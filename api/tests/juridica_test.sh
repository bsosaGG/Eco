#!/bin/bash

BASE_URL="http://localhost:3000/api"
EMAIL="test_juridica_update_$(date +%s)@scspr.gob.gt"
PASSWORD="TestPassword123!"

echo "--- 1. Registering Test User: $EMAIL ---"
curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$EMAIL"'",
    "password": "'"$PASSWORD"'",
    "confirm_password": "'"$PASSWORD"'",
    "nombre_completo": "Test Juridica User"
  }' > /dev/null

echo -e "\n\n--- 2. Granting Permissions ---"
docker compose exec users_db psql -U usr_global_users -d db_global_users -c "
DO \$\$
DECLARE
    uid INT;
BEGIN
    SELECT id_usuario INTO uid FROM usuarios WHERE email = '$EMAIL';
    IF uid IS NOT NULL THEN
        INSERT INTO usuario_permisos (id_usuario, id_permiso)
        SELECT uid, id_permiso FROM permisos WHERE clave_permiso LIKE 'juridica:%';
        -- Tambien necesitamos permiso de config para subir plantilla
        INSERT INTO usuario_permisos (id_usuario, id_permiso)
        SELECT uid, id_permiso FROM permisos WHERE clave_permiso = 'juridica:config'; 
    END IF;
END \$\$;
"

echo -e "\n--- 3. Login ---"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$EMAIL"'",
    "password": "'"$PASSWORD"'"
  }')
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
echo "Token obtained."

echo -e "\n--- 4. Testing Suggestions (Should be empty initially or requires text) ---"
echo "Query: ?field=juez (Should return [])"
curl -s -X GET "$BASE_URL/juridica/suggestions?field=juez" -H "Authorization: Bearer $TOKEN"
echo -e "\nQuery: ?field=juez&search=Juez (Should return results if any)"
curl -s -X GET "$BASE_URL/juridica/suggestions?field=juez&search=Juez" -H "Authorization: Bearer $TOKEN"


echo -e "\n\n--- 5. Uploading Template (Required for Export) ---"
# Creating a dummy docx file
echo "Dummy DOCX content" > dummy_template.docx

UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/juridica/config/templates" \
  -H "Authorization: Bearer $TOKEN" \
  -F "nombre=Plantilla Test" \
  -F "descripcion=Descripcion test" \
  -F "archivo=@dummy_template.docx")

echo $UPLOAD_RESPONSE
rm dummy_template.docx

echo -e "\n\n--- 6. Creating Case & Exporting ---"
# Create Case
CASE_ID=$(curl -s -X POST "$BASE_URL/juridica" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "numero_proceso": "TEST-EXPORT-'$(date +%s)'", "organo_jurisdiccional": "Juzgado Test", "juez": "Juez Test", "oficial": "Oficial Test", "demandante_id": "Pedro" }' \
  | grep -o '"id":[^,]*' | awk -F: '{print $2}')

echo "Case ID: $CASE_ID"

# Export
echo "Exporting DOCX..."
curl -v -X GET "$BASE_URL/juridica/$CASE_ID/export-docx" \
  -H "Authorization: Bearer $TOKEN" \
  -o "export_test.docx"

if [ -s "export_test.docx" ]; then
    echo "Export successful (file size > 0)"
else
    echo "Export failed"
fi
rm export_test.docx

echo "Done."
