const profileService = require("../services/profile.service");

const getAllProfiles = async (req, res, next) => {
  try {
    const profiles = await profileService.findAll();
    res.json(profiles);
  } catch (error) {
    next(error);
  }
};

const getAllPermissions = async (req, res, next) => {
  try {
    const permissions = await profileService.findAllPermissions();
    res.json(permissions);
  } catch (error) {
    next(error);
  }
};

const createProfile = async (req, res, next) => {
  try {
    const newProfile = await profileService.create(req.body);
    res.status(201).json(newProfile);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const updatedProfile = await profileService.update(req.params.id, req.body);
    res.json(updatedProfile);
  } catch (error) {
    next(error);
  }
};

const deleteProfile = async (req, res, next) => {
  try {
    await profileService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProfiles,
  getAllPermissions,
  createProfile,
  updateProfile,
  deleteProfile,
};
