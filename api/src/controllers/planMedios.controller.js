// api/src/controllers/planMedios.controller.js
// Módulo: Plan de Medios. Capa HTTP delgada: extrae parámetros de la petición,
// llama al caso de uso correspondiente y arma la respuesta. No contiene reglas de
// negocio ni SQL; los errores (ValidationError, NotFoundError, ConflictError, ...)
// los resuelve el errorHandler global a partir de su `statusCode`.
const expedientesService = require("../services/plan-medios/expedientes.service");
const planDocumentService = require("../services/plan-medios/plan-document.service");
const purchaseRequestsService = require("../services/plan-medios/purchase-requests.service");
const rankingService = require("../services/plan-medios/ranking.service");
const catalogService = require("../services/plan-medios/catalog.service");
const auditService = require("../services/plan-medios/audit.service");
const languageService = require("../services/plan-medios/language.service");
const { planMediosDb } = require("../config/db-plan-medios");
const { ValidationError } = require("../services/plan-medios/errors");

/** Envía un archivo generado como descarga. */
function sendFile(res, { buffer, filename, contentType }) {
  res.set({
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  });
  res.send(buffer);
}

const handle = (action) => (req, res, next) => Promise.resolve(action(req, res)).catch(next);

class PlanMediosController {
  // --- Salud (sin autenticación) ---
  health = async (req, res) => {
    try {
      await planMediosDb.query("SELECT 1");
      res.json({ status: "ok", application: "plan-medios", database: "up" });
    } catch (error) {
      console.error("Plan de Medios: la base de datos no responde:", error.message);
      res.status(503).json({ status: "error", application: "plan-medios", database: "down" });
    }
  };

  // --- Catálogo de medios ---
  estadoCatalogo = handle(async (req, res) => res.json(await catalogService.estadoCatalogo()));

  listarMedios = handle(async (req, res) =>
    res.json(await catalogService.listarMedios({ tipo: req.query.tipo, limite: req.query.limite }))
  );

  obtenerMedio = handle(async (req, res) => res.json(await catalogService.obtenerMedio(req.params.id)));

  // --- Expedientes ---
  listarExpedientes = handle(async (req, res) =>
    res.json({
      expedientes: await expedientesService.listarExpedientes({ query: req.query.q, limit: req.query.limite }),
    })
  );

  crearExpediente = handle(async (req, res) => {
    if (!req.file) throw new ValidationError("Brief: Debe adjuntar el archivo del Brief.");
    res.status(201).json(await expedientesService.crearExpediente({ file: req.file }));
  });

  obtenerExpediente = handle(async (req, res) =>
    res.json(await expedientesService.obtenerExpediente(req.params.id))
  );

  guardarResumen = handle(async (req, res) =>
    res.json(await expedientesService.guardarResumen({ id: req.params.id, input: req.body, actor: req.user }))
  );

  rankingMedios = handle(async (req, res) =>
    res.json(await rankingService.rankearExpediente({ id: req.params.id, limit: req.query.limite }))
  );

  auditoria = handle(async (req, res) =>
    res.json(await auditService.listarAuditoria({ id: req.params.id, limit: req.query.limite }))
  );

  // --- Plan de Medios (Word) ---
  generarPlanMedios = handle(async (req, res) =>
    res.json(await planDocumentService.generarPlanMedios({ id: req.params.id, actor: req.user }))
  );

  descargarPlanMedios = handle(async (req, res) =>
    sendFile(res, await planDocumentService.descargarPlanMedios(req.params.id))
  );

  // --- Solicitudes de compra (Excel) ---
  prepararSolicitud = handle(async (req, res) => {
    const request = await purchaseRequestsService.prepararSolicitud({
      id: req.params.id,
      index: req.params.index,
      form: req.body,
    });
    res.json({
      status: "completed",
      message: "La Solicitud de Compra fue preparada y superó la validación de neutralidad.",
      request,
    });
  });

  generarSolicitud = handle(async (req, res) =>
    sendFile(
      res,
      await purchaseRequestsService.generarSolicitud({
        id: req.params.id,
        index: req.params.index,
        form: req.body,
      })
    )
  );

  descargarSolicitud = handle(async (req, res) =>
    sendFile(res, await purchaseRequestsService.descargarSolicitud({ id: req.params.id, index: req.params.index }))
  );

  justificacionIA = handle(async (req, res) =>
    res.json(await purchaseRequestsService.generarJustificacionIA({ id: req.params.id, index: req.params.index }))
  );

  // --- Revisión ortográfica y diccionario ---
  revisarTexto = handle(async (req, res) =>
    res.json(await languageService.revisarTexto({ text: req.body.text, language: req.body.language || "es" }))
  );

  agregarTermino = handle(async (req, res) =>
    res.json(await languageService.agregarTermino({ term: req.body.term, actor: req.user }))
  );
}

module.exports = new PlanMediosController();
