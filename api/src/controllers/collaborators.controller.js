const db = require("../config/db-core-humanis");
const { mockData } = require("../config/mock-store");
const { evaluarIntegridadExpediente } = require("../services/traffic-light.service");
const { registrarAuditoria } = require("../services/audit.service");
const {
  buildCollaboratorLinks,
  buildCollaboratorCollectionLinks,
} = require("../utils/hateoas.helper");

// Listado de colaboradores con filtros multicriterio, paginación hipermedia y cálculo de semáforo
exports.getColaboradores = async (req, res) => {
  try {
    const { search, renglon, unidad, estado, estado_expediente, page, limit } = req.query;

    let items = [...mockData.personas];

    // Filtro por texto libre
    if (search) {
      const q = search.toLowerCase().trim();
      items = items.filter((p) => {
        const full = `${p.primer_nombre} ${p.segundo_nombre || ""} ${p.primer_apellido} ${p.segundo_apellido || ""}`.toLowerCase();
        const dpi = (p.cui_dpi || "").toLowerCase();
        const nit = (p.nit || "").toLowerCase();
        const puesto = (p.contrato_actual?.puesto_funcional || "").toLowerCase();
        return full.includes(q) || dpi.includes(q) || nit.includes(q) || puesto.includes(q);
      });
    }

    // Filtro por Renglón
    if (renglon && renglon !== "ALL") {
      items = items.filter((p) => p.contrato_actual?.renglon_codigo === renglon);
    }

    // Filtro por Unidad
    if (unidad && unidad !== "ALL") {
      items = items.filter((p) => p.contrato_actual?.unidad_admin?.includes(unidad));
    }

    // Evaluar y adjuntar el semáforo del expediente a cada uno
    const resultado = items.map((p) => {
      const integridad = evaluarIntegridadExpediente(p.documentos || [], p.contrato_actual?.renglon_codigo);
      return {
        ...p,
        semaforo_expediente: integridad,
        _links: buildCollaboratorLinks(p),
      };
    });

    // Filtro por estado del expediente si aplica
    let filtrado = resultado;
    if (estado_expediente && estado_expediente !== "ALL") {
      filtrado = filtrado.filter((p) => p.semaforo_expediente.estado === estado_expediente);
    }

    const total = filtrado.length;

    // Parámetros de paginación HATEOAS
    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = limit ? Math.max(1, parseInt(limit, 10)) : 10;
    const totalPages = Math.max(1, Math.ceil(total / pageLimit));
    const startIndex = (currentPage - 1) * pageLimit;
    const paginatedItems = filtrado.slice(startIndex, startIndex + pageLimit);

    const queryFilters = {};
    if (search) queryFilters.search = search;
    if (renglon && renglon !== "ALL") queryFilters.renglon = renglon;
    if (unidad && unidad !== "ALL") queryFilters.unidad = unidad;
    if (estado_expediente && estado_expediente !== "ALL") queryFilters.estado_expediente = estado_expediente;

    const paginationMeta = {
      page: currentPage,
      limit: pageLimit,
      total,
      totalPages,
    };

    res.json({
      success: true,
      total,
      page: currentPage,
      limit: pageLimit,
      totalPages,
      data: paginatedItems,
      _links: buildCollaboratorCollectionLinks(queryFilters, paginationMeta),
    });
  } catch (error) {
    console.error("Error al obtener colaboradores:", error);
    res.status(500).json({ success: false, message: "Error interno al consultar colaboradores" });
  }
};

// Ficha 360° Dossier Completo
exports.getColaboradorById = async (req, res) => {
  try {
    const { id } = req.params;
    const persona = mockData.personas.find((p) => p.id === id);

    if (!persona) {
      return res.status(404).json({ success: false, message: "Colaborador no encontrado" });
    }

    const integridad = evaluarIntegridadExpediente(persona.documentos || [], persona.contrato_actual?.renglon_codigo);

    const dataWithLinks = {
      ...persona,
      semaforo_expediente: integridad,
      _links: buildCollaboratorLinks(persona),
    };

    res.json({
      success: true,
      data: dataWithLinks,
      _links: {
        self: { href: `/api/v1/core-humanis/collaborators/${id}`, method: "GET" },
        collection: { href: "/api/v1/core-humanis/collaborators", method: "GET" },
      },
    });
  } catch (error) {
    console.error("Error al obtener colaborador:", error);
    res.status(500).json({ success: false, message: "Error al consultar ficha 360°" });
  }
};

// Crear nuevo colaborador (Persona + Contrato inicial)
exports.crearColaborador = async (req, res) => {
  try {
    const {
      cui_dpi,
      nit,
      igss_afiliacion,
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      fecha_nacimiento,
      genero,
      estado_civil,
      direccion_residencia,
      telefono_personal,
      correo_institucional,
      renglon_codigo,
      puesto_funcional,
      puesto_nominal,
      unidad_admin,
      numero_acuerdo_contrato,
      salario_honorarios,
      fecha_inicio,
      fecha_fin,
    } = req.body;

    if (!cui_dpi || (cui_dpi.length !== 13 && cui_dpi.length !== 36 && cui_dpi.length < 8)) {
      return res.status(400).json({ success: false, message: "El CUI / DPI debe contener 13 dígitos numéricos o un identificador UUID válido" });
    }

    if (!primer_nombre || !primer_apellido) {
      return res.status(400).json({ success: false, message: "El primer nombre y primer apellido son obligatorios" });
    }

    const nuevoId = `pers-${Date.now()}`;
    const nuevoColaborador = {
      id: nuevoId,
      cui_dpi,
      nit: nit || "",
      igss_afiliacion: igss_afiliacion || null,
      primer_nombre,
      segundo_nombre: segundo_nombre || "",
      primer_apellido,
      segundo_apellido: segundo_apellido || "",
      fecha_nacimiento: fecha_nacimiento || null,
      genero: genero || "NO_ESPECIFICADO",
      estado_civil: estado_civil || "SOLTERO/A",
      direccion_residencia: direccion_residencia || "",
      departamento: "Guatemala",
      municipio: "Guatemala",
      telefono_personal: telefono_personal || "",
      correo_personal: "",
      correo_institucional: correo_institucional || "",
      foto_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(primer_nombre + "+" + primer_apellido)}&background=0B2545&color=fff`,
      activo: true,
      contrato_actual: {
        id: `cont-${Date.now()}`,
        renglon_codigo: renglon_codigo || "011",
        renglon_nombre: mockData.renglones.find((r) => r.codigo === renglon_codigo)?.nombre || "Personal Permanente",
        puesto_nominal: puesto_nominal || "Servicios Técnicos Especializados",
        puesto_funcional: puesto_funcional || "Analista Institucional",
        unidad_admin: unidad_admin || "Unidad de Recursos Humanos",
        numero_acuerdo_contrato: numero_acuerdo_contrato || "SCSPR-2026-NUEVO",
        partida_presupuestaria: "11130005-101-00-0101-0001",
        fecha_inicio: fecha_inicio || new Date().toISOString().split("T")[0],
        fecha_fin: fecha_fin || null,
        salario_honorarios: Number(salario_honorarios || 15000),
        estado: "ACTIVO",
      },
      documentos: [],
      estudios: [],
    };

    mockData.personas.unshift(nuevoColaborador);

    await registrarAuditoria({
      usuarioUsername: req.user?.username || "sistema",
      accion: "CREATE",
      tablaAfectada: "personas",
      registroId: nuevoId,
      valoresNuevos: { cui_dpi, primer_nombre, primer_apellido, renglon_codigo },
      detalles: `Alta de nuevo colaborador ${primer_nombre} ${primer_apellido} (${cui_dpi})`,
    });

    const resourceLocation = `/api/v1/core-humanis/collaborators/${nuevoId}`;
    res.location(resourceLocation);
    res.status(201).json({
      success: true,
      message: "Colaborador registrado exitosamente en Core Humanis",
      data: {
        ...nuevoColaborador,
        _links: buildCollaboratorLinks(nuevoColaborador),
      },
    });
  } catch (error) {
    console.error("Error al crear colaborador:", error);
    res.status(500).json({ success: false, message: "Error interno al crear colaborador" });
  }
};

// Actualizar datos del colaborador
exports.actualizarColaborador = async (req, res) => {
  try {
    const { id } = req.params;
    const index = mockData.personas.findIndex((p) => p.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: "Colaborador no encontrado" });
    }

    const prev = { ...mockData.personas[index] };
    mockData.personas[index] = {
      ...mockData.personas[index],
      ...req.body,
      id, // asegurar que id no cambie
    };

    await registrarAuditoria({
      usuarioUsername: req.user?.username || "sistema",
      accion: "UPDATE",
      tablaAfectada: "personas",
      registroId: id,
      valoresAnteriores: prev,
      valoresNuevos: req.body,
      detalles: `Actualización de datos para expediente ${prev.primer_nombre} ${prev.primer_apellido}`,
    });

    res.json({
      success: true,
      message: "Expediente actualizado correctamente",
      data: {
        ...mockData.personas[index],
        _links: buildCollaboratorLinks(mockData.personas[index]),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al actualizar expediente" });
  }
};
