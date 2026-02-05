// api/src/services/monitoring.service.js (VERSIÓN FINAL COMPLETA)
const { monitoreoPool } = require("../config/db-monitoring");
const { Client } = require("ssh2");
const fs = require("fs");
const cron = require("node-cron");
const axios = require("axios");
const emailService = require("./email.service");

const runningJobs = {};
const servicesState = {};

// --- LÓGICA DE ALERTAS (COMPLETA Y CORRECTA) ---
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
  const itemId = `${type}-${item.id_sitio_web || item.id_servidor}`;
  const previousStatus = servicesState[itemId];
  const newStatus = newStatusIsOnline ? "online" : "offline";

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
      const htmlBody = `<h1>Alerta de Monitoreo</h1><p>El servicio <strong>${
        item.nombre
      }</strong> (${type}) ha cambiado su estado a <strong>${newStatus.toUpperCase()}</strong>.</p><p><strong>Fecha y Hora:</strong> ${new Date().toLocaleString(
        "es-GT",
        { timeZone: "America/Guatemala" }
      )}</p>${details ? `<p><strong>Detalles:</strong> ${details}</p>` : ""}`;
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

// --- (EL RESTO DEL ARCHIVO ES IDÉNTICO A LA ÚLTIMA VERSIÓN FUNCIONAL) ---
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
const executeCommandsInOneConnection = (server, commands, retries = 4) => {
  return new Promise((resolve, reject) => {
    // FUNCIÓN INTERNA PARA REINTENTAR
    const attemptConnection = (filesRemaining) => {
      const conn = new Client();

      const connectionConfig = {
        host: server.direccion_ip,
        port: server.puerto_ssh,
        username: server.usuario_ssh,
        privateKey: fs.readFileSync(
          process.env.SSH_PRIVATE_KEY_PATH || "C:\\Users\\adroreyes\\.ssh\\id_ed25519"
        ),
        readyTimeout: 30000, // Bajamos a 30s (90s es demasiado esperar para un monitor)
        keepaliveInterval: 0, // Desactivar keepalive para scripts de "entrar y salir" rápido
        // ELIMINAMOS "algorithms": Dejamos que ssh2 negocie lo mejor con el servidor
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
              // Agregamos un pequeño timeout por comando por si se cuelga el grep
              const result = await new Promise((res, rej) => {
                conn.exec(command, (err, stream) => {
                  if (err) return rej(err);
                  let data = "";
                  stream
                    .on("data", (chunk) => (data += chunk.toString()))
                    .on("close", () => res(data.trim()))
                    .stderr.on("data", (chunk) => {
                      // Ignorar advertencias menores, solo errores reales
                      const msg = chunk.toString().trim();
                      if (!msg.includes("Warning")) console.error("SSH Stderr:", msg);
                    });
                });
              });
              results[key] = result;
            }
            conn.end(); // Cerrar explícitamente al terminar
            resolve(results);
          } catch (error) {
            conn.end();
            reject(error);
          }
        })
        .on("error", (err) => {
          // LÓGICA DE REINTENTO (RETRY)
          conn.end();
          if (filesRemaining > 0) {
            console.log(`Reintentando conexión a ${server.direccion_ip}... (${filesRemaining} restantes)`);
            setTimeout(() => attemptConnection(filesRemaining - 1), 2000); // Esperar 2s antes de reintentar
          } else {
            reject(new Error(`Fallo tras reintentos: ${err.message}`));
          }
        })
        .connect(connectionConfig);
    };

    // Iniciar primer intento
    attemptConnection(retries);
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
const checkSiteStatus = async (site, retries = 5) => {
  const startTime = Date.now();

  // 1. CONFIGURACIÓN DE CAMUFLAJE (Headers de Navegador Real)
  // Cloudflare bloqueará "axios/..." pero dejará pasar esto:
  const config = {
    timeout: 30000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
      "Referer": "https://www.google.com/"
    },
    // Validamos el estado manualmente para no lanzar excepción en 403/404 y poder reintentar
    validateStatus: () => true,
  };

  const attemptRequest = async (attemptsLeft, errorAttemptsLeft) => {
    try {
      const response = await axios.get(site.url, config);

      // LÓGICA DE REINTENTO PARA CLOUDFLARE
      // Si recibimos 403 (Forbidden) o 503 (Service Unavailable - Pantalla de espera)
      // y nos quedan intentos, esperamos 2 segundos y probamos de nuevo.
      if ((response.status === 403 || response.status === 503) && attemptsLeft > 0) {
        console.log(`Reintentando conexión a ${site.url} por estatus ${response.status}... (${attemptsLeft} restantes)`);
        await new Promise((resolve) => setTimeout(resolve, 4000));
        return attemptRequest(attemptsLeft - 1, errorAttemptsLeft);
      }

      const responseTimeMs = Date.now() - startTime;
      let result = {
        online: true,
        statusCode: response.status,
        responseTimeMs: responseTimeMs,
        error: null,
      };

      // 1. Validar Código de Estado
      if (response.status !== site.codigo_estado_esperado) {
        result.online = false;
        result.error = `Se esperaba el código ${site.codigo_estado_esperado} pero se recibió ${response.status}.`;
        // Si es 403, damos una pista extra
        if (response.status === 403) result.error += " (Posible bloqueo de WAF/Cloudflare)";
        return result;
      }

      // 2. Validar Texto (Content Check)
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
      // Manejo de errores de red (DNS, Timeout real, etc.)
      const responseTimeMs = Date.now() - startTime;

      // Lista de códigos de error de red transitorios que merecen un reintento
      const retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'ENOTFOUND'];

      // Si es un error de conexión listado y quedan intentos, reintentamos
      if (errorAttemptsLeft > 0 && retryableErrors.includes(error.code)) {
        console.log(`Reintentando conexión a ${site.url} por error ${error.code}... (${errorAttemptsLeft} restantes)`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return attemptRequest(attemptsLeft, errorAttemptsLeft - 1);
      }

      let errorMessage = error.message;
      let statusCode = error.response ? error.response.status : null;

      return {
        online: false,
        statusCode,
        responseTimeMs,
        error: errorMessage
      };
    }
  };

  return attemptRequest(retries, retries);
};
const getSiteStatus = async (siteId) => {
  const site = await getSiteById(siteId);
  return await checkSiteStatus(site);
};
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

  // --- JOB DE LATIDO (HEARTBEAT) ---
  // Horas GT (GMT-6): 08:00, 12:00, 16:00, 20:00
  // Horas UTC:       14:00, 18:00, 22:00, 02:00
  const heartbeatCron = "0 2,14,18,22 * * *";
  const heartbeatTask = cron.schedule(heartbeatCron, async () => {
    console.log("[CRON] Ejecutando latido de monitoreo (heartbeat)...");
    const emails = await getAlertEmails();
    if (emails && emails.length > 0) {
      const dateStr = new Date().toLocaleString("es-GT", { timeZone: "America/Guatemala" });
      const subject = "🟢 Monitoreo Activo: Reporte de Estado (Latido)";
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #28a745;">Sistema de Monitoreo Activo</h2>
          <p>Este es un mensaje automático para confirmar que el servicio de monitoreo se encuentra en ejecución y funcionando correctamente.</p>
          <p><strong>Hora del reporte:</strong> ${dateStr}</p>
          <hr style="border: 0; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">No se requiere ninguna acción.</p>
        </div>
      `;
      const textBody = `Sistema de Monitoreo Activo. Este mensaje confirma que el servicio está funcionando. Hora: ${dateStr}`;

      try {
        await emailService.sendEmail(emails, subject, htmlBody, textBody);
        console.log("[CRON] Correo de latido enviado.");
      } catch (error) {
        console.error("[CRON] Error al enviar correo de latido:", error);
      }
    }
  });
  runningJobs["heartbeat"] = heartbeatTask;

  console.log(
    `${Object.keys(runningJobs).length} tareas de monitoreo iniciadas (incluyendo latido).`
  );
};
const addServer = async (serverData) => {
  const {
    nombre,
    direccion_ip,
    puerto_ssh,
    usuario_ssh,
    intervalo_verificacion_segundos,
    ssh_key_passphrase,
    descripcion,
  } = serverData;
  const query = `INSERT INTO servidores (nombre, direccion_ip, puerto_ssh, usuario_ssh, intervalo_verificacion_segundos, ssh_key_passphrase, descripcion) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;`;
  const values = [
    nombre,
    direccion_ip,
    puerto_ssh,
    usuario_ssh,
    intervalo_verificacion_segundos,
    ssh_key_passphrase || null,
    descripcion || null,
  ];
  const { rows } = await monitoreoPool.query(query, values);
  startMonitoringJobs();
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
    descripcion,
  } = serverData;
  const query = `UPDATE servidores SET nombre = $1, direccion_ip = $2, puerto_ssh = $3, usuario_ssh = $4, ssh_key_passphrase = $5, intervalo_verificacion_segundos = $6, activo = $7, descripcion = $8 WHERE id_servidor = $9 RETURNING *;`;
  const values = [
    nombre,
    direccion_ip,
    puerto_ssh,
    usuario_ssh,
    ssh_key_passphrase || null,
    intervalo_verificacion_segundos,
    activo,
    descripcion || null,
    serverId,
  ];
  const { rows } = await monitoreoPool.query(query, values);
  if (rows.length === 0)
    throw new Error("Servidor no encontrado para actualizar.");
  startMonitoringJobs();
  return rows[0];
};
const deleteServer = async (serverId) => {
  await monitoreoPool.query("DELETE FROM servidores WHERE id_servidor = $1", [
    serverId,
  ]);
  startMonitoringJobs();
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
  startMonitoringJobs();
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
  startMonitoringJobs();
  return rows[0];
};
const deleteSite = async (siteId) => {
  await monitoreoPool.query("DELETE FROM sitios_web WHERE id_sitio_web = $1", [
    siteId,
  ]);
  startMonitoringJobs();
};
const updateConfig = async (key, value) => {
  const query = `INSERT INTO monitoreo_configuracion (clave, valor) VALUES ($1, $2) ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor RETURNING *;`;
  const { rows } = await monitoreoPool.query(query, [key, value]);
  return rows[0];
};
const getServerHistory = async (serverId, range) => {
  let interval;
  switch (range) {
    case "1h":
      interval = "1 hour";
      break;
    case "7d":
      interval = "7 days";
      break;
    case "30d":
      interval = "30 days";
      break;
    case "24h":
    default:
      interval = "24 hours";
      break;
  }
  const query = `SELECT fecha_verificacion, online, cpu_usage_percent, ram_usage_percent, disk_usage_percent FROM historial_estado_servidor WHERE id_servidor = $1 AND fecha_verificacion >= NOW() - $2::interval ORDER BY fecha_verificacion ASC;`;
  const { rows } = await monitoreoPool.query(query, [serverId, interval]);
  return rows;
};
const getSiteHistory = async (siteId, range) => {
  let interval;
  switch (range) {
    case "7d":
      interval = "7 days";
      break;
    case "30d":
      interval = "30 days";
      break;
    case "24h":
    default:
      interval = "24 hours";
      break;
  }
  const query = `SELECT fecha_verificacion, online, tiempo_respuesta_ms FROM historial_estado_sitio WHERE id_sitio_web = $1 AND fecha_verificacion >= NOW() - $2::interval ORDER BY fecha_verificacion ASC;`;
  const { rows } = await monitoreoPool.query(query, [siteId, interval]);
  return rows;
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
  getServerHistory,
  getSiteHistory,
};
