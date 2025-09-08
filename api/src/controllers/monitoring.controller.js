const monitoringService = require("../services/monitoring.service");
const { validationResult } = require("express-validator");

// --- Controladores de Servidores ---
const getServers = async (req, res, next) => {
  try {
    const servers = await monitoringService.getAllServers();
    res.status(200).json(servers);
  } catch (error) {
    next(error);
  }
};
const createServer = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const newServer = await monitoringService.addServer(req.body);
    res
      .status(201)
      .json({ message: "Servidor añadido exitosamente.", server: newServer });
  } catch (error) {
    if (
      error.code === "23505" &&
      error.constraint === "servidores_direccion_ip_key"
    ) {
      return res
        .status(409)
        .json({ message: "La dirección IP ya está registrada." });
    }
    next(error);
  }
};
const getServerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = await monitoringService.checkServerStatus(id);
    if (!status) {
      return res
        .status(404)
        .json({ message: "No se pudo obtener el estado del servidor." });
    }
    res.status(200).json(status);
  } catch (error) {
    if (error.message === "Servidor no encontrado.") {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

// --- NUEVOS Controladores de Sitios Web ---
const getSites = async (req, res, next) => {
  try {
    const sites = await monitoringService.getAllSites();
    res.status(200).json(sites);
  } catch (error) {
    next(error);
  }
};

// --- NUEVOS Controladores de Configuración ---
const getConfig = async (req, res, next) => {
  try {
    const config = await monitoringService.getConfig();
    // Convertir de array a objeto para un manejo más fácil en el frontend
    const configObject = config.reduce((obj, item) => {
      obj[item.clave] = item.valor;
      return obj;
    }, {});
    res.status(200).json(configObject);
  } catch (error) {
    next(error);
  }
};

const updateConfig = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { key, value } = req.body;
    const updated = await monitoringService.updateConfig(key, value);
    res
      .status(200)
      .json({ message: "Configuración actualizada.", config: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServers,
  createServer,
  getServerStatus,
  getSites,
  getConfig,
  updateConfig,
};
