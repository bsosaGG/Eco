-- ============================================================================
-- MIGRACIÓN DE PERMISOS: CORE HUMANIS
-- Para ejecutar en db_global_users de denuncias-scsp
-- ============================================================================

INSERT INTO permisos (clave_permiso, descripcion)
VALUES
    ('core-humanis:read', 'Ver información general y expedientes de Recursos Humanos (Core Humanis)'),
    ('core-humanis:write', 'Crear y editar expedientes de colaboradores y relaciones laborales'),
    ('core-humanis:constancias', 'Emitir y firmar constancias laborales y de servicios'),
    ('core-humanis:admin', 'Administración completa, catálogos y auditoría de Core Humanis')
ON CONFLICT (clave_permiso) DO NOTHING;
