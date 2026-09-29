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
const trainingsCtrl = require("../controllers/trainings.controller");
const occupationalHealthCtrl = require("../controllers/occupational-health.controller");
const climateCtrl = require("../controllers/climate.controller");
const hiringCtrl = require("../controllers/hiring.controller");
const templatesCtrl = require("../controllers/templates.controller");
const complaintsCtrl = require("../controllers/complaints.controller");

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
router.put("/auth/me", verifyToken, authCtrl.updateProfile);
router.get("/auth/me/download", verifyToken, authCtrl.downloadProfile);
router.get("/auth/roles", authCtrl.getAvailableRoles);

// Alias de retrocompatibilidad
router.post("/auth/login", authCtrl.login);
router.get("/auth/dev-roles", authCtrl.getAvailableRoles);

// ===========================================================================
// 2. CATÁLOGOS DEL SISTEMA
// ===========================================================================
// Canónico RESTful agrupado (Bundle)
router.get("/catalogs", verifyToken, catalogsCtrl.getCatalogos);
router.get("/catalogos", verifyToken, catalogsCtrl.getCatalogos);

// Recursos granulares por catálogo individual (English canonical)
router.get("/catalogs/budget-lines", verifyToken, catalogsCtrl.getBudgetLines);
router.get("/catalogs/units", verifyToken, catalogsCtrl.getUnits);
router.get("/catalogs/nominal-positions", verifyToken, catalogsCtrl.getNominalPositions);
router.get("/catalogs/functional-positions", verifyToken, catalogsCtrl.getFunctionalPositions);
router.get("/catalogs/document-types", verifyToken, catalogsCtrl.getDocumentTypes);

// Alias de retrocompatibilidad
router.get("/catalogs/renglones", verifyToken, catalogsCtrl.getBudgetLines);
router.get("/catalogs/unidades", verifyToken, catalogsCtrl.getUnits);
router.get("/catalogs/puestos-nominales", verifyToken, catalogsCtrl.getNominalPositions);
router.get("/catalogs/puestos-funcionales", verifyToken, catalogsCtrl.getFunctionalPositions);
router.get("/catalogs/tipos-documento", verifyToken, catalogsCtrl.getDocumentTypes);

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
router.get("/vacations/requests/:id", verifyToken, vacationsCtrl.getRequestDetail);
router.get("/vacations/requests/:id/print", verifyToken, vacationsCtrl.printRequest);
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

// Módulo 7: Capacitación y Desarrollo (/trainings)
router.get("/trainings", verifyToken, trainingsCtrl.getTrainings);
router.post("/trainings", verifyToken, checkPermission("core-humanis:write"), trainingsCtrl.createTraining);
router.get("/trainings/:id", verifyToken, trainingsCtrl.getTrainingById);
router.patch("/trainings/:id/status", verifyToken, checkPermission("core-humanis:write"), trainingsCtrl.updateTrainingStatus);
router.post("/trainings/:id/enrollments", verifyToken, checkPermission("core-humanis:write"), trainingsCtrl.enrollParticipant);
router.patch("/trainings/:id/enrollments/:enrId/grade", verifyToken, checkPermission("core-humanis:write"), trainingsCtrl.gradeParticipant);
router.get("/trainings/collaborator/:personaId", verifyToken, trainingsCtrl.getCollaboratorTrainings);

// Módulo 10: Salud y Seguridad Ocupacional - SSO (/occupational-health)
router.get("/occupational-health/committee", verifyToken, occupationalHealthCtrl.getCommittee);
router.post("/occupational-health/committee/members", verifyToken, checkPermission("core-humanis:write"), occupationalHealthCtrl.addCommitteeMember);
router.get("/occupational-health/incidents", verifyToken, occupationalHealthCtrl.getIncidents);
router.post("/occupational-health/incidents", verifyToken, checkPermission("core-humanis:write"), occupationalHealthCtrl.createIncident);
router.get("/occupational-health/medical-profiles/:personaId", verifyToken, occupationalHealthCtrl.getMedicalProfile);
router.put("/occupational-health/medical-profiles/:personaId", verifyToken, checkPermission("core-humanis:write"), occupationalHealthCtrl.updateMedicalProfile);

// Módulo 10: Bienestar y Clima Laboral (/climate)
router.get("/climate/surveys", verifyToken, climateCtrl.getSurveys);
router.get("/climate/surveys/active", verifyToken, climateCtrl.getActiveSurvey);
router.post("/climate/surveys", verifyToken, checkPermission("core-humanis:write"), climateCtrl.createSurvey);
router.post("/climate/surveys/:id/submit", verifyToken, climateCtrl.submitAnonymousResponse);
router.get("/climate/surveys/:id/results", verifyToken, climateCtrl.getSurveyResults);

// Módulo de Contratación de Personal (/hiring)
router.get("/hiring/pipeline", verifyToken, hiringCtrl.getPipeline);
router.post("/hiring/validate-cui", verifyToken, hiringCtrl.validateCui);
router.post("/hiring/formalize", verifyToken, checkPermission("core-humanis:write"), hiringCtrl.formalizeHiring);

// Motor de Plantillas Modificables (.docx / .pdf) (/templates)
router.get("/templates", verifyToken, templatesCtrl.getTemplates);
router.get("/templates/:codigo/download", verifyToken, templatesCtrl.downloadTemplateDocx);
router.post("/templates/:codigo/upload", verifyToken, checkPermission("core-humanis:admin"), upload.single("template"), templatesCtrl.uploadTemplateDocx);
router.post("/templates/:codigo/render", verifyToken, templatesCtrl.renderTemplate);

// Buzón Institucional de Denuncias Éticas y Laborales (/complaints)
router.post("/complaints", complaintsCtrl.createComplaint);
router.get("/complaints", verifyToken, complaintsCtrl.getComplaints);
router.get("/complaints/track/:trackingCode", complaintsCtrl.trackComplaint);
router.get("/complaints/:id", verifyToken, complaintsCtrl.getComplaintById);
router.patch("/complaints/:id/status", verifyToken, checkPermission("core-humanis:write"), complaintsCtrl.updateComplaintStatus);

module.exports = router;


