-- ============================================================================
-- MIGRACIÓN OLA 3: NÓMINA, ACCIONES DE PERSONAL Y RÉGIMEN DISCIPLINARIO
-- Core Humanis (SCSPR) - Septiembre 2026
-- ============================================================================

-- 1. TABLA DE CONCEPTOS SALARIALES Y DE NÓMINA
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

-- 2. CABECERA DE NÓMINAS
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

-- 3. DETALLE POR COLABORADOR EN NÓMINA
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

-- 4. DESGLOSE DE CONCEPTOS APLICADOS POR COLABORADOR
CREATE TABLE IF NOT EXISTS nominas_conceptos_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomina_detalle_id UUID NOT NULL REFERENCES nominas_detalles(id) ON DELETE CASCADE,
    concepto_id UUID NOT NULL REFERENCES conceptos_salariales(id),
    monto NUMERIC(12,2) NOT NULL,
    observacion VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ACCIONES DE PERSONAL INSTITUCIONALES
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

-- 6. EXPEDIENTES DISCIPLINARIOS
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

-- 7. AUDIENCIAS DE DESCARGO (DERECHO DE DEFENSA ART. 12 CPRG)
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

-- SEEDERS INICIALES DE CONCEPTOS SALARIALES GUATEMALTECOS
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

-- ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_nominas_periodo ON nominas_cabecera(periodo_anio, periodo_mes, renglon_presupuestario);
CREATE INDEX IF NOT EXISTS idx_nominas_detalles_persona ON nominas_detalles(persona_id);
CREATE INDEX IF NOT EXISTS idx_acciones_personal_persona ON acciones_personal(persona_id);
CREATE INDEX IF NOT EXISTS idx_disciplinario_persona ON expedientes_disciplinarios(persona_id);
