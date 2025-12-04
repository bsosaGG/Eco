const db = require("../config/db-media");

const getPublicCatalog = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, nombre, requiere_especificar FROM cat_medios WHERE activo = true ORDER BY requiere_especificar ASC, nombre ASC"
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error al obtener catálogo de medios:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

const submitResponse = async (req, res) => {
    const { mediaId, journalistName, email, customMediaName, topics } = req.body;

    if (!mediaId || !journalistName || !email || !topics || !Array.isArray(topics) || topics.length === 0) {
        return res.status(400).json({ error: "Datos incompletos o inválidos" });
    }

    const client = await db.getClient();

    try {
        await client.query("BEGIN");

        // 1. Insertar cabecera
        const insertHeaderQuery = `
      INSERT INTO respuestas_medios (id_medio, nombre_periodista, email, nombre_medio_otro)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
        const headerResult = await client.query(insertHeaderQuery, [
            mediaId,
            journalistName,
            email,
            customMediaName,
        ]);
        const responseId = headerResult.rows[0].id;

        // 2. Insertar temas
        const insertTopicQuery = `
      INSERT INTO temas_respuesta (id_respuesta, prioridad, descripcion)
      VALUES ($1, $2, $3)
    `;

        for (let i = 0; i < topics.length; i++) {
            // Prioridad es el índice + 1
            await client.query(insertTopicQuery, [responseId, i + 1, topics[i]]);
        }

        await client.query("COMMIT");
        res.status(201).json({ message: "Respuesta enviada correctamente", id: responseId });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error al enviar respuesta:", error);
        res.status(500).json({ error: "Error al procesar la solicitud" });
    } finally {
        client.release();
    }
};

const getSubmissions = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        // 1. Obtener total de registros
        const countResult = await db.query("SELECT COUNT(*) FROM respuestas_medios");
        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);

        // 2. Obtener registros paginados
        const optimizedQuery = `
      SELECT 
        rm.id, 
        rm.nombre_periodista, 
        rm.nombre_medio_otro, 
        rm.email,
        rm.fecha_creacion,
        cm.nombre as nombre_medio,
        COALESCE(
          json_agg(
            json_build_object('prioridad', tr.prioridad, 'descripcion', tr.descripcion) 
            ORDER BY tr.prioridad ASC
          ) FILTER (WHERE tr.id IS NOT NULL), 
          '[]'
        ) as temas
      FROM respuestas_medios rm
      JOIN cat_medios cm ON rm.id_medio = cm.id
      LEFT JOIN temas_respuesta tr ON rm.id = tr.id_respuesta
      GROUP BY rm.id, cm.nombre
      ORDER BY rm.fecha_creacion DESC
      LIMIT $1 OFFSET $2
    `;

        const result = await db.query(optimizedQuery, [limit, offset]);

        res.json({
            data: result.rows,
            meta: {
                total,
                page,
                limit,
                totalPages
            }
        });
    } catch (error) {
        console.error("Error al obtener respuestas:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

const getCatalog = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM cat_medios ORDER BY id ASC");
        res.json(result.rows);
    } catch (error) {
        console.error("Error al obtener catálogo (admin):", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

const createMedia = async (req, res) => {
    const { nombre, requiere_especificar } = req.body;
    try {
        const result = await db.query(
            "INSERT INTO cat_medios (nombre, requiere_especificar) VALUES ($1, $2) RETURNING *",
            [nombre, requiere_especificar || false]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error al crear medio:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

const updateMedia = async (req, res) => {
    const { id } = req.params;
    const { nombre, activo, requiere_especificar } = req.body;
    try {
        const result = await db.query(
            "UPDATE cat_medios SET nombre = $1, activo = $2, requiere_especificar = $3 WHERE id = $4 RETURNING *",
            [nombre, activo, requiere_especificar, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Medio no encontrado" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error al actualizar medio:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

const deleteMedia = async (req, res) => {
    const { id } = req.params;
    try {
        // Verificar si tiene uso
        const checkUsage = await db.query("SELECT COUNT(*) FROM respuestas_medios WHERE id_medio = $1", [id]);
        if (parseInt(checkUsage.rows[0].count) > 0) {
            // Soft delete si tiene uso (o simplemente desactivar, pero el usuario pidió DELETE endpoint)
            // Si tiene uso, mejor desactivar o impedir borrar.
            // Vamos a impedir borrar si tiene uso.
            return res.status(400).json({ error: "No se puede eliminar un medio con respuestas asociadas. Desactívelo en su lugar." });
        }

        const result = await db.query("DELETE FROM cat_medios WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Medio no encontrado" });
        }
        res.json({ message: "Medio eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar medio:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

const getConfig = async (req, res) => {
    try {
        const result = await db.query("SELECT clave, valor FROM configuracion");
        const config = {};
        result.rows.forEach(row => {
            config[row.clave] = row.valor;
        });
        res.json(config);
    } catch (error) {
        console.error("Error al obtener configuración:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

const updateConfig = async (req, res) => {
    const configUpdates = req.body; // Espera un objeto { clave: valor, ... }

    try {
        await db.query("BEGIN");

        const updateQuery = `
            INSERT INTO configuracion (clave, valor)
            VALUES ($1, $2)
            ON CONFLICT (clave) 
            DO UPDATE SET valor = EXCLUDED.valor
        `;

        for (const [key, value] of Object.entries(configUpdates)) {
            await db.query(updateQuery, [key, String(value)]);
        }

        await db.query("COMMIT");
        res.json({ message: "Configuración actualizada correctamente" });
    } catch (error) {
        await db.query("ROLLBACK");
        console.error("Error al actualizar configuración:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

module.exports = {
    getPublicCatalog,
    getConfig,
    updateConfig,
    submitResponse,
    getSubmissions,
    getCatalog,
    createMedia,
    updateMedia,
    deleteMedia
};
