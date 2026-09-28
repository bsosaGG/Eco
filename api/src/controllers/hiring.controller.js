/**
 * Hiring Controller (Core Humanis SCSPR)
 * RESTful Level 3 HATEOAS controller for Onboarding Pipeline:
 * persona -> candidato -> empleado -> contrato.
 */

const hiringService = require("../services/hiring.service");

class HiringController {
  async getPipeline(req, res) {
    try {
      const candidates = await hiringService.getHiringPipeline();
      const items = candidates.map((c) => ({
        ...c,
        _links: {
          self: { href: `/api/v1/recruitments/${c.convocatoria_id}/applications/${c.id}`, method: "GET" },
          validateCui: { href: "/api/v1/hiring/validate-cui", method: "POST" },
          formalize: { href: "/api/v1/hiring/formalize", method: "POST" },
        },
      }));

      return res.json({
        success: true,
        total: items.length,
        data: items,
        _links: {
          self: { href: "/api/v1/hiring/pipeline", method: "GET" },
          formalize: { href: "/api/v1/hiring/formalize", method: "POST" },
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al consultar pipeline de contratación: " + err.message });
    }
  }

  async validateCui(req, res) {
    try {
      const { cui } = req.body;
      const result = await hiringService.validateCui(cui);
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al validar CUI: " + err.message });
    }
  }

  async formalizeHiring(req, res) {
    try {
      const result = await hiringService.formalizeHiring(req.body);
      return res.status(201).json({ success: true, data: result, ...result });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = new HiringController();
