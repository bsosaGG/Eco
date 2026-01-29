-- SCRIPT DE LIMPIEZA DE DATOS (NO ESTRUCTURA) - JURIDICA
-- Mantiene usuarios y permisos, pero elimina todos los datos de pruebas.
-- Ejecutar en: docker exec -i juridica_db_scspr_container psql -U usr_juridica_scspr -d db_juridica < scripts/clean_juridica_db.sql

-- sudo rm -rf uploads_scspr/juridica/*
-- # Borra todo lo que NO sea la carpeta 'plantillas' (avanzado)
-- find uploads_scspr/juridica -mindepth 1 -maxdepth 1 -not -name 'plantillas' -exec rm -rf {} +

BEGIN;

-- 1. Deshabilitar triggers temporalmente (opcional, pero seguro)
SET session_replication_role = 'replica';

-- 2. Limpiar tablas en orden de dependencia (o usar CASCADE)
-- Tablas hijas primero
TRUNCATE TABLE historial_procesal RESTART IDENTITY CASCADE;
TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE;

-- Tablas principales
TRUNCATE TABLE juicios RESTART IDENTITY CASCADE;
TRUNCATE TABLE actores_juridicos RESTART IDENTITY CASCADE;
TRUNCATE TABLE plantillas_docs RESTART IDENTITY CASCADE;

-- 3. Habilitar triggers de nuevo
SET session_replication_role = 'origin';

COMMIT;

-- Mensaje de confirmación en la salida
SELECT 'Limpieza de base de datos JURIDICA completada exitosamente. Estructura intacta.' as status;
