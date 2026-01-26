-- Tabla de Plantillas de Documentos (Independiente)
CREATE TABLE IF NOT EXISTS plantillas_docs (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL, -- Ej: 'Ficha General'
    descripcion TEXT,
    ruta_archivo VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Actores Jurídicos (CU-02) (Debe ir ANTES de juicios por la FK)
CREATE TABLE IF NOT EXISTS actores_juridicos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    identificacion VARCHAR(50), -- DPI/Nit/Colegiado
    identificacion_tipo VARCHAR(50), -- NEW: NIT, DPI, Pasaporte, etc.
    tipo VARCHAR(50) NOT NULL -- 'Juez', 'Oficial', 'Abogado', 'Demandante', etc.
);

-- Tabla de Juicios
CREATE TABLE IF NOT EXISTS juicios (
    id SERIAL PRIMARY KEY,
    correlativo VARCHAR(50) UNIQUE, -- Para búsqueda rápida
    numero_proceso VARCHAR(100) NOT NULL,
    organo_jurisdiccional VARCHAR(200),
    juez VARCHAR(200),
    oficial VARCHAR(200),
    demandante_id INTEGER REFERENCES actores_juridicos(id), -- RELACIÓN NORMALIZADA
    estado_procesal VARCHAR(50) DEFAULT 'En Trámite',
    actitud_procesal VARCHAR(200),
    intento_conciliacion BOOLEAN DEFAULT FALSE, -- Nuevo: CU-05 Checkbox
    observaciones TEXT,
    
    -- Campos Financieros
    monto_liquidacion DECIMAL(12,2),
    monto_rrhh DECIMAL(12,2),
    monto_estimado DECIMAL(12,2),
    efecto_sentencia_descripcion TEXT, -- Nuevo: Impacto financiero
    
    -- Campos Narrativos (PDF)
    origen_proceso TEXT,
    objeto_pretension TEXT,
    antecedentes_caso TEXT,
    
    -- Campos Apelación/Amparo Manuales (Opción A)
    sala_apelacion_nombre VARCHAR(255),
    tiene_amparo BOOLEAN DEFAULT FALSE,
    estado_amparo_descripcion VARCHAR(255),
    
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Historial Procesal
CREATE TABLE IF NOT EXISTS historial_procesal (
    id SERIAL PRIMARY KEY,
    juicio_id INTEGER REFERENCES juicios(id) ON DELETE CASCADE,
    tipo_evento VARCHAR(100) NOT NULL, -- 'Apelación', 'Amparo', 'Notificación', etc.
    sala_corte VARCHAR(200),
    fecha_interposicion DATE,
    estado_recurso VARCHAR(50),
    descripcion TEXT,
    ruta_archivo_adjunto VARCHAR(255), -- Ruta relativa local
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Audit Logs (Específico del módulo si se requiere separado, o usar el global si existiera)
-- El requerimiento pide una tabla específica audit_logs para el módulo
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    juicio_id INTEGER REFERENCES juicios(id) ON DELETE SET NULL,
    usuario_id INTEGER, -- ID del usuario global
    nombre_usuario VARCHAR(200),
    accion VARCHAR(100) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    detalles TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_juicios_estado ON juicios(estado_procesal);
CREATE INDEX IF NOT EXISTS idx_juicios_num_proceso ON juicios(numero_proceso);
CREATE INDEX IF NOT EXISTS idx_actores_nombre ON actores_juridicos(nombre);
