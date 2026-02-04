-- Migration: Add tipo_juicio column to juicios table
-- Date: 2026-01-30

ALTER TABLE juicios ADD COLUMN IF NOT EXISTS tipo_juicio VARCHAR(200);
ALTER TABLE juicios ADD COLUMN IF NOT EXISTS ultimo_renglon_presupuestario VARCHAR(200);

-- Make demandante_id nullable
ALTER TABLE juicios ALTER COLUMN demandante_id DROP NOT NULL;

UPDATE actores_juridicos SET tipo = 'Demandante / Parte Actora' WHERE tipo = 'Demandante';


-- 2026-02-03: New fields requested by Legal
ALTER TABLE juicios ADD COLUMN IF NOT EXISTS estado_actual_descripcion TEXT;
ALTER TABLE juicios ADD COLUMN IF NOT EXISTS interpuso_apelacion BOOLEAN DEFAULT FALSE;

ALTER TABLE juicios
ADD COLUMN amparo_organo_competente TEXT,
ADD COLUMN numero_amparo TEXT;
