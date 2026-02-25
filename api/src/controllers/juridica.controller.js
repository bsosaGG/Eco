const db = require("../config/db-juridica");
const dbUsers = require("../config/db-users"); // Para audit logs globales si es necesario, pero usamos tabla local
const path = require("path");
const fs = require("fs");
const { TemplateHandler } = require("easy-template-x");
const libre = require('libreoffice-convert');
const util = require('util');
const convertAsync = util.promisify(libre.convert);

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

exports.getAuditLogs = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            "SELECT * FROM audit_logs WHERE juicio_id = $1 ORDER BY fecha DESC",
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

exports.getJuicios = async (req, res, next) => {
    try {
        const { estado, search, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT j.*, a.nombre as demandante_nombre 
            FROM juicios j
            LEFT JOIN actores_juridicos a ON j.demandante_id = a.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (estado) {
            query += ` AND j.estado_procesal = $${paramCount}`;
            params.push(estado);
            paramCount++;
        }

        if (search) {
            query += ` AND (j.numero_proceso ILIKE $${paramCount} OR j.organo_jurisdiccional ILIKE $${paramCount} OR a.nombre ILIKE $${paramCount} OR a.identificacion ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        query += " ORDER BY j.fecha_actualizacion DESC";

        // Count total for pagination
        // This is a bit expensive but needed for full pagination. 
        // For optimization, we could separate count query or use window function COUNT(*) OVER().
        const countQuery = `SELECT count(*) FROM (${query}) as count_table`; // Simple wrap for count despite performance in large datasets, ok for now.
        // Actually, let's just run the count query separately with same where clauses for better PG optimization usually.
        // Re-building where clause for count:
        let whereClause = "WHERE 1=1";
        const countParams = [];
        let countParamCount = 1;

        if (estado) {
            whereClause += ` AND j.estado_procesal = $${countParamCount}`;
            countParams.push(estado);
            countParamCount++;
        }
        if (search) {
            whereClause += ` AND (j.numero_proceso ILIKE $${countParamCount} OR j.organo_jurisdiccional ILIKE $${countParamCount} OR a.nombre ILIKE $${countParamCount})`;
            countParams.push(`%${search}%`);
            countParamCount++;
        }

        const totalResult = await db.query(`
            SELECT count(*) 
            FROM juicios j 
            LEFT JOIN actores_juridicos a ON j.demandante_id = a.id 
            ${whereClause}
        `, countParams);
        const total = parseInt(totalResult.rows[0].count);

        // Add pagination to main query
        query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const { rows } = await db.query(query, params);

        res.json({
            data: rows,
            meta: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getJuicioById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT j.*, a.nombre as demandante_nombre, a.identificacion as demandante_identificacion, a.identificacion_tipo as demandante_identificacion_tipo, a.tipo as demandante_tipo
            FROM juicios j
            LEFT JOIN actores_juridicos a ON j.demandante_id = a.id
            WHERE j.id = $1
        `;
        const juicioResult = await db.query(query, [id]);

        if (juicioResult.rows.length === 0) {
            return res.status(404).json({ message: "Juicio no encontrado" });
        }

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
            tipo_juicio,
            organo_jurisdiccional,
            juez,
            oficial,
            demandante_id,
            estado_procesal,
            actitud_procesal,
            intento_conciliacion,
            observaciones,
            monto_liquidacion,
            monto_rrhh,
            monto_estimado,
            efecto_sentencia_descripcion,
            origen_proceso,
            objeto_pretension,
            antecedentes_caso,
            sala_apelacion_nombre,
            tiene_amparo,
            amparo_organo_competente, // NUEVO
            numero_amparo,            // NUEVO
            estado_amparo_descripcion,
            ultimo_renglon_presupuestario,
            estado_actual_descripcion,
            interpuso_apelacion
        } = req.body;

        // Generar correlativo simple (placeholder)
        const currentYear = new Date().getFullYear();
        const countResult = await db.query("SELECT count(*) FROM juicios WHERE EXTRACT(YEAR FROM fecha_creacion) = $1", [currentYear]);
        const count = parseInt(countResult.rows[0].count) + 1;
        const correlativo = `SCSP-${currentYear}-${String(count).padStart(4, '0')}`;

        const query = `
      INSERT INTO juicios (
        correlativo, numero_proceso, tipo_juicio, organo_jurisdiccional, juez, oficial, demandante_id, estado_procesal, 
        actitud_procesal, intento_conciliacion, observaciones,
        monto_liquidacion, monto_rrhh, monto_estimado, efecto_sentencia_descripcion,
        origen_proceso, objeto_pretension, antecedentes_caso,
        sala_apelacion_nombre, tiene_amparo, amparo_organo_competente, numero_amparo, estado_amparo_descripcion, ultimo_renglon_presupuestario,
        estado_actual_descripcion, interpuso_apelacion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      RETURNING *
    `;

        const values = [
            correlativo, numero_proceso, tipo_juicio, organo_jurisdiccional, juez, oficial, demandante_id, estado_procesal || 'Demanda Ordinaria Laboral',
            actitud_procesal, intento_conciliacion || false, observaciones,
            monto_liquidacion || 0, monto_rrhh || 0, monto_estimado || 0, efecto_sentencia_descripcion,
            origen_proceso, objeto_pretension, antecedentes_caso,
            sala_apelacion_nombre, tiene_amparo || false, amparo_organo_competente, numero_amparo, estado_amparo_descripcion, ultimo_renglon_presupuestario,
            estado_actual_descripcion, interpuso_apelacion || false
        ];

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

        // 1. Obtener estado actual
        const selectQuery = `
            SELECT j.*, a.nombre as demandante_nombre, a.identificacion as demandante_identificacion, a.identificacion_tipo as demandante_identificacion_tipo, a.tipo as demandante_tipo
            FROM juicios j
            LEFT JOIN actores_juridicos a ON j.demandante_id = a.id
            WHERE j.id = $1
        `;
        const currentResult = await db.query(selectQuery, [id]);
        if (currentResult.rows.length === 0) return res.status(404).json({ message: "Juicio no encontrado" });
        const current = currentResult.rows[0];

        // 2. Definir campos permitidos y financieros
        const allowedFields = [
            'numero_proceso', 'tipo_juicio', 'organo_jurisdiccional', 'juez', 'oficial', 'demandante_id', 'estado_procesal',
            'actitud_procesal', 'intento_conciliacion', 'observaciones',
            'monto_liquidacion', 'monto_rrhh', 'monto_estimado', 'efecto_sentencia_descripcion',
            'origen_proceso', 'objeto_pretension', 'antecedentes_caso',
            'sala_apelacion_nombre', 'tiene_amparo', 'amparo_organo_competente', 'numero_amparo', 'estado_amparo_descripcion', 'ultimo_renglon_presupuestario',
            'estado_actual_descripcion', 'interpuso_apelacion'
        ];
        const financialFields = ['monto_liquidacion', 'monto_rrhh', 'monto_estimado', 'efecto_sentencia_descripcion'];

        // 3. Filtrar updates reales y checkear permisos
        const auditChanges = [];
        const params = [id];
        let paramCount = 2;
        let query = "UPDATE juicios SET ";
        const setClauses = [];

        // Check permisos financieros (Si existen en req.user, depende de auth middleware)
        // Asumimos que req.user.permissions es un array de strings.
        const userPermissions = req.user.permissions || [];
        const canManageFinancials = userPermissions.includes('juridica:manage-financials') || userPermissions.includes('admin');
        console.log(userPermissions, canManageFinancials);

        for (const key of Object.keys(updates)) {
            if (allowedFields.includes(key)) {
                // Check if value actually changed
                // Use loose equality for numbers/strings or explicit casting
                if (updates[key] != current[key]) {
                    // Check Permission for Financials
                    if (financialFields.includes(key) && !canManageFinancials) {
                        return res.status(403).json({ message: `No tiene permiso para modificar campos financieros (${key}).` });
                    }

                    setClauses.push(`${key} = $${paramCount}`);
                    params.push(updates[key]);
                    paramCount++;

                    // Audit log details
                    const oldVal = current[key] === null ? 'null' : current[key];
                    const newVal = updates[key] === null ? 'null' : updates[key];
                    auditChanges.push(`${key}: ${oldVal} -> ${newVal}`);
                }
            }
        }

        if (setClauses.length === 0) {
            return res.status(200).json(current); // Nada que actualizar
        }

        setClauses.push("fecha_actualizacion = CURRENT_TIMESTAMP");
        query += setClauses.join(", ") + " WHERE id = $1";

        await db.query(query, params);

        // 4. Log audit con detalles específicos
        await logAction(id, req.user.userId, req.user.email, "UPDATE_CASE", `Cambios: ${auditChanges.join(", ")}`);

        // Devolver el juicio actualizado con la información del demandante
        const updatedResult = await db.query(selectQuery, [id]);
        res.json(updatedResult.rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.saveBorrador = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { borrador } = req.body; // Expect JSON string or null

        // Update just the borrador field
        const query = "UPDATE juicios SET borrador = $1 WHERE id = $2 RETURNING id";
        await db.query(query, [borrador, id]);

        res.json({ message: "Borrador guardado" });
    } catch (error) {
        next(error);
    }
};

exports.downloadHistorialAttachment = async (req, res, next) => {
    try {
        const { id } = req.params; // Historial ID
        const result = await db.query("SELECT ruta_archivo_adjunto FROM historial_procesal WHERE id = $1", [id]);

        if (result.rows.length === 0 || !result.rows[0].ruta_archivo_adjunto) {
            return res.status(404).json({ message: "Adjunto no encontrado" });
        }

        const relativePath = result.rows[0].ruta_archivo_adjunto;
        const absolutePath = path.resolve(relativePath);

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ message: "Archivo físico no encontrado en servidor" });
        }

        res.download(absolutePath);
    } catch (error) {
        next(error);
    }
};

exports.getSuggestions = async (req, res, next) => {
    try {
        const { field, search } = req.query; // juez, oficial, organo_jurisdiccional, tipo_juicio, ultimo_renglon_presupuestario
        const allowed = ['juez', 'oficial', 'organo_jurisdiccional', 'tipo_juicio', 'ultimo_renglon_presupuestario', 'estado_actual_descripcion'];

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

exports.updateHistorial = async (req, res, next) => {
    try {
        const { id } = req.params; // Historial ID
        const { tipo_evento, sala_corte, fecha_interposicion, estado_recurso, descripcion, eliminar_adjunto } = req.body;
        const archivo = req.file;

        // 1. Check existance
        const currentResult = await db.query("SELECT * FROM historial_procesal WHERE id = $1", [id]);
        if (currentResult.rows.length === 0) return res.status(404).json({ message: "Registro de historial no encontrado" });
        const current = currentResult.rows[0];

        let nuevaRuta = current.ruta_archivo_adjunto;

        // 2. Definir cambios para auditoría
        const auditChanges = [];

        if (tipo_evento && tipo_evento !== current.tipo_evento) {
            auditChanges.push(`Tipo: "${current.tipo_evento}" -> "${tipo_evento}"`);
        }
        if (sala_corte !== undefined && sala_corte !== current.sala_corte) { // Puede venir vacio
            auditChanges.push(`Sala/Corte: "${current.sala_corte || ''}" -> "${sala_corte}"`);
        }
        if (fecha_interposicion) {
            const currentDate = new Date(current.fecha_interposicion).toISOString().split('T')[0];
            if (fecha_interposicion !== currentDate) {
                auditChanges.push(`Fecha: ${currentDate} -> ${fecha_interposicion}`);
            }
        }
        if (estado_recurso !== undefined && estado_recurso !== current.estado_recurso) {
            auditChanges.push(`Estado Recurso: "${current.estado_recurso || ''}" -> "${estado_recurso}"`);
        }
        if (descripcion && descripcion !== current.descripcion) {
            auditChanges.push(`Descripción: "${current.descripcion || ''}" -> "${descripcion}"`);
        }

        // 3. Handle File Logic
        if (archivo) {
            // New file uploaded -> Replace
            if (current.ruta_archivo_adjunto) {
                const oldPath = path.resolve(current.ruta_archivo_adjunto);
                if (fs.existsSync(oldPath)) {
                    try {
                        fs.unlinkSync(oldPath);
                    } catch (err) {
                        console.error("Error deleting old file:", err);
                    }
                }
            }
            nuevaRuta = `uploads/juridica/${archivo.filename}`;
            auditChanges.push("Archivo: Reemplazado");
        } else if (eliminar_adjunto === 'true' || eliminar_adjunto === true) {
            // Request to delete file
            if (current.ruta_archivo_adjunto) {
                const oldPath = path.resolve(current.ruta_archivo_adjunto);
                if (fs.existsSync(oldPath)) {
                    try {
                        fs.unlinkSync(oldPath);
                    } catch (err) {
                        console.error("Error deleting file:", err);
                    }
                }
                nuevaRuta = null;
                auditChanges.push("Archivo: Eliminado");
            }
        }

        // 4. Update DB
        const query = `
            UPDATE historial_procesal 
            SET tipo_evento = $1, sala_corte = $2, fecha_interposicion = $3, estado_recurso = $4, descripcion = $5, ruta_archivo_adjunto = $6
            WHERE id = $7
            RETURNING *
        `;
        const values = [
            tipo_evento || current.tipo_evento,
            sala_corte !== undefined ? sala_corte : current.sala_corte,
            fecha_interposicion || current.fecha_interposicion,
            estado_recurso !== undefined ? estado_recurso : current.estado_recurso,
            descripcion || current.descripcion,
            nuevaRuta,
            id
        ];

        const { rows } = await db.query(query, values);

        const detallesAudit = auditChanges.length > 0
            ? `Cambios en historial ID ${id}: ${auditChanges.join(", ")}`
            : `Actualizado historial ID ${id} (Sin cambios detectados)`;

        await logAction(current.juicio_id, req.user.userId, req.user.email, "UPDATE_HISTORY", detallesAudit);

        res.json(rows[0]);

    } catch (error) {
        // If error and we uploaded a new file, clean it up
        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch (e) { }
        }
        next(error);
    }
};

exports.deleteHistorial = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await db.query("SELECT * FROM historial_procesal WHERE id = $1", [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Registro no encontrado" });
        const historial = result.rows[0];

        // Delete file if exists
        if (historial.ruta_archivo_adjunto) {
            const filePath = path.resolve(historial.ruta_archivo_adjunto);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    console.error("Error deleting file during historial delete:", err);
                }
            }
        }

        await db.query("DELETE FROM historial_procesal WHERE id = $1", [id]);

        const detallesEliminado = `Historial eliminado: Tipo=${historial.tipo_evento}, Fecha=${new Date(historial.fecha_interposicion).toISOString().split('T')[0]}, Desc=${historial.descripcion}, Sala=${historial.sala_corte || 'N/A'}, Adjunto=${historial.ruta_archivo_adjunto ? 'Sí' : 'No'}`;

        await logAction(historial.juicio_id, req.user.userId, req.user.email, "DELETE_HISTORY", detallesEliminado);

        res.json({ message: "Registro y archivo eliminado correctamente" });
    } catch (error) {
        next(error);
    }
};

exports.exportDocx = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 1. Verificar Permisos (Granular)
        const format = req.query.format || 'docx';
        const userPermissions = req.user.permissions || [];
        const isAdmin = req.user.role === 'admin';

        if (format === 'pdf') {
            if (!isAdmin && !userPermissions.includes('juridica:generate-pdf')) {
                return res.status(403).json({ message: "No tiene permiso para generar documentos PDF (juridica:generate-pdf)." });
            }
        } else {
            // Default to DOCX check
            if (!isAdmin && !userPermissions.includes('juridica:generate-doc')) {
                return res.status(403).json({ message: "No tiene permiso para generar documentos DOCX (juridica:generate-doc)." });
            }
        }

        // 2. Obtener datos
        const juicioQuery = await db.query("SELECT * FROM juicios WHERE id = $1", [id]);
        if (juicioQuery.rows.length === 0) return res.status(404).json({ message: "Juicio no encontrado" });
        const juicio = juicioQuery.rows[0];

        const actorQuery = await db.query("SELECT * FROM actores_juridicos WHERE id = $1", [juicio.demandante_id]);
        const actor = actorQuery.rows[0];
        actor.tiene_identificacion = actor.identificacion ? true : false;

        const historialQuery = await db.query("SELECT *, TO_CHAR(fecha_interposicion, 'DD/MM/YYYY') as fecha_interposicion_legible FROM historial_procesal WHERE juicio_id = $1", [id]);
        const historial = historialQuery.rows;

        const demandanteAplanado = Object.entries(actor).reduce((acc, [key, value]) => {
            acc[`demandante_${key}`] = value;
            return acc;
        }, {});

        const data = {
            ...juicio,
            ...demandanteAplanado,
            historial: historial,

            // Logic for exported fields
            actitud_procesal: (juicio.intento_conciliacion ? "SÍ se ha buscado la vía conciliatoria. " : "NO se ha buscado la vía conciliatoria. ") + (juicio.actitud_procesal || ''),
            monto_liquidacion: `Q${Number(juicio.monto_liquidacion || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`,
            monto_rrhh: `Q${Number(juicio.monto_rrhh || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`,
            monto_estimado: `Q${Number(juicio.monto_estimado || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })} - Impacto: ${juicio.efecto_sentencia_descripcion || 'Sin descripción'}`,

            // Direct Mapping with aliases if template uses them specifically
            sala_apelacion: juicio.sala_apelacion_nombre,
            amparo_estado: juicio.estado_amparo_descripcion,
            interpuso_apelacion: juicio.interpuso_apelacion ? "SÍ" : "NO",
            sala_apelacion_nombre: juicio.interpuso_apelacion ? juicio.sala_apelacion_nombre : "-",
            accion_amparo: juicio.tiene_amparo
                ? "SÍ se interpuso amparo. Órgano competente: " + juicio.amparo_organo_competente + ". No. Expediente " + juicio.numero_amparo + ". " + juicio.estado_amparo_descripcion
                : "NO se interpuso amparo.",

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

        // 3. Renderizar DOCX
        const handler = new TemplateHandler();
        const doc = await handler.process(templateFile, data);

        // 4. Verificar formato solicitado
        // const format = req.query.format || 'docx'; // YA DECLARADO ARRIBA

        if (format === 'pdf') {
            // Convertir a PDF usando libreoffice
            const pdfBuf = await convertAsync(doc, '.pdf', undefined);

            res.setHeader("Content-Disposition", `attachment; filename="Ficha_Juicio_${juicio.numero_proceso}.pdf"`);
            res.setHeader("Content-Type", "application/pdf");
            res.send(pdfBuf);
        } else {
            // Enviar DOCX (default)
            res.setHeader("Content-Disposition", `attachment; filename="Ficha_Juicio_${juicio.numero_proceso}.docx"`);
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            res.send(doc);
        }

    } catch (error) {
        next(error);
    }
};

// --- GESTIÓN DE PLANTILLAS Y ACTORES ---
exports.createActor = async (req, res, next) => {
    try {
        const { nombre, identificacion, identificacion_tipo, tipo } = req.body;
        const result = await db.query(
            "INSERT INTO actores_juridicos (nombre, identificacion, identificacion_tipo, tipo) VALUES ($1, $2, $3, $4) RETURNING *",
            [nombre, identificacion, identificacion_tipo, tipo]
        );
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.getActorById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query("SELECT * FROM actores_juridicos WHERE id = $1", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Actor no encontrado" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.searchActores = async (req, res, next) => {
    try {
        const { search, tipo } = req.query;
        let query = "SELECT * FROM actores_juridicos WHERE 1=1";
        const params = [];
        let paramCount = 1;

        if (tipo) {
            query += ` AND tipo = $${paramCount}`;
            params.push(tipo);
            paramCount++;
        }

        if (search) {
            query += ` AND (nombre ILIKE $${paramCount} OR identificacion ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        query += " ORDER BY nombre ASC LIMIT 10";

        const result = await db.query(query, params);
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

exports.getDashboardStats = async (req, res, next) => {
    try {
        const result = await db.query(`
            SELECT 
                COUNT(*) FILTER (WHERE estado_procesal NOT IN ('Archivado', 'Favorable'))::int as casos_activos,
                COUNT(*) FILTER (WHERE estado_procesal = 'En Trámite')::int as en_tramite,
                COUNT(*) FILTER (WHERE estado_procesal = 'Sentencia')::int as sentencias,
                COALESCE(SUM(monto_estimado) FILTER (WHERE 
                    estado_procesal NOT IN ('Archivado', 'Favorable') 
                    OR tiene_amparo = TRUE 
                    OR interpuso_apelacion = TRUE
                ), 0) as contingencia_total
            FROM juicios
        `);
        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
};
