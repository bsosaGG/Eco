const db = require("../config/db-agendas");

const getProfile = async (userId) => {
  const query = `
    SELECT i.id, i.name, i.acronym, i.logo_url
    FROM user_assignments ua
    JOIN institutions i ON ua.institution_id = i.id
    WHERE ua.user_id = $1
  `;
  const { rows } = await db.query(query, [userId]);
  return rows[0];
};

const getMatrix = async (year, weekNumber) => {
  // 1. Obtener el ID de la semana
  const weekQuery = `SELECT id FROM weeks WHERE year = $1 AND week_number = $2`;
  const weekRes = await db.query(weekQuery, [year, weekNumber]);

  if (weekRes.rows.length === 0) {
    return [];
  }

  const weekId = weekRes.rows[0].id;

  // 2. Consulta principal con JSON_AGG
  const query = `
    SELECT 
      i.id as institution_id,
      i.name as institution_name,
      i.acronym,
      i.logo_url,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', ai.id,
              'type', ai.item_type,
              'description', ai.description,
              'date', ai.item_date,
              'url', ai.url_resource,
              'alert_level', ai.alert_level,
              'order', ai.order_index
            ) ORDER BY ai.order_index ASC
          )
          FROM agenda_items ai
          JOIN agenda_reports ar ON ai.agenda_report_id = ar.id
          WHERE ar.institution_id = i.id AND ar.week_id = $1
        ),
        '[]'::json
      ) as items,
      (
        SELECT ar.status 
        FROM agenda_reports ar 
        WHERE ar.institution_id = i.id AND ar.week_id = $1
      ) as status
    FROM institutions i
    ORDER BY i.id ASC
  `;

  const { rows } = await db.query(query, [weekId]);
  return rows;
};

const saveWeeklyAgenda = async (userId, weekId, itemsPayload, status) => {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");

    // 1. Validar asignación
    const profile = await getProfile(userId);
    if (!profile) {
      throw new Error("Usuario no tiene institución asignada.");
    }
    const institutionId = profile.id;

    // 2. Cabecera (Upsert logic manual)
    const checkQuery = `SELECT id FROM agenda_reports WHERE week_id = $1 AND institution_id = $2`;
    const checkRes = await client.query(checkQuery, [weekId, institutionId]);

    let reportId;

    if (checkRes.rows.length > 0) {
      // Update
      reportId = checkRes.rows[0].id;
      await client.query(
        `UPDATE agenda_reports 
         SET status = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [status, userId, reportId]
      );
    } else {
      // Insert
      const insertRes = await client.query(
        `INSERT INTO agenda_reports (week_id, institution_id, status, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $4)
         RETURNING id`,
        [weekId, institutionId, status, userId]
      );
      reportId = insertRes.rows[0].id;
    }

    // 3. Limpieza de items anteriores
    await client.query(`DELETE FROM agenda_items WHERE agenda_report_id = $1`, [
      reportId,
    ]);

    // 4. Inserción de nuevos items
    if (itemsPayload && itemsPayload.length > 0) {
      const insertItemQuery = `
        INSERT INTO agenda_items 
        (agenda_report_id, item_type, description, item_date, url_resource, alert_level, order_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      for (let i = 0; i < itemsPayload.length; i++) {
        const item = itemsPayload[i];
        await client.query(insertItemQuery, [
          reportId,
          item.type,
          item.description,
          item.date || null,
          item.url || null,
          item.alert_level || null,
          i,
        ]);
      }
    }

    await client.query("COMMIT");
    return { reportId, message: "Agenda guardada correctamente." };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getWeeklyEntry = async (userId, weekId) => {
  const profile = await getProfile(userId);
  if (!profile) return null;

  const institutionId = profile.id;

  const query = `
    SELECT 
      ar.id as report_id,
      ar.status,
      ar.updated_at,
      (
        SELECT json_agg(
          json_build_object(
            'id', ai.id,
            'type', ai.item_type,
            'description', ai.description,
            'date', ai.item_date,
            'url', ai.url_resource,
            'alert_level', ai.alert_level,
            'order', ai.order_index
          ) ORDER BY ai.order_index ASC
        )
        FROM agenda_items ai
        WHERE ai.agenda_report_id = ar.id
      ) as items
    FROM agenda_reports ar
    WHERE ar.institution_id = $1 AND ar.week_id = $2
  `;

  const { rows } = await db.query(query, [institutionId, weekId]);

  if (rows.length === 0) {
    return null;
  }

  return {
    report: {
      id: rows[0].report_id,
      status: rows[0].status,
      updatedAt: rows[0].updated_at,
    },
    items: rows[0].items || [],
  };
};

const getMonthlyOverview = async (year, month) => {
  // 1. Definimos el SQL con CTEs para máxima precisión
  const query = `
    WITH month_range AS (
        -- Definimos el rango exacto del mes solicitado
        SELECT 
            MAKE_DATE($1::int, $2::int, 1) as m_start,
            (MAKE_DATE($1::int, $2::int, 1) + INTERVAL '1 month' - INTERVAL '1 day')::date as m_end
    ),
    weighted_weeks AS (
        SELECT 
            w.id as week_id,
            -- Calculamos cuántos días de ESTA semana caen dentro del mes solicitado
            -- La lógica es: (FinIntersección - InicioIntersección) + 1
            (
                LEAST(w.end_date, mr.m_end) - 
                GREATEST(w.start_date, mr.m_start) + 1
            ) as days_weight
        FROM weeks w, month_range mr
        WHERE 
            -- Solo tomamos semanas que tocan el mes
            w.start_date <= mr.m_end AND w.end_date >= mr.m_start
    ),
    month_stats AS (
        -- Sumamos el peso total (debería dar 28, 30 o 31 días)
        SELECT SUM(days_weight) as total_days_in_month FROM weighted_weeks
    )
    SELECT 
        i.id as institution_id,
        i.name as institution_name,
        i.acronym,
        i.logo_url,
        mc.is_closed,
        mc.file_url,
        mc.closed_at,
        -- Calculamos los días ganados (peso de las semanas completadas)
        COALESCE(
            (
                SELECT SUM(ww.days_weight)
                FROM agenda_reports ar
                JOIN weighted_weeks ww ON ar.week_id = ww.week_id
                WHERE ar.institution_id = i.id 
                  AND ar.status = 'COMPLETED'
            ), 0
        ) as completed_days_score,
        (SELECT total_days_in_month FROM month_stats) as total_possible_days
    FROM institutions i
    LEFT JOIN monthly_closures mc ON mc.institution_id = i.id AND mc.year = $1 AND mc.month = $2
    ORDER BY i.id ASC
  `;

  const { rows } = await db.query(query, [year, month]);

  // Mapeamos para calcular el porcentaje final
  return rows.map((row) => {
    const total = parseInt(row.total_possible_days) || 0;
    const score = parseInt(row.completed_days_score) || 0;

    return {
      ...row,
      // Evitamos división por cero y redondeamos
      progress_percent: total > 0 ? Math.round((score / total) * 100) : 0
    };
  });
};

const closeMonth = async (institutionId, month, year, file, userId) => {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");

    let fileUrl = null;
    if (file) {
      // Construir URL accesible. Asumiendo que 'uploads' se sirve estáticamente.
      fileUrl = `/uploads/${file.filename}`;
    }

    const query = `
      INSERT INTO monthly_closures (institution_id, month, year, file_url, is_closed, closed_at, closed_by)
      VALUES ($1, $2, $3, $4, TRUE, NOW(), $5)
      ON CONFLICT (institution_id, month, year)
      DO UPDATE SET 
        file_url = COALESCE($4, monthly_closures.file_url),
        is_closed = TRUE,
        closed_at = NOW(),
        closed_by = $5;
    `;
    await client.query(query, [institutionId, month, year, fileUrl, userId]);

    await client.query("COMMIT");
    return { success: true, file_url: fileUrl };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getWeeks = async (year) => {
  const result = await db.query(
    "SELECT * FROM weeks WHERE year = $1 ORDER BY week_number ASC",
    [year]
  );
  return result.rows;
};

const getItemTypes = async () => {
  const result = await db.query(
    "SELECT * FROM agenda_item_types ORDER BY order_index ASC"
  );
  return result.rows;
};

module.exports = {
  getProfile,
  getMatrix,
  saveWeeklyAgenda,
  getWeeklyEntry,
  getMonthlyOverview,
  closeMonth,
  getWeeks,
  getItemTypes,

  // Admin
  getInstitutions: async () => {
    const query = `
            SELECT id, name, acronym, logo_url, created_by, updated_by, updated_at
            FROM institutions
            ORDER BY id ASC
        `;
    const { rows } = await db.query(query);
    return rows;
  },

  createInstitution: async (name, acronym, logoUrl, userId) => {
    const query = `
            INSERT INTO institutions (name, acronym, logo_url, created_by, updated_by)
            VALUES ($1, $2, $3, $4, $4)
            RETURNING *
        `;
    const { rows } = await db.query(query, [name, acronym, logoUrl, userId]);
    return rows[0];
  },

  updateInstitution: async (id, name, acronym, logoUrl, userId) => {
    let query = `
            UPDATE institutions
            SET name = $1, acronym = $2, updated_by = $3, updated_at = NOW()
        `;
    const params = [name, acronym, userId];
    let paramIndex = 4;

    if (logoUrl !== undefined) {
      query += `, logo_url = $${paramIndex}`;
      params.push(logoUrl);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(id);

    const { rows } = await db.query(query, params);
    return rows[0];
  },

  deleteInstitution: async (id) => {
    await db.query("DELETE FROM institutions WHERE id = $1", [id]);
  },

  getAssignments: async (institutionId) => {
    // 1. Get user_ids assigned to institution
    const assignmentQuery = `SELECT user_id FROM user_assignments WHERE institution_id = $1`;
    const assignmentRes = await db.query(assignmentQuery, [institutionId]);
    const userIds = assignmentRes.rows.map(r => r.user_id);

    if (userIds.length === 0) {
      return [];
    }

    // 2. Fetch user details from users_db
    const { Pool } = require('pg');
    const usersPool = new Pool({
      user: process.env.USERS_DB_USER,
      host: process.env.USERS_DB_HOST,
      database: process.env.USERS_DB_NAME,
      password: process.env.USERS_DB_PASSWORD,
      port: process.env.USERS_DB_PORT,
    });

    try {
      const usersQuery = `
                SELECT id_usuario as id, email, nombre_completo as name, rol as role 
                FROM usuarios 
                WHERE id_usuario = ANY($1::int[])
            `;
      const usersRes = await usersPool.query(usersQuery, [userIds]);
      return usersRes.rows;
    } finally {
      await usersPool.end();
    }
  },

  createAssignment: async (userId, institutionId) => {
    const query = `
            INSERT INTO user_assignments (user_id, institution_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
        `;
    await db.query(query, [userId, institutionId]);
  },

  deleteAssignment: async (userId, institutionId) => {
    const query = `
            DELETE FROM user_assignments 
            WHERE user_id = $1 AND institution_id = $2
        `;
    await db.query(query, [userId, institutionId]);
  },

  searchUsers: async (email) => {
    const { Pool } = require('pg');
    const usersPool = new Pool({
      user: process.env.USERS_DB_USER,
      host: process.env.USERS_DB_HOST,
      database: process.env.USERS_DB_NAME,
      password: process.env.USERS_DB_PASSWORD,
      port: process.env.USERS_DB_PORT,
    });

    try {
      const query = `
                SELECT id_usuario as id, email, nombre_completo as name, rol as role 
                FROM usuarios 
                WHERE email ILIKE $1
                LIMIT 10
            `;
      const { rows } = await usersPool.query(query, [`%${email}%`]);
      return rows;
    } finally {
      await usersPool.end();
    }
  },

  updateItemType: async (key, label, orderIndex) => {
    let query = `UPDATE agenda_item_types SET label = $1`;
    const params = [label];
    let paramIndex = 2;

    if (orderIndex !== undefined) {
      query += `, order_index = $${paramIndex}`;
      params.push(orderIndex);
      paramIndex++;
    }

    query += ` WHERE key = $${paramIndex} RETURNING *`;
    params.push(key);

    const { rows } = await db.query(query, params);
    return rows[0];
  }
};
