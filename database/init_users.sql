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


-- =========== NUEVAS TABLAS PARA PERMISOS Y PERFILES ===========

-- 1. Tabla de Permisos: Define cada acción atómica posible en el sistema.
CREATE TABLE
    IF NOT EXISTS permisos (
        id_permiso SERIAL PRIMARY KEY,
        clave_permiso VARCHAR(255) UNIQUE NOT NULL, -- Ejemplo: 'inv-item:read', 'inv-item:create'
        descripcion TEXT
    );

CREATE INDEX IF NOT EXISTS idx_permisos_clave ON permisos (clave_permiso);

-- 2. Tabla de Perfiles: Agrupa un conjunto de permisos.
CREATE TABLE
    IF NOT EXISTS perfiles (
        id_perfil SERIAL PRIMARY KEY,
        nombre_perfil VARCHAR(100) UNIQUE NOT NULL, -- Ejemplo: 'Administrador de Inventario', 'Auditor'
        descripcion TEXT
    );

-- 3. Tabla de enlace Muchos-a-Muchos: Usuario <-> Perfil
CREATE TABLE
    IF NOT EXISTS usuario_perfiles (
        id_usuario INTEGER NOT NULL REFERENCES usuarios (id_usuario) ON DELETE CASCADE,
        id_perfil INTEGER NOT NULL REFERENCES perfiles (id_perfil) ON DELETE CASCADE,
        PRIMARY KEY (id_usuario, id_perfil)
    );

-- 4. Tabla de enlace Muchos-a-Muchos: Perfil <-> Permiso
CREATE TABLE
    IF NOT EXISTS perfil_permisos (
        id_perfil INTEGER NOT NULL REFERENCES perfiles (id_perfil) ON DELETE CASCADE,
        id_permiso INTEGER NOT NULL REFERENCES permisos (id_permiso) ON DELETE CASCADE,
        PRIMARY KEY (id_perfil, id_permiso)
    );

-- 5. Tabla de enlace Muchos-a-Muchos: Usuario <-> Permiso (para permisos directos)
CREATE TABLE
    IF NOT EXISTS usuario_permisos (
        id_usuario INTEGER NOT NULL REFERENCES usuarios (id_usuario) ON DELETE CASCADE,
        id_permiso INTEGER NOT NULL REFERENCES permisos (id_permiso) ON DELETE CASCADE,
        PRIMARY KEY (id_usuario, id_permiso)
    );

-- =========== DATOS DE EJEMPLO PARA INICIAR ===========
-- Insertar los permisos que necesitaremos para el módulo de inventario
INSERT INTO
    permisos (clave_permiso, descripcion)
VALUES
    ('inv-item:read', 'Permite leer/consultar items del inventario'),
    ('inv-item:create', 'Permite crear nuevos items en el inventario'),
    ('inv-item:update', 'Permite actualizar items del inventario'),
    ('inv-item:delete', 'Permite eliminar items del inventario'),
    ('pac-item:read', 'Permite consultar la información y detalles de los PAC.'),
    ('pac-item:create', 'Permite registrar nuevos PAC en el sistema.'),
    ('pac-item:manage-status', 'Permite cambiar el estado de un PAC existente.'),
    ('pac-reports:read', 'Permite visualizar y generar reportes de PAC.'),
    ('cloudflare-requests:read', 'Permite acceder a la funcionalidad de peticiones a Cloudflare'),
    ('monitoring:read', 'Permite ver el dashboard de monitoreo.'),
    ('monitoring:create', 'Permite añadir nuevos servidores/sitios para monitorear.'),
    ('monitoring:update', 'Permite editar la configuración de un servidor/sitio.'),
    ('monitoring:delete', 'Permite eliminar un servidor/sitio del monitoreo.'),
    ('external-reports:read', 'Acceder a la página de Reportes Externos (Prensa, Guinadri).')
    ('extl-rprts-prensa:read', 'Acceder a la página de Reportes Externos (Prensa, Guinadri) y generar reporte de Prensa.'),
    ('extl-rprts-guinadri:read', 'Acceder a la página de Reportes Externos (Prensa, Guinadri) y generar reporte de Guinadri.'),
    ('extl-rprts-guinadri:update', 'Acceder a la página de Reportes Externos (Prensa, Guinadri) y reestablecer usuario Guinadri.'),
    ('extl-rprts-srvcios-gnrls:delete', 'Permite eliminar un registro de solicitud.')
        ON CONFLICT (clave_permiso) DO NOTHING;

-- Crear un perfil de ejemplo
INSERT INTO
    perfiles (nombre_perfil, descripcion)
VALUES
    (
        'Lector de Inventario',
        'Solo puede ver los items del inventario'
    ) ON CONFLICT (nombre_perfil) DO NOTHING;

-- Asignar el permiso de lectura al perfil "Lector de Inventario"
-- (Asegúrate de que los datos de arriba ya existan)
DO $$
DECLARE
    id_p_lector INT;
    id_perm_read INT;
BEGIN
    SELECT id_perfil INTO id_p_lector FROM perfiles WHERE nombre_perfil = 'Lector de Inventario';
    SELECT id_permiso INTO id_perm_read FROM permisos WHERE clave_permiso = 'inv-item:read';

    IF FOUND AND id_p_lector IS NOT NULL AND id_perm_read IS NOT NULL THEN
        INSERT INTO perfil_permisos (id_perfil, id_permiso)
        VALUES (id_p_lector, id_perm_read)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- SELECT 'Script de permisos y perfiles añadido.';