const db = require("../config/db-calendar");

const getEvents = async (startDate, endDate) => {
    let query = `SELECT * FROM events WHERE TRUE`;
    const params = [];
    let paramIndex = 1;

    if (startDate) {
        query += ` AND start_date >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
    }

    if (endDate) {
        query += ` AND end_date <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
    }

    query += ` ORDER BY start_date ASC`;

    const { rows } = await db.query(query, params);
    return rows;
};

const createEvent = async (eventData, userId) => {
    const { title, description, start_date, end_date, location } = eventData;
    const query = `
        INSERT INTO events (title, description, start_date, end_date, location, created_by, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $6)
        RETURNING *;
    `;
    const values = [title, description, start_date, end_date, location, userId];
    const { rows } = await db.query(query, values);
    return rows[0];
};

const updateEvent = async (id, eventData, userId) => {
    const { title, description, start_date, end_date, location } = eventData;
    const query = `
    UPDATE events
    SET title = $1, description = $2, start_date = $3, end_date = $4, location = $5, updated_by = $6, updated_at = NOW()
    WHERE id = $7
    RETURNING *;
  `;
    const values = [title, description, start_date, end_date, location, userId, id];
    const { rows } = await db.query(query, values);
    return rows[0];
};

const deleteEvent = async (id) => {
    const query = `DELETE FROM events WHERE id = $1 RETURNING *;`;
    const { rows } = await db.query(query, [id]);
    return rows[0];
};

module.exports = {
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent,
};
