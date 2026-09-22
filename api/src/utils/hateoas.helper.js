/**
 * HATEOAS Helper (Hypermedia As The Engine Of Application State)
 * Core Humanis - SCSPR
 *
 * Provee funciones para construir hipermedios de navegación canónicos conforme al
 * Modelo de Madurez de Richardson (Nivel 3).
 */

const API_BASE = "/api/v1/core-humanis";

/**
 * Enlaces hipermedia para un colaborador individual
 */
function buildCollaboratorLinks(colaborador) {
  const id = colaborador.id;
  return {
    self: {
      href: `${API_BASE}/collaborators/${id}`,
      method: "GET",
      description: "Obtener ficha 360° del colaborador",
    },
    update: {
      href: `${API_BASE}/collaborators/${id}`,
      method: "PUT",
      description: "Actualizar datos del expediente del colaborador",
    },
    documents: {
      href: `${API_BASE}/collaborators/${id}/documents`,
      method: "GET",
      description: "Listar documentos adjuntos al expediente",
    },
    uploadDocument: {
      href: `${API_BASE}/collaborators/${id}/documents`,
      method: "POST",
      description: "Cargar nuevo documento al expediente (Finiquito CGC, Contrato, etc.)",
    },
    certificates: {
      href: `${API_BASE}/certificates?persona_id=${id}`,
      method: "GET",
      description: "Consultar constancias emitidas para este colaborador",
    },
    issueCertificate: {
      href: `${API_BASE}/certificates`,
      method: "POST",
      description: "Generar y emitir una nueva constancia laboral con código QR",
    },
  };
}

/**
 * Enlaces hipermedia para la colección de colaboradores con soporte de paginación
 */
function buildCollaboratorCollectionLinks(query = {}, pagination = {}) {
  const { page = 1, limit = 10, total = 0, totalPages = 1 } = pagination;
  const buildQuery = (p) => {
    const q = { ...query, page: p, limit };
    return new URLSearchParams(q).toString();
  };

  const links = {
    self: {
      href: `${API_BASE}/collaborators?${buildQuery(page)}`,
      method: "GET",
      description: "Página actual de colaboradores",
    },
    first: {
      href: `${API_BASE}/collaborators?${buildQuery(1)}`,
      method: "GET",
      description: "Primera página del directorio",
    },
    last: {
      href: `${API_BASE}/collaborators?${buildQuery(totalPages || 1)}`,
      method: "GET",
      description: "Última página del directorio",
    },
    create: {
      href: `${API_BASE}/collaborators`,
      method: "POST",
      description: "Registrar un nuevo colaborador en la plataforma",
    },
    catalogs: {
      href: `${API_BASE}/catalogs`,
      method: "GET",
      description: "Consultar catálogos base (renglones, puestos, dependencias)",
    },
  };

  if (page > 1) {
    links.prev = {
      href: `${API_BASE}/collaborators?${buildQuery(page - 1)}`,
      method: "GET",
      description: "Página anterior de colaboradores",
    };
  }

  if (page < totalPages) {
    links.next = {
      href: `${API_BASE}/collaborators?${buildQuery(page + 1)}`,
      method: "GET",
      description: "Página siguiente de colaboradores",
    };
  }

  return links;
}

/**
 * Enlaces hipermedia para un documento del expediente
 */
function buildDocumentLinks(colaboradorId, doc) {
  return {
    self: {
      href: `${API_BASE}/collaborators/${colaboradorId}/documents`,
      method: "GET",
      description: "Documento adjunto en el expediente",
    },
    collaborator: {
      href: `${API_BASE}/collaborators/${colaboradorId}`,
      method: "GET",
      description: "Ficha 360° del colaborador propietario",
    },
  };
}

/**
 * Enlaces hipermedia para una constancia laboral emitida
 */
function buildCertificateLinks(constancia) {
  const hash = constancia.hash_verificacion;
  return {
    self: {
      href: `${API_BASE}/certificates/${constancia.id || constancia.correlativo}`,
      method: "GET",
      description: "Detalle de la constancia emitida",
    },
    collaborator: {
      href: `${API_BASE}/collaborators/${constancia.persona_id}`,
      method: "GET",
      description: "Ficha del colaborador certificado",
    },
    verification: {
      href: `${API_BASE}/certificates/verifications/${hash}`,
      method: "GET",
      description: "Endpoint público de validación institucional QR (sin autenticación)",
    },
    publicValidationPage: {
      href: `/core-humanis/certificates/verifications/${hash}`,
      method: "GET",
      description: "Portal web de validación ciudadana con sello institucional",
    },
  };
}

/**
 * Enlaces hipermedia para la colección de constancias
 */
function buildCertificateCollectionLinks() {
  return {
    self: {
      href: `${API_BASE}/certificates`,
      method: "GET",
      description: "Historial de constancias emitidas",
    },
    create: {
      href: `${API_BASE}/certificates`,
      method: "POST",
      description: "Emitir nueva constancia oficial con código QR",
    },
  };
}

/**
 * Enlaces hipermedia para el resultado público de verificación QR
 */
function buildVerificationLinks(hash) {
  return {
    self: {
      href: `${API_BASE}/certificates/verifications/${hash}`,
      method: "GET",
      description: "Verificación criptográfica del documento",
    },
    institutionWebsite: {
      href: "https://prensa.gob.gt",
      method: "GET",
      description: "Portal Oficial de la Secretaría de Comunicación Social de la Presidencia",
    },
  };
}

/**
 * Enlaces hipermedia para una alerta de vencimiento
 */
function buildAlertLinks(alerta) {
  const links = {
    self: {
      href: `${API_BASE}/alerts`,
      method: "GET",
      description: "Semáforo y monitor de alertas legales y contractuales",
    },
    collaborator: {
      href: `${API_BASE}/collaborators/${alerta.colaborador_id}`,
      method: "GET",
      description: "Expediente del colaborador afectado",
    },
    documents: {
      href: `${API_BASE}/collaborators/${alerta.colaborador_id}/documents`,
      method: "GET",
      description: "Documentos del expediente para actualizar o prorrogar",
    },
    uploadDocument: {
      href: `${API_BASE}/collaborators/${alerta.colaborador_id}/documents`,
      method: "POST",
      description: "Cargar nuevo finiquito o adenda de prórroga para solventar la alerta",
    },
  };

  return links;
}

/**
 * Enlaces hipermedia para la colección de alertas
 */
function buildAlertCollectionLinks() {
  return {
    self: {
      href: `${API_BASE}/alerts`,
      method: "GET",
      description: "Colección de alertas de vencimientos de finiquitos CGC y contratos",
    },
  };
}

/**
 * Enlaces hipermedia para la bitácora de auditoría
 */
function buildAuditCollectionLinks() {
  return {
    self: {
      href: `${API_BASE}/audit-logs`,
      method: "GET",
      description: "Pista inmutable de auditoría institucional",
    },
  };
}

/**
 * Enlaces hipermedia para catálogos
 */
function buildCatalogLinks() {
  return {
    self: {
      href: `${API_BASE}/catalogs`,
      method: "GET",
      description: "Catálogos maestros de la plataforma",
    },
    collaborators: {
      href: `${API_BASE}/collaborators`,
      method: "GET",
      description: "Directorio de colaboradores",
    },
  };
}

/**
 * Enlaces hipermedia de sesión y autenticación
 */
function buildAuthLinks(user) {
  return {
    self: {
      href: `${API_BASE}/auth/me`,
      method: "GET",
      description: "Perfil del usuario autenticado",
    },
    roles: {
      href: `${API_BASE}/auth/roles`,
      method: "GET",
      description: "Roles disponibles para emulación en entorno institucional",
    },
    token: {
      href: `${API_BASE}/auth/tokens`,
      method: "POST",
      description: "Generación de token JWT institucional",
    },
  };
}

function buildVacationCollectionLinks(query = {}) {
  return {
    self: {
      href: `${API_BASE}/vacations/requests`,
      method: "GET",
      description: "Listado de solicitudes de vacaciones",
    },
    create: {
      href: `${API_BASE}/vacations/requests`,
      method: "POST",
      description: "Crear una nueva solicitud de vacaciones",
    },
  };
}

function buildPayrollLinks(payroll) {
  const id = payroll.id;
  return {
    self: {
      href: `${API_BASE}/payrolls/${id}`,
      method: "GET",
      description: "Detalle consolidado de nómina",
    },
    calculate: {
      href: `${API_BASE}/payrolls/${id}/calculate`,
      method: "POST",
      description: "Ejecutar motor salarial de nómina",
    },
    updateStatus: {
      href: `${API_BASE}/payrolls/${id}/status`,
      method: "PATCH",
      description: "Cambiar estado de aprobación (REVISADO, APROBADO, PAGADO)",
    },
    bankDispersion: {
      href: `${API_BASE}/payrolls/${id}/bank-dispersion`,
      method: "GET",
      description: "Descargar archivo de dispersión bancaria Banrural/CHN",
    },
    igssFile: {
      href: `${API_BASE}/payrolls/${id}/igss-file`,
      method: "GET",
      description: "Descargar archivo de importación Planilla Electrónica IGSS",
    },
  };
}

function buildPayrollCollectionLinks(query = {}, pagination = {}) {
  const { page = 1, limit = 10, total = 0, totalPages = 1 } = pagination;
  return {
    self: {
      href: `${API_BASE}/payrolls?page=${page}&limit=${limit}`,
      method: "GET",
      description: "Página actual de nóminas",
    },
    create: {
      href: `${API_BASE}/payrolls`,
      method: "POST",
      description: "Apertura de nuevo período de nómina",
    },
    ...(page > 1 ? { prev: { href: `${API_BASE}/payrolls?page=${page - 1}&limit=${limit}`, method: "GET" } } : {}),
    ...(page < totalPages ? { next: { href: `${API_BASE}/payrolls?page=${page + 1}&limit=${limit}`, method: "GET" } } : {}),
  };
}

function buildPersonnelActionLinks(action) {
  const id = action.id;
  return {
    self: {
      href: `${API_BASE}/personnel-actions/${id}`,
      method: "GET",
      description: "Detalle de acción de personal",
    },
    updateStatus: {
      href: `${API_BASE}/personnel-actions/${id}/status`,
      method: "PATCH",
      description: "Aprobar o anular acción de personal",
    },
    collaborator: {
      href: `${API_BASE}/collaborators/${action.persona_id}`,
      method: "GET",
      description: "Expediente 360 del colaborador",
    },
  };
}

function buildDisciplinaryLinks(record) {
  const id = record.id;
  return {
    self: {
      href: `${API_BASE}/disciplinary-records/${id}`,
      method: "GET",
      description: "Detalle del expediente disciplinario",
    },
    hearings: {
      href: `${API_BASE}/disciplinary-records/${id}/hearings`,
      method: "POST",
      description: "Conferir audiencia de descargo (3 días)",
    },
    resolution: {
      href: `${API_BASE}/disciplinary-records/${id}/resolution`,
      method: "PATCH",
      description: "Emitir resolución disciplinaria final",
    },
  };
}

function buildRecruitmentLinks(id) {
  return {
    self: {
      href: `${API_BASE}/recruitments/${id}`,
      method: "GET",
      description: "Detalle de la convocatoria",
    },
    applications: {
      href: `${API_BASE}/recruitments/${id}/applications`,
      method: "POST",
      description: "Postular candidato a la plaza",
    },
    status: {
      href: `${API_BASE}/recruitments/${id}/status`,
      method: "PATCH",
      description: "Actualizar estado de la convocatoria",
    },
  };
}

function buildRecruitmentCollectionLinks(page, totalPages, limit) {
  return {
    self: {
      href: `${API_BASE}/recruitments?page=${page}&limit=${limit}`,
      method: "GET",
    },
    create: {
      href: `${API_BASE}/recruitments`,
      method: "POST",
      description: "Crear nueva convocatoria de plaza",
    },
    ...(page > 1 ? { prev: { href: `${API_BASE}/recruitments?page=${page - 1}&limit=${limit}`, method: "GET" } } : {}),
    ...(page < totalPages ? { next: { href: `${API_BASE}/recruitments?page=${page + 1}&limit=${limit}`, method: "GET" } } : {}),
  };
}

function buildEvaluationLinks(id) {
  return {
    self: {
      href: `${API_BASE}/performance-evaluations/${id}`,
      method: "GET",
      description: "Ficha de evaluación del desempeño",
    },
    defaultFactors: {
      href: `${API_BASE}/performance-evaluations/factors/default`,
      method: "GET",
      description: "Obtener factores de ley predeterminados",
    },
  };
}

function buildEvaluationCollectionLinks(page, totalPages, limit) {
  return {
    self: {
      href: `${API_BASE}/performance-evaluations?page=${page}&limit=${limit}`,
      method: "GET",
    },
    create: {
      href: `${API_BASE}/performance-evaluations`,
      method: "POST",
      description: "Registrar nueva evaluación del desempeño",
    },
    ...(page > 1 ? { prev: { href: `${API_BASE}/performance-evaluations?page=${page - 1}&limit=${limit}`, method: "GET" } } : {}),
    ...(page < totalPages ? { next: { href: `${API_BASE}/performance-evaluations?page=${page + 1}&limit=${limit}`, method: "GET" } } : {}),
  };
}

module.exports = {
  API_BASE,
  buildCollaboratorLinks,
  buildCollaboratorCollectionLinks,
  buildDocumentLinks,
  buildCertificateLinks,
  buildCertificateCollectionLinks,
  buildVerificationLinks,
  buildAlertLinks,
  buildAlertCollectionLinks,
  buildAuditCollectionLinks,
  buildCatalogLinks,
  buildAuthLinks,
  buildVacationCollectionLinks,
  buildPayrollLinks,
  buildPayrollCollectionLinks,
  buildPersonnelActionLinks,
  buildDisciplinaryLinks,
  buildRecruitmentLinks,
  buildRecruitmentCollectionLinks,
  buildEvaluationLinks,
  buildEvaluationCollectionLinks,
};


