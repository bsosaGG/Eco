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
    tipo_juicio VARCHAR(200), -- Nuevo 2026-01-30
    organo_jurisdiccional VARCHAR(200),
    juez VARCHAR(200),
    oficial VARCHAR(200),
    demandante_id INTEGER REFERENCES actores_juridicos(id), -- RELACIÓN NORMALIZADA (Nullable now)
    ultimo_renglon_presupuestario VARCHAR(200), -- Nuevo 2026-01-30
    estado_procesal VARCHAR(50) DEFAULT 'En Trámite',
    estado_actual_descripcion TEXT, -- Nuevo 2026-02-03
    actitud_procesal TEXT,
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
    interpuso_apelacion BOOLEAN DEFAULT FALSE, -- Nuevo 2026-02-03
    sala_apelacion_nombre VARCHAR(255),
    tiene_amparo BOOLEAN DEFAULT FALSE,
    amparo_organo_competente TEXT, -- Nuevo 2026-02-03
    numero_amparo TEXT, -- Nuevo 2026-02-03
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

-- Tabla de Borradores de Juicios (Mirror + Historial Draft) - Agregado 2026-02-16
CREATE TABLE IF NOT EXISTS juicios_borradores (
    juicio_id INTEGER PRIMARY KEY REFERENCES juicios(id) ON DELETE CASCADE,
    usuario_id INTEGER,
    
    -- Campos Gemelos de Juicios
    numero_proceso VARCHAR(100),
    tipo_juicio VARCHAR(200),
    organo_jurisdiccional VARCHAR(200),
    juez VARCHAR(200),
    oficial VARCHAR(200),
    demandante_id INTEGER,
    ultimo_renglon_presupuestario VARCHAR(200),
    estado_procesal VARCHAR(50),
    estado_actual_descripcion TEXT,
    actitud_procesal TEXT,
    intento_conciliacion BOOLEAN,
    observaciones TEXT,
    
    -- Financieros
    monto_liquidacion DECIMAL(12,2),
    monto_rrhh DECIMAL(12,2),
    monto_estimado DECIMAL(12,2),
    efecto_sentencia_descripcion TEXT,
    
    -- Narrativos
    origen_proceso TEXT,
    objeto_pretension TEXT,
    antecedentes_caso TEXT,
    
    -- Apelación/Amparo
    interpuso_apelacion BOOLEAN,
    sala_apelacion_nombre VARCHAR(255),
    tiene_amparo BOOLEAN,
    amparo_organo_competente TEXT,
    numero_amparo TEXT,
    estado_amparo_descripcion VARCHAR(255),
    
    -- Campos Historial
    historial_id INTEGER,
    historial_tipo_evento VARCHAR(100),
    historial_sala_corte VARCHAR(200),
    historial_fecha_interposicion DATE,
    historial_estado_recurso VARCHAR(50),
    historial_descripcion TEXT,
    historial_ruta_archivo_borrador VARCHAR(255),
    
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
