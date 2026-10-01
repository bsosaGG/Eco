#!/bin/sh
# =========================================================
# setup_plan_medios.sh
# Crea TODO lo de Plan de Medios en un db_master que ya está corriendo:
#   1) el usuario    usr_plan_medios_scspr        (contraseña: POSTGRES_PASSWORD_PLAN_MEDIOS del .env)
#   2) la base       db_plan_medios_scspr
#   3) las tablas    (database/init_plan_medios.sql)
#   4) los permisos  plan-medios:* en db_global_users (los usuarios/roles/permisos siguen centralizados allá)
#
# Es IDEMPOTENTE: se puede correr de nuevo sin perder datos (no borra nada).
# Corre DENTRO del contenedor de Postgres, que ya recibe el .env de la raíz:
#
#   docker compose exec -T db_master sh /sql_scripts/scripts/setup_plan_medios.sh
#
# (En Git Bash de Windows anteponga MSYS_NO_PATHCONV=1 al comando; en PowerShell no hace falta.)
# =========================================================
set -e

APP_USER="usr_plan_medios_scspr"
APP_DB="db_plan_medios_scspr"
USERS_DB="db_global_users"
SQL_DIR="${SQL_DIR:-/sql_scripts}"
DB_ROOT_USER="${POSTGRES_USER:-postgres}"
DB_ROOT_DB="${POSTGRES_DB:-postgres}"

if [ -z "$POSTGRES_PASSWORD_PLAN_MEDIOS" ]; then
    echo "ERROR: falta POSTGRES_PASSWORD_PLAN_MEDIOS en el .env de la raíz (contraseña del usuario $APP_USER)." >&2
    exit 1
fi
for file in "$SQL_DIR/init_plan_medios.sql" "$SQL_DIR/migrations/20260907_add_plan_medios_permissions.sql"; do
    if [ ! -f "$file" ]; then
        echo "ERROR: no se encontró $file (¿el volumen ./database está montado en $SQL_DIR?)." >&2
        exit 1
    fi
done

root_psql() { psql -v ON_ERROR_STOP=1 --username "$DB_ROOT_USER" "$@"; }

echo "==========================================="
echo ">> Plan de Medios: creando usuario, base, tablas y permisos"
echo "==========================================="

echo "-> Usuario '$APP_USER'..."
root_psql --dbname "$DB_ROOT_DB" <<EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$APP_USER') THEN
        CREATE ROLE $APP_USER WITH LOGIN PASSWORD '$POSTGRES_PASSWORD_PLAN_MEDIOS';
    ELSE
        ALTER ROLE $APP_USER WITH PASSWORD '$POSTGRES_PASSWORD_PLAN_MEDIOS';
    END IF;
END
\$\$;
EOF

echo "-> Base de datos '$APP_DB'..."
DB_EXISTS=$(root_psql --dbname "$DB_ROOT_DB" -tAc "SELECT 1 FROM pg_database WHERE datname='$APP_DB'")
if [ "$DB_EXISTS" != "1" ]; then
    root_psql --dbname "$DB_ROOT_DB" -c "CREATE DATABASE $APP_DB OWNER $APP_USER;"
else
    echo "   (ya existía)"
fi
root_psql --dbname "$DB_ROOT_DB" -c "GRANT ALL PRIVILEGES ON DATABASE $APP_DB TO $APP_USER;"

echo "-> Tablas (init_plan_medios.sql)..."
root_psql --dbname "$APP_DB" -f "$SQL_DIR/init_plan_medios.sql"

echo "-> Permisos de acceso a las tablas para '$APP_USER'..."
root_psql --dbname "$APP_DB" <<EOF
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $APP_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $APP_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $APP_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $APP_USER;
EOF

echo "-> Permisos plan-medios:* en $USERS_DB (usuarios y roles centralizados)..."
root_psql --dbname "$USERS_DB" -f "$SQL_DIR/migrations/20260907_add_plan_medios_permissions.sql"

echo "-> Verificación..."
TABLES=$(root_psql --dbname "$APP_DB" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'")
PERMS=$(root_psql --dbname "$USERS_DB" -tAc "SELECT count(*) FROM permisos WHERE clave_permiso LIKE 'plan-medios:%'")
echo "   tablas en $APP_DB: $TABLES (esperadas: 8)"
echo "   permisos plan-medios:* en $USERS_DB: $PERMS (esperados: 4)"

echo "==========================================="
echo ">> Listo. Siguiente paso: cargar el catálogo de medios (ver scripts/plan-medios/README.md)"
echo "==========================================="
