const db = require("../config/db-users");

const filterSensitiveData = (obj) => {
  if (!obj) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(filterSensitiveData);
  
  const filtered = {};
  const sensitiveKeys = ['password', 'contrasena', 'contraseña', 'token', 'secret'];
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some(sensitiveKey => lowerKey.includes(sensitiveKey));
      
      if (isSensitive) {
        filtered[key] = '[FILTRADO]';
      } else {
        filtered[key] = typeof obj[key] === 'object' ? filterSensitiveData(obj[key]) : obj[key];
      }
    }
  }
  return filtered;
};

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

    // Extraer metadatos de archivos sin guardar binarios
    let filesMetadata = [];
    if (req.file) {
      filesMetadata.push({
        originalname: req.file.originalname || req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    } else if (req.files) {
      if (Array.isArray(req.files)) {
        filesMetadata = req.files.map(file => ({
          originalname: file.originalname || file.filename,
          mimetype: file.mimetype,
          size: file.size
        }));
      } else if (typeof req.files === 'object') {
        for (const field in req.files) {
          req.files[field].forEach(file => {
            filesMetadata.push({
              originalname: file.originalname || file.filename,
              mimetype: file.mimetype,
              size: file.size
            });
          });
        }
      }
    }

    // Consolidar detalles
    const detalles = {
      body: filterSensitiveData(req.body) || {},
      files: filesMetadata
    };

    const query = `
      INSERT INTO registro_auditoria 
      (id_usuario, email_usuario, metodo_http, ruta_api, codigo_estado, tiempo_respuesta_ms, ip_origen, detalles)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    const values = [userId, email, method, url, statusCode, duration, ip, detalles]; // node-postgres stringificará automáticamente un JSONB con objetos js o también puedes usar JSON.stringify(detalles)

    // Fire and forget: no bloqueamos el event loop esperando la BD
    db.query(query, values).catch(err => {
      console.error("Error al registrar auditoría en BD:", err);
    });
  });

  next();
};

module.exports = auditMiddleware;
