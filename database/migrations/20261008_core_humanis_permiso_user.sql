-- ============================================================================
-- MIGRACIÓN DE PERMISOS: CORE HUMANIS (INTEROPERABILIDAD)
-- Para ejecutar en db_global_users de denuncias-scsp
-- ============================================================================

INSERT INTO permisos (clave_permiso, descripcion)
VALUES
    ('core-humanis:user', 'Consulta básica de colaboradores por correo institucional para interoperabilidad')
ON CONFLICT (clave_permiso) DO NOTHING;
