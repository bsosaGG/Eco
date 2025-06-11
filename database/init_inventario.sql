-- Tabla de Proveedores
CREATE TABLE proveedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE NOT NULL,
    nit VARCHAR(20) UNIQUE
);

-- Tabla de Facturas
CREATE TABLE facturas (
    id SERIAL PRIMARY KEY,
    numero_factura VARCHAR(50) NOT NULL,
    serie_factura VARCHAR(50) NOT NULL,
    fecha_factura DATE NOT NULL,
    id_proveedor INTEGER REFERENCES proveedores(id), -- Clave foránea a la tabla proveedores
    UNIQUE(numero_factura, serie_factura, id_proveedor) -- Asegura que la combinación número/serie/proveedor sea única
);

-- Tabla de Renglones (clasificación de inventario)
CREATE TABLE renglones_inventario (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE NOT NULL
);

-- Tabla de Unidades/Direcciones
CREATE TABLE unidades_direcciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE NOT NULL,
    descripcion TEXT
);

-- Tabla principal de inventario_items
CREATE TABLE inventario_items (
    no_item SERIAL PRIMARY KEY, -- "NO." como clave primaria auto-incremental
    id_factura INTEGER REFERENCES facturas(id), -- Clave foránea a la tabla facturas
    id_renglon INTEGER REFERENCES renglones_inventario(id), -- Clave foránea a la tabla renglones_inventario
    fecha_registro DATE,
    codigo TEXT UNIQUE NOT NULL, -- "CÓDIGO" como único y no nulo
    descripcion_fisica TEXT, -- "DESCRIPCION FISICA DEL BIEN / SICOIN"
    valor DECIMAL(10, 2), -- "VALOR" como decimal con 2 decimales
    libro INTEGER,
    folio INTEGER,
    responsable VARCHAR(255),
    id_unidad_direccion INTEGER REFERENCES unidades_direcciones(id), -- Clave foránea a la tabla unidades_direcciones
    no_tarjeta_responsabilidad VARCHAR(255),
    observaciones TEXT
);

-- Opcional: Otorgar todos los privilegios al usuario de la base de datos
GRANT ALL PRIVILEGES ON DATABASE db_inventario TO usr_inventario_scspr;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO usr_inventario_scspr;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO usr_inventario_scspr;

-- Creación de Índices para optimización de búsquedas
CREATE INDEX idx_inventario_codigo ON inventario_items (codigo);
CREATE INDEX idx_inventario_libro_folio ON inventario_items (libro, folio);
CREATE INDEX idx_inventario_id_factura ON inventario_items (id_factura);
CREATE INDEX idx_inventario_id_renglon ON inventario_items (id_renglon);
CREATE INDEX idx_inventario_id_unidad_direccion ON inventario_items (id_unidad_direccion);

CREATE INDEX idx_proveedores_nombre ON proveedores (nombre);
CREATE INDEX idx_facturas_numero_serie ON facturas (numero_factura, serie_factura);
CREATE INDEX idx_renglones_nombre ON renglones_inventario (nombre);
CREATE INDEX idx_unidades_nombre ON unidades_direcciones (nombre);