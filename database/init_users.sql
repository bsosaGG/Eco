-- Crear la tabla de usuarios para administración
CREATE TABLE
    IF NOT EXISTS usuarios (
        id_usuario SERIAL PRIMARY KEY,
        nombre_usuario VARCHAR(100) UNIQUE NOT NULL, -- O email si prefieres usar email para login
        password_hash VARCHAR(255) NOT NULL,
        rol VARCHAR(50) NOT NULL DEFAULT 'admin', -- Podrías tener roles como 'admin', 'revisor', etc.
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            ultimo_login TIMESTAMP
        WITH
            TIME ZONE
    );

-- Crear un índice en nombre_usuario para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_usuarios_nombre_usuario ON usuarios (nombre_usuario);

-- Insertar un usuario administrador inicial
-- ¡IMPORTANTE! El hash de la contraseña debe generarse de forma segura.
-- La contraseña 'SuperAdminSCSPR2024!' hasheada con bcrypt (costo 10) es:
-- $2a$10$TU_HASH_DE_BCRYPT_AQUI (Debes generar esto, te indicaré cómo)
-- Por ahora, dejaremos un placeholder. Te guiaré para generarlo.
INSERT INTO
    usuarios (nombre_usuario, password_hash, rol)
VALUES
    (
        'admin_scspr',
        '$2b$10$VeQXJIs4VovGb25.SRXy7OmstsM/GLBy38rpAzSsWVCtsslxz2MSi',
        'admin'
    );

-- Opcional: Si solo habrá un tipo de admin, puedes simplificar
-- INSERT INTO usuarios (nombre_usuario, password_hash)
-- VALUES ('admin_scspr', '$2a$10$GENERAR_ESTE_HASH_PARA_SuperAdminSCSPR2024!');
SELECT
    'Script de inicialización de la base de datos de usuarios globales completado.';