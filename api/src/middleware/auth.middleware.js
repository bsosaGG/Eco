const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET_KEY_SCSCR;

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  // El token usualmente viene como "Bearer <token>"
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(403)
      .json({ message: "No se proporcionó token de autenticación." });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expirado." });
      }
      return res
        .status(401)
        .json({ message: "Token inválido o no autorizado." });
    }
    // Si el token es válido, adjuntar el payload decodificado al objeto request
    req.user = decoded; // Contendrá { userId, username, role }
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "Acceso denegado. Requiere rol de administrador." });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
};
