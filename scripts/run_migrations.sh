#!/usr/bin/env bash
# ==============================================================================
# Script de Ejecución Segura de Migraciones e Inicialización (PostgreSQL)
# Monorepo: denuncias-scsp
# ==============================================================================

set -eo pipefail

# Colores para salida limpia
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuración por defecto usando variables de entorno o valores fallback de docker-compose
CONTAINER_NAME="${PGCONTAINER:-denuncias_db}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
MIGRATIONS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/database/migrations"

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}     EJECUTOR SEGURO DE MIGRACIONES - SCSP          ${NC}"
echo -e "${BLUE}=====================================================${NC}"

# 1. Verificar si el contenedor de Postgres está en ejecución
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo -e "${RED}Error: El contenedor '${CONTAINER_NAME}' no está corriendo.${NC}"
  echo -e "Asegúrate de haber iniciado docker con: ${YELLOW}docker compose up -d postgres${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Contenedor PostgreSQL detectado: ${CONTAINER_NAME}${NC}\n"

# 2. Asegurar la existencia de la tabla de control de migraciones en db_master/postgres
docker exec -i "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d postgres -c "
CREATE TABLE IF NOT EXISTS _schema_migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    target_db VARCHAR(100) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
" > /dev/null

# 3. Mapeo de archivos de migración a su base de datos destino correspondiente
get_target_db() {
  local filename="$1"
  case "$filename" in
    *core_humanis*|*biometrica*|*vacaciones*|*nomina*|*reclutamiento*|*hiring*|*capacitacion*|*renglones_subgrupo18*)
      echo "db_core_humanis"
      ;;
    *transportes*)
      echo "db_transportes_scspr"
      ;;
    *plan_medios*)
      echo "planmedios"
      ;;
    *impresiones*)
      echo "db_impresiones"
      ;;
    *juicio*|*historialprocesal*)
      echo "db_juridica"
      ;;
    *)
      echo "db_global_users"
      ;;
  esac
}

TARGET_FILTER="${1:-db_core_humanis}"

echo -e "${YELLOW}Escaneando migraciones para objetivo: ${BLUE}${TARGET_FILTER}${NC}"
echo -e "${YELLOW}Directorio: ${MIGRATIONS_DIR}${NC}\n"

COUNT_EXECUTED=0
COUNT_SKIPPED=0

for migration_file in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
  filename=$(basename "$migration_file")
  target_db=$(get_target_db "$filename")

  # Filtrar estrictamente solo el objetivo deseado (por defecto db_core_humanis)
  if [ "$target_db" != "$TARGET_FILTER" ]; then
    continue
  fi

  # Verificar si la migración ya fue registrada
  ALREADY_RUN=$(docker exec -i "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d postgres -tAc \
    "SELECT COUNT(*) FROM _schema_migrations WHERE filename='$filename';")

  if [ "$ALREADY_RUN" -gt 0 ]; then
    echo -e " ⏭️  ${YELLOW}[OMITIDO]${NC} $filename (Ya fue ejecutada previamente)"
    COUNT_SKIPPED=$((COUNT_SKIPPED + 1))
  else
    echo -e " 🚀 ${GREEN}[EJECUTANDO]${NC} $filename -> ${BLUE}$target_db${NC}..."

    # Ejecutar script SQL en la base de datos destino
    if docker exec -i "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$target_db" -v ON_ERROR_STOP=1 < "$migration_file"; then
      # Registrar migración exitosa
      docker exec -i "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d postgres -c \
        "INSERT INTO _schema_migrations (filename, target_db) VALUES ('$filename', '$target_db');" > /dev/null
      echo -e "    ${GREEN}✓ Completado con éxito.${NC}"
      COUNT_EXECUTED=$((COUNT_EXECUTED + 1))
    else
      echo -e "    ${RED}❌ ERROR ejecutando $filename. Proceso detenido.${NC}"
      exit 1
    fi
  fi
done

echo -e "\n${BLUE}=====================================================${NC}"
echo -e "${GREEN}Resumen de Ejecución (${TARGET_FILTER}):${NC}"
echo -e "  Migraciones aplicadas: ${GREEN}${COUNT_EXECUTED}${NC}"
echo -e "  Migraciones omitidas:  ${YELLOW}${COUNT_SKIPPED}${NC}"
echo -e "${BLUE}=====================================================${NC}"

