-- Script to insert Impresiones module permissions and Profile
-- Run this in the users_db container:
-- docker exec -i global_users_db_container psql -U usr_global_users -d db_global_users < scripts/insert_impresiones_permissions.sql

-- 1. Insertar los permisos
INSERT INTO permisos (clave_permiso, descripcion)
VALUES
    ('impresiones:read', 'Acceso de lectura a plantillas y registros de impresión'),
    ('impresiones:create', 'Creación de nuevos registros de impresión'),
    ('impresiones:config', 'Gestión de plantillas de impresión')
ON CONFLICT (clave_permiso) DO NOTHING;

-- 2. Crear el nuevo perfil para los usuarios recién registrados
INSERT INTO perfiles (nombre_perfil, descripcion)
VALUES
    ('Usuario Impresiones', 'Perfil básico asignado automáticamente con permisos para crear impresiones')
ON CONFLICT (nombre_perfil) DO NOTHING;

-- 3. Enlazar el permiso 'impresiones:create' al perfil 'Usuario Impresiones'
DO $$
DECLARE
    id_p_impresiones INT;
    id_perm_create INT;
BEGIN
    SELECT id_perfil INTO id_p_impresiones FROM perfiles WHERE nombre_perfil = 'Usuario Impresiones';
    SELECT id_permiso INTO id_perm_create FROM permisos WHERE clave_permiso = 'impresiones:create';

    IF FOUND AND id_p_impresiones IS NOT NULL AND id_perm_create IS NOT NULL THEN
        INSERT INTO perfil_permisos (id_perfil, id_permiso)
        VALUES (id_p_impresiones, id_perm_create)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Opcional: Asignar todos los permisos de impresiones al admin (suponiendo id_usuario = 1)
-- INSERT INTO usuario_permisos (id_usuario, id_permiso)
-- SELECT 1, id_permiso FROM permisos WHERE clave_permiso LIKE 'impresiones:%'
-- ON CONFLICT DO NOTHING;