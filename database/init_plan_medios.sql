-- =========================================================
-- init_plan_medios.sql
-- Módulo: Plan de Medios (Formulario Automatizado de Plan de Medios)
-- Base de datos: db_plan_medios_scspr / usr_plan_medios_scspr
-- Basado en: proyecto Python original (plan-medios), rediseñado desde cero.
--
-- Usuarios, roles y permisos NO viven aquí: están centralizados en db_global_users
-- (tablas usuarios / permisos / perfiles). Las columnas *_user_id de este esquema son
-- referencias lógicas a db_global_users.usuarios.id_usuario (sin FK real entre bases,
-- mismo patrón que Adquisiciones) y se acompañan de una copia de correo/nombre para
-- que el historial siga siendo legible aunque el usuario cambie.
--
-- Es IDEMPOTENTE (CREATE ... IF NOT EXISTS / CREATE OR REPLACE): se puede volver a correr
-- sin perder datos. Para crearlo todo con un solo comando ver scripts/plan-medios/README.md
-- =========================================================

-- === CATÁLOGO DE MEDIOS (alimenta el motor de scoring) ===

CREATE TABLE IF NOT EXISTS media_catalog (
    id                 INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name               TEXT        NOT NULL,
    group_name         TEXT        NOT NULL DEFAULT '',
    media_type         TEXT        NOT NULL DEFAULT '',
    coverage           TEXT        NOT NULL DEFAULT '',
    regions            TEXT        NOT NULL DEFAULT '',
    languages          TEXT        NOT NULL DEFAULT '',
    reach              TEXT        NOT NULL DEFAULT '',
    ages               TEXT        NOT NULL DEFAULT '',
    predominant_sex    TEXT        NOT NULL DEFAULT '',
    nse                TEXT        NOT NULL DEFAULT '',
    interests          TEXT        NOT NULL DEFAULT '',
    peak_hours         TEXT        NOT NULL DEFAULT '',
    contact_person     TEXT        NOT NULL DEFAULT '',
    contact_email      TEXT        NOT NULL DEFAULT '',
    contact_phone      TEXT        NOT NULL DEFAULT '',
    legal_name         TEXT        NOT NULL DEFAULT '',
    nit                TEXT        NOT NULL DEFAULT '',
    tax_status         TEXT        NOT NULL DEFAULT '',
    required_documents TEXT        NOT NULL DEFAULT '',
    minimum_investment TEXT        NOT NULL DEFAULT '',
    contracting_forms  TEXT        NOT NULL DEFAULT '',
    discounts          TEXT        NOT NULL DEFAULT '',
    rate_card_validity TEXT        NOT NULL DEFAULT '',
    imported_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_media_catalog_name_type UNIQUE (name, media_type)
);
CREATE INDEX IF NOT EXISTS ix_media_catalog_media_type ON media_catalog (media_type);

CREATE TABLE IF NOT EXISTS media_products (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    media_id           INTEGER        NOT NULL REFERENCES media_catalog (id) ON DELETE CASCADE,
    category           TEXT           NOT NULL,
    product_name       TEXT           NOT NULL DEFAULT '',
    format             TEXT           NOT NULL DEFAULT '',
    schedule           TEXT           NOT NULL DEFAULT '',
    prime_time         TEXT           NOT NULL DEFAULT '',
    rating             NUMERIC(18, 4),
    estimated_audience INTEGER,
    unit_cost          NUMERIC(18, 2),
    details            JSONB          NOT NULL DEFAULT '{}'::jsonb,
    imported_at        TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_media_products_category ON media_products (category);
CREATE INDEX IF NOT EXISTS ix_media_products_media_id ON media_products (media_id);

-- Bitácora de cada carga del catálogo (la hace el comando de importación).
CREATE TABLE IF NOT EXISTS catalog_import_runs (
    id                   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    imported_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    source_path          TEXT        NOT NULL,
    media_count          INTEGER     NOT NULL,
    product_count        INTEGER     NOT NULL,
    orphan_product_count INTEGER     NOT NULL DEFAULT 0
);

-- === EXPEDIENTES ===

-- Un expediente es un caso de trabajo (campaña) desde que se sube el Brief.
-- `version` es el control de concurrencia (bloqueo optimista): al guardar, el cliente
-- envía la versión que leyó y solo se acepta si sigue siendo la vigente.
CREATE TABLE IF NOT EXISTS expedientes (
    id                  TEXT PRIMARY KEY,                          -- AAAAMMDD-xxxxxxxx
    status              VARCHAR(50)  NOT NULL DEFAULT 'created',
    original_filename   TEXT,
    stored_path         TEXT,
    original_size_bytes INTEGER,
    extraction_status   VARCHAR(50),
    summary_payload     JSONB,
    version             INTEGER      NOT NULL DEFAULT 1,
    created_by_user_id  INTEGER,                                   -- db_global_users.usuarios.id_usuario
    created_by_email    TEXT,
    created_by_name     TEXT,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_expedientes_version_positive CHECK (version >= 1),
    CONSTRAINT ck_expedientes_size_nonnegative CHECK (original_size_bytes IS NULL OR original_size_bytes >= 0)
);
CREATE INDEX IF NOT EXISTS ix_expedientes_status     ON expedientes (status);
CREATE INDEX IF NOT EXISTS ix_expedientes_created_at ON expedientes (created_at);

-- Medios seleccionados en la Etapa 3 (una fila por bloque).
CREATE TABLE IF NOT EXISTS expediente_media_entries (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    expediente_id    TEXT        NOT NULL REFERENCES expedientes (id) ON DELETE CASCADE,
    position         INTEGER     NOT NULL,
    profile          TEXT,
    category         VARCHAR(100),
    catalog_media_id INTEGER     REFERENCES media_catalog (id) ON DELETE SET NULL,
    payload          JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_media_entry_position UNIQUE (expediente_id, position)
);
CREATE INDEX IF NOT EXISTS ix_expediente_media_entries_catalog ON expediente_media_entries (catalog_media_id);

-- === AUDITORÍA DE SELECCIONES ===

-- Registro INMUTABLE de cada selección, remoción o cambio de un medio (requerimiento de la
-- Secretaría, 2026-09-18). `id` crece estrictamente y es el orden oficial de los eventos
-- (occurred_at es solo para mostrar: dos eventos de un mismo guardado comparten now()).
CREATE TABLE IF NOT EXISTS selection_audit_events (
    id                         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    occurred_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    event_type                 VARCHAR(20) NOT NULL,
    expediente_id              TEXT        NOT NULL REFERENCES expedientes (id),   -- sin cascada: protege el historial
    campaign                   TEXT        NOT NULL DEFAULT '',
    analyst_user_id            INTEGER,                                            -- db_global_users.usuarios.id_usuario
    analyst_email              TEXT,
    analyst_name               TEXT,
    medium_name                TEXT        NOT NULL DEFAULT '',
    catalog_media_id           INTEGER,                                            -- copia: el historial no depende del catálogo vigente
    catalog_media_name         TEXT        NOT NULL DEFAULT '',
    provider_legal_name        TEXT        NOT NULL DEFAULT '',
    matched_top_recommendation BOOLEAN     NOT NULL DEFAULT FALSE,
    payload                    JSONB       NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT ck_selection_audit_events_type CHECK (event_type IN ('selected', 'removed', 'updated'))
);
CREATE INDEX IF NOT EXISTS ix_selection_audit_events_expediente ON selection_audit_events (expediente_id, id DESC);
CREATE INDEX IF NOT EXISTS ix_selection_audit_events_analyst    ON selection_audit_events (analyst_user_id);

-- === SOLICITUDES DE COMPRA ===

-- Una por medio seleccionado (se identifica por su posición en el expediente).
CREATE TABLE IF NOT EXISTS purchase_requests (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    expediente_id      TEXT        NOT NULL REFERENCES expedientes (id) ON DELETE CASCADE,
    media_position     INTEGER     NOT NULL,
    request_number     TEXT,
    request_date       DATE,
    budget_item        TEXT,
    code               TEXT,
    quantity           INTEGER,
    unit               TEXT,
    description        TEXT,
    justification      TEXT,
    specifications     TEXT,
    status             VARCHAR(50) NOT NULL DEFAULT 'draft',
    generated_filename TEXT,
    payload            JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_by_user_id INTEGER,                                     -- db_global_users.usuarios.id_usuario
    created_by_email   TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_purchase_request_media UNIQUE (expediente_id, media_position),
    CONSTRAINT ck_purchase_quantity_nonnegative CHECK (quantity IS NULL OR quantity >= 0),
    CONSTRAINT ck_purchase_position_nonnegative CHECK (media_position >= 0)
);

-- === DICCIONARIO INSTITUCIONAL (términos que el corrector ortográfico no marca) ===

CREATE TABLE IF NOT EXISTS institutional_terms (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    term            TEXT        NOT NULL,
    normalized_term TEXT        NOT NULL,
    created_by      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_institutional_terms_normalized UNIQUE (normalized_term)
);

-- === REGLAS EN LA BASE DE DATOS (último seguro) ===

-- 1) La auditoría no se modifica ni se borra.
CREATE OR REPLACE FUNCTION plan_medios_auditoria_inmutable() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'La auditoría de selecciones es inmutable: no se permite % sobre selection_audit_events.', TG_OP
        USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_selection_audit_events_inmutable
    BEFORE UPDATE OR DELETE ON selection_audit_events
    FOR EACH ROW EXECUTE FUNCTION plan_medios_auditoria_inmutable();

CREATE OR REPLACE TRIGGER trg_selection_audit_events_no_truncate
    BEFORE TRUNCATE ON selection_audit_events
    FOR EACH STATEMENT EXECUTE FUNCTION plan_medios_auditoria_inmutable();

-- 2) Regla de justificación (Secretaría, 2026-09-18): nunca se puede marcar un expediente como
--    'plan_medios_generado' si falta la justificación de un medio, salvo que ese medio sea la
--    opción #1 del ranking de scoring. La aplicación ya lo valida; esto evita saltárselo.
CREATE OR REPLACE FUNCTION plan_medios_validar_justificaciones() RETURNS trigger AS $$
DECLARE
    entry     JSONB;
    indice    INTEGER := 0;
    faltantes TEXT[]  := '{}';
BEGIN
    IF NEW.status = 'plan_medios_generado' AND jsonb_typeof(NEW.summary_payload -> 'media_entries') = 'array' THEN
        FOR entry IN SELECT value FROM jsonb_array_elements(NEW.summary_payload -> 'media_entries') LOOP
            indice := indice + 1;
            IF jsonb_typeof(entry) = 'object'
               AND NOT (COALESCE(entry ->> 'selection_source', 'manual') = 'catalog_scoring'
                        AND (entry ->> 'scoring_position') = '1')
               AND btrim(COALESCE(entry ->> 'selection_justification', '')) = '' THEN
                faltantes := faltantes || format('Medio %s: %s', indice, COALESCE(entry ->> 'medium', ''));
            END IF;
        END LOOP;
        IF array_length(faltantes, 1) > 0 THEN
            RAISE EXCEPTION 'Debes justificar la seleccion de este medio antes de continuar: %', array_to_string(faltantes, '; ')
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_expedientes_justificaciones
    BEFORE INSERT OR UPDATE OF status, summary_payload ON expedientes
    FOR EACH ROW EXECUTE FUNCTION plan_medios_validar_justificaciones();
