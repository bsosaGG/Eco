-- Migration: Change actitud_procesal and estado_actual_descripcion to TEXT
-- Date: 2026-02-10

ALTER TABLE juicios 
    ALTER COLUMN actitud_procesal TYPE TEXT,
    ALTER COLUMN estado_actual_descripcion TYPE TEXT;
