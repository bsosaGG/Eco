-- =============================================================================
-- MIGRACIÓN DE BASE DE DATOS: OLA 2 - ASISTENCIA BIOMÉTRICA Y MARCAS (SCSPR)
-- Archivo: database/migrations/20260918_ola2_asistencia_biometrica.sql
-- =============================================================================

-- Tabla de registro inmutable de marcajes de reloj biométrico / digital
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

-- Insertar marcajes biométricos de prueba para el colaborador Karina García Méndez (id: 510523ce-a019-51d3-b8c9-c6b5b1696471)
INSERT INTO asistencia_marcas (persona_id, fecha_hora, tipo_marca, origen)
VALUES 
    ('510523ce-a019-51d3-b8c9-c6b5b1696471', CURRENT_DATE + TIME '07:55:00', 'ENTRADA', 'BIOMETRICO'),
    ('510523ce-a019-51d3-b8c9-c6b5b1696471', CURRENT_DATE + TIME '16:32:00', 'SALIDA', 'BIOMETRICO')
ON CONFLICT DO NOTHING;
