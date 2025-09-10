// api/src/services/monitoring.service.js (VERSIÓN FINAL Y ORDENADA)
const { monitoreoPool } = require("../config/db-monitoring");
const { Client } = require("ssh2");
const fs = require("fs");
const cron = require("node-cron");
const axios = require("axios");
const emailService = require("./email.service");

const runningJobs = {};
const servicesState = {};

// --- FUNCIONES DE BASE DE DATOS ---

const getAllServers = async (onlyActive = false) => {
  const query = `SELECT * FROM servidores ${
    onlyActive ? "WHERE activo = TRUE" : ""
  } ORDER BY nombre ASC`;
  const { rows } = await monitoreoPool.query(query);
  return rows;
};
const getServerById = async (id) => {
  const query = "SELECT * FROM servidores WHERE id_servidor = $1";
  const { rows } = await monitoreoPool.query(query, [id]);
  if (rows.length === 0) {
    throw new Error("Servidor no encontrado.");
  }
  return rows[0];
};
const getAllSites = async (onlyActive = false) => {
  const query = `SELECT * FROM sitios_web ${
    onlyActive ? "WHERE activo = TRUE" : ""
  } ORDER BY nombre ASC`;
  const { rows } = await monitoreoPool.query(query);
  return rows;
};
const getSiteById = async (id) => {
  const query = "SELECT * FROM sitios_web WHERE id_sitio_web = $1";
  const { rows } = await monitoreoPool.query(query, [id]);
  if (rows.length === 0) {
    throw new Error("Sitio no encontrado.");
  }
  return rows[0];
};
const getConfig = async () => {
  const { rows } = await monitoreoPool.query(
    "SELECT clave, valor FROM monitoreo_configuracion"
  );
  return rows;
};
const saveServerStatusHistory = async (serverId, status) => {
  const query = `INSERT INTO historial_estado_servidor (id_servidor, online, cpu_usage_percent, ram_usage_percent, disk_usage_percent, detalles_error) VALUES ($1, $2, $3, $4, $5, $6)`;
  const values = [
    serverId,
    status.online,
    status.cpuUsagePercent,
    status.ramUsagePercent,
    status.diskUsagePercent,
    status.error,
  ];
  await monitoreoPool.query(query, values);
};
const saveSiteStatusHistory = async (siteId, status) => {
  const query = `INSERT INTO historial_estado_sitio (id_sitio_web, online, codigo_estado_recibido, tiempo_respuesta_ms, detalles_error) VALUES ($1, $2, $3, $4, $5)`;
  const values = [
    siteId,
    status.online,
    status.statusCode,
    status.responseTimeMs,
    status.error,
  ];
  await monitoreoPool.query(query, values);
};

// --- LÓGICA DE CONEXIÓN Y VERIFICACIÓN ---

const executeCommandsInOneConnection = (server, commands) => {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    const connectionConfig = {
      host: server.direccion_ip,
      port: server.puerto_ssh,
      username: server.usuario_ssh,
      privateKey: fs.readFileSync(
        process.env.SSH_PRIVATE_KEY_PATH ||
          "C:\\Users\\adroreyes\\.ssh\\id_ed25519"
      ),
      readyTimeout: 90000,
      keepaliveInterval: 15000,
      algorithms: {
        kex: [
          "curve25519-sha256",
          "curve25519-sha256@libssh.org",
          "ecdh-sha2-nistp256",
          "ecdh-sha2-nistp384",
          "ecdh-sha2-nistp521",
          "diffie-hellman-group-exchange-sha256",
          "diffie-hellman-group14-sha256",
        ],
        cipher: [
          "aes128-ctr",
          "aes192-ctr",
          "aes256-ctr",
          "aes128-gcm",
          "aes128-gcm@openssh.com",
          "aes256-gcm",
          "aes256-gcm@openssh.com",
        ],
        serverHostKey: [
          "ssh-ed25519",
          "ecdsa-sha2-nistp256",
          "ecdsa-sha2-nistp384",
          "ecdsa-sha2-nistp521",
          "rsa-sha2-512",
          "rsa-sha2-256",
          "ssh-rsa",
        ],
      },
    };
    if (server.ssh_key_passphrase) {
      connectionConfig.passphrase = server.ssh_key_passphrase;
    }
    conn
      .on("ready", async () => {
        const results = {};
        try {
          for (const key of Object.keys(commands)) {
            const command = commands[key];
            const result = await new Promise((res, rej) => {
              conn.exec(command, (err, stream) => {
                if (err) return rej(err);
                let data = "";
                stream
                  .on("data", (chunk) => (data += chunk.toString()))
                  .on("close", () => res(data.trim()))
                  .stderr.on("data", (chunk) =>
                    rej(new Error(chunk.toString().trim()))
                  );
              });
            });
            results[key] = result;
          }
          resolve(results);
        } catch (error) {
          reject(error);
        } finally {
          conn.end();
        }
      })
      .on("error", (err) => {
        reject(new Error(`Error de conexión SSH: ${err.message}`));
      })
      .connect(connectionConfig);
  });
};

const checkServerStatus = async (serverId) => {
  const server = await getServerById(serverId);
  const commands = {
    cpu: "top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'",
    ram: "awk '/MemTotal/ {total=$2} /MemAvailable/ {avail=$2} END {if (total > 0) printf \"%.2f\", (total-avail)/total*100}' /proc/meminfo",
    disk: "df -h / | grep / | awk '{print $5}' | sed 's/%//'",
  };
  try {
    const results = await executeCommandsInOneConnection(server, commands);
    return {
      online: true,
      cpuUsagePercent: parseFloat(results.cpu || 0).toFixed(2),
      ramUsagePercent: parseFloat(results.ram || 0).toFixed(2),
      diskUsagePercent: parseFloat(results.disk || 0).toFixed(2),
    };
  } catch (error) {
    return { online: false, error: error.message };
  }
};

const checkSiteStatus = async (site) => {
  const startTime = Date.now();
  try {
    const response = await axios.get(site.url, { timeout: 30000 });
    const responseTimeMs = Date.now() - startTime;
    let result = {
      online: true,
      statusCode: response.status,
      responseTimeMs: responseTimeMs,
      error: null,
    };
    if (response.status !== site.codigo_estado_esperado) {
      result.online = false;
      result.error = `Se esperaba el código ${site.codigo_estado_esperado} pero se recibió ${response.status}.`;
      return result;
    }
    if (site.texto_a_verificar) {
      const responseBody =
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data);
      if (!responseBody.includes(site.texto_a_verificar)) {
        result.online = false;
        result.error = `El sitio está en línea pero no se encontró el texto esperado.`;
      }
    }
    return result;
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    let errorMessage = error.message;
    let statusCode = error.response ? error.response.status : null;
    if (statusCode) {
      errorMessage = `El sitio devolvió un código de estado de error: ${statusCode}`;
    }
    return { online: false, statusCode, responseTimeMs, error: errorMessage };
  }
};

const getSiteStatus = async (siteId) => {
  const site = await getSiteById(siteId);
  return await checkSiteStatus(site);
};

// --- LÓGICA DE ALERTAS ---

const getAlertEmails = async () => {
  /* ... (sin cambios) ... */
};
const handleStatusChange = async (
  type,
  item,
  newStatusIsOnline,
  details = ""
) => {
  /* ... (sin cambios) ... */
};

// --- PLANIFICADOR DE TAREAS (CRON) ---

const startMonitoringJobs = async () => {
  console.log("Reiniciando planificador de tareas de monitoreo...");
  Object.values(runningJobs).forEach((job) => job.stop());
  const initialServers = await getAllServers(true);
  initialServers.forEach((initialServer) => {
    const serverId = initialServer.id_servidor;
    const interval = initialServer.intervalo_verificacion_segundos;
    if (!interval || isNaN(interval) || interval <= 0) return;
    const cronPattern =
      interval < 60
        ? `*/${interval} * * * * *`
        : `0 */${Math.round(interval / 60)} * * * *`;
    const task = cron.schedule(cronPattern, async () => {
      try {
        const currentServer = await getServerById(serverId);
        if (!currentServer || !currentServer.activo) {
          const jobToStop = runningJobs[`server-${serverId}`];
          if (jobToStop) {
            jobToStop.stop();
            delete runningJobs[`server-${serverId}`];
            console.log(
              `[CRON] Tarea detenida para servidor inactivo o eliminado: ${initialServer.nombre}`
            );
          }
          return;
        }
        console.log(
          `[CRON] Ejecutando verificación para el servidor: ${currentServer.nombre}`
        );
        const status = await checkServerStatus(serverId);
        await saveServerStatusHistory(serverId, status);
        await handleStatusChange(
          "servidor",
          currentServer,
          status.online,
          status.error
        );
      } catch (error) {
        console.error(
          `[CRON] Error en tarea para servidor ID ${serverId}:`,
          error.message
        );
        if (error.message.includes("no encontrado")) {
          const jobToStop = runningJobs[`server-${serverId}`];
          if (jobToStop) {
            jobToStop.stop();
            delete runningJobs[`server-${serverId}`];
            console.log(
              `[CRON] Tarea detenida para servidor eliminado: ID ${serverId}`
            );
          }
        }
      }
    });
    runningJobs[`server-${serverId}`] = task;
  });
  const initialSites = await getAllSites(true);
  initialSites.forEach((initialSite) => {
    const siteId = initialSite.id_sitio_web;
    const interval = initialSite.intervalo_verificacion_segundos;
    if (!interval || isNaN(interval) || interval <= 0) return;
    const cronPattern =
      interval < 60
        ? `*/${interval} * * * * *`
        : `0 */${Math.round(interval / 60)} * * * *`;
    const task = cron.schedule(cronPattern, async () => {
      try {
        const currentSite = await getSiteById(siteId);
        if (!currentSite || !currentSite.activo) {
          const jobToStop = runningJobs[`site-${siteId}`];
          if (jobToStop) {
            jobToStop.stop();
            delete runningJobs[`site-${siteId}`];
            console.log(
              `[CRON] Tarea detenida para sitio inactivo o eliminado: ${initialSite.nombre}`
            );
          }
          return;
        }
        console.log(
          `[CRON] Ejecutando verificación para el sitio: ${currentSite.nombre}`
        );
        const status = await checkSiteStatus(currentSite);
        await saveSiteStatusHistory(siteId, status);
        await handleStatusChange(
          "sitio",
          currentSite,
          status.online,
          status.error
        );
      } catch (error) {
        console.error(
          `[CRON] Error en tarea para sitio ID ${siteId}:`,
          error.message
        );
        if (error.message.includes("no encontrado")) {
          const jobToStop = runningJobs[`site-${siteId}`];
          if (jobToStop) {
            jobToStop.stop();
            delete runningJobs[`site-${siteId}`];
            console.log(
              `[CRON] Tarea detenida para sitio eliminado: ID ${siteId}`
            );
          }
        }
      }
    });
    runningJobs[`site-${siteId}`] = task;
  });
  console.log(
    `${Object.keys(runningJobs).length} tareas de monitoreo iniciadas.`
  );
};

// --- FUNCIONES CRUD (CON REINICIO DEL PLANIFICADOR) ---

const addServer = async (serverData) => {
  const {
    nombre,
    direccion_ip,
    puerto_ssh,
    usuario_ssh,
    intervalo_verificacion_segundos,
    ssh_key_passphrase,
  } = serverData;
  const query = `INSERT INTO servidores (nombre, direccion_ip, puerto_ssh, usuario_ssh, intervalo_verificacion_segundos, ssh_key_passphrase) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;
  const values = [
    nombre,
    direccion_ip,
    puerto_ssh,
    usuario_ssh,
    intervalo_verificacion_segundos,
    ssh_key_passphrase || null,
  ];
  const { rows } = await monitoreoPool.query(query, values);
  startMonitoringJobs(); // Reinicia el planificador
  return rows[0];
};
const updateServer = async (serverId, serverData) => {
  const {
    nombre,
    direccion_ip,
    puerto_ssh,
    usuario_ssh,
    ssh_key_passphrase,
    intervalo_verificacion_segundos,
    activo,
  } = serverData;
  const query = `UPDATE servidores SET nombre = $1, direccion_ip = $2, puerto_ssh = $3, usuario_ssh = $4, ssh_key_passphrase = $5, intervalo_verificacion_segundos = $6, activo = $7 WHERE id_servidor = $8 RETURNING *;`;
  const values = [
    nombre,
    direccion_ip,
    puerto_ssh,
    usuario_ssh,
    ssh_key_passphrase || null,
    intervalo_verificacion_segundos,
    activo,
    serverId,
  ];
  const { rows } = await monitoreoPool.query(query, values);
  if (rows.length === 0)
    throw new Error("Servidor no encontrado para actualizar.");
  startMonitoringJobs(); // Reinicia el planificador
  return rows[0];
};
const deleteServer = async (serverId) => {
  await monitoreoPool.query("DELETE FROM servidores WHERE id_servidor = $1", [
    serverId,
  ]);
  startMonitoringJobs(); // Reinicia el planificador
  return { message: "Servidor eliminado." };
};
const addSite = async (siteData) => {
  const {
    nombre,
    url,
    texto_a_verificar,
    id_servidor,
    intervalo_verificacion_segundos,
    activo,
  } = siteData;
  const query = `INSERT INTO sitios_web (nombre, url, texto_a_verificar, id_servidor, intervalo_verificacion_segundos, activo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;
  const values = [
    nombre,
    url,
    texto_a_verificar || null,
    id_servidor || null,
    intervalo_verificacion_segundos,
    activo,
  ];
  const { rows } = await monitoreoPool.query(query, values);
  startMonitoringJobs(); // Reinicia el planificador
  return rows[0];
};
const updateSite = async (siteId, siteData) => {
  const {
    nombre,
    url,
    texto_a_verificar,
    id_servidor,
    activo,
    intervalo_verificacion_segundos,
  } = siteData;
  const query = `UPDATE sitios_web SET nombre = $1, url = $2, texto_a_verificar = $3, id_servidor = $4, activo = $5, intervalo_verificacion_segundos = $6 WHERE id_sitio_web = $7 RETURNING *;`;
  const values = [
    nombre,
    url,
    texto_a_verificar || null,
    id_servidor || null,
    activo,
    intervalo_verificacion_segundos,
    siteId,
  ];
  const { rows } = await monitoreoPool.query(query, values);
  startMonitoringJobs(); // Reinicia el planificador
  return rows[0];
};
const deleteSite = async (siteId) => {
  await monitoreoPool.query("DELETE FROM sitios_web WHERE id_sitio_web = $1", [
    siteId,
  ]);
  startMonitoringJobs(); // Reinicia el planificador
};
const updateConfig = async (key, value) => {
  const query = `INSERT INTO monitoreo_configuracion (clave, valor) VALUES ($1, $2) ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor RETURNING *;`;
  const { rows } = await monitoreoPool.query(query, [key, value]);
  return rows[0];
};

module.exports = {
  getAllServers,
  addServer,
  updateServer,
  deleteServer,
  getServerById,
  checkServerStatus,
  getAllSites,
  addSite,
  updateSite,
  deleteSite,
  getSiteById,
  getSiteStatus,
  getConfig,
  updateConfig,
  startMonitoringJobs,
};
