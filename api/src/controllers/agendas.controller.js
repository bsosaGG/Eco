const service = require("../services/agendas.service");

const getMatrix = async (req, res, next) => {
    try {
        const { weekId } = req.query;
        if (!weekId) {
            return res.status(400).json({ message: "weekId is required." });
        }
        const data = await service.getMatrix(parseInt(weekId));
        res.json(data);
    } catch (error) {
        next(error);
    }
};

const getMatrixSummary = async (req, res, next) => {
    try {
        const { weekId } = req.query;
        if (!weekId) {
            return res.status(400).json({ message: "weekId is required." });
        }
        const data = await service.getMatrixSummary(parseInt(weekId));
        res.json(data);
    } catch (error) {
        next(error);
    }
};

const getWeeklyEntry = async (req, res, next) => {
    try {
        const { weekId } = req.query;
        const userId = req.user.userId;

        if (!weekId) {
            return res.status(400).json({ message: "weekId is required." });
        }

        const data = await service.getWeeklyEntry(userId, parseInt(weekId));
        // Si no hay datos, devolvemos un objeto vacío o null explícito, según preferencia del front.
        // El prompt dice: "Si no existe, retorna null o un objeto vacío".
        // Devolveremos un objeto vacío para facilitar el binding en front.
        res.json(data || {});
    } catch (error) {
        next(error);
    }
};

const saveWeeklyAgenda = async (req, res, next) => {
    try {
        const { weekId, items, status } = req.body;
        const userId = req.user.userId;

        if (!weekId || !items) {
            return res.status(400).json({ message: "weekId and items are required." });
        }

        const result = await service.saveWeeklyAgenda(userId, parseInt(weekId), items, status || 'DRAFT');
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const getMyAssignment = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const profile = await service.getProfile(userId);
        if (!profile) {
            return res.status(404).json({ message: "No assignment found for this user." });
        }
        res.json(profile);
    } catch (error) {
        next(error);
    }
};

const getMonthlyOverview = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { year, month } = req.query;
        if (!year || !month) {
            return res.status(400).json({ message: "Year and month are required." });
        }
        const data = await service.getMonthlyOverview(parseInt(year), parseInt(month), userId);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

const closeMonth = async (req, res, next) => {
    try {
        const { institutionId, month, year } = req.body;
        const userId = req.user.userId;
        const file = req.file;

        if (!institutionId || !month || !year) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        const result = await service.closeMonth(
            parseInt(institutionId),
            parseInt(month),
            parseInt(year),
            file, // Pass the file object
            userId
        );
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const getWeeks = async (req, res, next) => {
    try {
        const { year } = req.query;
        const weeks = await service.getWeeks(year || new Date().getFullYear());
        res.json(weeks);
    } catch (error) {
        next(error);
    }
};

const getItemTypes = async (req, res, next) => {
    try {
        const types = await service.getItemTypes();
        res.json(types);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMatrix,
    getMatrixSummary,
    getWeeklyEntry,
    saveWeeklyAgenda,
    getMyAssignment,
    getMonthlyOverview,
    closeMonth,
    getWeeks,
    getItemTypes,

    // Admin
    getInstitutions: async (req, res, next) => {
        try {
            const institutions = await service.getInstitutions();
            res.json(institutions);
        } catch (error) {
            next(error);
        }
    },

    createInstitution: async (req, res, next) => {
        try {
            const { name, acronym } = req.body;
            const file = req.file;
            const userId = req.user.userId;

            if (!name || !acronym) {
                return res.status(400).json({ message: "Name and acronym are required." });
            }

            const fileUrl = file ? `/uploads/${file.filename}` : null;

            const result = await service.createInstitution(name, acronym, fileUrl, userId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    updateInstitution: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { name, acronym } = req.body;
            const file = req.file;
            const userId = req.user.userId;

            const fileUrl = file ? `/uploads/${file.filename}` : undefined;

            const result = await service.updateInstitution(parseInt(id), name, acronym, fileUrl, userId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    deleteInstitution: async (req, res, next) => {
        try {
            const { id } = req.params;
            await service.deleteInstitution(parseInt(id));
            res.json({ message: "Institution deleted successfully." });
        } catch (error) {
            next(error);
        }
    },

    getAssignments: async (req, res, next) => {
        try {
            const { institutionId } = req.query;
            if (!institutionId) {
                return res.status(400).json({ message: "institutionId is required." });
            }
            const assignments = await service.getAssignments(parseInt(institutionId));
            res.json(assignments);
        } catch (error) {
            next(error);
        }
    },

    createAssignment: async (req, res, next) => {
        try {
            const { userId, institutionId } = req.body;
            if (!userId || !institutionId) {
                return res.status(400).json({ message: "userId and institutionId are required." });
            }
            await service.createAssignment(parseInt(userId), parseInt(institutionId));
            res.json({ message: "Assignment created successfully." });
        } catch (error) {
            next(error);
        }
    },

    deleteAssignment: async (req, res, next) => {
        try {
            const { userId, institutionId } = req.body;
            if (!userId || !institutionId) {
                return res.status(400).json({ message: "userId and institutionId are required." });
            }
            await service.deleteAssignment(parseInt(userId), parseInt(institutionId));
            res.json({ message: "Assignment deleted successfully." });
        } catch (error) {
            next(error);
        }
    },

    searchUsers: async (req, res, next) => {
        try {
            const { email } = req.query;
            if (!email) {
                return res.status(400).json({ message: "Email is required." });
            }
            const users = await service.searchUsers(email);
            res.json(users);
        } catch (error) {
            next(error);
        }
    },

    updateItemType: async (req, res, next) => {
        try {
            const { key } = req.params;
            const { label, order_index } = req.body;

            if (!label) {
                return res.status(400).json({ message: "Label is required." });
            }

            const result = await service.updateItemType(key, label, order_index);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
};
