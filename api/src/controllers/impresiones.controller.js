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
 * Genera un Excel a partir de una plantilla y lo devuelve como buffer.
 */
exports.generateExcel = async (req, res) => {
    const client = await db.getClient();
    try {
        const { id_plantilla, datos_formulario } = req.body;
        const userId = req.user.userId;

        if (!id_plantilla || !datos_formulario) {
            return res.status(400).json({ message: "id_plantilla y datos_formulario son obligatorios." });
        }

        await client.query("BEGIN");

        // 1. Obtener la plantilla para verificar que existe y está activa
        const plantillaResult = await client.query(
            "SELECT * FROM plantillas WHERE id = $1 AND activo = TRUE",
            [id_plantilla]
        );

        if (plantillaResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Plantilla no encontrada o inactiva." });
        }
        const plantilla = plantillaResult.rows[0];

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

        const correlativo = `DOC-${plantilla.codigo}-${secuencia.toString().padStart(4, "0")}`;

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
