-- Limpiar tablas existentes en el orden correcto para evitar errores de FK
DROP TABLE IF EXISTS pac_historial_estados,
pac_correlativos,
pac_solicitudes,
pac_unidades_solicitantes,
pac_modalidades_compra,
pac_renglones,
pac_estados CASCADE;

-- === TABLAS DE CATÁLOGOS ===
CREATE TABLE
    IF NOT EXISTS pac_unidades_solicitantes (
        id_unidad SERIAL PRIMARY KEY,
        nombre VARCHAR(255) UNIQUE NOT NULL,
        codigo_unidad VARCHAR(10) UNIQUE NOT NULL,
        activo BOOLEAN DEFAULT TRUE
    );

CREATE TABLE
    IF NOT EXISTS pac_modalidades_compra (
        id_modalidad SERIAL PRIMARY KEY,
        nombre VARCHAR(255) UNIQUE NOT NULL,
        activo BOOLEAN DEFAULT TRUE
    );

CREATE TABLE
    IF NOT EXISTS pac_renglones (
        id_renglon SERIAL PRIMARY KEY,
        numero_renglon INT UNIQUE NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        activo BOOLEAN DEFAULT TRUE
    );

-- *** TABLA DE ESTADOS MODIFICADA ***
CREATE TABLE
    IF NOT EXISTS pac_estados (
        id_estado SERIAL PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL,
        color VARCHAR(50) DEFAULT 'secondary', -- Color para la UI (ej. 'primary', 'success', 'danger')
        es_inicial BOOLEAN DEFAULT FALSE NOT NULL -- Identifica el estado por defecto para nuevas solicitudes
    );

-- === TABLAS DE OPERACIÓN ===
CREATE TABLE
    IF NOT EXISTS pac_correlativos (
        id_correlativo SERIAL PRIMARY KEY,
        id_unidad INT NOT NULL REFERENCES pac_unidades_solicitantes (id_unidad),
        anio INT NOT NULL,
        ultimo_numero INT NOT NULL DEFAULT 0,
        UNIQUE (id_unidad, anio)
    );

CREATE TABLE
    IF NOT EXISTS pac_solicitudes (
        id_solicitud SERIAL PRIMARY KEY,
        codigo_solicitud VARCHAR(50) UNIQUE NOT NULL,
        id_unidad_solicitante INT NOT NULL REFERENCES pac_unidades_solicitantes (id_unidad),
        id_modalidad_compra INT NOT NULL REFERENCES pac_modalidades_compra (id_modalidad),
        id_renglon INT NOT NULL REFERENCES pac_renglones (id_renglon),
        id_estado INT NOT NULL REFERENCES pac_estados (id_estado),
        descripcion TEXT NOT NULL,
        unidad_medida VARCHAR(100) NOT NULL,
        es_baja_cuantia BOOLEAN DEFAULT FALSE,
        responsable_usuario_id INT NOT NULL,
        fecha_creacion TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TIMESTAMP
        WITH
            TIME ZONE,
            cantidad_enero NUMERIC(12, 2) DEFAULT 0,
            monto_enero NUMERIC(12, 2) DEFAULT 0,
            cantidad_febrero NUMERIC(12, 2) DEFAULT 0,
            monto_febrero NUMERIC(12, 2) DEFAULT 0,
            cantidad_marzo NUMERIC(12, 2) DEFAULT 0,
            monto_marzo NUMERIC(12, 2) DEFAULT 0,
            cantidad_abril NUMERIC(12, 2) DEFAULT 0,
            monto_abril NUMERIC(12, 2) DEFAULT 0,
            cantidad_mayo NUMERIC(12, 2) DEFAULT 0,
            monto_mayo NUMERIC(12, 2) DEFAULT 0,
            cantidad_junio NUMERIC(12, 2) DEFAULT 0,
            monto_junio NUMERIC(12, 2) DEFAULT 0,
            cantidad_julio NUMERIC(12, 2) DEFAULT 0,
            monto_julio NUMERIC(12, 2) DEFAULT 0,
            cantidad_agosto NUMERIC(12, 2) DEFAULT 0,
            monto_agosto NUMERIC(12, 2) DEFAULT 0,
            cantidad_septiembre NUMERIC(12, 2) DEFAULT 0,
            monto_septiembre NUMERIC(12, 2) DEFAULT 0,
            cantidad_octubre NUMERIC(12, 2) DEFAULT 0,
            monto_octubre NUMERIC(12, 2) DEFAULT 0,
            cantidad_noviembre NUMERIC(12, 2) DEFAULT 0,
            monto_noviembre NUMERIC(12, 2) DEFAULT 0,
            cantidad_diciembre NUMERIC(12, 2) DEFAULT 0,
            monto_diciembre NUMERIC(12, 2) DEFAULT 0,
            -- Totales calculados
            cantidad_total NUMERIC(12, 2) GENERATED ALWAYS AS (
                cantidad_enero + cantidad_febrero + cantidad_marzo + cantidad_abril + cantidad_mayo + cantidad_junio + cantidad_julio + cantidad_agosto + cantidad_septiembre + cantidad_octubre + cantidad_noviembre + cantidad_diciembre
            ) STORED,
            monto_total NUMERIC(12, 2) GENERATED ALWAYS AS (
                monto_enero * cantidad_enero + monto_febrero * cantidad_febrero + monto_marzo * cantidad_marzo + monto_abril * cantidad_abril + monto_mayo * cantidad_mayo + monto_junio * cantidad_junio + monto_julio * cantidad_julio + monto_agosto * cantidad_agosto + monto_septiembre * cantidad_septiembre + monto_octubre * cantidad_octubre + monto_noviembre * cantidad_noviembre + monto_diciembre * cantidad_diciembre
            ) STORED
    );

CREATE TABLE
    IF NOT EXISTS pac_historial_estados (
        id_historial SERIAL PRIMARY KEY,
        id_solicitud INT NOT NULL REFERENCES pac_solicitudes (id_solicitud) ON DELETE CASCADE,
        id_estado_nuevo INT NOT NULL REFERENCES pac_estados (id_estado),
        comentario TEXT,
        usuario_id_cambio INT NOT NULL,
        fecha_cambio TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

-- === INSERCIÓN DE DATOS INICIALES ===
INSERT INTO
    pac_unidades_solicitantes (nombre, codigo_unidad)
VALUES
    ('Unidad de Informática', 'INF'),
    ('Unidad de Servicios Generales', 'USG'),
    ('Dirección de Planificación', 'DIP'),
    ('Recursos Humanos', 'RRHH') ON CONFLICT (codigo_unidad) DO NOTHING;

INSERT INTO
    pac_modalidades_compra (nombre)
VALUES
    ('Compra Directa'),
    ('Baja Cuantía'),
    ('Licitación Pública'),
    ('Cotización') ON CONFLICT (nombre) DO NOTHING;

INSERT INTO
    pac_renglones (numero_renglon, nombre)
VALUES
    (291, 'Útiles de oficina'),
    (
        292,
        'Productos sanitarios, de limpieza y de uso personal'
    ) ON CONFLICT (numero_renglon) DO NOTHING;

INSERT INTO
    pac_estados (nombre, color, es_inicial)
VALUES
    ('Vigente', 'success', TRUE), -- Marcado como estado inicial
    ('En proceso', 'primary', FALSE),
    ('Pagado', 'info', FALSE),
    ('Recibido', 'dark', FALSE),
    ('No Vigente', 'warning', FALSE),
    ('Anulado', 'danger', FALSE) ON CONFLICT (nombre) DO NOTHING;