const fs = require("fs");
const path = require("path");
const XlsxTemplate = require("xlsx-template");
const db = require("../config/db-impresiones");

/**
 * Sube una nueva plantilla de Excel al sistema.
 */
exports.uploadTemplate = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No se subió ningún archivo .xlsx" });
        }

        const { nombre, codigo, campos_requeridos = "[]" } = req.body;

        if (!nombre || !codigo) {
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ message: "El nombre y el código de la plantilla son obligatorios." });
        }

        // Guardar ruta relativa normalizada
        const ruta_archivo = req.file.path.replace(/\\/g, "/");

        const result = await db.query(
            "INSERT INTO plantillas (nombre, codigo, ruta_archivo, campos_requeridos) VALUES ($1, $2, $3, $4) RETURNING *",
            [nombre, codigo, ruta_archivo, campos_requeridos]
        );

        res.status(201).json({
            message: "Plantilla creada exitosamente.",
            plantilla: result.rows[0],
        });
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error("Error al subir plantilla:", error);

        // Capturar error de unique constraint (codigo duplicado)
        if (error.code === '23505') {
            return res.status(400).json({ message: "Ya existe una plantilla con ese código." });
        }

        res.status(500).json({ message: "Error interno al crear plantilla.", error: error.message });
    }
};

/**
 * Obtiene todas las plantillas activas.
 */
exports.getTemplates = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, nombre, codigo, campos_requeridos, fecha_creacion FROM plantillas WHERE activo = TRUE ORDER BY fecha_creacion DESC"
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error al obtener plantillas:", error);
        res.status(500).json({ message: "Error interno al obtener plantillas." });
    }
};

/**
 * Obtiene KPIs para el dashboard.
 */
exports.getDashboardKPIs = async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM registros_impresion) as total_generados,
                (SELECT COUNT(*) FROM plantillas WHERE activo = TRUE) as plantillas_activas,
                (SELECT COUNT(*) FROM registros_impresion WHERE recibido = FALSE) as pendientes_recibir
        `;
        const result = await db.query(statsQuery);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error al obtener KPIs:", error);
        res.status(500).json({ message: "Error interno al obtener KPIs." });
    }
};

/**
 * Obtiene los últimos documentos generados (con paginación).
 */
exports.getRecentDocuments = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Count total records for pagination
        const countResult = await db.query('SELECT COUNT(*) FROM registros_impresion');
        const totalRegistros = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalRegistros / limit);

        const result = await db.query(
            `SELECT ri.id, ri.correlativo, ri.fecha_creacion, p.nombre as plantilla_nombre,
            ri.datos_formulario, ri.recibido, ri.fecha_recibido, ri.nombre_recibe, ri.id_usuario_creador
            FROM registros_impresion ri
            JOIN plantillas p ON ri.id_plantilla = p.id
            ORDER BY ri.fecha_creacion DESC
            LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        // Obtener nombres reales de base de datos de usuarios
        const usersDb = require("../config/db-users");

        let userIds = new Set();
        result.rows.forEach(row => {
            if (row.id_usuario_creador) userIds.add(row.id_usuario_creador);
        });

        const usersMap = {};
        if (userIds.size > 0) {
            const usersResult = await usersDb.query(
                `SELECT id_usuario, email, nombre_completo FROM usuarios WHERE id_usuario = ANY($1::int[])`,
                [Array.from(userIds)]
            );
            usersResult.rows.forEach(u => {
                usersMap[u.id_usuario] = {
                    nombreCompleto: u.nombre_completo,
                    correo: u.email
                };
            });
        }

        const dataWithUsers = result.rows.map(row => {
            const creador = usersMap[row.id_usuario_creador];

            return {
                ...row,
                usuario_nombre: creador ? creador.nombreCompleto : 'Desconocido',
                creador_correo: creador ? creador.correo : null,
                receptor_nombre: row.nombre_recibe || null,
                receptor_correo: null
            };
        });

        res.status(200).json({
            data: dataWithUsers,
            pagination: {
                totalRegistros,
                totalPages,
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        console.error("Error al obtener documentos recientes:", error);
        res.status(500).json({ message: "Error interno al obtener documentos." });
    }
};

/**
 * Marca un documento como recibido
 */
exports.markAsReceived = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { secuencia, nombre_recibe, fecha_recibido } = req.body;

        if (!secuencia || !nombre_recibe) {
            return res.status(400).json({ message: "La secuencia y el nombre de quien recibe son requeridos." });
        }

        const anio = new Date().getFullYear();
        let fecha = fecha_recibido ? new Date(fecha_recibido) : new Date();

        // Compensar -6 horas de zona horaria (Guatemala) si la UI o cliente manda en UTC
        fecha.setHours(fecha.getHours() + 6);

        const client = await db.getClient();
        try {
            await client.query("BEGIN");

            // Buscar la plantilla activa más reciente
            const plantillaResult = await client.query(
                "SELECT id FROM plantillas WHERE activo = TRUE ORDER BY fecha_creacion DESC LIMIT 1"
            );

            if (plantillaResult.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({ message: "No hay ninguna plantilla activa." });
            }

            const id_plantilla = plantillaResult.rows[0].id;

            // Intentar marcar como recibido si pertenece a esta plantilla, a este creador, este año, y NO ha sido recibido aún
            const result = await client.query(
                `UPDATE registros_impresion 
                 SET recibido = TRUE, fecha_recibido = $1, nombre_recibe = $2
                 WHERE secuencia = $3 AND id_usuario_creador = $4 AND anio = $5 AND id_plantilla = $6 AND recibido = FALSE
                 RETURNING *`,
                [fecha, nombre_recibe, secuencia, userId, anio, id_plantilla]
            );

            if (result.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({ message: "El documento no existe, ya fue marcado como recibido, o usted no lo creó." });
            }

            await client.query("COMMIT");
            res.status(200).json({ message: "Documento marcado como recibido.", documento: result.rows[0] });
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error al marcar como recibido:", error);
        res.status(500).json({ message: "Error interno al actualizar documento." });
    }
};

/**
 * Genera un Excel a partir de una plantilla y lo devuelve como buffer.
 */
exports.generateExcel = async (req, res) => {
    const client = await db.getClient();
    try {
        let { id_plantilla, datos_formulario } = req.body;
        const userId = req.user.userId;

        if (!datos_formulario) {
            return res.status(400).json({ message: "Los datos_formulario son obligatorios." });
        }

        await client.query("BEGIN");

        let plantillaResult;
        // 1. Obtener la plantilla para verificar que existe y está activa
        if (id_plantilla) {
            plantillaResult = await client.query(
                "SELECT * FROM plantillas WHERE id = $1 AND activo = TRUE",
                [id_plantilla]
            );
        } else {
            // Si no se envía id_plantilla, tomar la más reciente
            plantillaResult = await client.query(
                "SELECT * FROM plantillas WHERE activo = TRUE ORDER BY fecha_creacion DESC LIMIT 1"
            );
        }

        if (plantillaResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "No hay ninguna plantilla activa para generar el documento." });
        }

        const plantilla = plantillaResult.rows[0];
        id_plantilla = plantilla.id;

        // 2. Determinar correlativo anual con bloqueo seguro
        const anio = new Date().getFullYear();

        // Para evitar el error de MAX() con FOR UPDATE, bloqueamos el registro más reciente (o la tabla si se requiere concurrencia extrema,
        // pero obtener la última fila con for update funciona bien en postgres para secuencias por padre)
        const ultimaSecuenciaResult = await client.query(
            "SELECT secuencia FROM registros_impresion WHERE id_plantilla = $1 AND anio = $2 ORDER BY secuencia DESC LIMIT 1 FOR UPDATE",
            [id_plantilla, anio]
        );

        let secuencia = 1;
        if (ultimaSecuenciaResult.rows.length > 0) {
            secuencia = ultimaSecuenciaResult.rows[0].secuencia + 1;
        }

        const correlativo = `${anio}-${plantilla.codigo}-${secuencia.toString().padStart(4, "0")}`;

        // 3. Registrar la impresión en la base de datos
        await client.query(
            "INSERT INTO registros_impresion (id_plantilla, anio, secuencia, correlativo, id_usuario_creador, datos_formulario) VALUES ($1, $2, $3, $4, $5, $6)",
            [id_plantilla, anio, secuencia, correlativo, userId, JSON.stringify(datos_formulario)]
        );

        await client.query("COMMIT");

        // 4. Generar el documento Excel
        const filePath = path.resolve(plantilla.ruta_archivo);

        if (!fs.existsSync(filePath)) {
            console.error(`Archivo de plantilla no encontrado físicamente: ${filePath}`);
            return res.status(500).json({ message: "El archivo físico de la plantilla no se encontró." });
        }

        const templateData = fs.readFileSync(filePath);
        const template = new XlsxTemplate(templateData);

        const fechaActual = new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });

        // Sustitución de datos (se usa hoja 1 por defecto)
        const substitutionValues = {
            correlativo: correlativo,
            secuencia: secuencia,
            fecha: fechaActual,
            ...datos_formulario,
        };

        template.substitute(1, substitutionValues);

        const buffer = template.generate({ type: "nodebuffer" });

        // 5. Retornar el archivo Excel al cliente
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="Documento_${correlativo}.xlsx"`
        );

        res.status(200).send(buffer);
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error al generar Excel:", error);
        res.status(500).json({ message: "Error interno al generar documento", error: error.message });
    } finally {
        client.release();
    }
};
