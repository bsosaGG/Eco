-- =========================================================
-- init_adquisiciones.sql
-- Módulo: SICOMPRAS - Adquisiciones (Baja Cuantía)
-- Base de datos: db_adquisiciones_scspr / usr_adquisiciones_scspr
-- Basado en: Casos de uso - proceso de solicitud de compra.pdf (CU-01 a CU-09)
-- =========================================================

-- Limpiar tablas existentes en el orden correcto para evitar errores de FK
DROP TABLE IF EXISTS
    historial_estados,
    notificaciones,
    devoluciones_observaciones,
    bitacora_trazabilidad,
    solicitudes_pago,
    devengados,
    compromisos_presupuestarios,
    documentos_soporte,
    recepciones,
    ordenes_compra,
    cdp,
    cotizaciones,
    expediente_items,
    expedientes,
    usuarios_unidad_solicitante,
    estados_expediente,
    partidas_presupuestarias,
    renglones_presupuestarios,
    proveedores,
    unidades_solicitantes CASCADE;

-- === TABLAS DE CATÁLOGOS ===

CREATE TABLE IF NOT EXISTS unidades_solicitantes (
    id_unidad SERIAL PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE NOT NULL,
    codigo_unidad VARCHAR(10) UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- Asignaciones "usuario <-> unidad solicitante", para la segunda firma de la Solicitud
-- de Compra (FOR-DG-UA-00-01). Referencia lógica a db_global_users.usuarios (sin FK
-- real entre bases, mismo patrón que usuario_solicitante_id). Se puebla a mano con las
-- asignaciones reales que existan por unidad -- no trae datos de ejemplo.
CREATE TABLE IF NOT EXISTS usuarios_unidad_solicitante (
    id_asignacion         SERIAL PRIMARY KEY,
    id_usuario            INTEGER NOT NULL,
    id_unidad_solicitante INTEGER NOT NULL REFERENCES unidades_solicitantes (id_unidad),
    cargo                 VARCHAR(150),
    activo                BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (id_usuario, id_unidad_solicitante)
);

CREATE INDEX IF NOT EXISTS idx_usuarios_unidad_solicitante_unidad
    ON usuarios_unidad_solicitante (id_unidad_solicitante)
    WHERE activo = TRUE;

CREATE TABLE IF NOT EXISTS proveedores (
    id_proveedor SERIAL PRIMARY KEY,
    razon_social VARCHAR(255) NOT NULL,
    nit VARCHAR(20) UNIQUE NOT NULL,
    constancia_rtu_vigente BOOLEAN DEFAULT FALSE,
    email_contacto VARCHAR(255),
    telefono VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS renglones_presupuestarios (
    id_renglon SERIAL PRIMARY KEY,
    numero_renglon INT UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS partidas_presupuestarias (
    id_partida SERIAL PRIMARY KEY,
    ejercicio_fiscal INT NOT NULL,
    programa VARCHAR(10) NOT NULL,
    actividad VARCHAR(10) NOT NULL,
    id_renglon INT NOT NULL REFERENCES renglones_presupuestarios (id_renglon),
    fuente_financiamiento VARCHAR(100) NOT NULL,
    monto_asignado NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monto_disponible NUMERIC(14, 2) NOT NULL DEFAULT 0,
    UNIQUE (
        ejercicio_fiscal,
        programa,
        actividad,
        id_renglon,
        fuente_financiamiento
    )
);

-- Catálogo oficial de renglones de gasto para compras (Manual de Clasificaciones
-- Presupuestarias de Minfin): grupo 1 (Servicios no personales), grupo 2
-- (Materiales y suministros) y grupo 3 (Propiedad, planta, equipo e intangibles).
-- No incluye personal (grupo 0) ni transferencias/deuda (grupos 4-9), que no aplican
-- a una Solicitud de Compra.
INSERT INTO renglones_presupuestarios (numero_renglon, nombre) VALUES
    (111, 'Energía eléctrica'),
    (112, 'Agua'),
    (113, 'Telefonía'),
    (114, 'Correos y telégrafos'),
    (115, 'Extracción de basura y destrucción de desechos sólidos'),
    (116, 'Servicios de lavandería'),
    (121, 'Divulgación e Información'),
    (122, 'Impresión, encuadernación y reproducción'),
    (131, 'Viáticos en el exterior'),
    (132, 'Viáticos de representación en el exterior'),
    (133, 'Viáticos en el interior'),
    (134, 'Compensación por kilómetro recorrido'),
    (135, 'Otros viáticos y gastos conexos'),
    (136, 'Reconocimiento de gastos'),
    (141, 'Transporte de personas'),
    (142, 'Fletes'),
    (143, 'Almacenaje'),
    (151, 'Arrendamiento de edificios y locales'),
    (152, 'Arrendamiento de tierras y terrenos'),
    (153, 'Arrendamiento de máquinas y equipos de oficina'),
    (154, 'Arrendamiento de maquinaria y equipo de construcción'),
    (155, 'Arrendamiento de medios de transporte'),
    (156, 'Arrendamiento de otras máquinas y equipo'),
    (157, 'Arrendamiento de equipo de cómputo'),
    (158, 'Derechos de bienes intangibles'),
    (161, 'Mantenimiento y reparación de maquinaria y equipo de producción'),
    (162, 'Mantenimiento y reparación de mobiliario y equipo de oficina'),
    (163, 'Mantenimiento y reparación de equipo médico sanitario y de laboratorio'),
    (164, 'Mantenimiento y reparación de mobiliario y equipos educacionales y recreativos'),
    (165, 'Mantenimiento y reparación de medios de transporte'),
    (166, 'Mantenimiento y reparación de equipo para comunicaciones'),
    (167, 'Mantenimiento y reparación de maquinaria y equipo de construcción'),
    (168, 'Mantenimiento y reparación de equipo de cómputo'),
    (169, 'Mantenimiento y reparación de otras maquinarias y equipos'),
    (171, 'Mantenimiento y reparación de edificios'),
    (172, 'Mantenimiento y reparación de viviendas'),
    (173, 'Mantenimiento y reparación de bienes nacionales de uso común'),
    (174, 'Mantenimiento y reparación de instalaciones'),
    (176, 'Mantenimiento y reparación de otras obras e instalaciones'),
    (181, 'Estudios, investigaciones y proyectos de pre-factibilidad y factibilidad'),
    (182, 'Servicios médico-sanitarios'),
    (183, 'Servicios jurídicos'),
    (184, 'Servicios económicos, financieros, contables y de auditoría'),
    (185, 'Servicios de capacitación'),
    (186, 'Servicios de informática y sistemas computarizados'),
    (187, 'Servicios por actuaciones artísticas y deportivas'),
    (188, 'Servicios de ingeniería, arquitectura y supervisión de obras'),
    (189, 'Otros estudios y/o servicios'),
    (191, 'Primas y gastos de seguros y fianzas'),
    (192, 'Comisiones a receptores fiscales y recaudadores'),
    (193, 'Comisiones a colocadores de pólizas'),
    (194, 'Gastos bancarios, comisiones y otros gastos'),
    (195, 'Impuestos, derechos y tasas'),
    (196, 'Servicios de atención y protocolo'),
    (197, 'Servicios de vigilancia'),
    (198, 'Recompensas para seguridad civil'),
    (199, 'Otros servicios no personales'),
    (211, 'Alimentos para personas'),
    (212, 'Granos, forrajes, concentrados y alimentos destinados a consumo para animales'),
    (213, 'Productos animales'),
    (214, 'Productos agroforestales, madera, corcho y sus manufacturas'),
    (215, 'Productos agropecuarios para comercialización'),
    (219, 'Otros alimentos, productos agroforestales y agropecuarios'),
    (221, 'Carbón mineral'),
    (222, 'Minerales metálicos'),
    (223, 'Piedra, arcilla y arena'),
    (224, 'Pómez, cal y yeso'),
    (225, 'Minerales no metálicos'),
    (229, 'Otros minerales'),
    (231, 'Hilados y telas'),
    (232, 'Acabados textiles'),
    (233, 'Prendas de vestir'),
    (239, 'Otros textiles y vestuario'),
    (241, 'Papel de escritorio'),
    (242, 'Papeles comerciales, cartones y otros'),
    (243, 'Productos de papel o cartón'),
    (244, 'Productos de artes gráficas'),
    (245, 'Libros, revistas y periódicos'),
    (246, 'Textos de enseñanza'),
    (247, 'Especies timbradas y valores'),
    (248, 'Otros productos de papel, cartón e impresos'),
    (251, 'Cueros y pieles'),
    (252, 'Artículos de cuero'),
    (253, 'Llantas y neumáticos'),
    (254, 'Artículos de caucho'),
    (261, 'Elementos y compuestos químicos'),
    (262, 'Combustibles y lubricantes'),
    (263, 'Abonos y fertilizantes'),
    (264, 'Insecticidas, fumigantes y similares'),
    (265, 'Asfalto y similares'),
    (266, 'Productos medicinales y farmacéuticos'),
    (267, 'Tintes, pinturas y colorantes'),
    (268, 'Productos plásticos, nylon, vinil y P.V.C.'),
    (269, 'Otros productos químicos y conexos'),
    (271, 'Productos de arcilla'),
    (272, 'Productos de vidrio'),
    (273, 'Productos de loza y porcelana'),
    (274, 'Cemento'),
    (275, 'Productos de cemento, pómez, asbesto y yeso'),
    (279, 'Otros productos de minerales no metálicos'),
    (281, 'Productos siderúrgicos'),
    (282, 'Productos metalúrgicos no férricos'),
    (283, 'Productos de metal y sus aleaciones'),
    (284, 'Estructuras metálicas acabadas'),
    (285, 'Materiales y equipos diversos'),
    (286, 'Herramientas menores'),
    (289, 'Otros productos metálicos'),
    (291, 'Útiles de oficina'),
    (292, 'Productos sanitarios, de limpieza y de uso personal'),
    (293, 'Útiles educacionales y culturales'),
    (294, 'Útiles deportivos y recreativos'),
    (295, 'Útiles menores, suministros e instrumental médico-quirúrgicos, de laboratorio y cuidado de la salud'),
    (296, 'Útiles de cocina y comedor'),
    (297, 'Materiales, productos y accesorios eléctricos, cableado estructurado de redes informáticas y telefónicas'),
    (298, 'Accesorios y repuestos en general'),
    (299, 'Otros materiales y suministros'),
    (311, 'Tierras y terrenos'),
    (312, 'Edificios, estructuras e instalaciones'),
    (313, 'Otros bienes muebles preexistentes'),
    (315, 'Adquisición de bienes de uso común'),
    (321, 'Maquinaria y equipo de producción'),
    (322, 'Mobiliario y equipo de oficina'),
    (323, 'Mobiliario y equipo médico-sanitario y de laboratorio'),
    (324, 'Mobiliario y equipo educacional, cultural y recreativo'),
    (325, 'Equipo de transporte'),
    (326, 'Equipo para comunicaciones'),
    (327, 'Maquinaria y equipo para la construcción'),
    (328, 'Equipo de cómputo'),
    (329, 'Otras maquinarias y equipos'),
    (331, 'Construcciones de bienes nacionales de uso común'),
    (332, 'Construcciones de bienes nacionales de uso no común'),
    (341, 'Equipo de Seguridad y Protección'),
    (351, 'Libros, Revistas y Otros Elementos Coleccionables'),
    (361, 'Obras de arte'),
    (371, 'Animales'),
    (381, 'Activos intangibles')
ON CONFLICT (numero_renglon) DO UPDATE SET nombre = EXCLUDED.nombre;

CREATE TABLE IF NOT EXISTS estados_expediente (
    id_estado SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    etapa VARCHAR(50),
    color VARCHAR(30) DEFAULT 'secondary',
    es_final BOOLEAN DEFAULT FALSE
);

-- === TABLAS DE OPERACIÓN (proceso, CU-01 a CU-09) ===

CREATE TABLE IF NOT EXISTS expedientes (
    id_expediente SERIAL PRIMARY KEY,
    codigo_expediente VARCHAR(50) UNIQUE NOT NULL,
    id_unidad_solicitante INT NOT NULL REFERENCES unidades_solicitantes (id_unidad),
    usuario_solicitante_id INT NOT NULL, -- vive en db_global_users, sin FK real (otra BD)
    funcionario_responsable VARCHAR(200),
    funcionario_responsable_id INT, -- id_usuario (db_global_users) del analista/responsable asignado (CU-01 paso 2)
    objeto_compra VARCHAR(500) NOT NULL,
    justificacion TEXT NOT NULL,
    monto_estimado NUMERIC(14, 2),
    modalidad VARCHAR(50) DEFAULT 'Baja Cuantía',
    id_estado_actual INT NOT NULL REFERENCES estados_expediente (id_estado),
    documento_especificaciones_url TEXT,
    -- Campos del formulario real "SOLICITUD DE COMPRA" (FOR-DG-UA-00-01):
    codigo_formulario VARCHAR(30) NOT NULL DEFAULT 'FOR-DG-UA-00-01',
    tipo_compra VARCHAR(20) CHECK (tipo_compra IN ('Suministros', 'Equipo', 'Materiales', 'Servicios')),
    tiene_anexo BOOLEAN NOT NULL DEFAULT FALSE,
    anexo_caracteristicas_tecnicas TEXT,
    anexo_especificaciones_especiales TEXT,
    -- Firma 1 siempre es usuario_solicitante_id. Firma 2 varía por unidad (ver
    -- usuarios_unidad_solicitante) -- referencia lógica + "foto" del cargo al firmar.
    firma2_usuario_id INT,
    firma2_cargo VARCHAR(150),
    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_expedientes_estado ON expedientes (id_estado_actual);

CREATE INDEX IF NOT EXISTS idx_expedientes_unidad ON expedientes (id_unidad_solicitante);

CREATE TABLE IF NOT EXISTS expediente_items (
    id_item SERIAL PRIMARY KEY,
    id_expediente INT NOT NULL REFERENCES expedientes (id_expediente) ON DELETE CASCADE,
    descripcion VARCHAR(500) NOT NULL,
    cantidad NUMERIC(10, 2) NOT NULL,
    unidad_medida VARCHAR(50) NOT NULL,
    costo_unitario_estimado NUMERIC(14, 2) NOT NULL,
    codigo_insumo VARCHAR(30), -- viene del catálogo público MAGA/SIGES (texto libre)
    id_renglon INT REFERENCES renglones_presupuestarios (id_renglon),
    subtotal_estimado NUMERIC(14, 2) GENERATED ALWAYS AS (
        cantidad * costo_unitario_estimado
    ) STORED
);

CREATE TABLE IF NOT EXISTS cotizaciones (
    id_cotizacion SERIAL PRIMARY KEY,
    id_expediente INT NOT NULL REFERENCES expedientes (id_expediente) ON DELETE CASCADE,
    id_proveedor INT NOT NULL REFERENCES proveedores (id_proveedor),
    monto_ofertado NUMERIC(14, 2) NOT NULL,
    plazo_entrega_dias INT,
    garantia_meses INT,
    cumple_especificaciones BOOLEAN,
    archivo_pdf_url TEXT,
    es_adjudicada BOOLEAN DEFAULT FALSE,
    registrado_por_usuario_id INT NOT NULL,
    fecha_registro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cdp (
    id_cdp SERIAL PRIMARY KEY,
    id_expediente INT NOT NULL UNIQUE REFERENCES expedientes (id_expediente),
    id_partida INT NOT NULL REFERENCES partidas_presupuestarias (id_partida),
    numero_cdp VARCHAR(50) UNIQUE,
    monto_reservado NUMERIC(14, 2) NOT NULL,
    estado VARCHAR(30) DEFAULT 'Borrador',
    elaborado_por_usuario_id INT,
    fecha_elaboracion TIMESTAMPTZ,
    aprobado_presupuesto_usuario_id INT,
    fecha_aprobacion_presupuesto TIMESTAMPTZ,
    firma_hash_presupuesto VARCHAR(255),
    vobo_udaf_usuario_id INT,
    fecha_vobo_udaf TIMESTAMPTZ,
    firma_hash_udaf VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS ordenes_compra (
    id_orden_compra SERIAL PRIMARY KEY,
    id_expediente INT NOT NULL UNIQUE REFERENCES expedientes (id_expediente),
    id_cdp INT NOT NULL UNIQUE REFERENCES cdp (id_cdp),
    id_proveedor_adjudicado INT NOT NULL REFERENCES proveedores (id_proveedor),
    numero_oc VARCHAR(50) UNIQUE,
    monto_total NUMERIC(14, 2) NOT NULL,
    plazo_entrega VARCHAR(100),
    lugar_entrega VARCHAR(255),
    estado VARCHAR(30) DEFAULT 'Borrador',
    elaborado_por_usuario_id INT,
    aprobado_jefe_usuario_id INT,
    fecha_aprobacion_jefe TIMESTAMPTZ,
    firma_hash_jefe VARCHAR(255),
    autorizado_directora_usuario_id INT,
    fecha_autorizacion_directora TIMESTAMPTZ,
    firma_hash_directora VARCHAR(255),
    fecha_notificacion_proveedor TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS recepciones (
    id_recepcion SERIAL PRIMARY KEY,
    id_orden_compra INT NOT NULL UNIQUE REFERENCES ordenes_compra (id_orden_compra),
    fecha_hora_recepcion TIMESTAMPTZ,
    recibido_conforme BOOLEAN,
    dictamen_fisico VARCHAR(255),
    tecnico_receptor_usuario_id INT,
    custodio_almacen_usuario_id INT,
    observaciones TEXT
);

CREATE TABLE IF NOT EXISTS documentos_soporte (
    id_documento SERIAL PRIMARY KEY,
    id_expediente INT NOT NULL REFERENCES expedientes (id_expediente) ON DELETE CASCADE,
    tipo_documento VARCHAR(50) NOT NULL CHECK (
        tipo_documento IN (
            'FACTURA',
            'HOJA_1H_INGRESO',
            'EGRESO_ALMACEN',
            'CERTIFICADO_SATISFACCION',
            'OTRO'
        )
    ),
    numero_documento VARCHAR(100),
    archivo_url TEXT NOT NULL,
    fecha_documento DATE,
    subido_por_usuario_id INT,
    fecha_carga TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS compromisos_presupuestarios (
    id_compromiso SERIAL PRIMARY KEY,
    id_expediente INT NOT NULL UNIQUE REFERENCES expedientes (id_expediente),
    numero_comp VARCHAR(50) UNIQUE,
    monto_comprometido NUMERIC(14, 2) NOT NULL,
    registrado_por_usuario_id INT,
    fecha_registro TIMESTAMPTZ,
    aprobado_udaf_usuario_id INT,
    fecha_aprobacion TIMESTAMPTZ,
    firma_hash_udaf VARCHAR(255),
    estado VARCHAR(30) DEFAULT 'Registrado'
);

CREATE TABLE IF NOT EXISTS devengados (
    id_devengado SERIAL PRIMARY KEY,
    id_compromiso INT NOT NULL UNIQUE REFERENCES compromisos_presupuestarios (id_compromiso),
    numero_dev VARCHAR(50) UNIQUE,
    monto_devengado NUMERIC(14, 2) NOT NULL,
    retencion_isr NUMERIC(14, 2) DEFAULT 0,
    registrado_por_usuario_id INT,
    fecha_registro TIMESTAMPTZ,
    aprobado_udaf_usuario_id INT,
    fecha_aprobacion TIMESTAMPTZ,
    firma_hash_udaf VARCHAR(255),
    estado VARCHAR(30) DEFAULT 'Registrado'
);

CREATE TABLE IF NOT EXISTS solicitudes_pago (
    id_solicitud_pago SERIAL PRIMARY KEY,
    id_devengado INT NOT NULL UNIQUE REFERENCES devengados (id_devengado),
    entidad_bancaria VARCHAR(100),
    tipo_cuenta VARCHAR(30),
    numero_cuenta VARCHAR(50),
    numero_transferencia_cheque VARCHAR(50),
    solicitado_por_usuario_id INT,
    fecha_solicitud TIMESTAMPTZ,
    tramitado_por_usuario_id INT,
    fecha_tramite TIMESTAMPTZ,
    estado VARCHAR(30) DEFAULT 'Pendiente',
    fecha_archivo TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS bitacora_trazabilidad (
    id_bitacora BIGSERIAL PRIMARY KEY,
    id_expediente INT NOT NULL REFERENCES expedientes (id_expediente) ON DELETE CASCADE,
    usuario_id INT NOT NULL,
    accion VARCHAR(150) NOT NULL,
    entidad_relacionada VARCHAR(50),
    observacion TEXT,
    hash_integridad VARCHAR(255),
    ip_origen VARCHAR(45),
    fecha_hora TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bitacora_expediente ON bitacora_trazabilidad (id_expediente);

-- Tiempo en cada estado: una fila por cada entrada a un estado (misma definición que
-- migrations/20261006_adquisiciones_historial_estados.sql, que es la que se corre en producción).
CREATE TABLE IF NOT EXISTS historial_estados (
    id_historial SERIAL PRIMARY KEY,
    id_expediente INT NOT NULL REFERENCES expedientes (id_expediente) ON DELETE CASCADE,
    id_estado INT NOT NULL REFERENCES estados_expediente (id_estado),
    fecha_entrada TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historial_estados_expediente
    ON historial_estados (id_expediente, fecha_entrada);

CREATE OR REPLACE FUNCTION registrar_historial_estado() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' OR NEW.id_estado_actual IS DISTINCT FROM OLD.id_estado_actual THEN
        INSERT INTO historial_estados (id_expediente, id_estado)
        VALUES (NEW.id_expediente, NEW.id_estado_actual);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_expedientes_historial_estado ON expedientes;
CREATE TRIGGER trg_expedientes_historial_estado
    AFTER INSERT OR UPDATE OF id_estado_actual ON expedientes
    FOR EACH ROW EXECUTE PROCEDURE registrar_historial_estado();

-- Avisos al solicitante y a la persona asignada (misma definición que
-- migrations/20261005_adquisiciones_notificaciones.sql, que es la que se corre en producción).
CREATE TABLE IF NOT EXISTS notificaciones (
    id_notificacion SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_expediente INT REFERENCES expedientes (id_expediente) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('cambio_etapa', 'asignacion', 'devolucion')),
    titulo VARCHAR(250) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_lectura TIMESTAMPTZ,
    correo_estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario
    ON notificaciones (id_usuario, leida, fecha_creacion DESC);

CREATE TABLE IF NOT EXISTS devoluciones_observaciones (
    id_devolucion SERIAL PRIMARY KEY,
    id_expediente INT NOT NULL REFERENCES expedientes (id_expediente) ON DELETE CASCADE,
    etapa_origen VARCHAR(50) NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    usuario_revisor_id INT,
    fecha_devolucion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    plazo_subsanacion_dias INT,
    fecha_limite TIMESTAMPTZ,
    estado VARCHAR(30) DEFAULT 'Pendiente',
    fecha_subsanacion TIMESTAMPTZ
);

-- === DATOS INICIALES (catálogos mínimos para poder trabajar en local) ===

-- Las 16 unidades solicitantes oficiales (nomenclatura real de la SCSPR). Antes se
-- seedeaban 4 unidades de prueba (UCP-04, DRH, SUB-ADM, DIR-MTTO) -- se reemplazan
-- directamente aquí porque el módulo se reinició desde cero.
INSERT INTO
    unidades_solicitantes (nombre, codigo_unidad)
VALUES
    ('Dirección de Producción y Logística',          'DPL'),
    ('Unidad de Logística',                          'UL'),
    ('Unidad de Televisión',                         'UT'),
    ('Unidad de Medios',                             'UM'),
    ('Dirección de Información y Prensa',            'DIP'),
    ('Dirección de Relaciones Interinstitucionales', 'DRI'),
    ('Dirección General',                            'DG'),
    ('Despacho Superior',                            'DS'),
    ('Unidad de Recursos Humanos',                   'URH'),
    ('Unidad de Administración Financiera',          'UDAF'),
    ('Unidad de Adquisiciones',                      'UA'),
    ('Asesoría Jurídica',                            'AJ'),
    ('Unidad de Servicios Generales',                'USG'),
    ('Unidad de Planificación',                      'UP'),
    ('Unidad de Auditoría Interna',                  'UDAI'),
    ('Unidad de Informática',                        'UI')
ON CONFLICT (codigo_unidad) DO NOTHING;


INSERT INTO
    partidas_presupuestarias (
        ejercicio_fiscal,
        programa,
        actividad,
        id_renglon,
        fuente_financiamiento,
        monto_asignado,
        monto_disponible
    )
VALUES
    (
        2026,
        '11',
        '001',
        (
            SELECT id_renglon
            FROM renglones_presupuestarios
            WHERE
                numero_renglon = 324
        ),
        '11 - Ingresos Corrientes',
        150000.00,
        150000.00
    ) ON CONFLICT (ejercicio_fiscal, programa, actividad, id_renglon, fuente_financiamiento) DO NOTHING;

INSERT INTO
    estados_expediente (nombre, etapa, color, es_final)
VALUES
    (
        'Recibida por Adquisiciones',
        'Solicitud',
        'secondary',
        FALSE
    ),
    (
        'Pendiente Cotización',
        'Cotizacion',
        'primary',
        FALSE
    ),
    ('En firma CDP', 'CDP', 'warning', FALSE),
    (
        'Revisión Jurídica',
        'CDP',
        'warning',
        FALSE
    ),
    (
        'Aprobación Jefatura',
        'OrdenCompra',
        'primary',
        FALSE
    ),
    (
        'Pendiente Autorización Final',
        'OrdenCompra',
        'primary',
        FALSE
    ),
    (
        'Expediente en Conformación',
        'Recepcion',
        'info',
        FALSE
    ),
    (
        'Fase Financiera / Liquidación',
        'Financiero',
        'info',
        FALSE
    ),
    (
        'Devuelto con Observaciones',
        'Devolucion',
        'danger',
        FALSE
    ),
    (
        'Pagado y Archivado',
        'Cierre',
        'success',
        TRUE
    ),
    (
        'Cancelado / Desierto',
        'Cierre',
        'dark',
        TRUE
    ) ON CONFLICT (nombre) DO NOTHING;

-- SELECT 'Script de inicialización de db_adquisiciones_scspr completado.';
