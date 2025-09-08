const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const denunciaRoutes = require("./routes/denuncia.routes");
const errorHandler = require("./middleware/errorHandler");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const websitesRoutes = require("./routes/websites.routes");
const websiteAgnRoutes = require("./routes/website-agn.routes");
const userRoutes = require("./routes/user.routes");
const inventarioRoutes = require("./routes/inventario.routes");
const facturasRoutes = require("./routes/facturas.routes");
const proveedoresRoutes = require("./routes/proveedores.routes");
const renglonesRoutes = require("./routes/renglones.routes");
const unidadesRoutes = require("./routes/unidades.routes");
const profileRoutes = require("./routes/profile.routes");
const pacRoutes = require("./routes/pac.routes");
const reportsRoutes = require("./routes/reports.routes");
const cloudflareRoutes = require("./routes/cloudflare.routes");
const monitoringRoutes = require("./routes/monitoring.routes");

const app = express();

// Middlewares de seguridad básicos
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Permite que los recursos sean solicitados por cualquier origen.
  })
);

// Configuración de CORS (ajustar según necesidades de producción)
// Por ahora, permite cualquier origen, pero en producción deberías restringirlo.
app.use(
  cors({
    origin: "*", // Cambiar a la URL de tu app Ionic/Vue en producción
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"], // 'Authorization' si vas a usar tokens JWT, etc.
  })
);

// Middlewares para parsear el body de las requests
// express.json() es para payloads JSON
app.use(express.json());
// express.urlencoded() es para payloads URL-encoded (formularios tradicionales)
// Multer se encargará de `multipart/form-data`
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "../public")));
app.use(
  "/uploads/profile_pics",
  express.static(path.join(__dirname, "../uploads/profile_pics"))
);

// Servir archivos estáticos desde la carpeta 'uploads' (si es necesario accederlos directamente vía URL)
// Considera la seguridad de esto. Para archivos de denuncias, podría ser mejor un endpoint protegido.
// El path '/uploads_scspr_public' es un ejemplo, puedes cambiarlo.
// app.use('/uploads_scspr_public', express.static(path.join(__dirname, '../uploads')));

// Rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/pac", pacRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/denuncias", denunciaRoutes);
app.use("/api/websites", websitesRoutes);
app.use("/api/website-agn", websiteAgnRoutes);
app.use("/api/user", userRoutes);
app.use("/api/inventario", inventarioRoutes);
app.use("/api/facturas", facturasRoutes);
app.use("/api/proveedores", proveedoresRoutes);
app.use("/api/renglones", renglonesRoutes);
app.use("/api/unidades", unidadesRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/cloudflare", cloudflareRoutes);
app.use("/api/monitoring", monitoringRoutes);

// Ruta de bienvenida o health check
app.get("/", (req, res) => {
  res.send("API del Sistema de Denuncias SCSPR funcionando.");
});

// Middleware para manejar rutas no encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({ message: "Ruta no encontrada." });
});

// Middleware manejador de errores (debe ser el último middleware)
app.use(errorHandler);

module.exports = app;
