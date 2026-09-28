-- =============================================================================
-- MIGRACIÓN OLA 5: CAPACITACIÓN, DESARROLLO, SSO (AG 229-2014) Y CLIMA LABORAL
-- Plataforma Tecnológica de Recursos Humanos Core Humanis (SCSPR)
-- =============================================================================

-- 1. CATÁLOGO DE PROGRAMAS Y CURSOS DE CAPACITACIÓN (MÓDULO 7)
CREATE TABLE IF NOT EXISTS capacitaciones_programas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_curso VARCHAR(50) UNIQUE NOT NULL, -- ej. CAP-2026-001
    titulo VARCHAR(255) NOT NULL,
    area_tematica VARCHAR(100) NOT NULL, -- GESTION_PUBLICA, COMUNICACION, TECNOLOGIA, ETICA, SSO
    modalidad VARCHAR(50) NOT NULL DEFAULT 'VIRTUAL' CHECK (modalidad IN ('PRESENCIAL', 'VIRTUAL_SINCRONICA', 'VIRTUAL_ASINCRONICA', 'HIBRIDA')),
    horas_lectivas NUMERIC(5,2) NOT NULL CHECK (horas_lectivas > 0),
    entidad_facilitadora VARCHAR(150) NOT NULL, -- INAP, ONSEC, SCSPR, etc.
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

-- 2. SESIONES Y ASIGNACIÓN DE PARTICIPANTES EN CAPACITACIÓN (MÓDULO 7)
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

-- 3. CHECKLIST Y SEGUIMIENTO DE INDUCCIÓN DE PERSONAL (MÓDULO 7)
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

-- 4. COMITÉ BIPARTITO DE SALUD Y SEGURIDAD OCUPACIONAL — SSO (AG 229-2014)
CREATE TABLE IF NOT EXISTS sso_comite_periodos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_gestion VARCHAR(100) NOT NULL, -- ej. Comité Bipartito SSO 2026-2028
    fecha_constitucion DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    numero_registro_mintrab VARCHAR(100), -- Registro oficial Departamento SSO MINTRAB
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

-- 5. LIBRO DE REGISTRO DE ACCIDENTES E INCIDENTES DE TRABAJO (MÓDULO 10 / AG 229-2014)
CREATE TABLE IF NOT EXISTS sso_incidentes_accidentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlativo VARCHAR(50) UNIQUE NOT NULL, -- ej. INC-SSO-2026-001
    tipo_evento VARCHAR(50) NOT NULL CHECK (tipo_evento IN ('ACCIDENTE_CON_BAJA', 'ACCIDENTE_SIN_BAJA', 'INCIDENTE_PELIGROSO', 'ENFERMEDAD_OCUPACIONAL')),
    fecha_hora_evento TIMESTAMP WITH TIME ZONE NOT NULL,
    lugar_exacto VARCHAR(200) NOT NULL,
    persona_afectada_id UUID REFERENCES personas(id),
    descripcion_hechos TEXT NOT NULL,
    parte_cuerpo_afectada VARCHAR(100), -- CABEZA, OJOS, MANOS_BRAZOS, ESPALDA, PIERNAS_PIES, MULTIPLE
    mecanismo_accidente VARCHAR(100), -- CAIDA, CORTE, GOLPE, SOBREESFUERZO, ELECTRICO, VIAL
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

-- 6. FICHA MÉDICA OCUPACIONAL BÁSICA (MÓDULO 10)
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

-- 7. CLIMA LABORAL Y ENCUESTAS ANÓNIMAS (MÓDULO 10)
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

-- Registro de respuestas estrictamente anónimas (Sin persona_id, sin usuario_id, sin IP)
CREATE TABLE IF NOT EXISTS clima_respuestas_anonimas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campana_id UUID NOT NULL REFERENCES clima_campanas(id) ON DELETE CASCADE,
    pregunta_id UUID NOT NULL REFERENCES clima_preguntas(id) ON DELETE CASCADE,
    unidad_admin_id UUID REFERENCES unidades_administrativas(id),
    puntuacion_numerica INTEGER CHECK (puntuacion_numerica BETWEEN 0 AND 10),
    respuesta_texto TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Control de participación ciega (Evita duplicados sin asociar voto)
CREATE TABLE IF NOT EXISTS clima_participaciones_ciegas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campana_id UUID NOT NULL REFERENCES clima_campanas(id) ON DELETE CASCADE,
    token_ciego_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256(usuario_id + salt_secreto + campana_id)
    participo_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_capacitaciones_persona ON capacitaciones_participantes(persona_id);
CREATE INDEX IF NOT EXISTS idx_capacitaciones_programa ON capacitaciones_participantes(programa_id);
CREATE INDEX IF NOT EXISTS idx_sso_incidentes_fecha ON sso_incidentes_accidentes(fecha_hora_evento);
CREATE INDEX IF NOT EXISTS idx_clima_respuestas_campana ON clima_respuestas_anonimas(campana_id);

-- =============================================================================
-- SEEDERS OLA 5: DATOS INSTITUCIONALES DE PRUEBA
-- =============================================================================

-- Cursos de Capacitación Base
INSERT INTO capacitaciones_programas (
    codigo_curso, titulo, area_tematica, modalidad, horas_lectivas, entidad_facilitadora,
    nombre_instructor, objetivo_capacitacion, temario_resumen, fecha_inicio, fecha_fin, cupo_maximo, estado
) VALUES 
(
    'CAP-2026-001',
    'Ética Pública, Probidad y Transparencia en la Comunicación Gubernamental',
    'ETICA',
    'HIBRIDA',
    20.00,
    'Instituto Nacional de Administración Pública (INAP)',
    'Lic. Rodrigo Méndez Cabrera',
    'Fortalecer los principios éticos, transparencia activa y prevención de faltas administrativas en el servicio público.',
    'Módulo 1: Marco de la Ley de Probidad. Módulo 2: Conflicto de interés y declaraciones juradas. Módulo 3: Ética digital.',
    '2026-10-01',
    '2026-10-15',
    35,
    'CONVOCATORIA_ABIERTA'
),
(
    'CAP-2026-002',
    'Protocolos de Evacuación y Primeros Auxilios Ocupacionales (AG 229-2014)',
    'SSO',
    'PRESENCIAL',
    12.00,
    'Benemérito Cuerpo Voluntario de Bomberos / MINTRAB',
    'Capitán Mario Villagrán',
    'Capacitar a las brigadas institucionales en técnicas de respuesta inmediata ante sismos, conatos de incendio y urgencias médicas.',
    'Módulo 1: Rutas de evacuación y puntos de reunión. Módulo 2: Manejo de extintores PQS. Módulo 3: RCP básico y vendajes.',
    '2026-10-20',
    '2026-10-22',
    25,
    'PLANIFICADO'
)
ON CONFLICT (codigo_curso) DO NOTHING;

-- Período Vigente de Comité Bipartito SSO
INSERT INTO sso_comite_periodos (
    nombre_gestion, fecha_constitucion, fecha_vencimiento, numero_registro_mintrab, estado
) VALUES (
    'Comité Bipartito de Salud y Seguridad Ocupacional SCSPR 2026-2028',
    '2026-01-15',
    '2028-01-14',
    'MINTRAB-DSSO-SCSPR-2026-044',
    'VIGENTE'
)
ON CONFLICT DO NOTHING;

-- Campaña de Clima Laboral 2026
INSERT INTO clima_campanas (
    titulo, descripcion, periodo_anio, fecha_inicio, fecha_cierre, estado, total_invitados
) VALUES (
    'Encuesta Institucional de Clima y Cultura SCSPR 2026',
    'Evaluación anónima y confidencial para diagnosticar la percepción de liderazgo, herramientas, bienestar y sentido de pertenencia.',
    2026,
    '2026-09-01',
    '2026-10-31',
    'ACTIVA',
    18
)
ON CONFLICT DO NOTHING;

-- Preguntas de la Campaña de Clima
DO $$
DECLARE
    v_campana_id UUID;
BEGIN
    SELECT id INTO v_campana_id FROM clima_campanas WHERE periodo_anio = 2026 LIMIT 1;
    IF v_campana_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM clima_preguntas WHERE campana_id = v_campana_id) THEN
        INSERT INTO clima_preguntas (campana_id, dimension, texto_pregunta, tipo_respuesta, orden) VALUES
        (v_campana_id, 'LIDERAZGO', 'Mi jefe inmediato comunica las metas de trabajo de manera clara y brinda retroalimentación constructiva.', 'LIKERT_1_5', 1),
        (v_campana_id, 'COMUNICACION', 'Existe un flujo de comunicación transparente y oportuno entre las distintas unidades de la SCSPR.', 'LIKERT_1_5', 2),
        (v_campana_id, 'CONDICIONES', 'Cuento con el equipo, herramientas y condiciones ergonómicas adecuadas para desempeñar mis labores.', 'LIKERT_1_5', 3),
        (v_campana_id, 'RECONOCIMIENTO', 'Mi esfuerzo y aportes al cumplimiento de los objetivos de la institución son valorados positivamente.', 'LIKERT_1_5', 4),
        (v_campana_id, 'EQUILIBRIO_VIDA', 'La carga laboral me permite mantener un equilibrio razonable entre mi vida personal y profesional.', 'LIKERT_1_5', 5),
        (v_campana_id, 'ENPS', 'En una escala del 0 al 10, ¿con qué probabilidad recomendaría a la SCSPR como un buen lugar para laborar?', 'ENPS_0_10', 6);
    END IF;
END $$;
