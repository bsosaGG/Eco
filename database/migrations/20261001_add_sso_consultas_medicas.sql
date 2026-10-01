-- Migration: Add sso_consultas_medicas table for Core Humanis / SSO
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
