-- ============================================================================
-- MIGRACIÓN OLA 2: CONTROL DE TIEMPO, VACACIONES, LICENCIAS Y ASISTENCIA
-- Fecha: 2026-09-18
-- Proyecto: Core Humanis (SCSPR)
-- ============================================================================

-- 1. JORNADAS INSTITUCIONALES (HORARIOS Y TURNOS)
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

-- 2. VACACIONES: SALDOS Y KARDEX POR COLABORADOR
CREATE TABLE IF NOT EXISTS vacaciones_saldos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    periodo_anio INTEGER NOT NULL,
    dias_derecho DECIMAL(5,2) DEFAULT 15.00,
    dias_utilizados DECIMAL(5,2) DEFAULT 0.00,
    dias_pendientes DECIMAL(5,2) DEFAULT 15.00,
    fecha_acreditacion DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,
    estado VARCHAR(30) DEFAULT 'VIGENTE', -- 'VIGENTE', 'PRESCRITO', 'AGOTADO'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_persona_periodo UNIQUE(persona_id, periodo_anio)
);

-- 3. VACACIONES: SOLICITUDES Y FLUJO DE APROBACIÓN
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
    tipo_solicitud VARCHAR(50) DEFAULT 'VACACIONES_ORDINARIAS', -- 'VACACIONES_ORDINARIAS', 'PERMISO_TEMPORAL_029'
    estado VARCHAR(40) DEFAULT 'PENDIENTE_JEFE', -- 'BORRADOR', 'PENDIENTE_JEFE', 'APROBADO_JEFE', 'APROBADO_RRHH', 'RECHAZADO', 'CANCELADO'
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

-- 4. LICENCIAS Y AUSENCIAS (IGSS, DUELO, MATERNIDAD, PATERNIDAD, PERMISOS)
CREATE TABLE IF NOT EXISTS licencias_ausencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlativo VARCHAR(50) UNIQUE NOT NULL,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    tipo_licencia VARCHAR(50) NOT NULL, -- 'IGSS_ENFERMEDAD', 'IGSS_MATERNIDAD', 'DUELO', 'MATRIMONIO', 'PATERNIDAD', 'SIN_GOCE_SUELDO', 'CON_GOCE_SUELDO', 'COMISION_OFICIAL'
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    dias_totales INTEGER NOT NULL,
    documento_soporte_num VARCHAR(100),
    archivo_soporte_url TEXT,
    estado VARCHAR(30) DEFAULT 'APROBADO', -- 'PENDIENTE', 'APROBADO', 'RECHAZADO'
    observaciones TEXT,
    registrado_por_usuario_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ASISTENCIA E INCIDENCIAS DE HORARIO
CREATE TABLE IF NOT EXISTS asistencia_incidencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    tipo_incidencia VARCHAR(50) NOT NULL, -- 'LLEGADA_TARDIA', 'OMISION_MARCAJE', 'COMISION_EXTERNA', 'SALIDA_ANTICIPADA'
    minutos_retraso INTEGER DEFAULT 0,
    justificada BOOLEAN DEFAULT FALSE,
    justificacion_motivo TEXT,
    aprobado_por_usuario_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SEEDERS INICIALES: JORNADA Y KARDEX DE PRUEBA 2026
INSERT INTO jornadas_institucionales (codigo, nombre, hora_entrada, hora_salida, tolerancia_minutos)
VALUES ('JORNADA_SCSPR_STD', 'Jornada Ordinaria SCSPR (8:00 a 16:30)', '08:00:00', '16:30:00', 15)
ON CONFLICT (codigo) DO NOTHING;

-- Acreditar saldo inicial de vacaciones 2026 a todas las personas registradas
INSERT INTO vacaciones_saldos (persona_id, periodo_anio, dias_derecho, dias_utilizados, dias_pendientes, fecha_acreditacion, fecha_vencimiento, estado)
SELECT 
    p.id, 
    2026, 
    CASE WHEN r.codigo IN ('029', '183', '189') THEN 0.00 ELSE 15.00 END AS dias_derecho,
    0.00 AS dias_utilizados,
    CASE WHEN r.codigo IN ('029', '183', '189') THEN 0.00 ELSE 15.00 END AS dias_pendientes,
    '2026-01-01'::DATE,
    '2027-12-31'::DATE,
    'VIGENTE'
FROM personas p
LEFT JOIN relaciones_laborales rl ON p.id = rl.persona_id AND rl.es_contrato_actual = TRUE
LEFT JOIN renglones_presupuestarios r ON rl.renglon_id = r.id
ON CONFLICT (persona_id, periodo_anio) DO NOTHING;
