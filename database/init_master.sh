#!/bin/sh
set -e

echo "==========================================="
echo "INICIANDO MASTER ENTRYPOINT SCRIPT"
echo "==========================================="

# Convertido de arreglo a string multilinea para ser 100% compatible con Alpine (ash/sh)
APPS="
Users:usr_global_users:db_global_users:$POSTGRES_PASSWORD_USERS:init_users.sql
Denuncias:usr_denuncias_scspr:db_denuncias_scspr:$POSTGRES_PASSWORD_DENUNCIAS:init_denuncias.sql
Inventario:usr_inventario_scspr:db_inventario:$POSTGRES_PASSWORD_INVENTARIO:init_inventario.sql
Pac:usr_pac_scspr:db_pac_scspr:$POSTGRES_PASSWORD_PAC:init_pac.sql
Monitoreo:usr_monitoreo_scspr:db_monitoreo_scspr:$POSTGRES_PASSWORD_MONITOREO:init_monitoreo.sql
Documentos:usr_documentos_scspr:db_documentos_scspr:$POSTGRES_PASSWORD_DOCUMENTOS:init_documentos.sql
Agendas:usr_agendas_scspr:db_agendas:$POSTGRES_PASSWORD_AGENDAS:init_agendas.sql
Media:usr_media_listening:db_media_listening:$POSTGRES_PASSWORD_MEDIA:init_media_listening.sql
Calendar:usr_calendar_scspr:db_calendar:$POSTGRES_PASSWORD_CALENDAR:init_calendar.sql
Juridica:usr_juridica_scspr:db_juridica:$POSTGRES_PASSWORD_JURIDICA:init_juridica.sql
Impresiones:usr_impresiones_scspr:db_impresiones:$POSTGRES_PASSWORD_IMPRESIONES:init_impresiones.sql
"

DB_ROOT_USER=${POSTGRES_USER:-postgres}
DB_ROOT_DB=${POSTGRES_DB:-postgres}

for APP_INFO in $APPS; do
    APP_NAME=$(echo "$APP_INFO" | cut -d: -f1)
    APP_USER=$(echo "$APP_INFO" | cut -d: -f2)
    APP_DB=$(echo "$APP_INFO" | cut -d: -f3)
    APP_PASS=$(echo "$APP_INFO" | cut -d: -f4)
    APP_SQL_FILE=$(echo "$APP_INFO" | cut -d: -f5)

    echo "==========================================="
    echo ">> Configurando base de datos para: $APP_NAME"
    echo "==========================================="

    if [ -z "$APP_PASS" ]; then
        echo "⚠️  ADVERTENCIA: La contraseña para $APP_NAME ($APP_USER) no está definida."
    fi

    echo "-> Creando usuario '$APP_USER'..."
    psql -v ON_ERROR_STOP=1 --username "$DB_ROOT_USER" --dbname "$DB_ROOT_DB" <<EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$APP_USER') THEN
        CREATE ROLE $APP_USER WITH LOGIN PASSWORD '$APP_PASS';
    ELSE
        ALTER ROLE $APP_USER WITH PASSWORD '$APP_PASS';
    END IF;
END
\$\$;
EOF

    echo "-> Verificando existencia de la base de datos '$APP_DB'..."
    DB_EXISTS=$(psql -v ON_ERROR_STOP=1 --username "$DB_ROOT_USER" --dbname "$DB_ROOT_DB" -tAc "SELECT 1 FROM pg_database WHERE datname='$APP_DB'")
    
    if [ "$DB_EXISTS" != "1" ]; then
        echo "-> Creando base de datos '$APP_DB' y asignando dueño '$APP_USER'..."
        psql -v ON_ERROR_STOP=1 --username "$DB_ROOT_USER" --dbname "$DB_ROOT_DB" <<EOF
CREATE DATABASE $APP_DB OWNER $APP_USER;
EOF
    else
        echo "-> La base de datos '$APP_DB' ya existe."
    fi

    psql -v ON_ERROR_STOP=1 --username "$DB_ROOT_USER" --dbname "$DB_ROOT_DB" <<EOF
GRANT ALL PRIVILEGES ON DATABASE $APP_DB TO $APP_USER;
EOF

    SQL_PATH="/sql_scripts/$APP_SQL_FILE"
    
    if [ -f "$SQL_PATH" ]; then
        echo "-> Ejecutando archivo $APP_SQL_FILE en '$APP_DB'..."
        psql -v ON_ERROR_STOP=1 --username "$DB_ROOT_USER" --dbname "$APP_DB" -f "$SQL_PATH"
        
        echo "-> Otorgando permisos sobre las tablas a '$APP_USER'..."
        psql -v ON_ERROR_STOP=1 --username "$DB_ROOT_USER" --dbname "$APP_DB" <<EOF
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $APP_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $APP_USER;
EOF
        echo "-> Archivo $APP_SQL_FILE ejecutado exitosamente."
    else
        echo "-> AVISO: El archivo SQL $APP_SQL_FILE no se encontró en $SQL_PATH."
    fi
    echo "<< Configuración para $APP_NAME completada."
    echo ""
done

echo "==========================================="
echo ">> TODAS LAS BASES DE DATOS FUERON UNIFICADAS <<"
echo "==========================================="