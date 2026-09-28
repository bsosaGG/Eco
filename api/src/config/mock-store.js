let migratedPersonas = [];
try {
  migratedPersonas = require("./migrated-colaboradores.json");
} catch (e) {
  migratedPersonas = [];
}

// Mock store para desarrollo local ágil cuando PostgreSQL aún no está levantado
const mockData = {
  roles: [
    { id: "11111111-1111-1111-1111-111111111101", codigo: "ADMIN_TI", nombre: "Administrador de Informática" },
    { id: "11111111-1111-1111-1111-111111111102", codigo: "JEFA_RRHH", nombre: "Jefa de Recursos Humanos" },
    { id: "11111111-1111-1111-1111-111111111103", codigo: "ANALISTA_RRHH", nombre: "Analista de Recursos Humanos" },
    { id: "11111111-1111-1111-1111-111111111104", codigo: "AUDITOR", nombre: "Auditor Interno / CGC" },
  ],
  renglones: [
    { id: "33333333-3333-3333-3333-333333333301", codigo: "011", nombre: "Personal Permanente", tipo: "PERMANENTE", tiene_relacion_dependencia: true },
    { id: "33333333-3333-3333-3333-333333333302", codigo: "022", nombre: "Personal por Contrato", tipo: "TEMPORAL", tiene_relacion_dependencia: true },
    { id: "33333333-3333-3333-3333-333333333303", codigo: "021", nombre: "Personal Supernumerario", tipo: "TEMPORAL", tiene_relacion_dependencia: true },
    { id: "33333333-3333-3333-3333-333333333304", codigo: "029", nombre: "Otras Remuneraciones (Servicios Técnicos y Profesionales)", tipo: "SERVICIOS_TECNICOS_PROFESIONALES", tiene_relacion_dependencia: false },
    { id: "33333333-3333-3333-3333-333333333305", codigo: "183", nombre: "Servicios Jurídicos", tipo: "SERVICIOS_TECNICOS_PROFESIONALES", tiene_relacion_dependencia: false },
    { id: "33333333-3333-3333-3333-333333333306", codigo: "189", nombre: "Otros Estudios y Servicios", tipo: "SERVICIOS_TECNICOS_PROFESIONALES", tiene_relacion_dependencia: false },
    { id: "33333333-3333-3333-3333-333333333307", codigo: "018", nombre: "Servicios Técnicos y Profesionales (Subgrupo 18)", tipo: "SERVICIOS_TECNICOS_PROFESIONALES", tiene_relacion_dependencia: false },
    { id: "33333333-3333-3333-3333-333333333308", codigo: "184", nombre: "Servicios Económicos, Financieros y de Control", tipo: "SERVICIOS_TECNICOS_PROFESIONALES", tiene_relacion_dependencia: false },
    { id: "33333333-3333-3333-3333-333333333309", codigo: "185", nombre: "Servicios de Capacitación", tipo: "SERVICIOS_TECNICOS_PROFESIONALES", tiene_relacion_dependencia: false },
    { id: "33333333-3333-3333-3333-333333333310", codigo: "186", nombre: "Servicios de Informática y Sistemas Computarizados", tipo: "SERVICIOS_TECNICOS_PROFESIONALES", tiene_relacion_dependencia: false },
    { id: "33333333-3333-3333-3333-333333333311", codigo: "187", nombre: "Servicios por Actuaciones Artísticas y Deportivas", tipo: "SERVICIOS_TECNICOS_PROFESIONALES", tiene_relacion_dependencia: false },
    { id: "33333333-3333-3333-3333-333333333312", codigo: "188", nombre: "Servicios de Ingeniería, Arquitectura y Supervisión de Obras", tipo: "SERVICIOS_TECNICOS_PROFESIONALES", tiene_relacion_dependencia: false },
  ],
  unidades: [
    { id: "44444444-4444-4444-4444-444444444401", codigo: "DESP_SUP", nombre: "Despacho Superior (Secretaría)" },
    { id: "44444444-4444-4444-4444-444444444402", codigo: "DESP_SUB", nombre: "Despacho de la Subsecretaría" },
    { id: "44444444-4444-4444-4444-444444444403", codigo: "DIR_PREN", nombre: "Dirección de Prensa y Noticias" },
    { id: "44444444-4444-4444-4444-444444444404", codigo: "DIR_DIGI", nombre: "Dirección de Comunicación Digital" },
    { id: "44444444-4444-4444-4444-444444444405", codigo: "DIR_AUDIO", nombre: "Dirección de Producción Audiovisual" },
    { id: "44444444-4444-4444-4444-444444444406", codigo: "DIR_ADMIN", nombre: "Dirección Administrativa y Financiera" },
    { id: "44444444-4444-4444-4444-444444444407", codigo: "UNI_RRHH", nombre: "Unidad de Recursos Humanos" },
    { id: "44444444-4444-4444-4444-444444444408", codigo: "UNI_INFO", nombre: "Unidad de Informática y Tecnología" },
  ],
  puestos_nominales: [
    { id: "55555555-5555-5555-5555-555555555501", codigo: "SEC_RP", nombre: "Secretario de Relaciones Públicas" },
    { id: "55555555-5555-5555-5555-555555555502", codigo: "SUBSEC_RP", nombre: "Subsecretario de Relaciones Públicas" },
    { id: "55555555-5555-5555-5555-555555555503", codigo: "DIR_EJEC", nombre: "Director Ejecutivo" },
    { id: "55555555-5555-5555-5555-555555555504", codigo: "ASESOR_PROF", nombre: "Servicios Profesionales de Asesoría" },
    { id: "55555555-5555-5555-5555-555555555505", codigo: "TECNICO_ESP", nombre: "Servicios Técnicos Especializados" },
  ],
  puestos_funcionales: [
    { id: "66666666-6666-6666-6666-666666666601", codigo: "F_SEC_COM", nombre: "Secretario/a de Comunicación Social" },
    { id: "66666666-6666-6666-6666-666666666602", codigo: "F_SUBSEC", nombre: "Subsecretario/a de Comunicación Social" },
    { id: "66666666-6666-6666-6666-666666666603", codigo: "F_ASESOR_ESTR", nombre: "Asesor/a de Estrategia de Comunicación" },
    { id: "66666666-6666-6666-6666-666666666604", codigo: "F_JEFE_RRHH", nombre: "Jefe/a de Recursos Humanos" },
    { id: "66666666-6666-6666-6666-666666666605", codigo: "F_COORD_PRENSA", nombre: "Coordinador/a de Redacción de Prensa" },
  ],
  tipos_documento: [
    { id: "77777777-7777-7777-7777-777777777701", codigo: "DOC_DPI", nombre: "Documento Personal de Identificación (DPI)", es_obligatorio: true, requiere_vencimiento: false },
    { id: "77777777-7777-7777-7777-777777777702", codigo: "DOC_RTU", nombre: "Constancia de RTU (SAT)", es_obligatorio: true, requiere_vencimiento: false },
    { id: "77777777-7777-7777-7777-777777777703", codigo: "DOC_IGSS", nombre: "Carné o Constancia de Afiliación IGSS", es_obligatorio: true, requiere_vencimiento: false },
    { id: "77777777-7777-7777-7777-777777777704", codigo: "DOC_CV", nombre: "Currículum Vitae con Atestados", es_obligatorio: true, requiere_vencimiento: false },
    { id: "77777777-7777-7777-7777-777777777705", codigo: "DOC_TITULO", nombre: "Títulos y Diplomas Acreditados", es_obligatorio: true, requiere_vencimiento: false },
    { id: "77777777-7777-7777-7777-777777777706", codigo: "DOC_COLEG", nombre: "Constancia de Colegiado Activo", es_obligatorio: true, requiere_vencimiento: true },
    { id: "77777777-7777-7777-7777-777777777707", codigo: "DOC_FINIQ_CGC", nombre: "Finiquito Transitorio CGC (6 meses)", es_obligatorio: true, requiere_vencimiento: true, meses_vigencia: 6 },
    { id: "77777777-7777-7777-7777-777777777708", codigo: "DOC_DJP_CGC", nombre: "Declaración Jurada Patrimonial (DJP)", es_obligatorio: true, requiere_vencimiento: true },
    { id: "77777777-7777-7777-7777-777777777709", codigo: "DOC_ANTEC_PEN", nombre: "Antecedentes Penales", es_obligatorio: true, requiere_vencimiento: true },
    { id: "77777777-7777-7777-7777-777777777710", codigo: "DOC_ANTEC_POL", nombre: "Antecedentes Policiales", es_obligatorio: true, requiere_vencimiento: true },
    { id: "77777777-7777-7777-7777-777777777711", codigo: "DOC_CONTRATO", nombre: "Acuerdo de Nombramiento / Contrato", es_obligatorio: true, requiere_vencimiento: true },
    { id: "77777777-7777-7777-7777-777777777712", codigo: "DOC_ACTA_POS", nombre: "Acta de Toma de Posesión / Inicio", es_obligatorio: true, requiere_vencimiento: false },
  ],
  personas: [
    ...migratedPersonas,
    {
      id: "88888888-8888-8888-8888-888888888801",
      cui_dpi: "1984567290101",
      nit: "7845123-4",
      igss_afiliacion: "98451234",
      primer_nombre: "Harold",
      segundo_nombre: "Rolando",
      primer_apellido: "Sánchez",
      segundo_apellido: "Pérez",
      fecha_nacimiento: "1982-05-14",
      genero: "MASCULINO",
      estado_civil: "CASADO/A",
      direccion_residencia: "Zona 1, Ciudad de Guatemala",
      departamento: "Guatemala",
      municipio: "Guatemala",
      telefono_personal: "5551-0101",
      correo_personal: "harold.sanchez@gmail.com",
      correo_institucional: "harold.sanchez@scspr.gob.gt",
      foto_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
      activo: true,
      contrato_actual: {
        id: "99999999-9999-9999-9999-999999999901",
        renglon_codigo: "011",
        renglon_nombre: "Personal Permanente",
        puesto_nominal: "Secretario de Relaciones Públicas",
        puesto_funcional: "Secretario/a de Comunicación Social",
        unidad_admin: "Despacho Superior (Secretaría)",
        numero_acuerdo_contrato: "AG-01-2024",
        partida_presupuestaria: "11130005-101-00-0101-0001-011",
        fecha_inicio: "2024-01-15",
        fecha_fin: null,
        salario_honorarios: 45000.0,
        estado: "ACTIVO",
      },
      documentos: [
        {
          id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
          tipo_codigo: "DOC_FINIQ_CGC",
          tipo_nombre: "Finiquito Transitorio CGC (6 meses)",
          nombre_archivo: "Finiquito_CGC_2026.pdf",
          numero_documento: "CGC-FIN-2026-99881",
          fecha_emision: "2026-08-15",
          fecha_vencimiento: "2027-02-15",
          estado_vigencia: "VIGENTE",
          dias_restantes: 152,
        },
        {
          id: "doc-011-dpi-harold",
          tipo_codigo: "DOC_DPI",
          tipo_nombre: "Documento Personal de Identificación (DPI)",
          nombre_archivo: "DPI_Harold_Sanchez.pdf",
          numero_documento: "1984567290101",
          fecha_emision: "2020-01-10",
          fecha_vencimiento: null,
          estado_vigencia: "VIGENTE",
          dias_restantes: null,
        }
      ],
      estudios: [
        { nivel_academico: "LICENCIATURA", titulo_obtenido: "Licenciado en Ciencias de la Comunicación", institucion: "Universidad de San Carlos de Guatemala", numero_colegiado: "14892", colegio_profesional: "Colegio de Humanidades" }
      ]
    },
    {
      id: "88888888-8888-8888-8888-888888888802",
      cui_dpi: "2456789120101",
      nit: "8954120-1",
      igss_afiliacion: "10458796",
      primer_nombre: "Brenda",
      segundo_nombre: "Carolina",
      primer_apellido: "López",
      segundo_apellido: "Estrada",
      fecha_nacimiento: "1990-11-20",
      genero: "FEMENINO",
      estado_civil: "SOLTERO/A",
      direccion_residencia: "Zona 11, Ciudad de Guatemala",
      departamento: "Guatemala",
      municipio: "Guatemala",
      telefono_personal: "5552-0202",
      correo_personal: "brenda.lopez@gmail.com",
      correo_institucional: "brenda.lopez@scspr.gob.gt",
      foto_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200",
      activo: true,
      contrato_actual: {
        id: "99999999-9999-9999-9999-999999999902",
        renglon_codigo: "022",
        renglon_nombre: "Personal por Contrato",
        puesto_nominal: "Director Ejecutivo",
        puesto_funcional: "Jefe/a de Recursos Humanos",
        unidad_admin: "Unidad de Recursos Humanos",
        numero_acuerdo_contrato: "SCSPR-022-2026-015",
        partida_presupuestaria: "11130005-101-00-0101-0001-022",
        fecha_inicio: "2026-01-02",
        fecha_fin: "2026-12-31",
        salario_honorarios: 22000.0,
        estado: "ACTIVO",
      },
      documentos: [
        {
          id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
          tipo_codigo: "DOC_FINIQ_CGC",
          tipo_nombre: "Finiquito Transitorio CGC (6 meses)",
          nombre_archivo: "Finiquito_CGC_Brenda.pdf",
          numero_documento: "CGC-FIN-2026-33412",
          fecha_emision: "2026-04-10",
          fecha_vencimiento: "2026-10-10",
          estado_vigencia: "POR_VENCER", // Vence en menos de 30 días
          dias_restantes: 24,
        }
      ],
      estudios: [
        { nivel_academico: "MAESTRIA", titulo_obtenido: "Magíster en Gestión de Talento Humano", institucion: "Universidad Rafael Landívar", numero_colegiado: "8912", colegio_profesional: "Colegio de Profesionales de Humanidades" }
      ]
    },
    {
      id: "88888888-8888-8888-8888-888888888803",
      cui_dpi: "3124567890101",
      nit: "9874561-2",
      igss_afiliacion: null,
      primer_nombre: "Carlos",
      segundo_nombre: "Enrique",
      primer_apellido: "Méndez",
      segundo_apellido: "García",
      fecha_nacimiento: "1988-08-03",
      genero: "MASCULINO",
      estado_civil: "SOLTERO/A",
      direccion_residencia: "Zona 7, Mixco",
      departamento: "Guatemala",
      municipio: "Mixco",
      telefono_personal: "5553-0303",
      correo_personal: "carlos.mendez@outlook.com",
      correo_institucional: "carlos.mendez@scspr.gob.gt",
      foto_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
      activo: true,
      contrato_actual: {
        id: "99999999-9999-9999-9999-999999999903",
        renglon_codigo: "029",
        renglon_nombre: "Otras Remuneraciones (Servicios Técnicos y Profesionales)",
        puesto_nominal: "Servicios Profesionales de Asesoría",
        puesto_funcional: "Asesor/a de Estrategia de Comunicación",
        unidad_admin: "Despacho Superior (Secretaría)",
        numero_acuerdo_contrato: "SCSPR-029-2026-089",
        partida_presupuestaria: "11130005-101-00-0101-0001-029",
        fecha_inicio: "2026-02-01",
        fecha_fin: "2026-12-31",
        salario_honorarios: 25000.0,
        estado: "ACTIVO",
      },
      documentos: [
        {
          id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3",
          tipo_codigo: "DOC_FINIQ_CGC",
          tipo_nombre: "Finiquito Transitorio CGC (6 meses)",
          nombre_archivo: "Finiquito_CGC_Carlos.pdf",
          numero_documento: "CGC-FIN-2025-11002",
          fecha_emision: "2026-02-01",
          fecha_vencimiento: "2026-08-01",
          estado_vigencia: "VENCIDO", // Ya venció
          dias_restantes: -45,
        }
      ],
      estudios: [
        { nivel_academico: "LICENCIATURA", titulo_obtenido: "Licenciado en Relaciones Internacionales", institucion: "Universidad del Valle de Guatemala", numero_colegiado: "19230", colegio_profesional: "Colegio de Abogados y Notarios" }
      ]
    }
  ],
  constancias: [
    {
      id: "const-001",
      correlativo: "SCSPR-URH-CONST-2026-00001",
      persona_id: "88888888-8888-8888-8888-888888888801",
      colaborador_nombre: "Harold Rolando Sánchez Pérez",
      tipo_constancia: "LABORAL",
      dirigido_a: "A QUIEN INTERESE",
      incluye_salario: true,
      hash_verificacion: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      fecha_emision: "2026-09-01T10:00:00Z",
      emitido_por: "Licda. María Elena Morales Paz"
    }
  ],
  auditoria: [
    {
      id: "audit-001",
      usuario: "jefa.rrhh",
      accion: "LOGIN",
      tabla_afectada: "usuarios",
      detalles: "Inicio de sesión institucional correcto",
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "audit-002",
      usuario: "jefa.rrhh",
      accion: "EMITIR_CONSTANCIA",
      tabla_afectada: "constancias_emitidas",
      detalles: "Emisión de constancia laboral SCSPR-URH-CONST-2026-00001 para Harold Sánchez",
      created_at: new Date(Date.now() - 1800000).toISOString()
    }
  ],
  denuncias: [
    {
      id: "den-0001",
      correlativo: "DEN-SCSPR-2026-0001",
      tipo_denuncia: "ACOSO_LABORAL",
      prioridad: "ALTA",
      es_anonima: true,
      denunciante_nombre: null,
      denunciante_correo: null,
      denunciante_telefono: null,
      denunciante_unidad: "Dirección de Producción Audiovisual",
      persona_denunciada: "Personal de Supervisión de Turno",
      cargo_denunciado: "Supervisor de Producción",
      dependencia_denunciada: "Dirección de Producción Audiovisual",
      fecha_incidente: "2026-03-10",
      lugar_incidente: "Cabina de Edición 2 - Piso 3",
      descripcion: "Trato degradante reiterado y asignación desproporcionada de jornadas extraordinarias sin justificación técnica ni compensación.",
      pruebas_descripcion: "Bitácoras de turnos de marzo y mensajes institucionales.",
      codigo_seguimiento: "c4ca4238a0b923820dcc509a6f75849b20260310denunciascsp001",
      estado: "EN_INVESTIGACION",
      resolucion_nota: "Trasladado a Comité de Ética y Unidad de Recursos Humanos para entrevista reservada.",
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: "den-0002",
      correlativo: "DEN-SCSPR-2026-0002",
      tipo_denuncia: "SSO_PELIGRO",
      prioridad: "URGENTE",
      es_anonima: false,
      denunciante_nombre: "Karina Elizabeth García",
      denunciante_correo: "karina.garcia@scspr.gob.gt",
      denunciante_telefono: "5551-0101",
      denunciante_unidad: "Unidad de Recursos Humanos",
      persona_denunciada: "Servicios Generales / Mantenimiento",
      cargo_denunciado: "Encargado de Mantenimiento",
      dependencia_denunciada: "Dirección Administrativa y Financiera",
      fecha_incidente: "2026-03-22",
      lugar_incidente: "Salida de Emergencia Pasillo Central - Piso 2",
      descripcion: "Bloqueo constante de la ruta de evacuación con cajas de archivo y cables expuestos sin canaleta reglamentaria.",
      pruebas_descripcion: "Inspección ocular conjunta con delegada de Comité Bipartito SSO.",
      codigo_seguimiento: "c81e728d9d4c2f636f067f89cc14862c20260322denunciascsp002",
      estado: "RECIBIDA",
      resolucion_nota: null,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ]
};

module.exports = {
  mockData,
  query: async (text, params = []) => {
    // Interceptador de consultas para modo desarrollo
    return { rows: [], rowCount: 0 };
  },
  getClient: async () => ({
    query: async () => ({ rows: [], rowCount: 0 }),
    release: () => {},
  }),
};
