-- =========================================================
-- init_adquisiciones.sql
-- Módulo: SICOMPRAS - Adquisiciones (Baja Cuantía)
-- Base de datos: db_adquisiciones_scspr / usr_adquisiciones_scspr
-- Basado en: Casos de uso - proceso de solicitud de compra.pdf (CU-01 a CU-09)
-- =========================================================

-- Limpiar tablas existentes en el orden correcto para evitar errores de FK
DROP TABLE IF EXISTS
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
    objeto_compra VARCHAR(500) NOT NULL,
    justificacion TEXT NOT NULL,
    monto_estimado NUMERIC(14, 2),
    modalidad VARCHAR(50) DEFAULT 'Baja Cuantía',
    id_estado_actual INT NOT NULL REFERENCES estados_expediente (id_estado),
    documento_especificaciones_url TEXT,
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

INSERT INTO
    unidades_solicitantes (nombre, codigo_unidad)
VALUES
    ('Unidad de Informática y Telecomunicaciones', 'UCP-04'),
    ('Dirección de Recursos Humanos', 'DRH'),
    ('Subdirección Administrativa', 'SUB-ADM'),
    ('Dirección de Mantenimiento', 'DIR-MTTO') ON CONFLICT (codigo_unidad) DO NOTHING;

INSERT INTO
    renglones_presupuestarios (numero_renglon, nombre)
VALUES
    (111, 'Personal permanente'),
    (
        324,
        'Mantenimiento y reparación de equipo de cómputo'
    ),
    (
        261,
        'Elementos y compuestos químicos (papelería y útiles)'
    ) ON CONFLICT (numero_renglon) DO NOTHING;

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
