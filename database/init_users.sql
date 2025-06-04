-- ... (DROP TABLEs existentes si los tienes al inicio) ...
-- DROP TABLE IF EXISTS historial_estados_denuncia CASCADE;
-- DROP TABLE IF EXISTS archivos_adjuntos CASCADE;
-- DROP TABLE IF EXISTS denuncias CASCADE;
-- DROP TABLE IF EXISTS denunciantes CASCADE;
-- DROP TABLE IF EXISTS usuarios CASCADE;
-- DROP TYPE IF EXISTS estado_denuncia_enum;
-- ...
-- Crear la tabla de usuarios para administración
CREATE TABLE
    IF NOT EXISTS usuarios (
        id_usuario SERIAL PRIMARY KEY,
        -- nombre_usuario VARCHAR(100) UNIQUE NOT NULL, -- Lo cambiaremos a email
        email VARCHAR(255) UNIQUE NOT NULL, -- Email para login, reemplaza nombre_usuario
        password_hash VARCHAR(255), -- Puede ser NULL hasta que se establezca/confirme
        nombre_completo VARCHAR(200), -- Nombre visible/real del usuario
        foto_perfil_url TEXT, -- URL a la imagen de perfil (o podrías guardar el binario)
        rol VARCHAR(50) NOT NULL DEFAULT 'usuario', -- Rol por defecto para nuevos usuarios
        activo BOOLEAN DEFAULT TRUE, -- Para desactivar cuentas por un admin
        correo_validado BOOLEAN DEFAULT FALSE,
        token_validacion_correo VARCHAR(255) UNIQUE, -- Token para validar email
        token_validacion_correo_expira TIMESTAMP
        WITH
            TIME ZONE,
            token_reseteo_password VARCHAR(255) UNIQUE, -- Token para resetear contraseña
            token_reseteo_password_expira TIMESTAMP
        WITH
            TIME ZONE,
            fecha_creacion TIMESTAMP
        WITH
            TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            ultimo_login TIMESTAMP
        WITH
            TIME ZONE
    );

-- Crear un índice en email para búsquedas rápidas y login
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios (email);

CREATE INDEX IF NOT EXISTS idx_usuarios_token_validacion ON usuarios (token_validacion_correo);

CREATE INDEX IF NOT EXISTS idx_usuarios_token_reseteo ON usuarios (token_reseteo_password);

-- Insertar un usuario administrador inicial (usando email ahora)
INSERT INTO
    usuarios (
        email,
        password_hash,
        rol,
        correo_validado,
        activo,
        nombre_completo
    )
VALUES
    (
        'hgatica@scspr.gob.gt', -- Cambia esto por el email real del admin
        '$2b$10$VeQXJIs4VovGb25.SRXy7OmstsM/GLBy38rpAzSsWVCtsslxz2MSi', -- Tu hash existente
        'admin',
        TRUE, -- El admin ya está validado y activo
        TRUE,
        'Administrador SCSPR' -- Nombre para el admin
    );

-- SELECT 'Script de inicialización de la base de datos de usuarios globales completado.';