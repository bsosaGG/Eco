-- Tabla para almacenar los servidores a monitorear
CREATE TABLE
    IF NOT EXISTS servidores (
        id_servidor SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        direccion_ip VARCHAR(45) UNIQUE NOT NULL,
        puerto_ssh INT NOT NULL DEFAULT 22,
        usuario_ssh VARCHAR(100) NOT NULL,
        descripcion TEXT,
        intervalo_verificacion_segundos INTEGER DEFAULT 300,
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

-- Tabla para almacenar los sitios web a monitorear
CREATE TABLE
    IF NOT EXISTS sitios_web (
        id_sitio_web SERIAL PRIMARY KEY,
        id_servidor INTEGER REFERENCES servidores (id_servidor) ON DELETE SET NULL,
        nombre VARCHAR(255) NOT NULL,
        url TEXT UNIQUE NOT NULL,
        intervalo_verificacion_segundos INTEGER DEFAULT 300,
        codigo_estado_esperado INTEGER DEFAULT 200,
        texto_a_verificar TEXT, -- Puede ser NULL si no se necesita verificar contenido
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

-- Tabla para guardar el historial de estado de los servidores (métricas)
CREATE TABLE
    IF NOT EXISTS historial_estado_servidor (
        id_historial SERIAL PRIMARY KEY,
        id_servidor INTEGER NOT NULL REFERENCES servidores (id_servidor) ON DELETE CASCADE,
        fecha_verificacion TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            cpu_usage_percent DECIMAL(5, 2),
            ram_usage_percent DECIMAL(5, 2),
            disk_usage_percent DECIMAL(5, 2),
            online BOOLEAN NOT NULL,
            detalles_error TEXT
    );

-- Tabla para guardar el historial de estado de los sitios web (uptime)
CREATE TABLE
    IF NOT EXISTS historial_estado_sitio (
        id_historial SERIAL PRIMARY KEY,
        id_sitio_web INTEGER NOT NULL REFERENCES sitios_web (id_sitio_web) ON DELETE CASCADE,
        fecha_verificacion TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            online BOOLEAN NOT NULL,
            codigo_estado_recibido INTEGER,
            tiempo_respuesta_ms INTEGER,
            detalles_error TEXT
    );

CREATE TABLE
    IF NOT EXISTS monitoreo_configuracion (
        clave VARCHAR(100) PRIMARY KEY,
        valor TEXT,
        descripcion TEXT
    );

-- Insertamos un valor inicial para la lista de correos de alertas.
-- Los correos deben estar separados por comas.
INSERT INTO
    monitoreo_configuracion (clave, valor, descripcion)
VALUES
    (
        'alert_emails',
        'hgatica@scspr.gob.gt,hggpaz@outlook.com',
        'Lista de correos (separados por coma) a los que se enviarán las alertas de monitoreo.'
    ) ON CONFLICT (clave) DO NOTHING;