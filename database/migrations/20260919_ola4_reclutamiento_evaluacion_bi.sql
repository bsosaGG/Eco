-- ============================================================================
-- MIGRACIÓN OLA 4: RECLUTAMIENTO Y SELECCIÓN, EVALUACIÓN DEL DESEMPEÑO Y BI
-- Fecha: 2026-09-19
-- Base de datos: db_core_humanis (SCSPR)
-- ============================================================================

-- 1. CONVOCATORIAS DE PLAZAS (MÓDULO 6)
CREATE TABLE IF NOT EXISTS convocatorias_plazas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlativo VARCHAR(50) UNIQUE NOT NULL, -- ej. SCSPR-CONV-2026-001
    titulo_plaza VARCHAR(200) NOT NULL,
    renglon_presupuestario VARCHAR(10) NOT NULL, -- '011', '022', '029', '189'
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

-- 2. BANCO DE POSTULACIONES Y CANDIDATOS (MÓDULO 6)
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
    punteo_curricular NUMERIC(5,2) DEFAULT 0.00, -- 0 a 30 pts
    punteo_tecnico NUMERIC(5,2) DEFAULT 0.00,    -- 0 a 40 pts
    punteo_entrevista NUMERIC(5,2) DEFAULT 0.00, -- 0 a 30 pts
    punteo_total NUMERIC(5,2) DEFAULT 0.00,      -- Total 0 a 100 pts
    en_terna BOOLEAN DEFAULT FALSE,
    estado VARCHAR(30) DEFAULT 'POSTULADO' CHECK (estado IN ('POSTULADO', 'EN_REVISION', 'PRESELECCIONADO', 'EVALUADO', 'SELECCIONADO', 'RECHAZADO')),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_candidato_convocatoria UNIQUE (convocatoria_id, cui)
);

-- 3. EVALUACIONES DEL DESEMPEÑO (MÓDULO 8)
CREATE TABLE IF NOT EXISTS evaluaciones_desempeno (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlativo VARCHAR(50) UNIQUE NOT NULL, -- ej. SCSPR-ED-2026-001
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    evaluador_usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    periodo_evaluado VARCHAR(50) NOT NULL, -- ej. '2026 - Primer Semestre'
    tipo_instrumento VARCHAR(30) NOT NULL CHECK (tipo_instrumento IN ('ONSEC_011_022', 'TDR_029_SUB18')),
    calificacion_total NUMERIC(5,2) NOT NULL, -- 0 a 100 pts
    resultado_escala VARCHAR(30) NOT NULL CHECK (resultado_escala IN ('EXCELENTE', 'MUY_BUENO', 'SATISFACTORIO', 'DEFICIENTE')),
    observaciones_evaluador TEXT,
    compromisos_colaborador TEXT,
    requiere_plan_mejora BOOLEAN DEFAULT FALSE,
    plan_mejora_detalle TEXT,
    fecha_reevaluacion DATE,
    estado VARCHAR(30) DEFAULT 'COMPLETADA' CHECK (estado IN ('BORRADOR', 'COMPLETADA', 'NOTIFICADA', 'APROBADA_URH')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. DESGLOSE DE FACTORES DE EVALUACIÓN (MÓDULO 8)
CREATE TABLE IF NOT EXISTS evaluaciones_factores_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluacion_id UUID NOT NULL REFERENCES evaluaciones_desempeno(id) ON DELETE CASCADE,
    factor_clave VARCHAR(100) NOT NULL, -- ej. 'Calidad de Trabajo', 'Puntualidad'
    factor_descripcion TEXT,
    ponderacion_maxima NUMERIC(5,2) NOT NULL,
    puntaje_obtenido NUMERIC(5,2) NOT NULL,
    justificacion_factor TEXT
);

-- Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_convocatorias_estado ON convocatorias_plazas(estado);
CREATE INDEX IF NOT EXISTS idx_convocatorias_renglon ON convocatorias_plazas(renglon_presupuestario);
CREATE INDEX IF NOT EXISTS idx_postulaciones_convocatoria ON postulaciones_candidatos(convocatoria_id);
CREATE INDEX IF NOT EXISTS idx_postulaciones_terna ON postulaciones_candidatos(en_terna);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_persona ON evaluaciones_desempeno(persona_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_periodo ON evaluaciones_desempeno(periodo_evaluado);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_escala ON evaluaciones_desempeno(resultado_escala);

-- ----------------------------------------------------------------------------
-- SEEDERS INICIALES: CONVOCATORIAS Y EVALUACIONES DE EJEMPLO
-- ----------------------------------------------------------------------------

-- Convocatoria 1: Analista de Medios y Prensa (Renglón 029)
INSERT INTO convocatorias_plazas (
    correlativo, titulo_plaza, renglon_presupuestario, unidad_administrativa,
    salario_honorarios, descripcion_puesto, requisitos_academicos, experiencia_laboral,
    fecha_publicacion, fecha_cierre, plazas_disponibles, estado
) VALUES (
    'SCSPR-CONV-2026-001',
    'Analista de Monitoreo de Medios Digitales',
    '029',
    'Dirección de Información y Prensa',
    18000.00,
    'Monitoreo analítico de redes sociales, medios digitales y cobertura de prensa del Organismo Ejecutivo.',
    'Pensum cerrado o Licenciatura en Ciencias de la Comunicación, Periodismo o carrera afín.',
    'Mínimo 2 años en redacción periodística o análisis de opinión pública.',
    '2026-09-01',
    '2026-09-30',
    2,
    'PUBLICADA'
) ON CONFLICT (correlativo) DO NOTHING;

-- Convocatoria 2: Profesional de Recursos Humanos (Renglón 011)
INSERT INTO convocatorias_plazas (
    correlativo, titulo_plaza, renglon_presupuestario, unidad_administrativa,
    salario_honorarios, descripcion_puesto, requisitos_academicos, experiencia_laboral,
    fecha_publicacion, fecha_cierre, plazas_disponibles, estado
) VALUES (
    'SCSPR-CONV-2026-002',
    'Técnico de Selección y Evaluación del Desempeño',
    '011',
    'Unidad de Recursos Humanos',
    12500.00,
    'Aplicación de pruebas psicométricas, conformación de expedientes de oposición y gestión de planes de evaluación ONSEC.',
    'Licenciatura en Psicología Industrial, Administración de Empresas o Trabajo Social (Colegiado Activo).',
    'Mínimo 3 años en administración de personal público bajo Ley de Servicio Civil.',
    '2026-09-10',
    '2026-10-10',
    1,
    'PUBLICADA'
) ON CONFLICT (correlativo) DO NOTHING;

-- Candidatos para Convocatoria 1
INSERT INTO postulaciones_candidatos (
    convocatoria_id, cui, nombres, apellidos, email, telefono,
    grado_academico, profesion_oficio, resumen_perfil,
    punteo_curricular, punteo_tecnico, punteo_entrevista, punteo_total,
    en_terna, estado, observaciones
)
SELECT 
    c.id, '2456789010101', 'Alejandro David', 'Gómez Sandoval', 'agomez.prensa@gmail.com', '502 4589-1234',
    'Licenciatura en Periodismo', 'Periodista y Comunicador', 'Experiencia en medios televisivos y prensa digital gubernamental.',
    28.00, 36.00, 27.00, 91.00, TRUE, 'PRESELECCIONADO', 'Candidato con perfil idóneo para terna final'
FROM convocatorias_plazas c WHERE c.correlativo = 'SCSPR-CONV-2026-001'
ON CONFLICT (convocatoria_id, cui) DO NOTHING;

INSERT INTO postulaciones_candidatos (
    convocatoria_id, cui, nombres, apellidos, email, telefono,
    grado_academico, profesion_oficio, resumen_perfil,
    punteo_curricular, punteo_tecnico, punteo_entrevista, punteo_total,
    en_terna, estado, observaciones
)
SELECT 
    c.id, '1987654320101', 'Claudia Marcela', 'Rivas Castillo', 'crivas.media@outlook.com', '502 5521-8976',
    'Licenciatura en Ciencias de la Comunicación', 'Comunicadora Social', 'Experiencia de 4 años en monitoreo de prensa radial y digital.',
    26.00, 35.00, 25.00, 86.00, TRUE, 'PRESELECCIONADO', 'Cumple requisitos y TDRs a cabalidad'
FROM convocatorias_plazas c WHERE c.correlativo = 'SCSPR-CONV-2026-001'
ON CONFLICT (convocatoria_id, cui) DO NOTHING;
