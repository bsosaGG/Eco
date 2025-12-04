-- Tabla de Catálogo de Medios
CREATE TABLE IF NOT EXISTS cat_medios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    requiere_especificar BOOLEAN DEFAULT FALSE -- Para la opción "Otro"
);

-- Tabla de Cabecera de Respuestas
CREATE TABLE IF NOT EXISTS respuestas_medios (
    id SERIAL PRIMARY KEY,
    id_medio INTEGER REFERENCES cat_medios(id),
    nombre_periodista VARCHAR(255),
    email VARCHAR(255), -- Nuevo campo de email
    nombre_medio_otro TEXT, -- Se llena si id_medio tiene requiere_especificar=true
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Detalle de Temas (Normalizada)
CREATE TABLE IF NOT EXISTS temas_respuesta (
    id SERIAL PRIMARY KEY,
    id_respuesta INTEGER REFERENCES respuestas_medios(id) ON DELETE CASCADE,
    prioridad INTEGER NOT NULL, -- 1, 2, 3, etc.
    descripcion TEXT NOT NULL
);

-- Tabla de Configuración
CREATE TABLE IF NOT EXISTS configuracion (
    clave VARCHAR(50) PRIMARY KEY,
    valor TEXT NOT NULL,
    descripcion TEXT
);

-- Insertar configuración inicial
INSERT INTO configuracion (clave, valor, descripcion) VALUES 
('max_temas_prioritarios', '3', 'Número máximo de temas prioritarios que un medio puede enviar');

-- Insertar medios iniciales
INSERT INTO cat_medios (nombre, requiere_especificar) VALUES 
('Prensa Libre', FALSE),
('El Periódico', FALSE),
('Emisoras Unidas', FALSE),
('La Hora', FALSE),
('Soy502', FALSE),
('Otro', TRUE);
