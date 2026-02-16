CREATE TABLE IF NOT EXISTS juicios_borradores (
    juicio_id INTEGER PRIMARY KEY REFERENCES juicios(id) ON DELETE CASCADE,
    usuario_id INTEGER, -- Opcional: ID del usuario que guardó el borrador
    
    -- Campos Gemelos de Juicios (Todos NULLABLE para borradores parciales)
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
    
    -- Campos para el Historial en Borrador (Edición o Creación)
    historial_id INTEGER, -- Si tiene valor, es un borrador de EDICIÓN de ese historial. Si es NULL, es CREACIÓN.
    historial_tipo_evento VARCHAR(100),
    historial_sala_corte VARCHAR(200),
    historial_fecha_interposicion DATE,
    historial_estado_recurso VARCHAR(50),
    historial_descripcion TEXT,
    historial_ruta_archivo_borrador VARCHAR(255), -- Ruta temporal en uploads/juridica/borradores
    
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
