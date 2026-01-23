const db = require("../config/db-juridica");
const dbUsers = require("../config/db-users"); // Para audit logs globales si es necesario, pero usamos tabla local
const path = require("path");
const fs = require("fs");
const { TemplateHandler } = require("easy-template-x");

// --- UTILS ---
const logAction = async (juicioId, userId, userName, action, details) => {
    try {
        await db.query(
            "INSERT INTO audit_logs (juicio_id, usuario_id, nombre_usuario, accion, detalles) VALUES ($1, $2, $3, $4, $5)",
            [juicioId, userId, userName, action, details]
        );
    } catch (err) {
        console.error("Error creating audit log:", err);
    }
};

// --- CONTROLLERS ---

exports.getJuicios = async (req, res, next) => {
    try {
        const { estado, search } = req.query;
        let query = "SELECT * FROM juicios WHERE 1=1";
        const params = [];
        let paramCount = 1;

        if (estado) {
            query += ` AND estado_procesal = $${paramCount}`;
            params.push(estado);
            paramCount++;
        }

        if (search) {
            query += ` AND (numero_proceso ILIKE $${paramCount} OR demandante_id ILIKE $${paramCount} OR organo_jurisdiccional ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        query += " ORDER BY fecha_actualizacion DESC";

        const { rows } = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        next(error);
    }
};

exports.getJuicioById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const juicioResult = await db.query("SELECT * FROM juicios WHERE id = $1", [id]);

        if (juicioResult.rows.length === 0) {
            return res.status(404).json({ message: "Juicio no encontrado" });
        }

        const actorsResult = await db.query("SELECT * FROM actores_juridicos WHERE id IN (SELECT id FROM actores_juridicos)");
        // TODO: Relacionar actores con juicio si es n-n, pero el esquema actual usa campos de texto libre en juicios (juez, oficial) o IDs en demandante_id.
        // El requerimiento dice "Campos para ID... juez, oficial, demandante_id".
        // Asumiremos que por ahora devuelve el juicio y el frontend busca los actores si es necesario o son campos de texto autocompletados.

        const historialResult = await db.query("SELECT * FROM historial_procesal WHERE juicio_id = $1 ORDER BY fecha_registro DESC", [id]);

        const juicio = juicioResult.rows[0];
        const historial = historialResult.rows;

        res.json({ ...juicio, historial });
    } catch (error) {
        next(error);
    }
};

exports.createJuicio = async (req, res, next) => {
    try {
        const {
            numero_proceso,
            organo_jurisdiccional,
            juez,
            oficial,
            demandante_id,
            estado_procesal,
            actitud_procesal,
            observaciones
        } = req.body;

        // Generar correlativo simple (placeholder)
        const countResult = await db.query("SELECT count(*) FROM juicios");
        const count = parseInt(countResult.rows[0].count) + 1;
        const correlativo = `LAB-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

        const query = `
      INSERT INTO juicios (
        correlativo, numero_proceso, organo_jurisdiccional, juez, oficial, demandante_id, estado_procesal, actitud_procesal, observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

        const values = [correlativo, numero_proceso, organo_jurisdiccional, juez, oficial, demandante_id, estado_procesal || 'En Trámite', actitud_procesal, observaciones];

        const { rows } = await db.query(query, values);

        await logAction(rows[0].id, req.user.userId, req.user.email || req.user.username, "CREATE_CASE", `Juicio creado ${correlativo}`);

        res.status(201).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.updateJuicio = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Construir query dinámica
        const allowedFields = ['numero_proceso', 'organo_jurisdiccional', 'juez', 'oficial', 'demandante_id', 'estado_procesal', 'actitud_procesal', 'observaciones', 'monto_liquidacion', 'monto_rrhh', 'monto_estimado'];

        // Validar permisos financieros
        const financialFields = ['monto_liquidacion', 'monto_rrhh', 'monto_estimado'];
        const hasFinancialUpdate = Object.keys(updates).some(k => financialFields.includes(k));

        // Esta validación también se puede hacer en middleware, pero aquí es más flexible
        /* 
           NOTA: La validación estricta de permisos para campos específicos se hace difícil solo con middleware de ruta.
           Aquí asumimos que 'juridica:manage-financials' es necesario si se tocan los montos.
        */
        // Check permission logic inside controller if complicated
        // const canManageFinancials = ... (check req.user permissions)

        let query = "UPDATE juicios SET ";
        const params = [id];
        let paramCount = 2;
        const setClauses = [];

        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                setClauses.push(`${key} = $${paramCount}`);
                params.push(updates[key]);
                paramCount++;
            }
        });

        if (setClauses.length === 0) {
            return res.status(400).json({ message: "No valid fields to update" });
        }

        setClauses.push("fecha_actualizacion = CURRENT_TIMESTAMP");
        query += setClauses.join(", ") + " WHERE id = $1 RETURNING *";

        const { rows } = await db.query(query, params);

        await logAction(id, req.user.userId, req.user.email, "UPDATE_CASE", `Actualización de campos: ${Object.keys(updates).join(", ")}`);

        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.getSuggestions = async (req, res, next) => {
    try {
        const { field, search } = req.query; // juez, oficial, organo_jurisdiccional
        const allowed = ['juez', 'oficial', 'organo_jurisdiccional'];

        if (!allowed.includes(field)) {
            return res.status(400).json({ message: "Invalid field for suggestions" });
        }

        if (!search || search.trim() === '') {
            return res.json([]);
        }

        const query = `SELECT DISTINCT ${field} as value FROM juicios WHERE ${field} ILIKE $1 ORDER BY ${field} LIMIT 10`;
        const { rows } = await db.query(query, [`%${search}%`]);
        res.json(rows.map(r => r.value));
    } catch (error) {
        next(error);
    }
};

exports.addHistorial = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { tipo_evento, sala_corte, fecha_interposicion, estado_recurso, descripcion } = req.body;
        const archivo = req.file;

        const rutaArchivo = archivo ? `uploads/juridica/${archivo.filename}` : null;

        const query = `
      INSERT INTO historial_procesal (
        juicio_id, tipo_evento, sala_corte, fecha_interposicion, estado_recurso, descripcion, ruta_archivo_adjunto
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

        const values = [id, tipo_evento, sala_corte, fecha_interposicion, estado_recurso, descripcion, rutaArchivo];
        const { rows } = await db.query(query, values);

        await logAction(id, req.user.userId, req.user.email, "ADD_HISTORY", `Agregado historial: ${tipo_evento}`);

        res.status(201).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.exportDocx = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 1. Obtener datos
        const juicioQuery = await db.query("SELECT * FROM juicios WHERE id = $1", [id]);
        if (juicioQuery.rows.length === 0) return res.status(404).json({ message: "Juicio no encontrado" });
        const juicio = juicioQuery.rows[0];

        const historialQuery = await db.query("SELECT * FROM historial_procesal WHERE juicio_id = $1", [id]);
        const historial = historialQuery.rows;

        const data = {
            ...juicio,
            historial: historial,
            fecha_impresion: new Date().toLocaleDateString()
        };

        // 2. Cargar plantilla activa
        const plantillasQuery = await db.query("SELECT ruta_archivo FROM plantillas_docs WHERE activo = TRUE LIMIT 1");
        // Fallback si no hay plantilla en BD, usar una default o error
        if (plantillasQuery.rows.length === 0) {
            return res.status(400).json({ message: "No hay plantilla activa configurada" });
        }

        const templatePath = path.resolve(plantillasQuery.rows[0].ruta_archivo); // Asegurar ruta absoluta si es relativa
        // NOTA: ruta_archivo en BD debería ser relativa a la raíz o absoluta. Asumiremos relativa a CWD o 'uploads/plantillas/'
        // Ajustar path según como se guarden.

        if (!fs.existsSync(templatePath)) {
            return res.status(500).json({ message: "Archivo de plantilla no encontrado en servidor" });
        }

        const templateFile = fs.readFileSync(templatePath);

        // 3. Renderizar
        const handler = new TemplateHandler();
        console.log(data);
        const doc = await handler.process(templateFile, data);

        // 4. Enviar
        res.setHeader("Content-Disposition", `attachment; filename="Ficha_Juicio_${juicio.numero_proceso}.docx"`);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.send(doc);

    } catch (error) {
        next(error);
    }
};

// --- GESTIÓN DE PLANTILLAS Y ACTORES ---
exports.createActor = async (req, res, next) => {
    try {
        const { nombre, identificacion, tipo } = req.body;
        const result = await db.query(
            "INSERT INTO actores_juridicos (nombre, identificacion, tipo) VALUES ($1, $2, $3) RETURNING *",
            [nombre, identificacion, tipo]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.searchActores = async (req, res, next) => {
    try {
        const { search } = req.query;
        const result = await db.query(
            "SELECT * FROM actores_juridicos WHERE nombre ILIKE $1 LIMIT 10",
            [`%${search}%`]
        );
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

exports.uploadTemplate = async (req, res, next) => {
    try {
        const { nombre, descripcion } = req.body;
        const file = req.file;
        if (!file) return res.status(400).json({ message: "No file uploaded" });

        const ruta = file.path; // Multer returns path

        // Desactivar anteriores si se desea solo 1 activa
        await db.query("UPDATE plantillas_docs SET activo = FALSE");

        const result = await db.query(
            "INSERT INTO plantillas_docs (nombre, descripcion, ruta_archivo, activo) VALUES ($1, $2, $3, TRUE) RETURNING *",
            [nombre, descripcion, ruta]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.getTemplates = async (req, res, next) => {
    try {
        const result = await db.query("SELECT * FROM plantillas_docs ORDER BY fecha_actualizacion DESC");
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};
