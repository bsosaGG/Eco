-- Script to insert Juridica module permissions
-- Run this in the users_db container:
-- docker exec -i global_users_db_container psql -U usr_global_users -d db_global_users < scripts/insert_juridica_permissions.sql

INSERT INTO permisos (clave_permiso, descripcion)
VALUES
    ('juridica:read', 'Acceso de lectura a juicios y expedientes (CU-05)'),
    ('juridica:create', 'Creación de nuevos juicios (CU-01)'),
    ('juridica:update-case', 'Actualización de casos, historial y adjuntos (CU-03)'),
    ('juridica:manage-financials', 'Edición de montos y observaciones críticas (CU-04)'),
    ('juridica:audit', 'Visualización de logs de auditoría (CU-06)'),
    ('juridica:generate-doc', 'Generación y descarga de documentos DOCX (CU-05)'),
    ('juridica:config', 'Gestión de plantillas y configuraciones')
ON CONFLICT (clave_permiso) DO NOTHING;

-- Optional: Assign to admin user if needed (Assuming id_usuario 1 is admin)
-- INSERT INTO usuario_permisos (id_usuario, id_permiso)
-- SELECT 1, id_permiso FROM permisos WHERE clave_permiso LIKE 'juridica:%'
-- ON CONFLICT DO NOTHING;
