-- Conectar a la base de datos db_denuncias_scspr (esto usualmente se hace desde el cliente psql,
-- pero Docker lo hará automáticamente al crear la DB con POSTGRES_DB)
-- \c db_denuncias_scspr;

-- Crear la tabla para los datos del denunciante (manejar con extrema confidencialidad)
CREATE TABLE IF NOT EXISTS denunciantes (
    id_denunciante SERIAL PRIMARY KEY,
    primer_apellido VARCHAR(100) NOT NULL,
    segundo_apellido VARCHAR(100),
    primer_nombre VARCHAR(100) NOT NULL,
    segundo_nombre VARCHAR(100),
    telefono VARCHAR(20) NOT NULL,
    correo_electronico VARCHAR(255), -- No es obligatorio según el formulario, pero la confirmación sí. Hacerlo obligatorio si se requiere.
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear un tipo ENUM para los estados de la denuncia
CREATE TYPE estado_denuncia_enum AS ENUM (
    'Recibida',
    'En Análisis',
    'En Investigación',
    'Desestimada',
    'Resuelta',
    'Requiere Más Información'
);

-- Crear la tabla principal de denuncias
CREATE TABLE IF NOT EXISTS denuncias (
    id_denuncia SERIAL PRIMARY KEY,
    id_denunciante_fk INTEGER REFERENCES denunciantes(id_denunciante), -- Relación con el denunciante
    
    -- Datos de la persona a quien denuncia
    conoce_nombre_denunciado BOOLEAN NOT NULL,
    nombre_denunciado TEXT,
    puesto_cargo_denunciado TEXT,
    municipio_denunciado VARCHAR(255) NOT NULL,
    ubicacion_denunciado TEXT, -- Dirección o descripción más específica

    -- Detalles de la denuncia
    tiene_pruebas_adjuntas BOOLEAN NOT NULL,
    descripcion_hechos TEXT NOT NULL,
    denunciado_antes_otra_institucion BOOLEAN NOT NULL,
    
    -- Metadatos de la denuncia
    estado estado_denuncia_enum DEFAULT 'Recibida' NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion_estado TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Podríamos añadir un folio único para seguimiento externo si fuera necesario
    folio_denuncia VARCHAR(50) UNIQUE -- Se generará en la API
);

-- Crear tabla para archivos adjuntos
CREATE TABLE IF NOT EXISTS archivos_adjuntos (
    id_archivo SERIAL PRIMARY KEY,
    id_denuncia_fk INTEGER NOT NULL REFERENCES denuncias(id_denuncia) ON DELETE CASCADE,
    nombre_original_archivo VARCHAR(255) NOT NULL,
    nombre_guardado_archivo VARCHAR(255) NOT NULL UNIQUE, -- Nombre en el sistema de archivos para evitar colisiones
    tipo_mime_archivo VARCHAR(100),
    ruta_archivo TEXT NOT NULL, -- Ruta relativa dentro del volumen de uploads
    fecha_carga TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento en búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_denuncias_estado ON denuncias(estado);
CREATE INDEX IF NOT EXISTS idx_denuncias_fecha_creacion ON denuncias(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_archivos_id_denuncia_fk ON archivos_adjuntos(id_denuncia_fk);
CREATE INDEX IF NOT EXISTS idx_denunciantes_correo ON denunciantes(correo_electronico);

-- Trigger para actualizar fecha_actualizacion_estado cuando cambia el estado
CREATE OR REPLACE FUNCTION actualizar_fecha_estado_denuncia()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado IS DISTINCT FROM OLD.estado THEN
        NEW.fecha_actualizacion_estado = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_fecha_estado
BEFORE UPDATE ON denuncias
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_estado_denuncia();

-- Crear la tabla para el historial de cambios de estado de las denuncias
CREATE TABLE IF NOT EXISTS historial_estados_denuncia (
    id_historial SERIAL PRIMARY KEY,
    id_denuncia_fk INTEGER NOT NULL REFERENCES denuncias(id_denuncia) ON DELETE CASCADE,
    id_usuario_admin_fk INTEGER,
    estado_anterior estado_denuncia_enum, -- Puede ser NULL para el primer estado (Recibida)
    estado_nuevo estado_denuncia_enum NOT NULL,
    fecha_cambio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    comentario_admin TEXT -- Para futuras notas del administrador al cambiar el estado
);

-- Índices para la tabla de historial
CREATE INDEX IF NOT EXISTS idx_historial_id_denuncia_fk ON historial_estados_denuncia(id_denuncia_fk);
CREATE INDEX IF NOT EXISTS idx_historial_id_usuario_admin_fk ON historial_estados_denuncia(id_usuario_admin_fk);
CREATE INDEX IF NOT EXISTS idx_historial_fecha_cambio ON historial_estados_denuncia(fecha_cambio);

-- Opcional: Trigger para registrar el estado inicial 'Recibida' en el historial cuando se crea una denuncia
-- Esto asegura que cada denuncia tenga al menos una entrada en el historial desde su creación.
CREATE OR REPLACE FUNCTION registrar_estado_inicial_denuncia()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO historial_estados_denuncia (id_denuncia_fk, id_usuario_admin_fk, estado_anterior, estado_nuevo, fecha_cambio)
    VALUES (NEW.id_denuncia, NULL, NULL, NEW.estado, NEW.fecha_creacion); -- Usamos la fecha_creacion de la denuncia
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_registrar_estado_inicial
AFTER INSERT ON denuncias
FOR EACH ROW
WHEN (NEW.estado = 'Recibida') -- Solo para el estado inicial 'Recibida'
EXECUTE FUNCTION registrar_estado_inicial_denuncia();

SELECT 'Script de inicialización de la base de datos de Denuncias (app-specific) completado.';
