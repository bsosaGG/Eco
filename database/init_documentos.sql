-- database/init_documentos.sql

-- Extensión para generar UUIDs si se necesitara en el futuro
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla para almacenar las plantillas de documentos .docx
CREATE TABLE plantillas_documentos (
    id_plantilla SERIAL PRIMARY KEY,
    -- Un nombre amigable y único para identificar la plantilla en la UI
    nombre VARCHAR(255) UNIQUE NOT NULL,
    -- Una descripción opcional para detallar el propósito de la plantilla
    descripcion TEXT,
    -- El contenido binario del archivo .docx
    contenido_plantilla BYTEA NOT NULL,
    -- El nombre original del archivo subido por el usuario
    nombre_archivo_original VARCHAR(255) NOT NULL,
    -- El tipo MIME del archivo, para validaciones y respuestas HTTP correctas
    mimetype VARCHAR(100) NOT NULL,
    -- El tamaño del archivo en bytes
    tamano_archivo INTEGER NOT NULL,
    -- Timestamp de creación (automático)
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Timestamp de la última actualización
    fecha_actualizacion TIMESTAMPTZ
);

-- Trigger para actualizar automáticamente la fecha_actualizacion en cada UPDATE
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_actualizar_fecha_plantilla
BEFORE UPDATE ON plantillas_documentos
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Comentario sobre la tabla para mayor claridad en la introspección de la BD
COMMENT ON TABLE plantillas_documentos IS 'Almacena las plantillas .docx para el generador de documentos.';
COMMENT ON COLUMN plantillas_documentos.contenido_plantilla IS 'Contenido binario del archivo .docx (formato bytea).';