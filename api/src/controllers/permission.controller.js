// api\src/controllers/permission.controller.js

const permissionService = require("../services/permission.service");

const getAllPermissions = async (req, res, next) => {
  try {
    const permissions = await permissionService.findAll();
    res.json(permissions);
  } catch (error) {
    next(error);
  }
};

const createPermission = async (req, res, next) => {
  try {
    const newPermission = await permissionService.create(req.body);
    res.status(201).json(newPermission);
  } catch (error) {
    next(error);
  }
};

const updatePermission = async (req, res, next) => {
  try {
    const updatedPermission = await permissionService.update(
      req.params.id,
      req.body
    );
    res.json(updatedPermission);
  } catch (error) {
    next(error);
  }
};

const deletePermission = async (req, res, next) => {
  try {
    await permissionService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPermissions,
  createPermission,
  updatePermission,
  deletePermission,
};
