-- ============================================================================
-- SCRIPT DE INICIALIZACIÓN: CORE HUMANIS (RRHH SCSPR) - OLA 1 (MVP)
-- Base de datos: db_core_humanis
-- Secretaría de Comunicación Social de la Presidencia de la República (SCSPR)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. SEGURIDAD, ROLES Y USUARIOS (RBAC)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rol_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. CATÁLOGOS BASE INSTITUCIONALES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS renglones_presupuestarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(10) UNIQUE NOT NULL, -- '011', '021', '022', '029', '183', '189', '031'
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'PERMANENTE', 'TEMPORAL', 'SERVICIOS_TECNICOS_PROFESIONALES'
    tiene_relacion_dependencia BOOLEAN DEFAULT TRUE,
    requiere_fianza BOOLEAN DEFAULT FALSE,
    requiere_colegiado_activo BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS unidades_administrativas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(80) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    dependencia_padre_id UUID REFERENCES unidades_administrativas(id),
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS puestos_nominales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(80) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS puestos_funcionales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS tipos_documento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL, -- 'DOC_DPI', 'DOC_FINIQ_CGC', etc.
    nombre VARCHAR(150) NOT NULL,
    es_obligatorio BOOLEAN DEFAULT TRUE,
    requiere_vencimiento BOOLEAN DEFAULT FALSE,
    meses_vigencia INTEGER DEFAULT NULL, -- ej. 6 meses para CGC
    dias_alerta_anticipada INTEGER DEFAULT 30,
    renglones_aplicables VARCHAR(50) DEFAULT 'ALL', -- 'ALL', '011,022', '029,183,189'
    descripcion TEXT
);

-- ----------------------------------------------------------------------------
-- 3. EXPEDIENTE DIGITAL Y PERSONAL (ENTIDAD PERSONA Y CONTRATOS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cui_dpi VARCHAR(64) UNIQUE NOT NULL, -- 13 dígitos o UUID temporal
    nit VARCHAR(20),
    igss_afiliacion VARCHAR(30),
    primer_nombre VARCHAR(60) NOT NULL,
    segundo_nombre VARCHAR(60),
    otros_nombres VARCHAR(60),
    primer_apellido VARCHAR(60) NOT NULL,
    segundo_apellido VARCHAR(60),
    apellido_casada VARCHAR(60),
    fecha_nacimiento DATE,
    genero VARCHAR(20), -- 'MASCULINO', 'FEMENINO'
    estado_civil VARCHAR(30), -- 'SOLTERO/A', 'CASADO/A'
    nacionalidad VARCHAR(50) DEFAULT 'Guatemalteca',
    direccion_residencia TEXT,
    departamento VARCHAR(50) DEFAULT 'Guatemala',
    municipio VARCHAR(50) DEFAULT 'Guatemala',
    telefono_personal VARCHAR(20),
    correo_personal VARCHAR(120),
    correo_institucional VARCHAR(120),
    contacto_emergencia_nombre VARCHAR(120),
    contacto_emergencia_parentesco VARCHAR(50),
    contacto_emergencia_telefono VARCHAR(20),
    foto_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS estudios_academicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    nivel_academico VARCHAR(50) NOT NULL, -- 'PRIMARIA', 'DIVERSIFICADO', 'TECNICO', 'LICENCIATURA', 'MAESTRIA', 'DOCTORADO'
    titulo_obtenido VARCHAR(200) NOT NULL,
    institucion VARCHAR(200),
    campo_estudio VARCHAR(200),
    fecha_inicio DATE,
    fecha_graduacion DATE,
    en_curso BOOLEAN DEFAULT false,
    notas TEXT,
    numero_colegiado VARCHAR(30),
    colegio_profesional VARCHAR(150),
    vigencia_colegiado DATE,
    estado_colegiado VARCHAR(50) DEFAULT 'ACTIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS relaciones_laborales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    renglon_id UUID NOT NULL REFERENCES renglones_presupuestarios(id),
    puesto_nominal_id UUID REFERENCES puestos_nominales(id),
    puesto_funcional_id UUID REFERENCES puestos_funcionales(id),
    unidad_admin_id UUID REFERENCES unidades_administrativas(id),
    numero_acuerdo_contrato VARCHAR(100),
    partida_presupuestaria VARCHAR(100),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE, -- Requerido para contratos temporales
    salario_honorarios DECIMAL(12,2) NOT NULL,
    numero_fianza VARCHAR(80),
    aseguradora_fianza VARCHAR(120),
    vigencia_fianza DATE,
    estado VARCHAR(30) DEFAULT 'ACTIVO', -- 'ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'EN_TRAMITE'
    observaciones TEXT,
    es_contrato_actual BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expediente_documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    tipo_documento_id UUID NOT NULL REFERENCES tipos_documento(id),
    nombre_archivo_original VARCHAR(255) NOT NULL,
    nombre_archivo_guardado VARCHAR(255) NOT NULL,
    ruta_almacenamiento TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    tamano_bytes BIGINT NOT NULL,
    fecha_emision DATE,
    fecha_vencimiento DATE,
    numero_documento VARCHAR(100),
    estado_vigencia VARCHAR(30) DEFAULT 'VIGENTE', -- 'VIGENTE', 'POR_VENCER', 'VENCIDO', 'NO_APLICA'
    subido_por_usuario_id UUID REFERENCES usuarios(id),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. EMISIÓN DOCUMENTAL Y VALIDACIÓN QR (MÓDULO 11 FASE 1)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS constancias_emitidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlativo VARCHAR(60) UNIQUE NOT NULL, -- ej. 'SCSPR-URH-CONST-2026-00001'
    persona_id UUID NOT NULL REFERENCES personas(id),
    relacion_laboral_id UUID REFERENCES relaciones_laborales(id),
    tipo_constancia VARCHAR(40) NOT NULL, -- 'LABORAL', 'SERVICIOS_TECNICOS', 'SERVICIOS_PROFESIONALES', 'FICHA_EXPEDIENTE'
    dirigido_a VARCHAR(150) DEFAULT 'A QUIEN INTERESE',
    incluye_salario BOOLEAN DEFAULT TRUE,
    hash_verificacion VARCHAR(128) UNIQUE NOT NULL,
    ruta_pdf_archivo TEXT,
    emitido_por_usuario_id UUID REFERENCES usuarios(id),
    estado VARCHAR(20) DEFAULT 'VALIDA', -- 'VALIDA', 'ANULADA'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. PISTA DE AUDITORÍA INMUTABLE (AUDIT TRAIL)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    accion VARCHAR(50) NOT NULL, -- 'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'EMITIR_CONSTANCIA'
    tabla_afectada VARCHAR(60),
    registro_id UUID,
    valores_anteriores JSONB,
    valores_nuevos JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    detalles TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- SEED DATA INICIAL (CATÁLOGOS INSTITUCIONALES)
-- Nota: La autenticación, usuarios y roles se gestionan de forma centralizada
-- a través de db_global_users (http://localhost:8080/profiles).
-- ----------------------------------------------------------------------------

-- Renglones Presupuestarios
INSERT INTO renglones_presupuestarios (id, codigo, nombre, tipo, tiene_relacion_dependencia, requiere_fianza, requiere_colegiado_activo) VALUES
('33333333-3333-3333-3333-333333333301', '011', 'Personal Permanente', 'PERMANENTE', TRUE, FALSE, FALSE),
('33333333-3333-3333-3333-333333333302', '022', 'Personal por Contrato', 'TEMPORAL', TRUE, TRUE, FALSE),
('33333333-3333-3333-3333-333333333303', '021', 'Personal Supernumerario', 'TEMPORAL', TRUE, FALSE, FALSE),
('33333333-3333-3333-3333-333333333304', '029', 'Otras Remuneraciones de Personal Temporal', 'SERVICIOS_TECNICOS_PROFESIONALES', FALSE, TRUE, FALSE),
('33333333-3333-3333-3333-333333333305', '183', 'Servicios Jurídicos', 'SERVICIOS_TECNICOS_PROFESIONALES', FALSE, TRUE, TRUE),
('33333333-3333-3333-3333-333333333306', '189', 'Otros Estudios y Servicios', 'SERVICIOS_TECNICOS_PROFESIONALES', FALSE, TRUE, FALSE),
('33333333-3333-3333-3333-333333333307', '018', 'Servicios Técnicos y Profesionales (Subgrupo 18)', 'SERVICIOS_TECNICOS_PROFESIONALES', FALSE, TRUE, FALSE),
('33333333-3333-3333-3333-333333333308', '184', 'Servicios Económicos, Financieros y de Control', 'SERVICIOS_TECNICOS_PROFESIONALES', FALSE, TRUE, TRUE),
('33333333-3333-3333-3333-333333333309', '185', 'Servicios de Capacitación', 'SERVICIOS_TECNICOS_PROFESIONALES', FALSE, TRUE, FALSE),
('33333333-3333-3333-3333-333333333310', '186', 'Servicios de Informática y Sistemas Computarizados', 'SERVICIOS_TECNICOS_PROFESIONALES', FALSE, TRUE, FALSE),
('33333333-3333-3333-3333-333333333311', '187', 'Servicios por Actuaciones Artísticas y Deportivas', 'SERVICIOS_TECNICOS_PROFESIONALES', FALSE, FALSE, FALSE),
('33333333-3333-3333-3333-333333333312', '188', 'Servicios de Ingeniería, Arquitectura y Supervisión de Obras', 'SERVICIOS_TECNICOS_PROFESIONALES', FALSE, TRUE, TRUE)
ON CONFLICT (codigo) DO NOTHING;

-- Unidades Administrativas
INSERT INTO unidades_administrativas (id, codigo, nombre) VALUES
('44444444-4444-4444-4444-444444444401', 'DESP_SUP', 'Despacho Superior (Secretaría)'),
('44444444-4444-4444-4444-444444444402', 'DESP_SUB', 'Despacho de la Subsecretaría'),
('44444444-4444-4444-4444-444444444403', 'DIR_PREN', 'Dirección de Prensa y Noticias'),
('44444444-4444-4444-4444-444444444404', 'DIR_DIGI', 'Dirección de Comunicación Digital'),
('44444444-4444-4444-4444-444444444405', 'DIR_AUDIO', 'Dirección de Producción Audiovisual'),
('44444444-4444-4444-4444-444444444406', 'DIR_ADMIN', 'Dirección Administrativa y Financiera'),
('44444444-4444-4444-4444-444444444407', 'UNI_RRHH', 'Unidad de Recursos Humanos'),
('44444444-4444-4444-4444-444444444408', 'UNI_INFO', 'Unidad de Informática y Tecnología')
ON CONFLICT (codigo) DO NOTHING;

-- Puestos Nominales
INSERT INTO puestos_nominales (id, codigo, nombre) VALUES
('55555555-5555-5555-5555-555555555501', 'SEC_RP', 'Secretario de Relaciones Públicas'),
('55555555-5555-5555-5555-555555555502', 'SUBSEC_RP', 'Subsecretario de Relaciones Públicas'),
('55555555-5555-5555-5555-555555555503', 'DIR_EJEC', 'Director Ejecutivo'),
('55555555-5555-5555-5555-555555555504', 'ASESOR_PROF', 'Servicios Profesionales de Asesoría'),
('55555555-5555-5555-5555-555555555505', 'TECNICO_ESP', 'Servicios Técnicos Especializados'),
('55555555-5555-5555-5555-555555555506', 'ASIST_ADMIN', 'Asistente Administrativo')
ON CONFLICT (codigo) DO NOTHING;

-- Puestos Funcionales
INSERT INTO puestos_funcionales (id, codigo, nombre) VALUES
('66666666-6666-6666-6666-666666666601', 'F_SEC_COM', 'Secretario/a de Comunicación Social'),
('66666666-6666-6666-6666-666666666602', 'F_SUBSEC', 'Subsecretario/a de Comunicación Social'),
('66666666-6666-6666-6666-666666666603', 'F_ASESOR_ESTR', 'Asesor/a de Estrategia de Comunicación'),
('66666666-6666-6666-6666-666666666604', 'F_JEFE_RRHH', 'Jefe/a de Recursos Humanos'),
('66666666-6666-6666-6666-666666666605', 'F_COORD_PRENSA', 'Coordinador/a de Redacción de Prensa'),
('66666666-6666-6666-6666-666666666606', 'F_DISENADOR', 'Diseñador/a Gráfico Digital')
ON CONFLICT (codigo) DO NOTHING;

-- Tipos de Documento
INSERT INTO tipos_documento (id, codigo, nombre, es_obligatorio, requiere_vencimiento, meses_vigencia, dias_alerta_anticipada, renglones_aplicables) VALUES
('77777777-7777-7777-7777-777777777701', 'DOC_DPI', 'Documento Personal de Identificación (DPI)', TRUE, FALSE, NULL, 0, 'ALL'),
('77777777-7777-7777-7777-777777777702', 'DOC_RTU', 'Constancia de RTU (SAT)', TRUE, FALSE, 12, 30, 'ALL'),
('77777777-7777-7777-7777-777777777703', 'DOC_IGSS', 'Carné / Constancia Afiliación IGSS', TRUE, FALSE, NULL, 0, '011,022,021'),
('77777777-7777-7777-7777-777777777704', 'DOC_CV', 'Currículum Vitae con Atestados', TRUE, FALSE, NULL, 0, 'ALL'),
('77777777-7777-7777-7777-777777777705', 'DOC_TITULO', 'Títulos y Diplomas Acreditados', TRUE, FALSE, NULL, 0, 'ALL'),
('77777777-7777-7777-7777-777777777706', 'DOC_COLEG', 'Constancia de Colegiado Activo', TRUE, TRUE, 12, 30, 'PROFESIONALES'),
('77777777-7777-7777-7777-777777777707', 'DOC_FINIQ_CGC', 'Finiquito CGC (Vigencia Estricta 6 meses)', TRUE, TRUE, 6, 30, 'ALL'),
('77777777-7777-7777-7777-777777777708', 'DOC_DJP_CGC', 'Declaración Jurada Patrimonial (DJP)', TRUE, TRUE, 12, 30, 'OBLIGADOS'),
('77777777-7777-7777-7777-777777777709', 'DOC_ANTEC_PEN', 'Antecedentes Penales (6 meses)', TRUE, TRUE, 6, 30, 'ALL'),
('77777777-7777-7777-7777-777777777710', 'DOC_ANTEC_POL', 'Antecedentes Policiales (6 meses)', TRUE, TRUE, 6, 30, 'ALL'),
('77777777-7777-7777-7777-777777777711', 'DOC_CONTRATO', 'Acuerdo de Nombramiento / Contrato', TRUE, TRUE, 12, 30, 'ALL'),
('77777777-7777-7777-7777-777777777712', 'DOC_ACTA_POS', 'Acta de Toma de Posesión / Inicio', TRUE, FALSE, NULL, 0, 'ALL'),
('77777777-7777-7777-7777-777777777713', 'DOC_FIANZA', 'Póliza de Fianza de Cumplimiento', FALSE, TRUE, 12, 30, '022,029,183,189')
ON CONFLICT (codigo) DO NOTHING;

-- Colaboradores Iniciales de Ejemplo (Anonimizados para demostración y testing)
INSERT INTO personas (id, cui_dpi, nit, igss_afiliacion, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, fecha_nacimiento, genero, estado_civil, direccion_residencia, telefono_personal, correo_institucional, foto_url) VALUES
('88888888-8888-8888-8888-888888888801', '1000000000101', '1000001-1', '10000001', 'Colaborador', 'Demo', 'Permanente', 'SCSPR', '1985-01-01', 'MASCULINO', 'CASADO/A', 'Edificio SCSPR, Ciudad de Guatemala', '5555-0001', 'colaborador011@scspr.gob.gt', 'https://ui-avatars.com/api/?name=Colaborador+011&background=0B2545&color=EEF4F8&size=200'),
('88888888-8888-8888-8888-888888888802', '2000000000101', '2000002-2', '20000002', 'Colaboradora', 'Demo', 'Contrato', 'SCSPR', '1990-05-15', 'FEMENINO', 'SOLTERO/A', 'Edificio SCSPR, Ciudad de Guatemala', '5555-0002', 'colaboradora022@scspr.gob.gt', 'https://ui-avatars.com/api/?name=Colaboradora+022&background=0B2545&color=EEF4F8&size=200'),
('88888888-8888-8888-8888-888888888803', '3000000000101', '3000003-3', NULL, 'Consultor', 'Demo', 'Servicios', 'SCSPR', '1988-09-20', 'MASCULINO', 'SOLTERO/A', 'Edificio SCSPR, Ciudad de Guatemala', '5555-0003', 'consultor029@scspr.gob.gt', 'https://ui-avatars.com/api/?name=Consultor+029&background=0B2545&color=EEF4F8&size=200')
ON CONFLICT (cui_dpi) DO NOTHING;

-- Relaciones Laborales de Ejemplo
INSERT INTO relaciones_laborales (id, persona_id, renglon_id, puesto_nominal_id, puesto_funcional_id, unidad_admin_id, numero_acuerdo_contrato, partida_presupuestaria, fecha_inicio, fecha_fin, salario_honorarios, estado, es_contrato_actual) VALUES
('99999999-9999-9999-9999-999999999901', '88888888-8888-8888-8888-888888888801', '33333333-3333-3333-3333-333333333301', '55555555-5555-5555-5555-555555555501', '66666666-6666-6666-6666-666666666601', '44444444-4444-4444-4444-444444444401', 'AG-01-2024', '11130005-101-00-0101-0001-011', '2024-01-15', NULL, 45000.00, 'ACTIVO', TRUE),
('99999999-9999-9999-9999-999999999902', '88888888-8888-8888-8888-888888888802', '33333333-3333-3333-3333-333333333302', '55555555-5555-5555-5555-555555555503', '66666666-6666-6666-6666-666666666604', '44444444-4444-4444-4444-444444444407', 'SCSPR-022-2026-015', '11130005-101-00-0101-0001-022', '2026-01-02', '2026-12-31', 22000.00, 'ACTIVO', TRUE),
('99999999-9999-9999-9999-999999999903', '88888888-8888-8888-8888-888888888803', '33333333-3333-3333-3333-333333333304', '55555555-5555-5555-5555-555555555504', '66666666-6666-6666-6666-666666666603', '44444444-4444-4444-4444-444444444401', 'SCSPR-029-2026-089', '11130005-101-00-0101-0001-029', '2026-02-01', '2026-12-31', 25000.00, 'ACTIVO', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Documentos con Semáforos Reales
-- 1. Finiquito vigente
INSERT INTO expediente_documentos (id, persona_id, tipo_documento_id, nombre_archivo_original, nombre_archivo_guardado, ruta_almacenamiento, mime_type, tamano_bytes, fecha_emision, fecha_vencimiento, numero_documento, estado_vigencia) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '88888888-8888-8888-8888-888888888801', '77777777-7777-7777-7777-777777777707', 'Finiquito_CGC_2026.pdf', 'cgc_8888_01.pdf', '/uploads/expedientes/cgc_8888_01.pdf', 'application/pdf', 245100, CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '5 months', 'CGC-FIN-2026-99881', 'VIGENTE'),
-- 2. Finiquito por vencer (a menos de 30 días)
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '88888888-8888-8888-8888-888888888802', '77777777-7777-7777-7777-777777777707', 'Finiquito_CGC_Brenda.pdf', 'cgc_8888_02.pdf', '/uploads/expedientes/cgc_8888_02.pdf', 'application/pdf', 189200, CURRENT_DATE - INTERVAL '5 months', CURRENT_DATE + INTERVAL '15 days', 'CGC-FIN-2026-33412', 'POR_VENCER'),
-- 3. Finiquito vencido
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '88888888-8888-8888-8888-888888888803', '77777777-7777-7777-7777-777777777707', 'Finiquito_CGC_Carlos.pdf', 'cgc_8888_03.pdf', '/uploads/expedientes/cgc_8888_03.pdf', 'application/pdf', 215400, CURRENT_DATE - INTERVAL '7 months', CURRENT_DATE - INTERVAL '1 month', 'CGC-FIN-2025-11002', 'VENCIDO')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. OLA 2: TABLAS Y SEEDERS DE VACACIONES, LICENCIAS Y ASISTENCIA
-- ============================================================================
CREATE TABLE IF NOT EXISTS jornadas_institucionales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidad_admin_id UUID REFERENCES unidades_administrativas(id),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    hora_entrada TIME NOT NULL DEFAULT '08:00:00',
    hora_salida TIME NOT NULL DEFAULT '16:30:00',
    tolerancia_minutos INTEGER DEFAULT 15,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vacaciones_saldos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    periodo_anio INTEGER NOT NULL,
    dias_derecho DECIMAL(5,2) DEFAULT 15.00,
    dias_utilizados DECIMAL(5,2) DEFAULT 0.00,
    dias_pendientes DECIMAL(5,2) DEFAULT 15.00,
    fecha_acreditacion DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,
    estado VARCHAR(30) DEFAULT 'VIGENTE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_persona_periodo UNIQUE(persona_id, periodo_anio)
);

CREATE TABLE IF NOT EXISTS vacaciones_solicitudes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlativo VARCHAR(50) UNIQUE NOT NULL,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    relacion_laboral_id UUID REFERENCES relaciones_laborales(id),
    saldo_id UUID REFERENCES vacaciones_saldos(id),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    fecha_retorno DATE NOT NULL,
    dias_solicitados INTEGER NOT NULL,
    tipo_solicitud VARCHAR(50) DEFAULT 'VACACIONES_ORDINARIAS',
    estado VARCHAR(40) DEFAULT 'PENDIENTE_JEFE',
    observaciones TEXT,
    jefe_visto_bueno_usuario_id UUID REFERENCES usuarios(id),
    jefe_visto_bueno_fecha TIMESTAMP WITH TIME ZONE,
    rrhh_aprobador_usuario_id UUID REFERENCES usuarios(id),
    rrhh_aprobador_fecha TIMESTAMP WITH TIME ZONE,
    comprobante_pdf_url TEXT,
    hash_verificacion VARCHAR(64) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS licencias_ausencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlativo VARCHAR(50) UNIQUE NOT NULL,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    tipo_licencia VARCHAR(50) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    dias_totales INTEGER NOT NULL,
    documento_soporte_num VARCHAR(100),
    archivo_soporte_url TEXT,
    estado VARCHAR(30) DEFAULT 'APROBADO',
    observaciones TEXT,
    registrado_por_usuario_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS asistencia_incidencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    tipo_incidencia VARCHAR(50) NOT NULL,
    minutos_retraso INTEGER DEFAULT 0,
    justificada BOOLEAN DEFAULT FALSE,
    justificacion_motivo TEXT,
    aprobado_por_usuario_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO jornadas_institucionales (codigo, nombre, hora_entrada, hora_salida, tolerancia_minutos)
VALUES ('JORNADA_SCSPR_STD', 'Jornada Ordinaria SCSPR (8:00 a 16:30)', '08:00:00', '16:30:00', 15)
ON CONFLICT (codigo) DO NOTHING;

-- 16. REGISTRO INMUTABLE DE MARCAJES BIOMÉTRICOS Y ASISTENCIA
CREATE TABLE IF NOT EXISTS asistencia_marcas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo_marca VARCHAR(20) NOT NULL CHECK (tipo_marca IN ('ENTRADA', 'SALIDA', 'ALMUERZO_INICIO', 'ALMUERZO_FIN')),
    dispositivo_id VARCHAR(50) DEFAULT 'BIOMETRICO_PRINCIPAL',
    origen VARCHAR(30) DEFAULT 'BIOMETRICO' CHECK (origen IN ('BIOMETRICO', 'MANUAL', 'PORTAL_WEB', 'API_INTEGRACION')),
    registrado_por_usuario_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asistencia_marcas_persona ON asistencia_marcas(persona_id);
CREATE INDEX IF NOT EXISTS idx_asistencia_marcas_fecha ON asistencia_marcas(fecha_hora);

-- ============================================================================
-- 17. OLA 3: NÓMINA, ACCIONES DE PERSONAL Y RÉGIMEN DISCIPLINARIO
-- ============================================================================

CREATE TABLE IF NOT EXISTS conceptos_salariales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('HABER', 'DESCUENTO_LEY', 'DESCUENTO_OTRO', 'RETENCION_SAT')),
    es_afecto_igss BOOLEAN DEFAULT FALSE,
    es_afecto_montepio BOOLEAN DEFAULT FALSE,
    es_afecto_isr BOOLEAN DEFAULT FALSE,
    valor_fijo NUMERIC(12,2) DEFAULT 0.00,
    porcentaje NUMERIC(6,4) DEFAULT 0.00,
    formula_calculo VARCHAR(100),
    renglones_aplicables VARCHAR(100) DEFAULT '011,022',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nominas_cabecera (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlativo VARCHAR(50) UNIQUE NOT NULL,
    periodo_mes INTEGER NOT NULL CHECK (periodo_mes BETWEEN 1 AND 12),
    periodo_anio INTEGER NOT NULL,
    tipo_planilla VARCHAR(30) NOT NULL CHECK (tipo_planilla IN ('ORDINARIA', 'AGUINALDO', 'BONO14', 'LIQUIDACION')),
    renglon_presupuestario VARCHAR(10) NOT NULL CHECK (renglon_presupuestario IN ('011', '022', '029', '18')),
    total_devengado NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    total_descuentos NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    total_liquido NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(30) NOT NULL DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR', 'REVISADO', 'APROBADO', 'PAGADO')),
    creado_por_usuario_id UUID REFERENCES usuarios(id),
    aprobado_por_usuario_id UUID REFERENCES usuarios(id),
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    archivo_dispersion_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nominas_detalles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomina_id UUID NOT NULL REFERENCES nominas_cabecera(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES personas(id),
    contrato_id UUID REFERENCES relaciones_laborales(id),
    dias_laborados INTEGER NOT NULL DEFAULT 30,
    sueldo_base_honorarios NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_bonificaciones NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_ingresos NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_descuentos_ley NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_descuentos_otros NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    liquido_a_recibir NUMERIC(12,2) NOT NULL,
    banco_nombre VARCHAR(100) DEFAULT 'BANRURAL',
    banco_numero_cuenta VARCHAR(50),
    tipo_cuenta VARCHAR(30) DEFAULT 'MONETARIA',
    boleta_hash_sha256 VARCHAR(64) UNIQUE,
    boleta_pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nominas_conceptos_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomina_detalle_id UUID NOT NULL REFERENCES nominas_detalles(id) ON DELETE CASCADE,
    concepto_id UUID NOT NULL REFERENCES conceptos_salariales(id),
    monto NUMERIC(12,2) NOT NULL,
    observacion VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS acciones_personal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlativo VARCHAR(50) UNIQUE NOT NULL,
    persona_id UUID NOT NULL REFERENCES personas(id),
    tipo_accion VARCHAR(50) NOT NULL CHECK (tipo_accion IN ('NOMBRAMIENTO', 'CONTRATACION', 'ASCENSO', 'TRASLADO', 'BAJA', 'SUSPENSION', 'JUBILACION')),
    fecha_efectiva DATE NOT NULL,
    fecha_rige_hasta DATE,
    acuerdo_numero VARCHAR(100),
    acta_toma_posesion VARCHAR(100),
    puesto_nominal_id UUID REFERENCES puestos_nominales(id),
    puesto_funcional_id UUID REFERENCES puestos_funcionales(id),
    unidad_admin_id UUID REFERENCES unidades_administrativas(id),
    salario_nuevo NUMERIC(12,2),
    justificacion TEXT NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR', 'EN_FIRMA', 'APROBADO', 'ANULADO')),
    documento_acuerdo_pdf_url TEXT,
    documento_acta_pdf_url TEXT,
    notificado_onsec BOOLEAN DEFAULT FALSE,
    fecha_notificacion_onsec DATE,
    requiere_djp_cgc BOOLEAN DEFAULT TRUE,
    fecha_limite_djp_cgc DATE,
    djp_cumplida BOOLEAN DEFAULT FALSE,
    autorizado_por_usuario_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expedientes_disciplinarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlativo VARCHAR(50) UNIQUE NOT NULL,
    persona_id UUID NOT NULL REFERENCES personas(id),
    jefatura_denunciante_id UUID REFERENCES usuarios(id),
    fecha_incidente DATE NOT NULL,
    gravedad_falta VARCHAR(30) NOT NULL CHECK (gravedad_falta IN ('LEVE', 'GRAVE', 'GRAVISIMA')),
    tipo_sancion_propuesta VARCHAR(50) NOT NULL,
    tipo_sancion_definitiva VARCHAR(50),
    dias_suspension INTEGER DEFAULT 0,
    hechos_denuncia TEXT NOT NULL,
    base_legal VARCHAR(150) DEFAULT 'Ley de Servicio Civil Decreto 1748',
    estado VARCHAR(30) NOT NULL DEFAULT 'REGISTRADO' CHECK (estado IN ('REGISTRADO', 'AUDIENCIA_CONFERIDA', 'DESCARGO_RECIBIDO', 'RESUELTO', 'ARCHIVADO')),
    fecha_resolucion DATE,
    resolucion_pdf_url TEXT,
    resuelto_por_usuario_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audiencias_descargo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expediente_disciplinario_id UUID NOT NULL REFERENCES expedientes_disciplinarios(id) ON DELETE CASCADE,
    fecha_notificacion DATE NOT NULL,
    fecha_limite_evacuacion DATE NOT NULL,
    memorial_descargo TEXT,
    documento_descargo_pdf_url TEXT,
    fecha_presentacion DATE,
    presentado_a_tiempo BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO conceptos_salariales (codigo, nombre, tipo, es_afecto_igss, es_afecto_montepio, es_afecto_isr, valor_fijo, porcentaje, renglones_aplicables)
VALUES
    ('SUELDO_BASE', 'Sueldo Base Mensual', 'HABER', TRUE, TRUE, TRUE, 0.00, 0.00, '011,022'),
    ('BONO_INCENTIVO_37_2001', 'Bonificación Incentivo (Decreto 37-2001)', 'HABER', FALSE, FALSE, FALSE, 250.00, 0.00, '011,022'),
    ('BONO_PROFESIONAL_72_2001', 'Bonificación Profesional (Decreto 72-2001)', 'HABER', FALSE, FALSE, FALSE, 375.00, 0.00, '011,022'),
    ('HONORARIOS_029', 'Honorarios Mensuales de Servicios', 'HABER', FALSE, FALSE, TRUE, 0.00, 0.00, '029,18'),
    ('CUOTA_IGSS_LABORAL', 'Cuota Laboral IGSS (4.83%)', 'DESCUENTO_LEY', FALSE, FALSE, FALSE, 0.00, 0.0483, '011,022'),
    ('MONTEPIO_CLASES_PASIVAS', 'Montepío Civil del Estado (Decreto 63-88)', 'DESCUENTO_LEY', FALSE, FALSE, FALSE, 0.00, 0.1100, '011'),
    ('RETENCION_ISR_TRABAJO', 'Retención ISR Trabajo en Relación de Dependencia', 'RETENCION_SAT', FALSE, FALSE, FALSE, 0.00, 0.0500, '011,022'),
    ('RETENCION_ISR_SERVICIOS', 'Retención ISR 5% Servicios Técnicos/Profesionales', 'RETENCION_SAT', FALSE, FALSE, FALSE, 0.00, 0.0500, '029,18'),
    ('DESCUENTO_SUSPENSION_DISC', 'Descuento por Suspensión Disciplinaria', 'DESCUENTO_OTRO', FALSE, FALSE, FALSE, 0.00, 0.00, '011,022')
ON CONFLICT (codigo) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_nominas_periodo ON nominas_cabecera(periodo_anio, periodo_mes, renglon_presupuestario);
CREATE INDEX IF NOT EXISTS idx_nominas_detalles_persona ON nominas_detalles(persona_id);
CREATE INDEX IF NOT EXISTS idx_acciones_personal_persona ON acciones_personal(persona_id);
CREATE INDEX IF NOT EXISTS idx_disciplinario_persona ON expedientes_disciplinarios(persona_id);

-- ----------------------------------------------------------------------------
-- 7. RECLUTAMIENTO, EVALUACIÓN DEL DESEMPEÑO Y BI (OLA 4)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS convocatorias_plazas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlativo VARCHAR(50) UNIQUE NOT NULL,
    titulo_plaza VARCHAR(200) NOT NULL,
    renglon_presupuestario VARCHAR(10) NOT NULL,
    puesto_nominal_id UUID REFERENCES puestos_nominales(id) ON DELETE SET NULL,
    puesto_funcional_id UUID REFERENCES puestos_funcionales(id) ON DELETE SET NULL,
    unidad_administrativa VARCHAR(150) NOT NULL,
    salario_honorarios NUMERIC(10,2) NOT NULL,
    descripcion_puesto TEXT NOT NULL,
    requisitos_academicos TEXT NOT NULL,
    experiencia_laboral TEXT NOT NULL,
    fecha_publicacion DATE NOT NULL,
    fecha_cierre DATE NOT NULL,
    plazas_disponibles INTEGER DEFAULT 1,
    estado VARCHAR(30) DEFAULT 'PUBLICADA' CHECK (estado IN ('BORRADOR', 'PUBLICADA', 'EN_EVALUACION', 'FINALIZADA', 'CANCELADA')),
    creado_por_usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS postulaciones_candidatos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    convocatoria_id UUID NOT NULL REFERENCES convocatorias_plazas(id) ON DELETE CASCADE,
    cui VARCHAR(20) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    telefono VARCHAR(30),
    grado_academico VARCHAR(100) NOT NULL,
    profesion_oficio VARCHAR(100),
    resumen_perfil TEXT,
    cv_url TEXT,
    punteo_curricular NUMERIC(5,2) DEFAULT 0.00,
    punteo_tecnico NUMERIC(5,2) DEFAULT 0.00,
    punteo_entrevista NUMERIC(5,2) DEFAULT 0.00,
    punteo_total NUMERIC(5,2) DEFAULT 0.00,
    en_terna BOOLEAN DEFAULT FALSE,
    estado VARCHAR(30) DEFAULT 'POSTULADO' CHECK (estado IN ('POSTULADO', 'EN_REVISION', 'PRESELECCIONADO', 'EVALUADO', 'SELECCIONADO', 'RECHAZADO')),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_candidato_convocatoria UNIQUE (convocatoria_id, cui)
);

CREATE TABLE IF NOT EXISTS evaluaciones_desempeno (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlativo VARCHAR(50) UNIQUE NOT NULL,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    evaluador_usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    periodo_evaluado VARCHAR(50) NOT NULL,
    tipo_instrumento VARCHAR(30) NOT NULL CHECK (tipo_instrumento IN ('ONSEC_011_022', 'TDR_029_SUB18')),
    calificacion_total NUMERIC(5,2) NOT NULL,
    resultado_escala VARCHAR(30) NOT NULL CHECK (resultado_escala IN ('EXCELENTE', 'MUY_BUENO', 'SATISFACTORIO', 'DEFICIENTE')),
    observaciones_evaluador TEXT,
    compromisos_colaborador TEXT,
    requiere_plan_mejora BOOLEAN DEFAULT FALSE,
    plan_mejora_detalle TEXT,
    fecha_reevaluacion DATE,
    estado VARCHAR(30) DEFAULT 'COMPLETADA' CHECK (estado IN ('BORRADOR', 'COMPLETADA', 'NOTIFICADA', 'APROBADA_URH')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evaluaciones_factores_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluacion_id UUID NOT NULL REFERENCES evaluaciones_desempeno(id) ON DELETE CASCADE,
    factor_clave VARCHAR(100) NOT NULL,
    factor_descripcion TEXT,
    ponderacion_maxima NUMERIC(5,2) NOT NULL,
    puntaje_obtenido NUMERIC(5,2) NOT NULL,
    justificacion_factor TEXT
);

CREATE INDEX IF NOT EXISTS idx_convocatorias_estado ON convocatorias_plazas(estado);
CREATE INDEX IF NOT EXISTS idx_postulaciones_convocatoria ON postulaciones_candidatos(convocatoria_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_persona ON evaluaciones_desempeno(persona_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_periodo ON evaluaciones_desempeno(periodo_evaluado);

-- =============================================================================
-- TABLAS OLA 5: CAPACITACIÓN, BIENESTAR, SSO (AG 229-2014) Y CLIMA LABORAL
-- =============================================================================

CREATE TABLE IF NOT EXISTS capacitaciones_programas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_curso VARCHAR(50) UNIQUE NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    area_tematica VARCHAR(100) NOT NULL,
    modalidad VARCHAR(50) NOT NULL DEFAULT 'VIRTUAL' CHECK (modalidad IN ('PRESENCIAL', 'VIRTUAL_SINCRONICA', 'VIRTUAL_ASINCRONICA', 'HIBRIDA')),
    horas_lectivas NUMERIC(5,2) NOT NULL CHECK (horas_lectivas > 0),
    entidad_facilitadora VARCHAR(150) NOT NULL,
    nombre_instructor VARCHAR(150),
    objetivo_capacitacion TEXT,
    temario_resumen TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    cupo_maximo INTEGER NOT NULL DEFAULT 30,
    estado VARCHAR(50) NOT NULL DEFAULT 'PLANIFICADO' CHECK (estado IN ('PLANIFICADO', 'CONVOCATORIA_ABIERTA', 'EN_CURSO', 'FINALIZADO', 'CANCELADO')),
    creado_por_usuario_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS capacitaciones_participantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programa_id UUID NOT NULL REFERENCES capacitaciones_programas(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    origen_inscripcion VARCHAR(50) NOT NULL DEFAULT 'VOLUNTARIA' CHECK (origen_inscripcion IN ('VOLUNTARIA', 'ASIGNACION_RRHH', 'PLAN_MEJORA_EVALUACION', 'INDUCCION_NUEVO_INGRESO')),
    evaluacion_desempeno_origen_id UUID REFERENCES evaluaciones_desempeno(id),
    porcentaje_asistencia NUMERIC(5,2) DEFAULT 0.00,
    calificacion_final NUMERIC(5,2) DEFAULT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'INSCRITO' CHECK (estado IN ('INSCRITO', 'EN_CURSO', 'APROBADO', 'REPROBADO', 'DESERTOR')),
    hash_certificado VARCHAR(100) UNIQUE,
    fecha_certificacion DATE,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_participante_curso UNIQUE (programa_id, persona_id)
);

CREATE TABLE IF NOT EXISTS inducciones_personal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    fecha_inicio DATE NOT NULL,
    fecha_completada DATE,
    fase_institucional_completada BOOLEAN DEFAULT FALSE,
    fase_normativa_completada BOOLEAN DEFAULT FALSE,
    fase_herramientas_completada BOOLEAN DEFAULT FALSE,
    fase_seguridad_sso_completada BOOLEAN DEFAULT FALSE,
    estado VARCHAR(30) DEFAULT 'EN_PROCESO' CHECK (estado IN ('EN_PROCESO', 'COMPLETADA', 'VENCIDA')),
    tutor_usuario_id UUID REFERENCES usuarios(id),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sso_comite_periodos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_gestion VARCHAR(100) NOT NULL,
    fecha_constitucion DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    numero_registro_mintrab VARCHAR(100),
    estado VARCHAR(30) DEFAULT 'VIGENTE' CHECK (estado IN ('VIGENTE', 'CONCLUIDO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sso_comite_miembros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periodo_id UUID NOT NULL REFERENCES sso_comite_periodos(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES personas(id),
    representacion VARCHAR(50) NOT NULL CHECK (representacion IN ('PATRONAL', 'TRABAJADORES')),
    tipo_miembro VARCHAR(50) NOT NULL CHECK (tipo_miembro IN ('TITULAR', 'SUPLENTE')),
    cargo_comite VARCHAR(50) NOT NULL CHECK (cargo_comite IN ('PRESIDENTE', 'SECRETARIO', 'VOCAL')),
    fecha_acreditacion DATE NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sso_incidentes_accidentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlativo VARCHAR(50) UNIQUE NOT NULL,
    tipo_evento VARCHAR(50) NOT NULL CHECK (tipo_evento IN ('ACCIDENTE_CON_BAJA', 'ACCIDENTE_SIN_BAJA', 'INCIDENTE_PELIGROSO', 'ENFERMEDAD_OCUPACIONAL')),
    fecha_hora_evento TIMESTAMP WITH TIME ZONE NOT NULL,
    lugar_exacto VARCHAR(200) NOT NULL,
    persona_afectada_id UUID REFERENCES personas(id),
    descripcion_hechos TEXT NOT NULL,
    parte_cuerpo_afectada VARCHAR(100),
    mecanismo_accidente VARCHAR(100),
    dias_incapacidad_estimados INTEGER DEFAULT 0,
    requirio_traslado_igss BOOLEAN DEFAULT FALSE,
    causa_raiz TEXT,
    medidas_correctivas TEXT NOT NULL,
    investigado_por_comite BOOLEAN DEFAULT FALSE,
    estado VARCHAR(30) DEFAULT 'REGISTRADO' CHECK (estado IN ('REGISTRADO', 'EN_INVESTIGACION', 'CERRADO')),
    creado_por_usuario_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sso_fichas_medicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID UNIQUE NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    tipo_sangre VARCHAR(10),
    alergias_conocidas TEXT,
    padecimientos_cronicos TEXT,
    medicamentos_permanentes TEXT,
    nombre_contacto_emergencia VARCHAR(150),
    telefono_contacto_emergencia VARCHAR(50),
    parentesco_contacto VARCHAR(50),
    fecha_ultimo_chequeo DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sso_consultas_medicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    doctora_nombre VARCHAR(150) DEFAULT 'Dra. Claudia Ramos - SCSPR',
    fecha_consulta TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    motivo_consulta TEXT NOT NULL,
    diagnostico TEXT NOT NULL,
    signos_vitales JSONB,
    tratamiento_indicado TEXT,
    genera_reposo BOOLEAN DEFAULT false,
    dias_reposo INT DEFAULT 0,
    remite_igss BOOLEAN DEFAULT false,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sso_consultas_persona ON sso_consultas_medicas(persona_id);
CREATE INDEX IF NOT EXISTS idx_sso_consultas_fecha ON sso_consultas_medicas(fecha_consulta);

CREATE TABLE IF NOT EXISTS clima_campanas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    periodo_anio INTEGER NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_cierre DATE NOT NULL,
    estado VARCHAR(30) DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR', 'ACTIVA', 'CERRADA')),
    total_invitados INTEGER DEFAULT 0,
    total_respuestas INTEGER DEFAULT 0,
    creado_por_usuario_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clima_preguntas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campana_id UUID NOT NULL REFERENCES clima_campanas(id) ON DELETE CASCADE,
    dimension VARCHAR(50) NOT NULL CHECK (dimension IN ('LIDERAZGO', 'COMUNICACION', 'CONDICIONES', 'RECONOCIMIENTO', 'EQUILIBRIO_VIDA', 'ENPS')),
    texto_pregunta TEXT NOT NULL,
    tipo_respuesta VARCHAR(30) NOT NULL DEFAULT 'LIKERT_1_5' CHECK (tipo_respuesta IN ('LIKERT_1_5', 'ENPS_0_10', 'TEXTO_ABIERTO')),
    orden INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS clima_respuestas_anonimas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campana_id UUID NOT NULL REFERENCES clima_campanas(id) ON DELETE CASCADE,
    pregunta_id UUID NOT NULL REFERENCES clima_preguntas(id) ON DELETE CASCADE,
    unidad_admin_id UUID REFERENCES unidades_administrativas(id),
    puntuacion_numerica INTEGER CHECK (puntuacion_numerica BETWEEN 0 AND 10),
    respuesta_texto TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clima_participaciones_ciegas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campana_id UUID NOT NULL REFERENCES clima_campanas(id) ON DELETE CASCADE,
    token_ciego_hash VARCHAR(64) UNIQUE NOT NULL,
    participo_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_capacitaciones_persona ON capacitaciones_participantes(persona_id);
CREATE INDEX IF NOT EXISTS idx_capacitaciones_programa ON capacitaciones_participantes(programa_id);
CREATE INDEX IF NOT EXISTS idx_sso_incidentes_fecha ON sso_incidentes_accidentes(fecha_hora_evento);
CREATE INDEX IF NOT EXISTS idx_clima_respuestas_campana ON clima_respuestas_anonimas(campana_id);

-- Restricción de Contrato Activo Único
CREATE UNIQUE INDEX IF NOT EXISTS idx_relaciones_laborales_un_contrato_activo
ON relaciones_laborales (persona_id)
WHERE estado = 'ACTIVO';

-- Tabla de Plantillas Modificables de Documentos (.docx)
CREATE TABLE IF NOT EXISTS plantillas_documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(60) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    descripcion TEXT,
    archivo_nombre VARCHAR(150) NOT NULL,
    archivo_contenido BYTEA,
    variables_disponibles JSONB DEFAULT '[]'::jsonb,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plantillas_codigo ON plantillas_documentos (codigo);
CREATE INDEX IF NOT EXISTS idx_plantillas_tipo ON plantillas_documentos (tipo);

-- Catálogo Oficial Inicial de Plantillas Institucionales (17)
INSERT INTO plantillas_documentos (codigo, nombre, tipo, descripcion, archivo_nombre, variables_disponibles)
VALUES 
(
  'INFORME_MENSUAL_029',
  'Informe Mensual de Actividades (029 / Subgrupo 18)',
  'INFORMES_029',
  'Formato oficial estandarizado de rendición de cuentas de actividades y productos mensuales para prestadores de servicios técnicos y profesionales de la SCSPR.',
  'formato-informe-mensual.docx',
  '[
    {"tag": "correlativo", "descripcion": "Número correlativo de informe (ej: SCSPR-029-INF-03-2026)"},
    {"tag": "periodo_mes", "descripcion": "Mes reportado en texto (ej: Marzo)"},
    {"tag": "periodo_anio", "descripcion": "Año fiscal de ejercicio (ej: 2026)"},
    {"tag": "colaborador_nombre", "descripcion": "Nombres y apellidos completos del contratista"},
    {"tag": "cui_dpi", "descripcion": "CUI / DPI del contratista"},
    {"tag": "nit", "descripcion": "Número de Identificación Tributaria (NIT)"},
    {"tag": "numero_contrato", "descripcion": "Número de contrato administrativo (ej: SCSP-029-015-2026)"},
    {"tag": "unidad_administrativa", "descripcion": "Dirección o Unidad requirente asignada"},
    {"tag": "honorarios_monto", "descripcion": "Monto mensual de honorarios pactados (Q.)"},
    {"tag": "atribuciones_detalle", "descripcion": "Detalle de actividades realizadas por cada atribución contractual"},
    {"tag": "supervisor_nombre", "descripcion": "Nombre del supervisor del contrato / Jefe Inmediato"},
    {"tag": "qr_code", "descripcion": "Código QR institucional de trazabilidad y validación pública"}
  ]'::jsonb
),
(
  'INFORME_FINAL_029',
  'Informe Final de Cumplimiento Contractual (029 / SG18)',
  'INFORMES_029',
  'Informe de cierre contractual con consolidado de actividades realizadas, productos entregados y metas cumplidas durante la vigencia del contrato.',
  'formato-informe-final.docx',
  '[
    {"tag": "correlativo", "descripcion": "Número correlativo de informe final"},
    {"tag": "colaborador_nombre", "descripcion": "Nombre completo del contratista"},
    {"tag": "cui_dpi", "descripcion": "CUI / DPI del contratista"},
    {"tag": "numero_contrato", "descripcion": "Número oficial de contrato administrativo"},
    {"tag": "vigencia_contrato", "descripcion": "Período total de vigencia del contrato"},
    {"tag": "resumen_actividades", "descripcion": "Resumen ejecutivo de actividades prestadas"},
    {"tag": "productos_entregados", "descripcion": "Consolidado de productos y entregables"},
    {"tag": "supervisor_nombre", "descripcion": "Nombre del supervisor / Director autorizador"},
    {"tag": "qr_code", "descripcion": "Código QR de validación institucional"}
  ]'::jsonb
),
(
  'FINIQUITO_029',
  'Finiquito Recíproco de Contrato (029)',
  'LEGAL_029',
  'Documento formal de finiquito mutuo por cumplimiento a entera satisfacción o rescisión de contrato de servicios técnicos o profesionales.',
  'finiquito-modelo-029.docx',
  '[
    {"tag": "colaborador_nombre", "descripcion": "Nombre del contratista prestador de servicios"},
    {"tag": "cui_dpi", "descripcion": "CUI / DPI del contratista"},
    {"tag": "numero_contrato", "descripcion": "Número de contrato administrativo"},
    {"tag": "monto_total_pagado", "descripcion": "Monto total percibido durante la vigencia contractual"},
    {"tag": "fecha_finiquito", "descripcion": "Fecha formal de suscripción del finiquito"},
    {"tag": "autoridad_nombre", "descripcion": "Nombre y cargo de la autoridad nominadora que suscribe"}
  ]'::jsonb
),
(
  'DECLARACION_JURADA_029',
  'Acta Notarial de Declaración Jurada 029',
  'LEGAL_029',
  'Declaración jurada notarial de no tener impedimento legal ni inhabilitación para contratar con el Estado (Artículo 80 Ley de Contrataciones del Estado).',
  'acta-notarial-de-declaracion-jurada-029-final-con-negrita.docx',
  '[
    {"tag": "colaborador_nombre", "descripcion": "Nombre completo del declarante"},
    {"tag": "cui_dpi", "descripcion": "CUI / DPI del declarante"},
    {"tag": "nit", "descripcion": "Número de Identificación Tributaria"},
    {"tag": "domicilio", "descripcion": "Domicilio y dirección de residencia del declarante"},
    {"tag": "fecha_acta", "descripcion": "Fecha de redacción del acta notarial"},
    {"tag": "notario_nombre", "descripcion": "Nombre del Notario autorizante"}
  ]'::jsonb
),
(
  'CONTRATO_029',
  'Minuta Oficial de Contrato de Servicios Técnicos/Profesionales (029)',
  'CONTRATO',
  'Contrato administrativo de servicios técnicos y profesionales de la SCSPR con cláusulas de honorarios, retenciones tributarias y plazos legales.',
  'plantilla-contrato-029.docx',
  '[
    {"tag": "numero_contrato", "descripcion": "Número correlativo de contrato SCSP-029-..."},
    {"tag": "contratista_nombre", "descripcion": "Nombre del contratista individual"},
    {"tag": "cui_dpi", "descripcion": "CUI / DPI"},
    {"tag": "nit", "descripcion": "NIT"},
    {"tag": "honorarios_mensuales", "descripcion": "Honorarios pactados en letras y números"},
    {"tag": "plazo_meses", "descripcion": "Vigencia en meses del contrato"},
    {"tag": "objeto_servicios", "descripcion": "Descripción detallada del objeto de contratación"},
    {"tag": "vigencia_inicio", "descripcion": "Fecha inicial de vigencia"},
    {"tag": "vigencia_fin", "descripcion": "Fecha final de vigencia"}
  ]'::jsonb
),
(
  'CONTRATO_022',
  'Plantilla de Contrato Laboral Temporal (022)',
  'CONTRATO',
  'Contrato de trabajo por tiempo determinado en relación de dependencia con asignación de salario base, bonificaciones y prestaciones laborales.',
  'plantilla-contrato-022.docx',
  '[
    {"tag": "numero_contrato", "descripcion": "Número correlativo de contrato 022"},
    {"tag": "colaborador_nombre", "descripcion": "Nombre completo del colaborador"},
    {"tag": "cui_dpi", "descripcion": "CUI / DPI"},
    {"tag": "puesto_funcional", "descripcion": "Puesto funcional desempeñado"},
    {"tag": "salario_base", "descripcion": "Salario base mensual"},
    {"tag": "bonificacion_incentivo", "descripcion": "Bonificación Incentivo Dto. 37-2001 (Q250.00)"},
    {"tag": "vigencia_inicio", "descripcion": "Fecha de inicio del contrato laboral"},
    {"tag": "vigencia_fin", "descripcion": "Fecha de vencimiento del contrato"}
  ]'::jsonb
),
(
  'CONSTANCIA_LABORAL_011_022',
  'Constancia Laboral con Validación QR (011 / 022)',
  'CONSTANCIA',
  'Constancia oficial de relación de dependencia laboral, fecha de ingreso y puesto desempeñado con firma electrónica y código QR de verificación.',
  'plantilla-constancia-laboral.docx',
  '[
    {"tag": "correlativo", "descripcion": "Correlativo institucional oficial SCSPR-URH-CONST-..."},
    {"tag": "fecha_emision", "descripcion": "Fecha formal de emisión del documento"},
    {"tag": "dirigido_a", "descripcion": "Destinatario formal (ej: A QUIEN INTERESE)"},
    {"tag": "colaborador_nombre", "descripcion": "Nombre completo del colaborador"},
    {"tag": "cui_dpi", "descripcion": "CUI / DPI del colaborador"},
    {"tag": "puesto_funcional", "descripcion": "Puesto desempeñado en la institución"},
    {"tag": "fecha_ingreso", "descripcion": "Fecha de ingreso laboral"},
    {"tag": "hash_verificacion", "descripcion": "Hash criptográfico SHA-256 de autenticidad"},
    {"tag": "qr_code", "descripcion": "Imagen del código QR para validación pública"}
  ]'::jsonb
),
(
  'CONSTANCIA_LABORAL_INGRESOS',
  'Constancia Laboral con Desglose de Ingresos (011 / 022)',
  'CONSTANCIA',
  'Constancia de trabajo que detalla sueldo nominal, bonificaciones de ley e ingresos líquidos para trámites crediticios, bancarios y consulares.',
  'plantilla-constancia-laboral-ingresos.docx',
  '[
    {"tag": "correlativo", "descripcion": "Número correlativo del documento"},
    {"tag": "fecha_emision", "descripcion": "Fecha formal de emisión"},
    {"tag": "dirigido_a", "descripcion": "Destinatario de la constancia"},
    {"tag": "colaborador_nombre", "descripcion": "Nombre del trabajador"},
    {"tag": "cui_dpi", "descripcion": "CUI / DPI"},
    {"tag": "puesto_funcional", "descripcion": "Puesto institucional desempeñado"},
    {"tag": "salario_letras", "descripcion": "Monto de sueldo en letras"},
    {"tag": "salario_numero", "descripcion": "Monto de sueldo en números Q."},
    {"tag": "hash_verificacion", "descripcion": "Hash SHA-256"},
    {"tag": "qr_code", "descripcion": "Código QR de verificación pública"}
  ]'::jsonb
),
(
  'CONSTANCIA_SERVICIOS_029',
  'Constancia de Servicios Técnicos y Profesionales (029 / SG18)',
  'CONSTANCIA',
  'Certificación de prestación de servicios y honorarios facturados sin relación de dependencia laboral para consultores y contratistas individuales.',
  'plantilla-constancia-029-sg18.docx',
  '[
    {"tag": "correlativo", "descripcion": "Correlativo oficial SCSPR-URH-CONST-..."},
    {"tag": "fecha_emision", "descripcion": "Fecha de emisión"},
    {"tag": "dirigido_a", "descripcion": "Destinatario formal"},
    {"tag": "colaborador_nombre", "descripcion": "Nombre del contratista prestador de servicios"},
    {"tag": "cui_dpi", "descripcion": "CUI / DPI"},
    {"tag": "objeto_contrato", "descripcion": "Servicios técnicos o profesionales contratados"},
    {"tag": "honorarios_letras", "descripcion": "Honorarios mensuales en letras"},
    {"tag": "honorarios_numero", "descripcion": "Honorarios mensuales en número Q."},
    {"tag": "vigencia_contrato", "descripcion": "Plazo de vigencia del contrato"},
    {"tag": "hash_verificacion", "descripcion": "Hash SHA-256"},
    {"tag": "qr_code", "descripcion": "Código QR de validación"}
  ]'::jsonb
),
(
  'BOLETA_SOLICITUD_VACACIONES',
  'Boleta Oficial de Trámite de Vacaciones',
  'VACACIONES',
  'Formulario para solicitud, cómputo de días hábiles y visto bueno institucional de descanso vacacional en la SCSPR.',
  'boleta-solicitud-vacaciones.docx',
  '[
    {"tag": "correlativo", "descripcion": "Número correlativo de solicitud"},
    {"tag": "fecha_solicitud", "descripcion": "Fecha de emisión de la solicitud"},
    {"tag": "colaborador_nombre", "descripcion": "Nombres y apellidos completos"},
    {"tag": "cui_dpi", "descripcion": "Código Único de Identificación"},
    {"tag": "renglon_codigo", "descripcion": "Renglón presupuestario (011/022/029)"},
    {"tag": "puesto_funcional", "descripcion": "Puesto desempeñado"},
    {"tag": "unidad_administrativa", "descripcion": "Dirección o unidad de adscripción"},
    {"tag": "fecha_inicio", "descripcion": "Fecha inicial del período solicitado"},
    {"tag": "fecha_fin", "descripcion": "Fecha final del período solicitado"},
    {"tag": "dias_solicitados", "descripcion": "Total de días hábiles calculados"},
    {"tag": "saldo_previo", "descripcion": "Saldo acumulado en Kardex previo"},
    {"tag": "saldo_remanente", "descripcion": "Saldo de días hábiles restantes"},
    {"tag": "motivo", "descripcion": "Justificación de la solicitud"},
    {"tag": "jefe_nombre", "descripcion": "Nombre del Jefe Inmediato autorizador"}
  ]'::jsonb
),
(
  'SOLICITUD_HORAS_EXTRAS',
  'Oficio de Solicitud de Turnos Extraordinarios',
  'HORAS_EXTRAS',
  'Oficio formal dirigido a la Unidad de Recursos Humanos para autorización previa y justificación de turnos de tiempo extraordinario.',
  '3-formato-de-oficio-para-solicitud-de-horas-extras.docx',
  '[
    {"tag": "numero_oficio", "descripcion": "Número de oficio de la unidad requirente"},
    {"tag": "fecha_oficio", "descripcion": "Fecha del oficio"},
    {"tag": "unidad_solicitante", "descripcion": "Unidad o Dirección que requiere el tiempo extraordinario"},
    {"tag": "motivo_extraordinario", "descripcion": "Justificación institucional de la necesidad imperiosa"},
    {"tag": "fecha_inicio", "descripcion": "Fecha de inicio del turno extraordinario"},
    {"tag": "fecha_fin", "descripcion": "Fecha de conclusión"},
    {"tag": "cantidad_horas", "descripcion": "Estimación total de horas extras requeridas"},
    {"tag": "personal_asignado", "descripcion": "Nómina de colaboradores asignados al turno"}
  ]'::jsonb
),
(
  'ASIGNACION_TURNOS_HORIZONTAL',
  'Programación de Turnos SCSP (Formato Horizontal)',
  'HORAS_EXTRAS',
  'Programación periódica de turnos y coberturas para el personal operativo, reporteros y monitoreo de medios.',
  'formato-asignacion-turnos-scsp-horizontal.docx',
  '[
    {"tag": "periodo_programacion", "descripcion": "Semana o mes programado"},
    {"tag": "unidad_administrativa", "descripcion": "Unidad de Comunicación asignada"},
    {"tag": "turnos_detalle", "descripcion": "Matriz de turnos rotativos y guardias"},
    {"tag": "responsable_nombre", "descripcion": "Jefe de turno o coordinador"}
  ]'::jsonb
),
(
  'ASIGNACION_TURNOS_VERTICAL',
  'Programación de Turnos SCSP (Formato Vertical)',
  'HORAS_EXTRAS',
  'Plantilla vertical para programación y registro de disponibilidad de turnos extraordinarios.',
  'formato-asignacion-turnos-scsp-vertical.docx',
  '[
    {"tag": "periodo_programacion", "descripcion": "Período de turno"},
    {"tag": "unidad_administrativa", "descripcion": "Unidad requirente"},
    {"tag": "turnos_detalle", "descripcion": "Lista de colaboradores y turnos asignados"}
  ]'::jsonb
),
(
  'CONSTANCIA_CODIGO_ETICA',
  'Constancia de Compromiso con el Código de Ética',
  'INDUCCION',
  'Constancia individual de lectura, compromiso y observancia de las normas de conducta ética e integridad en la SCSPR.',
  'constancia-de-codigo-de-etica.docx',
  '[
    {"tag": "colaborador_nombre", "descripcion": "Nombre del servidor público"},
    {"tag": "cui_dpi", "descripcion": "CUI / DPI"},
    {"tag": "unidad_administrativa", "descripcion": "Unidad a la que ingresa"},
    {"tag": "fecha_firma", "descripcion": "Fecha de formalización"}
  ]'::jsonb
),
(
  'CONSTANCIA_ACOSO',
  'Compromiso: Política Cero Tolerancia al Acoso Laboral y Sexual',
  'INDUCCION',
  'Constancia de inducción y compromiso con la política institucional de prevención, denuncia y sanción del acoso laboral y sexual.',
  'constancia-de-acoso-sexual-y-laboral.docx',
  '[
    {"tag": "colaborador_nombre", "descripcion": "Nombre del servidor o contratista"},
    {"tag": "cui_dpi", "descripcion": "CUI / DPI"},
    {"tag": "unidad_administrativa", "descripcion": "Unidad administrativa"},
    {"tag": "fecha_firma", "descripcion": "Fecha de suscripción"}
  ]'::jsonb
),
(
  'TOMA_POSESION_021',
  'Acta de Toma de Posesión (Renglón 021)',
  'ACCIONES_PUESTO',
  'Acta administrativa de toma de posesión para personal supernumerario bajo renglón presupuestario 021.',
  'plantilla-toma-de-posesion-renglon-021.docx',
  '[
    {"tag": "numero_acta", "descripcion": "Número oficial de acta SCSPR-URH-..."},
    {"tag": "colaborador_nombre", "descripcion": "Nombre del colaborador nombrado"},
    {"tag": "cui_dpi", "descripcion": "CUI / DPI"},
    {"tag": "puesto_funcional", "descripcion": "Puesto desempeñado"},
    {"tag": "unidad_administrativa", "descripcion": "Dirección o Unidad de destino"},
    {"tag": "fecha_posesion", "descripcion": "Fecha formal de toma de posesión"}
  ]'::jsonb
),
(
  'ACTA_ENTREGA_011',
  'Acta de Entrega de Puesto (Renglón 011)',
  'ACCIONES_PUESTO',
  'Acta formal de entrega de cargo, bienes institucionales, archivos y pendientes por renuncia o traslado de personal permanente.',
  '0-formato-011-acta-entrega.docx',
  '[
    {"tag": "numero_acta", "descripcion": "Número de acta de entrega"},
    {"tag": "colaborador_nombre", "descripcion": "Nombre de quien entrega el puesto"},
    {"tag": "puesto_funcional", "descripcion": "Puesto que se entrega"},
    {"tag": "fecha_entrega", "descripcion": "Fecha formal de entrega"},
    {"tag": "motivo_entrega", "descripcion": "Causa de la entrega (traslado, renuncia, etc.)"}
  ]'::jsonb
)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  tipo = EXCLUDED.tipo,
  descripcion = EXCLUDED.descripcion,
  archivo_nombre = EXCLUDED.archivo_nombre,
  variables_disponibles = EXCLUDED.variables_disponibles,
  updated_at = CURRENT_TIMESTAMP;

-- Tabla para Buzón de Denuncias Éticas y Laborales SCSPR
CREATE TABLE IF NOT EXISTS denuncias_buzon (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlativo VARCHAR(50) UNIQUE NOT NULL,
    tipo_denuncia VARCHAR(50) NOT NULL, -- 'ACOSO_LABORAL', 'DISCRIMINACION', 'FALTA_ETICA', 'CORRUPCION_IRREGULARIDAD', 'SSO_PELIGRO', 'OTRO'
    prioridad VARCHAR(20) DEFAULT 'MEDIA', -- 'BAJA', 'MEDIA', 'ALTA', 'URGENTE'
    es_anonima BOOLEAN DEFAULT TRUE,
    denunciante_nombre VARCHAR(150),
    denunciante_correo VARCHAR(100),
    denunciante_telefono VARCHAR(50),
    denunciante_unidad VARCHAR(100),
    persona_denunciada VARCHAR(150),
    cargo_denunciado VARCHAR(150),
    dependencia_denunciada VARCHAR(150),
    fecha_incidente DATE,
    lugar_incidente VARCHAR(200),
    descripcion TEXT NOT NULL,
    pruebas_descripcion TEXT,
    codigo_seguimiento VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 único para seguimiento anónimo
    estado VARCHAR(30) DEFAULT 'RECIBIDA', -- 'RECIBIDA', 'EN_INVESTIGACION', 'DESESTIMADA', 'RESUELTA'
    resolucion_nota TEXT,
    atendido_por UUID REFERENCES usuarios(id),
    fecha_resolucion TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_denuncias_codigo_seguimiento ON denuncias_buzon(codigo_seguimiento);
CREATE INDEX IF NOT EXISTS idx_denuncias_estado ON denuncias_buzon(estado);
CREATE INDEX IF NOT EXISTS idx_denuncias_tipo ON denuncias_buzon(tipo_denuncia);






