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
 * Obtiene los últimos documentos generados (con paginación y filtros).
 */
exports.getRecentDocuments = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { search, estado, fechaInicio, fechaFin, sortBy, sortOrder } = req.query;

        let whereClause = "WHERE 1=1";
        let queryParams = [];
        let paramIndex = 1;

        if (search) {
            // Check if it's a number to search in secuencia
            if (!isNaN(search)) {
                whereClause += ` AND (ri.correlativo ILIKE $${paramIndex} OR p.nombre ILIKE $${paramIndex} OR ri.secuencia = $${paramIndex + 1})`;
                queryParams.push(`%${search}%`, parseInt(search));
                paramIndex += 2;
            } else {
                whereClause += ` AND (ri.correlativo ILIKE $${paramIndex} OR p.nombre ILIKE $${paramIndex})`;
                queryParams.push(`%${search}%`);
                paramIndex++;
            }
        }

        if (estado === 'recibido') {
            whereClause += ` AND ri.recibido = TRUE`;
        } else if (estado === 'pendiente') {
            whereClause += ` AND ri.recibido = FALSE`;
        }

        if (fechaInicio) {
            // +6 Horas para zona horaria de Guatemala
            const startDate = new Date(fechaInicio);
            startDate.setHours(startDate.getHours() + 6);
            whereClause += ` AND ri.fecha_creacion >= $${paramIndex}`;
            queryParams.push(startDate);
            paramIndex++;
        }

        if (fechaFin) {
            // Añadir un día y truncar tiempo, y compensar +6 horas
            const endDate = new Date(fechaFin);
            endDate.setDate(endDate.getDate() + 1);
            endDate.setHours(endDate.getHours() + 6);
            whereClause += ` AND ri.fecha_creacion < $${paramIndex}`;
            queryParams.push(endDate);
            paramIndex++;
        }

        // Count total records for pagination
        const countQuery = `
            SELECT COUNT(*) 
            FROM registros_impresion ri
            JOIN plantillas p ON ri.id_plantilla = p.id
            ${whereClause}
        `;
        const countResult = await db.query(countQuery, queryParams);
        const totalRegistros = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalRegistros / limit);

        // Sorting
        const validSortColumns = {
            'correlativo': 'ri.correlativo',
            'fecha': 'ri.fecha_creacion',
            'estado': 'ri.recibido',
            'plantilla': 'p.nombre',
            'creador': 'ri.id_usuario_creador'
        };
        const direction = (sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const orderBy = validSortColumns[sortBy] || 'ri.fecha_creacion';

        // Prepare query for limit/offset
        const paginatedParams = [...queryParams, limit, offset];
        const result = await db.query(
            `SELECT ri.id, ri.correlativo, ri.fecha_creacion, p.nombre as plantilla_nombre,
            ri.datos_formulario, ri.recibido, ri.fecha_recibido, ri.nombre_recibe, ri.id_usuario_creador, ri.id_usuario_recibe
            FROM registros_impresion ri
            JOIN plantillas p ON ri.id_plantilla = p.id
            ${whereClause}
            ORDER BY ${orderBy} ${direction}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            paginatedParams
        );

        // Obtener nombres reales de base de datos de usuarios
        const usersDb = require("../config/db-users");

        let userIds = new Set();
        result.rows.forEach(row => {
            if (row.id_usuario_creador) userIds.add(row.id_usuario_creador);
            if (row.id_usuario_recibe) userIds.add(row.id_usuario_recibe);
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
            const receptor = usersMap[row.id_usuario_recibe];

            return {
                ...row,
                usuario_nombre: creador ? creador.nombreCompleto : 'Desconocido',
                creador_correo: creador ? creador.correo : null,
                receptor_nombre: row.nombre_recibe || null,
                receptor_usuario_nombre: receptor ? receptor.nombreCompleto : null,
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
 * Exporta a Excel los documentos generados, aplicando filtros.
 */
exports.exportExcel = async (req, res) => {
    try {
        const { search, estado, fechaInicio, fechaFin, sortBy, sortOrder } = req.query;

        let whereClause = "WHERE 1=1";
        let queryParams = [];
        let paramIndex = 1;

        if (search) {
            if (!isNaN(search)) {
                whereClause += ` AND (ri.correlativo ILIKE $${paramIndex} OR p.nombre ILIKE $${paramIndex} OR ri.secuencia = $${paramIndex + 1})`;
                queryParams.push(`%${search}%`, parseInt(search));
                paramIndex += 2;
            } else {
                whereClause += ` AND (ri.correlativo ILIKE $${paramIndex} OR p.nombre ILIKE $${paramIndex})`;
                queryParams.push(`%${search}%`);
                paramIndex++;
            }
        }

        if (estado === 'recibido') {
            whereClause += ` AND ri.recibido = TRUE`;
        } else if (estado === 'pendiente') {
            whereClause += ` AND ri.recibido = FALSE`;
        }

        if (fechaInicio) {
            const startDate = new Date(fechaInicio);
            startDate.setHours(startDate.getHours() + 6);
            whereClause += ` AND ri.fecha_creacion >= $${paramIndex}`;
            queryParams.push(startDate);
            paramIndex++;
        }

        if (fechaFin) {
            const endDate = new Date(fechaFin);
            endDate.setDate(endDate.getDate() + 1);
            endDate.setHours(endDate.getHours() + 6);
            whereClause += ` AND ri.fecha_creacion < $${paramIndex}`;
            queryParams.push(endDate);
            paramIndex++;
        }

        // Sorting
        const validSortColumns = {
            'correlativo': 'ri.correlativo',
            'fecha': 'ri.fecha_creacion',
            'estado': 'ri.recibido',
            'plantilla': 'p.nombre',
            'creador': 'ri.id_usuario_creador'
        };
        const direction = (sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const orderBy = validSortColumns[sortBy] || 'ri.fecha_creacion';

        // Fetch all matching data for export (no limit/offset)
        const result = await db.query(
            `SELECT ri.id, ri.correlativo, ri.fecha_creacion, p.nombre as plantilla_nombre,
            ri.datos_formulario, ri.recibido, ri.fecha_recibido, ri.nombre_recibe, ri.id_usuario_creador, ri.id_usuario_recibe
            FROM registros_impresion ri
            JOIN plantillas p ON ri.id_plantilla = p.id
            ${whereClause}
            ORDER BY ${orderBy} ${direction}`,
            queryParams
        );

        // Fetch user data
        const usersDb = require("../config/db-users");
        let userIds = new Set();
        result.rows.forEach(row => {
            if (row.id_usuario_creador) userIds.add(row.id_usuario_creador);
            if (row.id_usuario_recibe) userIds.add(row.id_usuario_recibe);
        });

        const usersMap = {};
        if (userIds.size > 0) {
            const usersResult = await usersDb.query(
                `SELECT id_usuario, email, nombre_completo FROM usuarios WHERE id_usuario = ANY($1::int[])`,
                [Array.from(userIds)]
            );
            usersResult.rows.forEach(u => {
                usersMap[u.id_usuario] = { nombreCompleto: u.nombre_completo };
            });
        }

        const dataWithUsers = result.rows.map(row => {
            const creador = usersMap[row.id_usuario_creador];
            const receptor = usersMap[row.id_usuario_recibe];
            return {
                ...row,
                usuario_nombre: creador ? creador.nombreCompleto : 'Desconocido',
                receptor_usuario_nombre: receptor ? receptor.nombreCompleto : null,
            };
        });

        // Setup Excel using exceljs
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'SCSCR';
        workbook.created = new Date();
        const worksheet = workbook.addWorksheet('Registros Impresión');

        // Extract all dynamic columns from form data
        let dynamicKeys = new Set();
        dataWithUsers.forEach(row => {
            if (row.datos_formulario) {
                Object.keys(row.datos_formulario).forEach(k => dynamicKeys.add(k));
            }
        });
        const dynamicColumns = Array.from(dynamicKeys);

        // Define base generic columns
        const columns = [
            { header: 'Correlativo', key: 'correlativo', width: 25 },
            { header: 'Plantilla', key: 'plantilla', width: 30 },
            { header: 'Fecha Creación', key: 'fecha_creacion', width: 20 },
            { header: 'Creador', key: 'creador', width: 30 },
            { header: 'Estado', key: 'estado', width: 15 },
            { header: 'Fecha Recibido', key: 'fecha_recibido', width: 20 },
            { header: 'Receptor (Sistema)', key: 'receptor_sistema', width: 30 },
            { header: 'Receptor (Firma)', key: 'receptor_firma', width: 30 }
        ];

        // Add dynamic columns
        dynamicColumns.forEach(key => {
            // Formatear el header por ejemplo "nombre_completo" -> "Nombre Completo"
            const headerName = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            columns.push({ header: `Form: ${headerName}`, key: key, width: 25 });
        });

        worksheet.columns = columns;

        // Apply style to header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

        // Insert rows
        dataWithUsers.forEach(item => {
            let fechaCreacionObj = null;
            if (item.fecha_creacion) {
                fechaCreacionObj = new Date(item.fecha_creacion);
                fechaCreacionObj.setHours(fechaCreacionObj.getHours() - 6);
            }

            let fechaRecibidoObj = null;
            if (item.fecha_recibido) {
                fechaRecibidoObj = new Date(item.fecha_recibido);
                fechaRecibidoObj.setHours(fechaRecibidoObj.getHours() - 6);
            }

            const rowValues = {
                correlativo: item.correlativo,
                plantilla: item.plantilla_nombre,
                fecha_creacion: fechaCreacionObj ? fechaCreacionObj.toLocaleString('es-GT') : '',
                creador: item.usuario_nombre,
                estado: item.recibido ? 'Recibido' : 'Pendiente',
                fecha_recibido: fechaRecibidoObj ? fechaRecibidoObj.toLocaleString('es-GT') : '',
                receptor_sistema: item.receptor_usuario_nombre || '',
                receptor_firma: item.nombre_recibe || ''
            };

            // Include dynamic format fields
            dynamicColumns.forEach(key => {
                rowValues[key] = item.datos_formulario ? item.datos_formulario[key] : '';
            });

            worksheet.addRow(rowValues);
        });

        // Escribir en un buffer
        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader('Content-Disposition', 'attachment; filename="Reporte_Impresiones.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.status(200).send(buffer);

    } catch (error) {
        console.error("Error al exportar documentos:", error);
        res.status(500).json({ message: "Error interno al exportar documentos." });
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
                 SET recibido = TRUE, fecha_recibido = $1, nombre_recibe = $2, id_usuario_recibe = $3
                 WHERE secuencia = $4 AND anio = $5 AND id_plantilla = $6 AND recibido = FALSE
                 RETURNING *`,
                [fecha, nombre_recibe, userId, secuencia, anio, id_plantilla]
            );

            if (result.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({ message: "El documento no existe o ya fue marcado como recibido." });
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
