-- ============================================================================
-- MIGRACIÓN: Ampliación de Renglones Presupuestarios (Subgrupo 18) y Buzón Ético de Denuncias
-- Proyecto: Core Humanis SCSPR
-- Fecha: 2026-09-28
-- ============================================================================

-- 1. Ampliación de Renglones Presupuestarios (Subgrupo 18 y clasificador MinFin)
INSERT INTO renglones_presupuestarios (id, codigo, nombre, tipo, tiene_relacion_dependencia, requiere_fianza, requiere_colegiado_activo) VALUES
('33333333-3333-3333-3333-333333333307', '018', 'Servicios Técnicos y Profesionales (Subgrupo 18)', 'SERVICIOS_TECNICOS_PROFESIONALES', FALSE, TRUE, FALSE),
('33333333-3333-3333-3333-333333333308', '184', 'Servicios Económicos, Financieros y de Control', 'SERVICIOS_TECNICOS_PROFESIONALES', FALSE, TRUE, TRUE),
('33333333-3333-3333-3333-333333333309', '185', 'Servicios de Capacitación', 'SERVICIOS_TECNICOS_PROFESIONALES', FALSE, TRUE, FALSE),
('33333333-3333-3333-3333-333333333310', '186', 'Servicios de Informática y Sistemas Computarizados', 'SERVICIOS_TECNICOS_PROFESIONALES', FALSE, TRUE, FALSE),
('33333333-3333-3333-3333-333333333311', '187', 'Servicios por Actuaciones Artísticas y Deportivas', 'SERVICIOS_TECNICOS_PROFESIONALES', FALSE, FALSE, FALSE),
('33333333-3333-3333-3333-333333333312', '188', 'Servicios de Ingeniería, Arquitectura y Supervisión de Obras', 'SERVICIOS_TECNICOS_PROFESIONALES', FALSE, TRUE, TRUE)
ON CONFLICT (codigo) DO UPDATE 
SET nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    tiene_relacion_dependencia = EXCLUDED.tiene_relacion_dependencia,
    requiere_fianza = EXCLUDED.requiere_fianza,
    requiere_colegiado_activo = EXCLUDED.requiere_colegiado_activo;

-- 2. Tabla para Buzón de Denuncias Éticas y Laborales SCSPR
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

-- 3. Registro en auditoría
INSERT INTO auditoria_logs (id, usuario_id, accion, tabla_afectada, registro_id, detalles) VALUES
(gen_random_uuid(), '22222222-2222-2222-2222-222222222204', 'MIGRACION_SCHEMA', 'renglones_presupuestarios', '33333333-3333-3333-3333-333333333307', 'Ampliación de renglones Subgrupo 18 (018, 184-188) y creación de tabla denuncias_buzon');
