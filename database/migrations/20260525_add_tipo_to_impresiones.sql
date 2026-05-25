-- Migration: Add 'tipo' column to plantillas and registros_impresion
-- Date: 2026-05-25

ALTER TABLE plantillas ADD COLUMN tipo VARCHAR(50) DEFAULT 'impresion';
ALTER TABLE registros_impresion ADD COLUMN tipo VARCHAR(50) DEFAULT 'impresion';
