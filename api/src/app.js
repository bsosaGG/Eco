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
const websiteScsprRoutes = require("./routes/website-scspr.routes.js"); // <-- AÑADIR ESTA LÍNEA
const userRoutes = require("./routes/user.routes");
const inventarioRoutes = require("./routes/inventario.routes");
const facturasRoutes = require("./routes/facturas.routes");
const proveedoresRoutes = require("./routes/proveedores.routes");
const renglonesRoutes = require("./routes/renglones.routes");
const unidadesRoutes = require("./routes/unidades.routes");
const profileRoutes = require("./routes/profile.routes");
const permissionRoutes = require("./routes/permission.routes.js");
const pacRoutes = require("./routes/pac.routes");
const adquisicionesRoutes = require("./routes/adquisiciones.routes"); // <-- Nueva ruta de Adquisiciones (SICOMPRAS)
const planMediosRoutes = require("./routes/planMedios.routes"); // <-- Plan de Medios (Express nativo, ya no es un proxy a Python)
const reportsRoutes = require("./routes/reports.routes");
const cloudflareRoutes = require("./routes/cloudflare.routes");
const monitoringRoutes = require("./routes/monitoring.routes");
const documentosRoutes = require("./routes/documentos.routes");
const agendasRoutes = require("./routes/agendas.routes");
const impresionesRoutes = require("./routes/impresiones.routes");
const uploadsRoutes = require("./routes/uploads.routes"); // <-- Nueva ruta protegida

const app = express();

// Middlewares de seguridad básicos
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Permite que los recursos sean solicitados por cualquier origen.
  }),
);

// Configuración de CORS (ajustar según necesidades de producción)
// Por ahora, permite cualquier origen, pero en producción deberías restringirlo.
app.use(
  cors({
    origin: "*", // Cambiar a la URL de tu app Ionic/Vue en producción
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"], // 'Authorization' si vas a usar tokens JWT, etc.
  }),
);

// Middlewares para parsear el body de las requests
// express.json() es para payloads JSON
// Plan de Medios guarda el formulario completo (hasta 50 medios con textos largos) en una sola petición:
// necesita un límite de JSON mayor que el predeterminado. Debe declararse antes del parser global.
app.use("/api/plan-medios", express.json({ limit: "5mb" }));
app.use(express.json());
// express.urlencoded() es para payloads URL-encoded (formularios tradicionales)
// Multer se encargará de `multipart/form-data`
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "../public")));
// Servir archivos estáticos desde la carpeta 'uploads' - REEMPLAZADO POR RUTA PROTEGIDA
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/pac", pacRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/denuncias", denunciaRoutes);
app.use("/api/websites", websitesRoutes);
app.use("/api/website-agn", websiteAgnRoutes);
app.use("/api/website-scspr", websiteScsprRoutes);
app.use("/api/user", userRoutes);
app.use("/api/inventario", inventarioRoutes);
app.use("/api/facturas", facturasRoutes);
app.use("/api/proveedores", proveedoresRoutes);
app.use("/api/renglones", renglonesRoutes);
app.use("/api/unidades", unidadesRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/cloudflare", cloudflareRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/documentos", documentosRoutes);
app.use("/api/agendas", agendasRoutes);
app.use("/api/media-listening", require("./routes/media-listening.routes"));
app.use("/api/calendar", require("./routes/calendar.routes")); // <-- Nueva ruta de calendario
app.use("/api/juridica", require("./routes/juridica.routes")); // <-- Nueva ruta de JURISGESTIÓN
app.use("/api/transportes", require("./routes/transportes.routes")); // <-- Nueva ruta de transportes
app.use("/api/adquisiciones", adquisicionesRoutes); // <-- Nueva ruta de Adquisiciones (SICOMPRAS)
app.use("/api/plan-medios", planMediosRoutes); // <-- Plan de Medios
app.use("/api/core-humanis", require("./routes/core-humanis.routes")); // <-- Core Humanis (RRHH)
app.use("/api/v1/core-humanis", require("./routes/core-humanis.routes")); // Alias HATEOAS / cliente Vue
app.use("/api/rrhh", require("./routes/core-humanis.routes")); // Alias institucional /api/rrhh
app.use("/api/v1/rrhh", require("./routes/core-humanis.routes")); // Alias canónico institucional /api/v1/rrhh
// Middleware para inyectar contexto de aplicación
const asignarContexto = (tipo) => (req, res, next) => {
  req.appTipo = tipo; // 'impresiones' o 'correspondencia'
  next();
};

app.use("/api/impresiones", asignarContexto("impresiones"), impresionesRoutes);
app.use(
  "/api/correspondencia",
  asignarContexto("correspondencia"),
  impresionesRoutes,
);
app.use("/api/uploads", uploadsRoutes); // <-- Endpoint protegido para archivos

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
