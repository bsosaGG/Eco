const db = require("../config/db-users");

const auditMiddleware = (req, res, next) => {
  const start = Date.now();

  // Escuchamos el evento 'finish' para capturar la petición cuando ya se resolvió
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Extraemos datos del usuario si pasó por auth.middleware.js
    const userId = req.user?.userId || null;
    const email = req.user?.email || req.user?.nombre_usuario || null; 

    const query = `
      INSERT INTO registro_auditoria 
      (id_usuario, email_usuario, metodo_http, ruta_api, codigo_estado, tiempo_respuesta_ms, ip_origen)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    const values = [userId, email, method, url, statusCode, duration, ip];

    // Fire and forget: no bloqueamos el event loop esperando la BD
    db.query(query, values).catch(err => {
      console.error("Error al registrar auditoría en BD:", err);
    });
  });

  next();
};

module.exports = auditMiddleware;
