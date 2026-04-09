CREATE TABLE IF NOT EXISTS registro_auditoria (
    id_auditoria SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    email_usuario VARCHAR(255),
    metodo_http VARCHAR(10) NOT NULL,
    ruta_api TEXT NOT NULL,
    codigo_estado INTEGER NOT NULL,
    tiempo_respuesta_ms INTEGER,
    ip_origen VARCHAR(45),
    detalles JSONB,
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auditoria_email ON registro_auditoria(email_usuario);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON registro_auditoria(fecha_hora);
