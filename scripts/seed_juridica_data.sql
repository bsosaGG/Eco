-- SCRIPT DE GENERACIÓN DE DATOS DE PRUEBA - JURIDICA
-- Ejecutar en: docker exec -i juridica_db_scspr_container psql -U usr_juridica_scspr -d db_juridica < scripts/seed_juridica_data.sql

BEGIN;

-- 1. Generar Actores Jurídicos (50 actores para variar)
INSERT INTO actores_juridicos (nombre, identificacion, identificacion_tipo, tipo)
SELECT
    'Actor de Prueba ' || i,
    'DPI-' || (1000000000000 + i),
    CASE WHEN i % 3 = 0 THEN 'NIT' ELSE 'DPI' END,
    CASE WHEN i % 5 = 0 THEN 'Abogado' ELSE 'Demandante' END
FROM generate_series(1, 50) AS i;

-- 2. Generar Juicios (100 expedientes)
INSERT INTO juicios (
    correlativo,
    numero_proceso,
    organo_jurisdiccional,
    juez,
    oficial,
    demandante_id,
    estado_procesal,
    actitud_procesal,
    intento_conciliacion,
    observaciones,
    monto_estimado,
    efecto_sentencia_descripcion,
    origen_proceso,
    objeto_pretension,
    antecedentes_caso,
    fecha_creacion
)
SELECT
    'SCSP-2025-' || lpad(i::text, 4, '0'), -- SCSP-2025-0001
    'PROC-' || (2000 + i) || '-2025',
    'Juzgado ' || (1 + (i % 10)) || ' de Instancia Civil',
    'Juez Prueba ' || (1 + (i % 5)),
    'Oficial ' || (1 + (i % 5)),
    (SELECT id FROM actores_juridicos ORDER BY random() LIMIT 1), -- Demandante random
    CASE (i % 11)
        WHEN 0 THEN 'Demanda Ordinaria Laboral'
        WHEN 1 THEN 'Sentencia de Primera Instancia'
        WHEN 2 THEN 'Apelación'
        WHEN 3 THEN 'Sentencia de Segunda Instancia'
        WHEN 4 THEN 'Amparo'
        WHEN 5 THEN 'Auto de Liquidación'
        WHEN 6 THEN 'Acta de Requerimiento de Pago'
        WHEN 7 THEN 'Acta de Verificación de Requerimiento de Pago.'
        WHEN 8 THEN 'Resolución para realizar Gestiones de Pago'
        WHEN 9 THEN 'Pagado'
        ELSE 'Fenecido (Archivado)'
    END,
    'Actitud procesal simulada ' || i,
    (i % 2 = 0), -- true/false
    'Observación generada automáticamente para el caso ' || i,
    (random() * 100000)::decimal(12,2),
    'Impacto financiero estimado del caso ' || i,
    'Origen del proceso simulado...',
    'Objeto de la pretensión simulado...',
    'Antecedentes del caso generados...',
    NOW() - (random() * interval '365 days') -- Fecha random último año
FROM generate_series(1, 100) AS i;

-- 3. Generar Historial Procesal (~10 por juicio)
-- Usamos CROSS JOIN con generate_series(1, 10) para multiplicar
INSERT INTO historial_procesal (
    juicio_id,
    tipo_evento,
    sala_corte,
    fecha_interposicion,
    estado_recurso,
    descripcion,
    fecha_registro
)
SELECT
    j.id,
    CASE (floor(random() * 5))::int
        WHEN 0 THEN 'Notificación'
        WHEN 1 THEN 'Audiencia'
        WHEN 2 THEN 'Memorial'
        WHEN 3 THEN 'Resolución'
        ELSE 'Amparo'
    END,
    'Sala ' || floor(random() * 5 + 1),
    j.fecha_creacion + (h * interval '10 days'), -- Fechas progresivas
    'Resuelto',
    'Descripción del evento de historial ' || h || ' para el juicio ' || j.correlativo,
    j.fecha_creacion + (h * interval '10 days')
FROM juicios j
CROSS JOIN generate_series(1, 10) AS h;

-- 4. Generar Audit Logs (~10 por juicio)
INSERT INTO audit_logs (
    juicio_id,
    usuario_id,
    nombre_usuario,
    accion,
    fecha,
    detalles
)
SELECT
    j.id,
    1, -- Asumimos admin ID 1
    'Administrador SCSPR',
    CASE (floor(random() * 4))::int
        WHEN 0 THEN 'CREAR_JUICIO'
        WHEN 1 THEN 'ACTUALIZAR_ESTADO'
        WHEN 2 THEN 'SUBIR_ARCHIVO'
        ELSE 'MODIFICAR_MONTOS'
    END,
    j.fecha_creacion + (a * interval '5 days'),
    'Detalles de auditoría simulada ' || a
FROM juicios j
CROSS JOIN generate_series(1, 10) AS a;

COMMIT;

SELECT 'Datos de prueba generados exitosamente: 100 Juicios, ~1000 Historiales, ~1000 Logs.' as status;
