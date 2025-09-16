// api/src/controllers/monitoring.controller.js (CÓDIGO COMPLETO)
const monitoringService = require("../services/monitoring.service");
const { validationResult } = require("express-validator");

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
    if (error.code === "23505") {
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
const getSites = async (req, res, next) => {
  try {
    const sites = await monitoringService.getAllSites();
    res.status(200).json(sites);
  } catch (error) {
    next(error);
  }
};
const createSite = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  try {
    const newSite = await monitoringService.addSite(req.body);
    res
      .status(201)
      .json({ message: "Sitio añadido exitosamente.", site: newSite });
  } catch (error) {
    if (error.code === "23505")
      return res.status(409).json({ message: "La URL ya está registrada." });
    next(error);
  }
};
const updateSite = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  try {
    const updatedSite = await monitoringService.updateSite(
      req.params.id,
      req.body
    );
    if (!updatedSite)
      return res.status(404).json({ message: "Sitio no encontrado." });
    res
      .status(200)
      .json({ message: "Sitio actualizado exitosamente.", site: updatedSite });
  } catch (error) {
    if (error.code === "23505")
      return res.status(409).json({ message: "La URL ya está registrada." });
    next(error);
  }
};
const deleteSite = async (req, res, next) => {
  try {
    await monitoringService.deleteSite(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
const getConfig = async (req, res, next) => {
  try {
    const config = await monitoringService.getConfig();
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
const getSiteStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = await monitoringService.getSiteStatus(id);
    res.status(200).json(status);
  } catch (error) {
    if (error.message === "Sitio no encontrado.") {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

const updateServer = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const updatedServer = await monitoringService.updateServer(
      req.params.id,
      req.body
    );
    res
      .status(200)
      .json({ message: "Servidor actualizado.", server: updatedServer });
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ message: "La dirección IP ya está registrada." });
    }
    next(error);
  }
};

const deleteServer = async (req, res, next) => {
  try {
    await monitoringService.deleteServer(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// --- NUEVOS CONTROLADORES PARA GRÁFICAS HISTÓRICAS ---

const getServerHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { range = "24h" } = req.query; // Por defecto pide las últimas 24 horas
    const history = await monitoringService.getServerHistory(id, range);
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};

const getSiteHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { range = "24h" } = req.query; // Por defecto pide las últimas 24 horas
    const history = await monitoringService.getSiteHistory(id, range);
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServers,
  createServer,
  getServerStatus,
  updateServer,
  deleteServer,
  getSites,
  createSite,
  updateSite,
  deleteSite,
  getConfig,
  updateConfig,
  getSiteStatus,
  getServerHistory,
  getSiteHistory,
};
