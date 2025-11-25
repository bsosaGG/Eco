-- Tabla de Instituciones (Ministerios)
CREATE TABLE IF NOT EXISTS institutions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    acronym VARCHAR(50) NOT NULL,
    logo_url TEXT,
    created_by INTEGER NOT NULL, -- user_id
    updated_by INTEGER, -- user_id
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Semanas
CREATE TABLE IF NOT EXISTS weeks (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    label VARCHAR(100) -- Ej: "Semana 1 (01/01 - 07/01)"
);

-- Tabla de Asignaciones de Usuarios a Instituciones
CREATE TABLE IF NOT EXISTS user_assignments (
    user_id INTEGER NOT NULL, -- Referencia a id_usuario en users_db (sin FK dura por estar en otra DB)
    institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, institution_id)
);

-- Tabla de Reportes de Agenda (Cabecera)
CREATE TABLE IF NOT EXISTS agenda_reports (
    id SERIAL PRIMARY KEY,
    week_id INTEGER NOT NULL REFERENCES weeks(id),
    institution_id INTEGER NOT NULL REFERENCES institutions(id),
    status VARCHAR(50) DEFAULT 'DRAFT', -- 'DRAFT', 'COMPLETED'
    created_by INTEGER NOT NULL, -- user_id
    updated_by INTEGER, -- user_id
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (week_id, institution_id)
);

-- Tabla de Items de Agenda (Detalle)
CREATE TABLE IF NOT EXISTS agenda_items (
    id SERIAL PRIMARY KEY,
    agenda_report_id INTEGER NOT NULL REFERENCES agenda_reports(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- 'WEEKLY_TOPIC', 'PRESIDENTIAL_VISIT', 'HOT_TOPIC', 'POLITICAL_ALERT', 'IMPORTANT_LINK'
    description TEXT NOT NULL,
    item_date DATE,
    url_resource TEXT,
    alert_level VARCHAR(20), -- 'HIGH', 'MEDIUM', 'LOW'
    order_index INTEGER DEFAULT 0
);

-- Tabla de Tipos de Items de Agenda (Catálogo)
CREATE TABLE IF NOT EXISTS agenda_item_types (
    key VARCHAR(50) PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    order_index INTEGER DEFAULT 0
);

-- Insertar tipos de items por defecto
INSERT INTO agenda_item_types (key, label, order_index) VALUES
('WEEKLY_TOPIC', 'Temas Semanales', 1),
('PRESIDENTIAL_VISIT', 'Visitas Presidenciales', 2),
('HOT_TOPIC', 'Temas Álgidos', 3),
('POLITICAL_ALERT', 'Alertas Políticas', 4),
('IMPORTANT_LINK', 'Enlaces Importantes', 5)
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label;

-- Tabla de Cierres Mensuales
CREATE TABLE IF NOT EXISTS monthly_closures (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    file_url TEXT,
    is_closed BOOLEAN DEFAULT FALSE,
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by INTEGER, -- user_id
    UNIQUE (institution_id, month, year)
);

-- Bloque anónimo para poblar semanas de 2025 a 2030
DO $$
DECLARE
    curr_date DATE := '2025-01-01';
    end_date_loop DATE := '2030-12-31';
    week_num INTEGER;
    year_num INTEGER;
    w_start DATE;
    w_end DATE;
    w_label TEXT;
BEGIN
    -- Ajustar al primer lunes si es necesario, o usar lógica ISO.
    -- Aquí usaremos una iteración simple semana a semana.
    -- ISO week starts on Monday.
    curr_date := date_trunc('week', curr_date); -- Lunes de la semana del 1 de enero

    WHILE curr_date <= end_date_loop LOOP
        year_num := EXTRACT(ISOYEAR FROM curr_date); -- Año ISO
        week_num := EXTRACT(WEEK FROM curr_date);
        w_start := curr_date;
        w_end := curr_date + 6;
        w_label := 'Semana ' || week_num || ' (' || to_char(w_start, 'DD/MM') || ' - ' || to_char(w_end, 'DD/MM') || ')';

        INSERT INTO weeks (year, week_number, start_date, end_date, label)
        VALUES (year_num, week_num, w_start, w_end, w_label)
        ON CONFLICT DO NOTHING;

        curr_date := curr_date + 7;
    END LOOP;
END $$;
