-- Crear base de datos para el módulo de impresiones
-- CREATE DATABASE db_impresiones; -- Esto se asume que lo hace docker-compose con POSTGRES_DB
-- \c db_impresiones;

CREATE TABLE plantillas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    ruta_archivo TEXT NOT NULL,
    campos_requeridos JSONB,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE registros_impresion (
    id SERIAL PRIMARY KEY,
    id_plantilla INT REFERENCES plantillas(id) ON DELETE RESTRICT,
    anio INT NOT NULL,
    secuencia INT NOT NULL,
    correlativo VARCHAR(50) UNIQUE NOT NULL,
    id_usuario_creador INT,
    datos_formulario JSONB,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_plantilla_anio_secuencia UNIQUE (id_plantilla, anio, secuencia)
);
