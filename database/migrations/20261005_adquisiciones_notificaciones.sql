-- =========================================================
-- Adquisiciones: avisos al solicitante y a la persona asignada
-- Base de datos: db_adquisiciones_scspr
--
-- Solo AGREGA una tabla (no borra ni modifica nada). Es idempotente: se puede correr más de una vez.
-- Correr como postgres sobre db_adquisiciones_scspr:
--   docker exec -i db_master_container psql -U postgres -d db_adquisiciones_scspr < database/migrations/20261005_adquisiciones_notificaciones.sql
--
-- NO correr init_adquisiciones.sql en producción: empieza con DROP TABLE de todo el módulo.
-- =========================================================

CREATE TABLE IF NOT EXISTS notificaciones (
    id_notificacion SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,            -- destinatario; vive en db_global_users, sin FK real (otra BD)
    id_expediente INT REFERENCES expedientes (id_expediente) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('cambio_etapa', 'asignacion', 'devolucion')),
    titulo VARCHAR(250) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_lectura TIMESTAMPTZ,
    -- Resultado del aviso por correo: pendiente -> encolado | sin_correo (el usuario no tiene email)
    -- | sin_smtp (el servidor no tiene correo configurado) | error
    correo_estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario
    ON notificaciones (id_usuario, leida, fecha_creacion DESC);

-- La tabla la crea postgres: se le da acceso al usuario del módulo (si existe en este servidor).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'usr_adquisiciones_scspr') THEN
        GRANT ALL PRIVILEGES ON TABLE notificaciones TO usr_adquisiciones_scspr;
        GRANT ALL PRIVILEGES ON SEQUENCE notificaciones_id_notificacion_seq TO usr_adquisiciones_scspr;
    END IF;
END $$;
