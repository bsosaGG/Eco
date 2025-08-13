CREATE TABLE IF NOT EXISTS pac_unidades_solicitantes (
    id_unidad SERIAL PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE NOT NULL,
    codigo_unidad VARCHAR(10) UNIQUE NOT NULL, -- Ej: 'USG', 'DIP'
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS pac_modalidades_compra (
    id_modalidad SERIAL PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS pac_renglones (
    id_renglon SERIAL PRIMARY KEY,
    numero_renglon INT UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS pac_estados (
    id_estado SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL -- 'Vigente', 'No Vigente', 'Pagado', 'Recibido'
);

-- Tabla para gestionar los correlativos de solicitudes
CREATE TABLE IF NOT EXISTS pac_correlativos (
    id_correlativo SERIAL PRIMARY KEY,
    id_unidad INT NOT NULL REFERENCES pac_unidades_solicitantes(id_unidad),
    anio INT NOT NULL,
    ultimo_numero INT NOT NULL DEFAULT 0,
    UNIQUE(id_unidad, anio)
);

CREATE TABLE IF NOT EXISTS pac_solicitudes (
    id_solicitud SERIAL PRIMARY KEY,
    codigo_solicitud VARCHAR(50) UNIQUE NOT NULL, -- Ej: 'USG-001/2025'
    id_unidad_solicitante INT NOT NULL REFERENCES pac_unidades_solicitantes(id_unidad),
    id_modalidad_compra INT NOT NULL REFERENCES pac_modalidades_compra(id_modalidad),
    id_renglon INT NOT NULL REFERENCES pac_renglones(id_renglon),
    id_estado INT NOT NULL REFERENCES pac_estados(id_estado),
    descripcion TEXT NOT NULL,
    unidad_medida VARCHAR(100) NOT NULL,
    es_baja_cuantia BOOLEAN DEFAULT FALSE,
    responsable_usuario_id INT NOT NULL, -- ID del usuario del sistema global
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE,
    -- Campos mensuales (puedes normalizar esto más adelante si es necesario)
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
    -- ... (repite para los 12 meses) ...
    cantidad_diciembre NUMERIC(12, 2) DEFAULT 0,
    monto_diciembre NUMERIC(12, 2) DEFAULT 0,
    -- Totales calculados
    cantidad_total NUMERIC(12, 2) GENERATED ALWAYS AS (
        cantidad_enero + cantidad_febrero + /*...*/ + cantidad_diciembre
    ) STORED,
    monto_total NUMERIC(12, 2) GENERATED ALWAYS AS (
        monto_enero + monto_febrero + /*...*/ + monto_diciembre
    ) STORED
);

-- =================================================================
-- INSERCIÓN DE DATOS INICIALES (CATÁLOGOS)
-- =================================================================

-- 1. Insertar Unidades Solicitantes
INSERT INTO pac_unidades_solicitantes (nombre, codigo_unidad) VALUES
('Unidad de Informática', 'INF'),
('Unidad de Servicios Generales', 'USG'),
('Dirección de Planificación', 'DIP'),
('Recursos Humanos', 'RRHH')
ON CONFLICT (codigo_unidad) DO NOTHING;

-- 2. Insertar Modalidades de Compra
INSERT INTO pac_modalidades_compra (nombre) VALUES
('Compra Directa'),
('Baja Cuantía'),
('Licitación Pública'),
('Cotización')
ON CONFLICT (nombre) DO NOTHING;

-- 3. Insertar Renglones Presupuestarios (ejemplos comunes)
INSERT INTO pac_renglones (numero_renglon, nombre) VALUES
(291, 'Útiles de oficina'),
(292, 'Productos sanitarios, de limpieza y de uso personal'),
(268, 'Productos plásticos, nylon, vinil y P.V.C.'),
(165, 'Mantenimiento y reparación de equipo de cómputo'),
(297, 'Materiales, productos y accs. eléctricos, cableado estructurado de redes informáticas y telefónicas')
ON CONFLICT (numero_renglon) DO NOTHING;

-- 4. Insertar Estados de Solicitud
INSERT INTO pac_estados (nombre) VALUES
('Vigente'),
('No Vigente'),
('Pagado'),
('Recibido'),
('En proceso'),
('Anulado')
ON CONFLICT (nombre) DO NOTHING;

-- Mensaje de finalización
SELECT 'Script de inicialización del módulo PAC ejecutado con éxito.';
