// Mock store mínimo de reserva para desarrollo desconectado (totalmente anonimizado)
const mockData = {
  roles: [],
  renglones: [
    { id: "33333333-3333-3333-3333-333333333301", codigo: "011", nombre: "Personal Permanente", tipo: "PERMANENTE", tiene_relacion_dependencia: true },
    { id: "33333333-3333-3333-3333-333333333302", codigo: "022", nombre: "Personal por Contrato", tipo: "TEMPORAL", tiene_relacion_dependencia: true },
    { id: "33333333-3333-3333-3333-333333333303", codigo: "021", nombre: "Personal Supernumerario", tipo: "TEMPORAL", tiene_relacion_dependencia: true },
    { id: "33333333-3333-3333-3333-333333333304", codigo: "029", nombre: "Otras Remuneraciones (Servicios Técnicos y Profesionales)", tipo: "SERVICIOS_TECNICOS_PROFESIONALES", tiene_relacion_dependencia: false },
    { id: "33333333-3333-3333-3333-333333333305", codigo: "183", nombre: "Servicios Jurídicos", tipo: "SERVICIOS_TECNICOS_PROFESIONALES", tiene_relacion_dependencia: false },
    { id: "33333333-3333-3333-3333-333333333306", codigo: "189", nombre: "Otros Estudios y Servicios", tipo: "SERVICIOS_TECNICOS_PROFESIONALES", tiene_relacion_dependencia: false }
  ],
  unidades: [
    { id: "44444444-4444-4444-4444-444444444401", codigo: "DESP_SUP", nombre: "Despacho Superior (Secretaría)" },
    { id: "44444444-4444-4444-4444-444444444402", codigo: "DESP_SUB", nombre: "Despacho de la Subsecretaría" },
    { id: "44444444-4444-4444-4444-444444444403", codigo: "DIR_PREN", nombre: "Dirección de Prensa y Noticias" },
    { id: "44444444-4444-4444-4444-444444444404", codigo: "DIR_DIGI", nombre: "Dirección de Comunicación Digital" },
    { id: "44444444-4444-4444-4444-444444444405", codigo: "DIR_AUDIO", nombre: "Dirección de Producción Audiovisual" },
    { id: "44444444-4444-4444-4444-444444444406", codigo: "DIR_ADMIN", nombre: "Dirección Administrativa y Financiera" },
    { id: "44444444-4444-4444-4444-444444444407", codigo: "UNI_RRHH", nombre: "Unidad de Recursos Humanos" },
    { id: "44444444-4444-4444-4444-444444444408", codigo: "UNI_INFO", nombre: "Unidad de Informática y Tecnología" }
  ],
  puestos_nominales: [
    { id: "55555555-5555-5555-5555-555555555501", codigo: "SEC_RP", nombre: "Secretario de Relaciones Públicas" },
    { id: "55555555-5555-5555-5555-555555555502", codigo: "SUBSEC_RP", nombre: "Subsecretario de Relaciones Públicas" },
    { id: "55555555-5555-5555-5555-555555555503", codigo: "DIR_EJEC", nombre: "Director Ejecutivo" },
    { id: "55555555-5555-5555-5555-555555555504", codigo: "ASESOR_PROF", nombre: "Servicios Profesionales de Asesoría" },
    { id: "55555555-5555-5555-5555-555555555505", codigo: "TECNICO_ESP", nombre: "Servicios Técnicos Especializados" }
  ],
  puestos_funcionales: [
    { id: "66666666-6666-6666-6666-666666666601", codigo: "F_SEC_COM", nombre: "Secretario/a de Comunicación Social" },
    { id: "66666666-6666-6666-6666-666666666602", codigo: "F_SUBSEC", nombre: "Subsecretario/a de Comunicación Social" },
    { id: "66666666-6666-6666-6666-666666666603", codigo: "F_ASESOR_ESTR", nombre: "Asesor/a de Estrategia de Comunicación" },
    { id: "66666666-6666-6666-6666-666666666604", codigo: "F_JEFE_RRHH", nombre: "Jefe/a de Recursos Humanos" },
    { id: "66666666-6666-6666-6666-666666666605", codigo: "F_COORD_PRENSA", nombre: "Coordinador/a de Redacción de Prensa" }
  ],
  tipos_documento: [
    { id: "77777777-7777-7777-7777-777777777701", codigo: "DOC_DPI", nombre: "Documento Personal de Identificación (DPI)", es_obligatorio: true, requiere_vencimiento: false },
    { id: "77777777-7777-7777-7777-777777777702", codigo: "DOC_RTU", nombre: "Constancia de RTU (SAT)", es_obligatorio: true, requiere_vencimiento: false },
    { id: "77777777-7777-7777-7777-777777777703", codigo: "DOC_IGSS", nombre: "Carné o Constancia de Afiliación IGSS", es_obligatorio: true, requiere_vencimiento: false },
    { id: "77777777-7777-7777-7777-777777777704", codigo: "DOC_CV", nombre: "Currículum Vitae con Atestados", es_obligatorio: true, requiere_vencimiento: false },
    { id: "77777777-7777-7777-7777-777777777705", codigo: "DOC_TITULO", nombre: "Títulos y Diplomas Acreditados", es_obligatorio: true, requiere_vencimiento: false },
    { id: "77777777-7777-7777-7777-777777777706", codigo: "DOC_COLEG", nombre: "Constancia de Colegiado Activo", es_obligatorio: true, requiere_vencimiento: true },
    { id: "77777777-7777-7777-7777-777777777707", codigo: "DOC_FINIQ_CGC", nombre: "Finiquito Transitorio CGC (6 meses)", es_obligatorio: true, requiere_vencimiento: true, meses_vigencia: 6 }
  ],
  personas: [
    {
      id: "88888888-8888-8888-8888-888888888801",
      cui_dpi: "1000000000101",
      nit: "1000001-1",
      igss_afiliacion: "10000001",
      primer_nombre: "Colaborador",
      segundo_nombre: "Demo",
      primer_apellido: "Permanente",
      segundo_apellido: "SCSPR",
      fecha_nacimiento: "1985-01-01",
      genero: "MASCULINO",
      estado_civil: "CASADO/A",
      direccion_residencia: "Edificio SCSPR, Ciudad de Guatemala",
      departamento: "Guatemala",
      municipio: "Guatemala",
      telefono_personal: "5555-0001",
      correo_personal: "colaborador011@ejemplo.com",
      correo_institucional: "colaborador011@scspr.gob.gt",
      foto_url: "https://ui-avatars.com/api/?name=Colaborador+011&background=0B2545&color=EEF4F8&size=200",
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
        salario_honorarios: 12000.0,
        estado: "ACTIVO"
      },
      documentos: [
        {
          id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
          tipo_codigo: "DOC_FINIQ_CGC",
          tipo_nombre: "Finiquito Transitorio CGC (6 meses)",
          nombre_archivo: "Finiquito_CGC_0001.pdf",
          numero_documento: "CGC-FIN-2026-99881",
          fecha_emision: "2026-08-15",
          fecha_vencimiento: "2027-02-15",
          estado_vigencia: "VIGENTE",
          dias_restantes: 152
        }
      ],
      estudios: []
    }
  ],
  constancias: [],
  auditoria: [],
  denuncias: []
};

module.exports = {
  mockData,
  query: async () => ({ rows: [], rowCount: 0 }),
  getClient: async () => ({
    query: async () => ({ rows: [], rowCount: 0 }),
    release: () => {}
  })
};
