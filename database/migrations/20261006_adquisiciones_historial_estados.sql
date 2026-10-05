-- =========================================================
-- Adquisiciones: cuánto tiempo lleva un expediente en cada estado
-- Base de datos: db_adquisiciones_scspr
--
-- Solo AGREGA una tabla y un trigger (no borra ni modifica datos existentes). Es idempotente.
-- Correr como postgres sobre db_adquisiciones_scspr:
--   docker exec -i db_master_container psql -U postgres -d db_adquisiciones_scspr < database/migrations/20261006_adquisiciones_historial_estados.sql
--
-- NO correr init_adquisiciones.sql en producción: empieza con DROP TABLE de todo el módulo.
-- =========================================================

CREATE TABLE IF NOT EXISTS historial_estados (
    id_historial SERIAL PRIMARY KEY,
    id_expediente INT NOT NULL REFERENCES expedientes (id_expediente) ON DELETE CASCADE,
    id_estado INT NOT NULL REFERENCES estados_expediente (id_estado),
    fecha_entrada TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historial_estados_expediente
    ON historial_estados (id_expediente, fecha_entrada);

-- Cada vez que un expediente nace o cambia de estado se anota la entrada al estado nuevo, sin
-- importar desde qué parte del código (o a mano) se haga el cambio. El tiempo en un estado es la
-- diferencia con la entrada siguiente (o con el momento actual si es el estado vigente).
CREATE OR REPLACE FUNCTION registrar_historial_estado() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' OR NEW.id_estado_actual IS DISTINCT FROM OLD.id_estado_actual THEN
        INSERT INTO historial_estados (id_expediente, id_estado)
        VALUES (NEW.id_expediente, NEW.id_estado_actual);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_expedientes_historial_estado ON expedientes;
CREATE TRIGGER trg_expedientes_historial_estado
    AFTER INSERT OR UPDATE OF id_estado_actual ON expedientes
    FOR EACH ROW EXECUTE PROCEDURE registrar_historial_estado();

-- Expedientes que ya existen: su estado actual cuenta desde la última vez que se actualizaron
-- (es lo más cercano que se sabe; el detalle por estado empieza desde aquí).
INSERT INTO historial_estados (id_expediente, id_estado, fecha_entrada)
SELECT e.id_expediente, e.id_estado_actual, COALESCE(e.fecha_actualizacion, e.fecha_creacion, CURRENT_TIMESTAMP)
FROM expedientes e
WHERE NOT EXISTS (SELECT 1 FROM historial_estados h WHERE h.id_expediente = e.id_expediente);

-- Las crea postgres: se da acceso al usuario del módulo (si existe en este servidor).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'usr_adquisiciones_scspr') THEN
        GRANT ALL PRIVILEGES ON TABLE historial_estados TO usr_adquisiciones_scspr;
        GRANT ALL PRIVILEGES ON SEQUENCE historial_estados_id_historial_seq TO usr_adquisiciones_scspr;
    END IF;
END $$;
