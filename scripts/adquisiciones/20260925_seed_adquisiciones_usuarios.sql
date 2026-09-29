-- Usuarios de prueba para el módulo de Adquisiciones (SICOMPRAS, Baja Cuantía):
-- uno por cada perfil/etapa del proceso + un superadministrador que lo puede todo.
--
-- Requiere haber corrido ANTES (en este orden):
--   1. database/migrations/20260918_add_adquisiciones_permissions.sql (los 19 permisos)
--   2. database/migrations/20260918_add_adquisiciones_perfiles.sql   (los 12 perfiles + perfil_permisos)
--
-- Vive en db_global_users (usuarios/perfiles/permisos son compartidos por toda la plataforma,
-- no son tablas del módulo de adquisiciones). Ejecutar contra el mismo contenedor donde ya
-- corriste las dos migraciones anteriores, p.ej.:
--   docker exec -i db_master_container psql -U usr_global_users -d db_global_users \
--     < database/migrations/20260925_seed_adquisiciones_usuarios.sql
--
-- Contraseñas de prueba (bcrypt, cost 10 — mismo esquema que usa api/src/services/auth.service.js):
--   - Los 12 usuarios de rol/etapa comparten la contraseña: Adquisiciones2026!
--   - El superadministrador usa:                             SuperAdmin2026!
-- Son credenciales de prueba para levantar el módulo con el cliente — cámbialas (o fuerza un
-- reseteo) antes de ir a producción real. correo_validado y activo quedan en TRUE para que el
-- login funcione de inmediato (loginUser en auth.service.js exige ambos en TRUE).

BEGIN;

-- 1) Un usuario por perfil (mismo nombre_completo que el perfil, para que quede claro en el
--    selector de Usuarios/Perfiles de admin-panel qué cuenta corresponde a qué etapa).
INSERT INTO usuarios (email, password_hash, nombre_completo, rol, activo, correo_validado)
VALUES
    ('solicitante.adquisiciones@scspr.gob.gt',   '$2b$10$dCJ.74pKygsn5cX1DKPybe5Oxb83Zw4wCNs5fXR1yameKV2tSRwVa', 'Prueba - Unidad Solicitante',            'usuario', TRUE, TRUE),
    ('recepcion.adquisiciones@scspr.gob.gt',     '$2b$10$dCJ.74pKygsn5cX1DKPybe5Oxb83Zw4wCNs5fXR1yameKV2tSRwVa', 'Prueba - Unidad de Adquisiciones',       'usuario', TRUE, TRUE),
    ('analista.adquisiciones@scspr.gob.gt',      '$2b$10$dCJ.74pKygsn5cX1DKPybe5Oxb83Zw4wCNs5fXR1yameKV2tSRwVa', 'Prueba - Analista de Adquisiciones',     'usuario', TRUE, TRUE),
    ('asistente.presupuesto@scspr.gob.gt',       '$2b$10$dCJ.74pKygsn5cX1DKPybe5Oxb83Zw4wCNs5fXR1yameKV2tSRwVa', 'Prueba - Asistente de Presupuesto',      'usuario', TRUE, TRUE),
    ('encargado.presupuesto@scspr.gob.gt',       '$2b$10$dCJ.74pKygsn5cX1DKPybe5Oxb83Zw4wCNs5fXR1yameKV2tSRwVa', 'Prueba - Encargado de Presupuesto',      'usuario', TRUE, TRUE),
    ('jefe.udaf@scspr.gob.gt',                   '$2b$10$dCJ.74pKygsn5cX1DKPybe5Oxb83Zw4wCNs5fXR1yameKV2tSRwVa', 'Prueba - Jefe UDAF',                     'usuario', TRUE, TRUE),
    ('jefe.adquisiciones@scspr.gob.gt',          '$2b$10$dCJ.74pKygsn5cX1DKPybe5Oxb83Zw4wCNs5fXR1yameKV2tSRwVa', 'Prueba - Jefe de Adquisiciones',         'usuario', TRUE, TRUE),
    ('directora.general@scspr.gob.gt',           '$2b$10$dCJ.74pKygsn5cX1DKPybe5Oxb83Zw4wCNs5fXR1yameKV2tSRwVa', 'Prueba - Directora General',             'usuario', TRUE, TRUE),
    ('contabilidad.adquisiciones@scspr.gob.gt',  '$2b$10$dCJ.74pKygsn5cX1DKPybe5Oxb83Zw4wCNs5fXR1yameKV2tSRwVa', 'Prueba - Encargado de Contabilidad',     'usuario', TRUE, TRUE),
    ('subdespacho.adquisiciones@scspr.gob.gt',   '$2b$10$dCJ.74pKygsn5cX1DKPybe5Oxb83Zw4wCNs5fXR1yameKV2tSRwVa', 'Prueba - Sub Despacho',                  'usuario', TRUE, TRUE),
    ('admin.ti.adquisiciones@scspr.gob.gt',      '$2b$10$dCJ.74pKygsn5cX1DKPybe5Oxb83Zw4wCNs5fXR1yameKV2tSRwVa', 'Prueba - Administrador de Sistema / TI', 'usuario', TRUE, TRUE),
    ('auditoria.adquisiciones@scspr.gob.gt',     '$2b$10$dCJ.74pKygsn5cX1DKPybe5Oxb83Zw4wCNs5fXR1yameKV2tSRwVa', 'Prueba - Auditoría Interna',             'usuario', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- 2) Superadministrador de pruebas para Adquisiciones. rol = 'admin' tiene bypass automático
--    en checkPermission (backend) y en los getters hasAny*Permission (frontend) — igual que el
--    admin global existente (hgatica@scspr.gob.gt) — así que NO necesita fila en usuario_perfiles:
--    ya puede hacer todo el proceso de punta a punta (los 23 pasos / 9 CU) sin que se le asigne
--    ningún perfil de la matriz.
INSERT INTO usuarios (email, password_hash, nombre_completo, rol, activo, correo_validado)
VALUES
    ('superadmin.adquisiciones@scspr.gob.gt', '$2b$10$P07CNo0pmzQIYxGHNhETpeG7yFbo1QbysRZB/nd5vzGd4ygZZE8uK', 'Superadministrador (Adquisiciones)', 'admin', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- 3) Asignar a cada usuario de rol/etapa su perfil correspondiente (usuario_perfiles es N:N,
--    igual que el resto de la plataforma). Un solo perfil por usuario aquí porque cada cuenta
--    de prueba representa exactamente una etapa del proceso.
INSERT INTO usuario_perfiles (id_usuario, id_perfil)
SELECT u.id_usuario, p.id_perfil
FROM (VALUES
    ('solicitante.adquisiciones@scspr.gob.gt',  'Unidad Solicitante'),
    ('recepcion.adquisiciones@scspr.gob.gt',    'Unidad de Adquisiciones'),
    ('analista.adquisiciones@scspr.gob.gt',     'Analista de Adquisiciones'),
    ('asistente.presupuesto@scspr.gob.gt',      'Asistente de Presupuesto'),
    ('encargado.presupuesto@scspr.gob.gt',      'Encargado de Presupuesto'),
    ('jefe.udaf@scspr.gob.gt',                  'Jefe UDAF'),
    ('jefe.adquisiciones@scspr.gob.gt',         'Jefe de Adquisiciones'),
    ('directora.general@scspr.gob.gt',          'Directora General'),
    ('contabilidad.adquisiciones@scspr.gob.gt', 'Encargado de Contabilidad'),
    ('subdespacho.adquisiciones@scspr.gob.gt',  'Sub Despacho'),
    ('admin.ti.adquisiciones@scspr.gob.gt',     'Administrador de Sistema / TI'),
    ('auditoria.adquisiciones@scspr.gob.gt',    'Auditoría Interna')
) AS v(email, nombre_perfil)
JOIN usuarios u ON u.email = v.email
JOIN perfiles p ON p.nombre_perfil = v.nombre_perfil
ON CONFLICT (id_usuario, id_perfil) DO NOTHING;

COMMIT;

SELECT 'Seed de usuarios de Adquisiciones completado: 12 cuentas de etapa + 1 superadmin.' AS status;
