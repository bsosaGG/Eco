#!/usr/bin/env bash
# Siembra datos DUMMY de Adquisiciones (27 expedientes en los 11 estados).
# Requisitos: contenedor db_master_container arriba y las 3 migraciones de usuarios/perfiles
# ya corridas (scripts/adquisiciones/2026091*_*.sql y 20260925_seed_adquisiciones_usuarios.sql).
# Ejecutar desde la raíz del repo:  bash scripts/adquisiciones/seed_adquisiciones_data.sh
# ⚠ Borra los datos operativos de db_adquisiciones_scspr (no toca catálogos ni proveedores).
set -euo pipefail

CONTAINER="${DB_CONTAINER:-db_master_container}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/../.." && pwd)"

uid() {
  local id
  id=$(docker exec -i "$CONTAINER" psql -U usr_global_users -d db_global_users -tA \
        -c "SELECT id_usuario FROM usuarios WHERE email = '$1'" | tr -d '[:space:]')
  if [[ -z "$id" ]]; then
    echo "ERROR: no existe el usuario $1 en db_global_users. Corre primero 20260925_seed_adquisiciones_usuarios.sql" >&2
    exit 1
  fi
  echo "$id"
}

echo "Resolviendo usuarios de prueba..."
docker exec -i "$CONTAINER" psql -U postgres -d db_adquisiciones_scspr -v ON_ERROR_STOP=1 \
  -v u_solicitante="$(uid solicitante.adquisiciones@scspr.gob.gt)" \
  -v u_recepcion="$(uid recepcion.adquisiciones@scspr.gob.gt)" \
  -v u_analista="$(uid analista.adquisiciones@scspr.gob.gt)" \
  -v u_asistente="$(uid asistente.presupuesto@scspr.gob.gt)" \
  -v u_encargado="$(uid encargado.presupuesto@scspr.gob.gt)" \
  -v u_udaf="$(uid jefe.udaf@scspr.gob.gt)" \
  -v u_jefe="$(uid jefe.adquisiciones@scspr.gob.gt)" \
  -v u_directora="$(uid directora.general@scspr.gob.gt)" \
  -v u_contabilidad="$(uid contabilidad.adquisiciones@scspr.gob.gt)" \
  -v u_subdespacho="$(uid subdespacho.adquisiciones@scspr.gob.gt)" \
  < "$DIR/seed_adquisiciones_data.sql"

# PDF de relleno al que apuntan los documentos de soporte sembrados (evita 404 al abrirlos).
DEST="$ROOT/uploads_scspr/adquisiciones/documentos-soporte"
mkdir -p "$DEST"
printf '%%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 100]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 58>>stream\nBT /F1 14 Tf 20 50 Td (Documento de prueba - seed) Tj ET\nendstream\nendobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%%%EOF\n' > "$DEST/seed-placeholder.pdf"
echo "Listo. PDF de relleno en $DEST/seed-placeholder.pdf"
