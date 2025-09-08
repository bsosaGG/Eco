const { monitoreoPool } = require("../config/db-monitoring");
const { Client } = require("ssh2");
const fs = require("fs");
const cron = require("node-cron");
const axios = require("axios");
const emailService = require("./email.service"); // <<< Importación real

// --- Estado en memoria y gestión de alertas ---
const runningJobs = {};
const servicesState = {}; // Guarda el último estado conocido ('online' o 'offline')

const getAlertEmails = async () => {
  try {
    const { rows } = await monitoreoPool.query(
      "SELECT valor FROM monitoreo_configuracion WHERE clave = 'alert_emails'"
    );
    if (rows.length > 0 && rows[0].valor) {
      return rows[0].valor
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email);
    }
    return [];
  } catch (error) {
    console.error("Error al obtener la lista de correos para alertas:", error);
    return [];
  }
};

const handleStatusChange = async (
  type,
  item,
  newStatusIsOnline,
  details = ""
) => {
  const itemId = `${type}-${item.id_servidor || item.id_sitio_web}`;
  const previousStatus = servicesState[itemId];
  const newStatus = newStatusIsOnline ? "online" : "offline";

  // Inicializar estado si es la primera vez
  if (previousStatus === undefined) {
    servicesState[itemId] = newStatus;
    console.log(
      `[Estado Inicial] ${item.nombre} está ${newStatus}. No se enviará alerta inicial.`
    );
    return;
  }

  if (previousStatus !== newStatus) {
    console.log(
      `[ALERTA] Estado de ${item.nombre} ha cambiado de ${previousStatus} a ${newStatus}.`
    );
    servicesState[itemId] = newStatus;

    const emails = await getAlertEmails();
    if (emails.length > 0) {
      const subject = `Alerta de Monitoreo: ${
        item.nombre
      } está ${newStatus.toUpperCase()}`;
      const htmlBody = `
                <h1>Alerta de Monitoreo</h1>
                <p>El servicio <strong>${
                  item.nombre
                }</strong> (${type}) ha cambiado su estado a <strong>${newStatus.toUpperCase()}</strong>.</p>
                <p><strong>Fecha y Hora:</strong> ${new Date().toLocaleString(
                  "es-GT",
                  { timeZone: "America/Guatemala" }
                )}</p>
                ${details ? `<p><strong>Detalles:</strong> ${details}</p>` : ""}
            `;
      const textBody = `Alerta de Monitoreo: El servicio ${
        item.nombre
      } (${type}) ha cambiado su estado a ${newStatus.toUpperCase()} a las ${new Date().toLocaleString(
        "es-GT",
        { timeZone: "America/Guatemala" }
      )}. ${details ? `Detalles: ${details}` : ""}`;

      try {
        await emailService.sendEmail(emails, subject, htmlBody, textBody);
      } catch (error) {
        console.error(
          `Falló el envío de la alerta por correo para ${item.nombre}.`
        );
      }
    }
  }
};

// --- Funciones de la Base de Datos ---
const getAllServers = async (onlyActive = false) => {
  let query = "SELECT * FROM servidores ORDER BY nombre ASC";
  if (onlyActive) {
    query = "SELECT * FROM servidores WHERE activo = TRUE ORDER BY nombre ASC";
  }
  const { rows } = await monitoreoPool.query(query);
  return rows;
};
const addServer = async (serverData) => {
  const { nombre, direccion_ip, puerto_ssh, usuario_ssh, descripcion } =
    serverData;
  const query = `INSERT INTO servidores (nombre, direccion_ip, puerto_ssh, usuario_ssh, descripcion) VALUES ($1, $2, $3, $4, $5) RETURNING *;`;
  const values = [nombre, direccion_ip, puerto_ssh, usuario_ssh, descripcion];
  const { rows } = await monitoreoPool.query(query, values);
  return rows[0];
};
const getServerById = async (id) => {
  const query = "SELECT * FROM servidores WHERE id_servidor = $1";
  const { rows } = await monitoreoPool.query(query, [id]);
  if (rows.length === 0) {
    throw new Error("Servidor no encontrado.");
  }
  return rows[0];
};
const saveServerStatusHistory = async (serverId, status) => {
  const query = `INSERT INTO historial_estado_servidor (id_servidor, online, cpu_usage_percent, ram_usage_percent, disk_usage_percent, detalles_error) VALUES ($1, $2, $3, $4, $5, $6)`;
  const ramPercent = status.ram ? status.ram.cwpStyle.percent : null;
  const values = [
    serverId,
    status.online,
    status.cpuUsagePercent,
    ramPercent,
    status.diskUsagePercent,
    status.error,
  ];
  await monitoreoPool.query(query, values);
};
const getAllSites = async (onlyActive = false) => {
  let query = "SELECT * FROM sitios_web ORDER BY nombre ASC";
  if (onlyActive) {
    query = "SELECT * FROM sitios_web WHERE activo = TRUE ORDER BY nombre ASC";
  }
  const { rows } = await monitoreoPool.query(query);
  return rows;
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
const getConfig = async () => {
  const { rows } = await monitoreoPool.query(
    "SELECT clave, valor FROM monitoreo_configuracion"
  );
  return rows;
};
const updateConfig = async (key, value) => {
  const query = `INSERT INTO monitoreo_configuracion (clave, valor) VALUES ($1, $2) ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor RETURNING *;`;
  const { rows } = await monitoreoPool.query(query, [key, value]);
  return rows[0];
};

// --- Lógica de Verificación ---
const executeSshCommand = (server, command) => {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let stdout = "";
    let stderr = "";
    conn
      .on("ready", () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            return reject(err);
          }
          stream.on("data", (data) => {
            stdout += data.toString();
          });
          stream.stderr.on("data", (data) => {
            stderr += data.toString();
          });
          stream.on("close", (code) => {
            conn.end();
            if (code !== 0) {
              return reject(
                new Error(`Comando falló con código ${code}. Stderr: ${stderr}`)
              );
            }
            resolve(stdout);
          });
        });
      })
      .on("error", (err) => {
        reject(new Error(`Error de conexión SSH: ${err.message}`));
      })
      .connect({
        host: server.direccion_ip,
        port: server.puerto_ssh,
        username: server.usuario_ssh,
        privateKey: fs.readFileSync(
          process.env.SSH_PRIVATE_KEY_PATH ||
            "C:\\Users\\adroreyes\\.ssh\\id_ed25519"
        ),
      });
  });
};
const parseMemoryInfo = (freeOutput) => {
  const lines = freeOutput.split("\n");
  const memLine = lines.find((line) => line.startsWith("Mem:"));
  const swapLine = lines.find((line) => line.startsWith("Swap:"));
  if (!memLine)
    throw new Error("No se pudo leer la información de Memoria RAM.");
  const memValues = memLine.split(/\s+/);
  const totalRamMb = parseFloat(memValues[1]);
  const usedRamNoCacheMb = parseFloat(memValues[2]);
  const freeRamMb = parseFloat(memValues[3]);
  const availableRamMb = parseFloat(memValues[6]);
  const usedRamWithCacheMb = totalRamMb - availableRamMb;
  const usedRamCwpStyleMb = totalRamMb - freeRamMb;
  const toGb = (mb) => (mb / 1024).toFixed(2);
  const ram = {
    cwpStyle: {
      usedGb: toGb(usedRamCwpStyleMb),
      totalGb: toGb(totalRamMb),
      percent: ((usedRamCwpStyleMb / totalRamMb) * 100).toFixed(1),
    },
    withCache: {
      usedGb: toGb(usedRamWithCacheMb),
      totalGb: toGb(totalRamMb),
      percent: ((usedRamWithCacheMb / totalRamMb) * 100).toFixed(1),
    },
    noCache: {
      usedGb: toGb(usedRamNoCacheMb),
      totalGb: toGb(totalRamMb),
      percent: ((usedRamNoCacheMb / totalRamMb) * 100).toFixed(1),
    },
  };
  let swap = null;
  if (swapLine) {
    const swapValues = swapLine.split(/\s+/);
    const totalSwapMb = parseFloat(swapValues[1]);
    const usedSwapMb = parseFloat(swapValues[2]);
    if (totalSwapMb > 0) {
      swap = {
        usedGb: toGb(usedSwapMb),
        totalGb: toGb(totalSwapMb),
        percent: ((usedSwapMb / totalSwapMb) * 100).toFixed(1),
      };
    }
  }
  return { ram, swap };
};
const checkServerStatus = async (serverId) => {
  const server = await getServerById(serverId);
  const commands = {
    cpu: "top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'",
    memory: "free -m",
    disk: "df -h / | grep / | awk '{print $5}' | sed 's/%//'",
  };
  try {
    const [cpuOutput, memoryOutput, diskOutput] = await Promise.all([
      executeSshCommand(server, commands.cpu),
      executeSshCommand(server, commands.memory),
      executeSshCommand(server, commands.disk),
    ]);
    const { ram, swap } = parseMemoryInfo(memoryOutput);
    return {
      online: true,
      cpuUsagePercent: parseFloat(cpuOutput.trim()).toFixed(2),
      ram: ram,
      swap: swap,
      diskUsagePercent: parseFloat(diskOutput.trim()).toFixed(2),
    };
  } catch (error) {
    return { online: false, error: error.message };
  }
};
const checkSiteStatus = async (site) => {
  const startTime = Date.now();
  try {
    const response = await axios.get(site.url, { timeout: 10000 });
    const responseTimeMs = Date.now() - startTime;
    let online = response.status === site.codigo_estado_esperado;
    let error = null;
    if (!online) {
      error = `Se esperaba el código de estado ${site.codigo_estado_esperado} pero se recibió ${response.status}.`;
    } else if (site.texto_a_verificar) {
      if (!response.data.includes(site.texto_a_verificar)) {
        online = false;
        error = `El sitio está en línea pero no se encontró el texto esperado: "${site.texto_a_verificar}"`;
      }
    }
    return { online, statusCode: response.status, responseTimeMs, error };
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    let errorMessage = error.message;
    let statusCode = null;
    if (error.response) {
      statusCode = error.response.status;
      errorMessage = `El sitio devolvió un código de estado de error: ${statusCode}`;
    }
    return { online: false, statusCode, responseTimeMs, error: errorMessage };
  }
};

// --- Lógica del Planificador de Tareas ---
const startMonitoringJobs = async () => {
  console.log("Iniciando planificador de tareas de monitoreo...");
  Object.values(runningJobs).forEach((job) => job.stop());
  const servers = await getAllServers(true);
  servers.forEach((server) => {
    const interval = server.intervalo_verificacion_segundos;
    if (!interval || isNaN(interval) || interval <= 0) return;
    const cronPattern =
      interval < 60
        ? `*/${interval} * * * * *`
        : `0 */${Math.round(interval / 60)} * * * *`;
    const task = cron.schedule(cronPattern, async () => {
      const status = await checkServerStatus(server.id_servidor);
      await saveServerStatusHistory(server.id_servidor, status);
      await handleStatusChange("servidor", server, status.online, status.error);
    });
    runningJobs[`server-${server.id_servidor}`] = task;
  });
  const sites = await getAllSites(true);
  sites.forEach((site) => {
    const interval = site.intervalo_verificacion_segundos;
    if (!interval || isNaN(interval) || interval <= 0) return;
    const cronPattern =
      interval < 60
        ? `*/${interval} * * * * *`
        : `0 */${Math.round(interval / 60)} * * * *`;
    const task = cron.schedule(cronPattern, async () => {
      const status = await checkSiteStatus(site);
      await saveSiteStatusHistory(site.id_sitio_web, status);
      await handleStatusChange("sitio", site, status.online, status.error);
    });
    runningJobs[`site-${site.id_sitio_web}`] = task;
  });
  console.log(
    `${Object.keys(runningJobs).length} tareas de monitoreo iniciadas.`
  );
};

module.exports = {
  getAllServers,
  addServer,
  checkServerStatus,
  startMonitoringJobs,
  getAllSites,
  getConfig,
  updateConfig,
};
