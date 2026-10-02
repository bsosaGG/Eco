const app = require("./app");
require("dotenv").config(); // Asegura que dotenv se cargue

const monitoringService = require("./services/monitoring.service");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor API escuchando en el puerto ${PORT}`);
  console.log(`Modo: ${process.env.NODE_ENV || "development"}`);
  // Verificación rápida de variables de entorno clave
  if (!process.env.DATABASE_URL) console.warn("DATABASE_URL no está definida!");
  if (!process.env.MAIL_HOST)
    console.warn("MAIL_HOST no está definida (para correos)!");
  if (!process.env.RECAPTCHA_SECRET_KEY)
    console.warn("RECAPTCHA_SECRET_KEY no está definida!");

  // Inicia las tareas de monitoreo después de que el servidor se haya iniciado correctamente
  try {
    monitoringService.startMonitoringJobs();
  } catch (error) {
    console.error("Error al iniciar el servicio de monitoreo:", error);
  }

  // Plan de Medios: si su catálogo de medios está vacío se carga solo (seed). Corre en segundo plano y
  // nunca bloquea ni tumba el API: si la base aún no existe solo deja un aviso en el log.
  try {
    const planMediosConfig = require("./config/plan-medios.config");
    if (planMediosConfig.catalog.autoSeed) {
      require("./services/plan-medios/catalog-seed.service").seedCatalogIfEmpty();
    }
  } catch (error) {
    console.error("[Plan de Medios] No se pudo iniciar la carga del catálogo:", error.message);
  }
});
