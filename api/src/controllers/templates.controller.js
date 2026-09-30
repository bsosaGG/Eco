/**
 * Templates Controller (Core Humanis SCSPR)
 * RESTful Level 3 HATEOAS controller for modifiable .docx templates
 * and headless PDF rendering.
 */

const db = require("../config/db-core-humanis");
const templatesService = require("../services/templates.service");

class TemplatesController {
  async getTemplates(req, res) {
    try {
      const result = await db.query(
        `SELECT id, codigo, nombre, tipo, descripcion, archivo_nombre, variables_disponibles, updated_at
         FROM plantillas_documentos
         WHERE activo = true
         ORDER BY tipo ASC, nombre ASC`
      );

      const items = result.rows.map((row) => ({
        ...row,
        _links: {
          self: { href: `/api/v1/templates/${row.codigo}`, method: "GET" },
          downloadDocx: { href: `/api/v1/templates/${row.codigo}/download`, method: "GET" },
          uploadDocx: { href: `/api/v1/templates/${row.codigo}/upload`, method: "POST" },
          renderPdf: { href: `/api/v1/templates/${row.codigo}/render?format=pdf`, method: "POST" },
        },
      }));

      return res.json({
        success: true,
        data: items,
        _links: {
          self: { href: "/api/v1/templates", method: "GET" },
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al listar plantillas: " + err.message });
    }
  }

  async downloadTemplateDocx(req, res) {
    try {
      const { codigo } = req.params;
      const buffer = await templatesService.getTemplateBuffer(codigo);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="${codigo}.docx"`);
      return res.send(buffer);
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al descargar plantilla: " + err.message });
    }
  }

  async uploadTemplateDocx(req, res) {
    try {
      const { codigo } = req.params;
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ success: false, message: "Debe adjuntar un archivo .docx válido" });
      }

      const updated = await templatesService.updateTemplateFile(
        codigo,
        req.file.buffer,
        req.file.originalname || `${codigo}.docx`
      );

      return res.json({
        success: true,
        message: `Plantilla ${codigo} actualizada exitosamente`,
        data: updated,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al actualizar plantilla: " + err.message });
    }
  }

  async renderTemplate(req, res) {
    try {
      const { codigo } = req.params;
      const { format = "pdf", data = {} } = req.body;

      const rendered = await templatesService.renderDocument(codigo, data, format);
      const filename = `${codigo}_${Date.now()}.${rendered.extension}`;

      res.setHeader("Content-Type", rendered.contentType);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      return res.send(rendered.buffer);
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al renderizar plantilla: " + err.message });
    }
  }
}

module.exports = new TemplatesController();
