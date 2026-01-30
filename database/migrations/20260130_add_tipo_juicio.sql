-- Migration: Add tipo_juicio column to juicios table
-- Date: 2026-01-30

ALTER TABLE juicios ADD COLUMN IF NOT EXISTS tipo_juicio VARCHAR(200);

-- Make demandante_id nullable
ALTER TABLE juicios ALTER COLUMN demandante_id DROP NOT NULL;

UPDATE actores_juridicos SET tipo = 'Demandante / Parte Actora' WHERE tipo = 'Demandante';