-- SCRIPT DE GENERACIÓN DE DATOS DE PRUEBA - IMPRESIONES
-- Ejecutar en: docker exec -i impresiones_db_scspr_container psql -U usr_impresiones_scspr -d db_impresiones < scripts/seed_impresiones_data.sql

BEGIN;

-- 1. Insertar una plantilla de prueba
INSERT INTO plantillas (nombre, codigo, ruta_archivo, campos_requeridos, activo)
VALUES (
    'Memorando Oficial',
    'MEMO',
    'uploads/impresiones/plantillas/plantilla_demo.xlsx',
    '["enviado_por", "unidad_remitente", "destinatario", "unidad_destinatario", "descripcion"]',
    TRUE
) ON CONFLICT (codigo) DO NOTHING;

-- 2. Generar Registros de Impresión (50 documentos)
INSERT INTO registros_impresion (
    id_plantilla,
    anio,
    secuencia,
    correlativo,
    id_usuario_creador,
    datos_formulario,
    fecha_creacion,
    recibido,
    fecha_recibido,
    nombre_recibe
)
SELECT
    (SELECT id FROM plantillas WHERE codigo = 'MEMO' LIMIT 1),
    2025,
    i,
    'DOC-MEMO-' || lpad(i::text, 4, '0'),
    1, -- Asumimos usuario 1
    jsonb_build_object(
        'enviado_por', 'Usuario Remitente ' || i,
        'unidad_remitente', 'Dirección ' || (1 + (i % 5)),
        'destinatario', 'Usuario Destinatario ' || i,
        'unidad_destinatario', 'Departamento ' || (1 + (i % 3)),
        'descripcion', 'Descripción detallada del oficio generado número ' || i || ' para propósitos de prueba.'
    ),
    NOW() - (random() * interval '60 days'), -- Fecha random últimos 2 meses
    (i % 3 = 0), -- 1 de cada 3 marcado como recibido
    CASE WHEN (i % 3 = 0) THEN NOW() - (random() * interval '10 days') ELSE NULL END,
    CASE WHEN (i % 3 = 0) THEN 'Receptor de Prueba ' || i ELSE NULL END
FROM generate_series(1, 100) AS i
ON CONFLICT DO NOTHING;

COMMIT;

SELECT 'Datos de prueba generados exitosamente: 1 Plantilla, 100 Documentos.' as status;
