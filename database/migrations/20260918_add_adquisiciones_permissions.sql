INSERT INTO
    permisos (clave_permiso, descripcion)
VALUES
    ('adquisiciones:read', 'Ver la bandeja de expedientes y el detalle de un expediente'),
    ('adquisiciones:create', 'Crear y enviar una Solicitud de Compra'),
    ('adquisiciones:assign', 'Recibir la solicitud y asignarla a un Analista'),
    ('adquisiciones:manage-cotizaciones', 'Cargar, comparar y adjudicar cotizaciones de proveedores'),
    ('adquisiciones:elaborar-cdp', 'Elaborar el borrador del CDP'),
    ('adquisiciones:aprobar-cdp', 'Firmar la aprobación técnica del CDP'),
    ('adquisiciones:vobo-financiero', 'Vo.Bo. UDAF sobre CDP, Compromiso y Devengado'),
    ('adquisiciones:elaborar-oc', 'Elaborar la Orden de Compra'),
    ('adquisiciones:aprobar-oc', 'Firma de aprobación técnica de la Orden de Compra'),
    ('adquisiciones:autorizar-oc', 'Firma de autorización final y emisión de la Orden de Compra'),
    ('adquisiciones:confirmar-recepcion', 'Confirmar la compra y registrar la recepción del bien/servicio'),
    ('adquisiciones:conformar-pago', 'Integrar soportes y trasladar el expediente para pago'),
    ('adquisiciones:registrar-compromiso', 'Registrar el compromiso presupuestario'),
    ('adquisiciones:registrar-devengado', 'Registrar el devengado'),
    ('adquisiciones:solicitar-pago', 'Trasladar el expediente y archivarlo tras el pago'),
    ('adquisiciones:autorizar-pago', 'Solicitar formalmente el pago ante la instancia correspondiente'),
    ('adquisiciones:devolver', 'Registrar devolución/objeción y reingreso del expediente subsanado'),
    ('adquisiciones:audit', 'Ver la bitácora de trazabilidad inmutable del expediente'),
    ('adquisiciones:config', 'Administrar catálogos del módulo de Adquisiciones (proveedores, unidades, renglones, partidas)')
ON CONFLICT (clave_permiso) DO UPDATE
SET
    descripcion = EXCLUDED.descripcion;
