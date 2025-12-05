const calendarService = require("../services/calendar.service");

const getEvents = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const events = await calendarService.getEvents(startDate, endDate);
        res.json(events);
    } catch (error) {
        next(error);
    }
};

const createEvent = async (req, res, next) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "El cuerpo de la solicitud no puede estar vacío." });
        }
        const { title, start_date, end_date } = req.body;
        if (!title || !start_date || !end_date) {
            return res.status(400).json({ message: "Faltan campos obligatorios: title, start_date, end_date." });
        }
        const event = await calendarService.createEvent(req.body, req.user.userId);
        res.status(201).json(event);
    } catch (error) {
        next(error);
    }
};

const updateEvent = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "El cuerpo de la solicitud no puede estar vacío." });
        }
        const event = await calendarService.updateEvent(id, req.body, req.user.userId);
        if (!event) {
            return res.status(404).json({ message: "Evento no encontrado" });
        }
        res.json(event);
    } catch (error) {
        next(error);
    }
};

const deleteEvent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const event = await calendarService.deleteEvent(id);
        if (!event) {
            return res.status(404).json({ message: "Evento no encontrado" });
        }
        res.json({ message: "Evento eliminado correctamente" });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent,
};
