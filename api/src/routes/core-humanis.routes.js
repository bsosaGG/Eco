const express = require("express");
const router = express.Router();
const multer = require("multer");

// Middleware de autenticación y permisos institucional
const { verifyToken, checkPermission } = require("../middleware/auth.middleware");

// Controladores (en inglés y kebab-case)
const collaboratorsCtrl = require("../controllers/collaborators.controller");
const documentsCtrl = require("../controllers/documents.controller");
const certificatesCtrl = require("../controllers/certificates.controller");
const alertsCtrl = require("../controllers/alerts.controller");
const auditLogsCtrl = require("../controllers/audit-logs.controller");
const catalogsCtrl = require("../controllers/catalogs.controller");
const authCtrl = require("../controllers/core-humanis-auth.controller");
const vacationsCtrl = require("../controllers/vacations.controller");
const leavesCtrl = require("../controllers/leaves.controller");
const attendanceCtrl = require("../controllers/attendance.controller");
const payrollsCtrl = require("../controllers/payrolls.controller");
const personnelActionsCtrl = require("../controllers/personnel-actions.controller");
const disciplinaryCtrl = require("../controllers/disciplinary.controller");
const recruitmentsCtrl = require("../controllers/recruitments.controller");
const evaluationsCtrl = require("../controllers/evaluations.controller");
const analyticsCtrl = require("../controllers/analytics.controller");

// Configuración de Multer para carga segura de expedientes digitales
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB límite según RNF
});

// ===========================================================================
// 1. AUTENTICACIÓN Y SESIONES (/auth)
// ===========================================================================
// Canónico RESTful
router.post("/auth/tokens", authCtrl.login);
router.get("/auth/me", verifyToken, authCtrl.me);
router.get("/auth/roles", authCtrl.getAvailableRoles);

// Alias de retrocompatibilidad
router.post("/auth/login", authCtrl.login);
router.get("/auth/dev-roles", authCtrl.getAvailableRoles);

// ===========================================================================
// 2. CATÁLOGOS DEL SISTEMA
// ===========================================================================
// Canónico RESTful
router.get("/catalogs", verifyToken, catalogsCtrl.getCatalogos);

// Alias de retrocompatibilidad
router.get("/catalogos", verifyToken, catalogsCtrl.getCatalogos);

// ===========================================================================
// 3. COLABORADORES / EXPEDIENTES DIGITALES
// ===========================================================================
// Canónico RESTful (/collaborators)
router.get(
  "/collaborators",
  verifyToken,
  checkPermission("core-humanis:read"),
  collaboratorsCtrl.getColaboradores
);

router.post(
  "/collaborators",
  verifyToken,
  checkPermission("core-humanis:write"),
  collaboratorsCtrl.crearColaborador
);

router.get(
  "/collaborators/:id",
  verifyToken,
  checkPermission("core-humanis:read"),
  collaboratorsCtrl.getColaboradorById
);

router.put(
  "/collaborators/:id",
  verifyToken,
  checkPermission("core-humanis:write"),
  collaboratorsCtrl.actualizarColaborador
);

// Alias de retrocompatibilidad (/colaboradores)
router.get(
  "/colaboradores",
  verifyToken,
  checkPermission("core-humanis:read"),
  collaboratorsCtrl.getColaboradores
);

router.post(
  "/colaboradores",
  verifyToken,
  checkPermission("core-humanis:write"),
  collaboratorsCtrl.crearColaborador
);

router.get(
  "/colaboradores/:id",
  verifyToken,
  checkPermission("core-humanis:read"),
  collaboratorsCtrl.getColaboradorById
);

router.put(
  "/colaboradores/:id",
  verifyToken,
  checkPermission("core-humanis:write"),
  collaboratorsCtrl.actualizarColaborador
);

// ===========================================================================
// 4. DOCUMENTOS DEL EXPEDIENTE (Sub-recurso)
// ===========================================================================
// Canónico RESTful (/collaborators/:id/documents)
router.get(
  "/collaborators/:id/documents",
  verifyToken,
  checkPermission("core-humanis:read"),
  documentsCtrl.getDocumentosByColaboradorId
);

router.post(
  "/collaborators/:id/documents",
  verifyToken,
  checkPermission("core-humanis:write"),
  upload.single("archivo"),
  documentsCtrl.subirDocumento
);

// Alias de retrocompatibilidad (/colaboradores/:id/documentos)
router.get(
  "/colaboradores/:id/documentos",
  verifyToken,
  checkPermission("core-humanis:read"),
  documentsCtrl.getDocumentosByColaboradorId
);

router.post(
  "/colaboradores/:id/documentos",
  verifyToken,
  checkPermission("core-humanis:write"),
  upload.single("archivo"),
  documentsCtrl.subirDocumento
);

// ===========================================================================
// 5. CONSTANCIAS LABORALES DIGITALES Y VALIDACIÓN QR (MÓDULO 11)
// ===========================================================================
// Canónico RESTful (/certificates)
router.post(
  "/certificates",
  verifyToken,
  checkPermission("core-humanis:constancias"),
  certificatesCtrl.generarConstancia
);

router.get(
  "/certificates",
  verifyToken,
  checkPermission("core-humanis:read"),
  certificatesCtrl.getConstancias
);

router.get(
  "/certificates/:id",
  verifyToken,
  checkPermission("core-humanis:read"),
  certificatesCtrl.getConstanciaById
);

// Verificación pública vía QR (acceso libre sin token)
router.get("/certificates/verifications/:hash", certificatesCtrl.verificarConstancia);

// Alias de retrocompatibilidad (/constancias)
router.post(
  "/constancias/generar",
  verifyToken,
  checkPermission("core-humanis:constancias"),
  certificatesCtrl.generarConstancia
);

router.get(
  "/constancias",
  verifyToken,
  checkPermission("core-humanis:read"),
  certificatesCtrl.getConstancias
);

router.get("/constancias/verificar/:hash", certificatesCtrl.verificarConstancia);

// ===========================================================================
// 6. ALERTAS LEGALES Y CONTRACTUALES (FINIQUITOS CGC, CONTRATOS)
// ===========================================================================
// Canónico RESTful (/alerts)
router.get(
  "/alerts",
  verifyToken,
  checkPermission("core-humanis:read"),
  alertsCtrl.getAlertasVencimientos
);

// Alias de retrocompatibilidad (/alertas/vencimientos)
router.get(
  "/alertas/vencimientos",
  verifyToken,
  checkPermission("core-humanis:read"),
  alertsCtrl.getAlertasVencimientos
);

// ===========================================================================
// 7. PISTA INMUTABLE DE AUDITORÍA FORENSE
// ===========================================================================
// Canónico RESTful (/audit-logs)
router.get(
  "/audit-logs",
  verifyToken,
  checkPermission("core-humanis:read"),
  auditLogsCtrl.getLogs
);

// Alias de retrocompatibilidad (/auditoria)
router.get(
  "/auditoria",
  verifyToken,
  checkPermission("core-humanis:read"),
  auditLogsCtrl.getLogs
);

// ===========================================================================
// 8. OLA 2: VACACIONES, LICENCIAS Y CONTROL DE ASISTENCIA
// ===========================================================================
// Saldos Kardex y Solicitudes de Vacaciones (/vacations)
router.get("/vacations/balances/:collaboratorId", verifyToken, vacationsCtrl.getBalance);
router.get("/vacations/requests", verifyToken, vacationsCtrl.getRequests);
router.post("/vacations/requests", verifyToken, vacationsCtrl.createRequest);
router.patch("/vacations/requests/:id/status", verifyToken, vacationsCtrl.updateStatus);

// Licencias Médicas y Ausencias (/leaves)
router.get("/leaves", verifyToken, leavesCtrl.getLeaves);
router.post("/leaves", verifyToken, leavesCtrl.createLeave);

// Control de Asistencia e Incidencias (/attendance)
router.get("/attendance/incidents", verifyToken, attendanceCtrl.getIncidents);
router.post("/attendance/incidents", verifyToken, attendanceCtrl.createIncident);
router.patch("/attendance/incidents/:id/status", verifyToken, attendanceCtrl.updateIncidentStatus);
router.post("/attendance/punches", verifyToken, attendanceCtrl.registerPunches);
router.get("/attendance/punches/:persona_id", verifyToken, attendanceCtrl.getPunches);
router.get("/attendance/shifts", verifyToken, attendanceCtrl.getJornadas);

// ===========================================================================
// 9. OLA 3: NÓMINA, ACCIONES DE PERSONAL Y RÉGIMEN DISCIPLINARIO
// ===========================================================================

// Módulo 4: Nómina y Compensaciones (/payrolls)
router.get("/payrolls", verifyToken, payrollsCtrl.getPayrolls);
router.post("/payrolls", verifyToken, checkPermission("core-humanis:write"), payrollsCtrl.createPayroll);
router.get("/payrolls/:id", verifyToken, payrollsCtrl.getPayrollById);
router.post("/payrolls/:id/calculate", verifyToken, checkPermission("core-humanis:write"), payrollsCtrl.calculatePayroll);
router.patch("/payrolls/:id/status", verifyToken, checkPermission("core-humanis:write"), payrollsCtrl.updatePayrollStatus);
router.get("/payrolls/:id/bank-dispersion", verifyToken, payrollsCtrl.getBankDispersion);
router.get("/payrolls/:id/igss-file", verifyToken, payrollsCtrl.getIgssFile);
router.get("/payrolls/slips/:hash", payrollsCtrl.verifyPayrollSlip);
router.get("/portal/payroll-slips", verifyToken, payrollsCtrl.getPortalSlips);

// Módulo 5: Acciones de Personal (/personnel-actions)
router.get("/personnel-actions", verifyToken, personnelActionsCtrl.getPersonnelActions);
router.post("/personnel-actions", verifyToken, checkPermission("core-humanis:write"), personnelActionsCtrl.createPersonnelAction);
router.get("/personnel-actions/:id", verifyToken, personnelActionsCtrl.getPersonnelActionById);
router.patch("/personnel-actions/:id/status", verifyToken, checkPermission("core-humanis:write"), personnelActionsCtrl.updateStatus);
router.patch("/personnel-actions/:id/cgc-djp", verifyToken, checkPermission("core-humanis:write"), personnelActionsCtrl.updateCgcDjpStatus);

// Módulo 9: Régimen Disciplinario (/disciplinary-records)
router.get("/disciplinary-records", verifyToken, disciplinaryCtrl.getRecords);
router.post("/disciplinary-records", verifyToken, checkPermission("core-humanis:write"), disciplinaryCtrl.createRecord);
router.get("/disciplinary-records/:id", verifyToken, disciplinaryCtrl.getRecordById);
router.post("/disciplinary-records/:id/hearings", verifyToken, checkPermission("core-humanis:write"), disciplinaryCtrl.createHearing);
router.post("/disciplinary-records/:id/hearings/:hearingId/descargo", verifyToken, disciplinaryCtrl.submitDescargo);
router.patch("/disciplinary-records/:id/resolution", verifyToken, checkPermission("core-humanis:write"), disciplinaryCtrl.resolveRecord);

// ===========================================================================
// 10. OLA 4: RECLUTAMIENTO, EVALUACIÓN DEL DESEMPEÑO Y BI GERENCIAL
// ===========================================================================

// Módulo 6: Reclutamiento y Selección (/recruitments)
router.get("/recruitments", verifyToken, recruitmentsCtrl.getRecruitments);
router.post("/recruitments", verifyToken, checkPermission("core-humanis:write"), recruitmentsCtrl.createRecruitment);
router.get("/recruitments/:id", verifyToken, recruitmentsCtrl.getRecruitmentById);
router.patch("/recruitments/:id/status", verifyToken, checkPermission("core-humanis:write"), recruitmentsCtrl.updateRecruitmentStatus);
router.post("/recruitments/:id/applications", recruitmentsCtrl.applyToRecruitment);
router.patch("/recruitments/:id/applications/:appId/score", verifyToken, checkPermission("core-humanis:write"), recruitmentsCtrl.scoreCandidate);
router.post("/recruitments/:id/applications/:appId/select", verifyToken, checkPermission("core-humanis:write"), recruitmentsCtrl.selectWinnerCandidate);

// Módulo 8: Evaluación del Desempeño (/performance-evaluations)
router.get("/performance-evaluations", verifyToken, evaluationsCtrl.getEvaluations);
router.get("/performance-evaluations/factors/default", verifyToken, evaluationsCtrl.getDefaultFactors);
router.post("/performance-evaluations", verifyToken, checkPermission("core-humanis:write"), evaluationsCtrl.createEvaluation);
router.get("/performance-evaluations/:id", verifyToken, evaluationsCtrl.getEvaluationById);
router.get("/performance-evaluations/collaborator/:personaId", verifyToken, evaluationsCtrl.getCollaboratorEvaluations);

// Módulo 12: Business Intelligence y Transparencia LAIP (/analytics)
router.get("/analytics/dashboard", verifyToken, analyticsCtrl.getExecutiveDashboard);
router.get("/analytics/laip-art10", verifyToken, analyticsCtrl.getLaipArticle10Report);

module.exports = router;


