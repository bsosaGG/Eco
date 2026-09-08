INSERT INTO
    permisos (clave_permiso, descripcion)
VALUES
    ('plan-medios:read', 'Permite consultar las campañas y solicitudes de plan de medios'),
    ('plan-medios:create', 'Permite crear solicitudes de plan de medios'),
    ('plan-medios:update', 'Permite modificar solicitudes de plan de medios'),
    ('plan-medios:export', 'Permite exportar solicitudes de plan de medios')
ON CONFLICT (clave_permiso) DO UPDATE
SET
    descripcion = EXCLUDED.descripcion;
