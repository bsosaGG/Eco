-- Perfiles (roles) del proceso de Adquisiciones (SICOMPRAS, Baja Cuantía),
-- según la matriz perfil -> permisos de claude/diseno-db-adquisiciones.md.
-- Requiere haber corrido antes 20260918_add_adquisiciones_permissions.sql
-- (los 19 permisos adquisiciones:* deben existir en la tabla permisos).
--
-- "Proveedor" no se siembra: es un actor externo sin cuenta en el sistema,
-- según el propio documento de casos de uso.

INSERT INTO perfiles (nombre_perfil, descripcion) VALUES
    ('Unidad Solicitante', 'Crea y envía Solicitudes de Compra (CU-01)'),
    ('Unidad de Adquisiciones', 'Recibe la solicitud y la asigna a un Analista (CU-01)'),
    ('Analista de Adquisiciones', 'Gestiona cotizaciones, elabora la Orden de Compra, confirma la recepción y conforma el pago (CU-02, CU-04, CU-05, CU-06)'),
    ('Asistente de Presupuesto', 'Elabora el borrador del Certificado de Disponibilidad Presupuestaria (CU-03)'),
    ('Encargado de Presupuesto', 'Aprueba el CDP y registra el compromiso presupuestario (CU-03, CU-07)'),
    ('Jefe UDAF', 'Vo.Bo. financiero de CDP, Compromiso y Devengado, y auditoría de trazabilidad (CU-03, CU-07, CU-08)'),
    ('Jefe de Adquisiciones', 'Aprobación técnica de la Orden de Compra (CU-04)'),
    ('Directora General', 'Autorización final y emisión de la Orden de Compra (CU-04)'),
    ('Encargado de Contabilidad', 'Registra el devengado y solicita el pago (CU-08, CU-09)'),
    ('Sub Despacho', 'Autoriza formalmente el pago (CU-09)'),
    ('Administrador de Sistema / TI', 'Administra los catálogos del módulo (proveedores, unidades, renglones, partidas)'),
    ('Auditoría Interna', 'Acceso de solo lectura a expedientes y bitácora de trazabilidad')
ON CONFLICT (nombre_perfil) DO NOTHING;

-- Asignación de permisos por perfil (perfil -> claves de permiso)
INSERT INTO perfil_permisos (id_perfil, id_permiso)
SELECT p.id_perfil, pm.id_permiso
FROM perfiles p
JOIN (VALUES
    ('Unidad Solicitante', ARRAY['adquisiciones:read', 'adquisiciones:create']),
    ('Unidad de Adquisiciones', ARRAY['adquisiciones:read', 'adquisiciones:assign']),
    ('Analista de Adquisiciones', ARRAY['adquisiciones:read', 'adquisiciones:manage-cotizaciones', 'adquisiciones:elaborar-oc', 'adquisiciones:confirmar-recepcion', 'adquisiciones:conformar-pago', 'adquisiciones:devolver']),
    ('Asistente de Presupuesto', ARRAY['adquisiciones:read', 'adquisiciones:elaborar-cdp']),
    ('Encargado de Presupuesto', ARRAY['adquisiciones:read', 'adquisiciones:aprobar-cdp', 'adquisiciones:registrar-compromiso', 'adquisiciones:devolver']),
    ('Jefe UDAF', ARRAY['adquisiciones:read', 'adquisiciones:vobo-financiero', 'adquisiciones:devolver', 'adquisiciones:audit']),
    ('Jefe de Adquisiciones', ARRAY['adquisiciones:read', 'adquisiciones:aprobar-oc', 'adquisiciones:devolver']),
    ('Directora General', ARRAY['adquisiciones:read', 'adquisiciones:autorizar-oc', 'adquisiciones:devolver']),
    ('Encargado de Contabilidad', ARRAY['adquisiciones:read', 'adquisiciones:registrar-devengado', 'adquisiciones:solicitar-pago']),
    ('Sub Despacho', ARRAY['adquisiciones:read', 'adquisiciones:autorizar-pago']),
    ('Administrador de Sistema / TI', ARRAY['adquisiciones:read', 'adquisiciones:config']),
    ('Auditoría Interna', ARRAY['adquisiciones:read', 'adquisiciones:audit'])
) AS v(nombre_perfil, permisos) ON v.nombre_perfil = p.nombre_perfil
JOIN permisos pm ON pm.clave_permiso = ANY(v.permisos)
ON CONFLICT DO NOTHING;
