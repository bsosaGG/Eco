INSERT INTO
    permisos (clave_permiso, descripcion)
VALUES
    ('transportes:read', 'Permite leer y crear solicitudes de transporte'),
    ('transportes:write', 'Permite actualizar solicitudes de transporte'),
    ('transportes:admin', 'Permite actualizar items del inventario');

-- 1. Insertar los Perfiles
INSERT INTO perfiles (nombre_perfil, descripcion) VALUES 
('Transportes Usuario', 'Perfil con permisos exclusivos de lectura y creación de solicitudes de transporte.'),
('Transportes Administrador', 'Perfil con permisos totales de escritura, actualización y administración de solicitudes de transporte.')
ON CONFLICT (nombre_perfil) DO NOTHING;

-- 2. Asociar Permisos al Perfil: Transportes Usuario (Solo 'transportes:read')
INSERT INTO perfil_permisos (id_perfil, id_permiso)
VALUES (
    (SELECT id_perfil FROM perfiles WHERE nombre_perfil = 'Transportes Usuario'),
    (SELECT id_permiso FROM permisos WHERE clave_permiso = 'transportes:read')
)
ON CONFLICT (id_perfil, id_permiso) DO NOTHING;

-- 3. Asociar Permisos al Perfil: Transportes Administrador ('transportes:write' y 'transportes:admin')
INSERT INTO perfil_permisos (id_perfil, id_permiso)
VALUES 
(
    (SELECT id_perfil FROM perfiles WHERE nombre_perfil = 'Transportes Administrador'),
    (SELECT id_permiso FROM permisos WHERE clave_permiso = 'transportes:write')
),
(
    (SELECT id_perfil FROM perfiles WHERE nombre_perfil = 'Transportes Administrador'),
    (SELECT id_permiso FROM permisos WHERE clave_permiso = 'transportes:admin')
)
ON CONFLICT (id_perfil, id_permiso) DO NOTHING;
