---
name: integrar-modulo
description: >-
  Automatiza la integración o sincronización de un submódulo institucional (ej. core-humanis,
  adquisiciones, etc.) dentro del monorepo denuncias-scsp. Ejecuta el protocolo completo:
  base de datos PostgreSQL, API backend central, micro-frontend Vue 3, Nginx proxy y tarjeta en admin-panel.
---

# Procedimiento de Integración de Módulos en `denuncias-scsp`

Utiliza este procedimiento cuando el usuario pida:
- `"integra el módulo <ruta o nombre>"`
- `"sincroniza el módulo <nombre>"`
- `"agrega el módulo <nombre> a denuncias-scsp"`

---

## Convenciones del Proyecto `denuncias-scsp`

- **Raíz del Monorepo:** `C:\gob.gt\denuncias-scsp`
- **Red Docker:** `app_main_network` (bridge)
- **Base de Datos:** Contenedor maestro `db_master_container` (PostgreSQL 15).
  - Usuario: `usr_<modulo>_scspr`
  - Base de datos: `db_<modulo>`
  - Contraseña en `.env`: `POSTGRES_PASSWORD_<MODULO_UPPERCASE>`
- **API Central:** Contenedor `api_main_container` expuesto internamente en el puerto 3000 y bajo `/api` a través del proxy Nginx.
- **Nginx Proxy:** Contenedor `nginx_proxy_container` expuesto en el puerto host `8080`.
- **Admin Panel:** Aplicación principal en `admin_app_container` montada en `/`.

---

## Flujo de Trabajo Automatizado (Paso a Paso)

### 1. Base de Datos y Permisos
1. **Copiar scripts SQL:**
   - Script de esquema: copiar `<modulo>/database/init_<modulo>.sql` a `c:\gob.gt\denuncias-scsp\database\init_<modulo>.sql`.
   - Script de permisos: copiar migraciones de permisos de `<modulo>/database/migrations/` a `database/migrations/`.
2. **Actualizar `database/init_master.sh`:**
   - Agregar a la variable `APPS`:
     `<ModuloPascalCase>:usr_<modulo>_scspr:db_<modulo>:$POSTGRES_PASSWORD_<MODULO_UPPERCASE>:init_<modulo>.sql`
3. **Actualizar `.env`:**
   - Agregar contraseña: `POSTGRES_PASSWORD_<MODULO_UPPERCASE>=...`
   - Agregar bloque de conexión:
     ```env
     <MODULO_UPPERCASE>_DB_HOST=db_master
     <MODULO_UPPERCASE>_DB_PORT=5432
     <MODULO_UPPERCASE>_DB_USER=usr_<modulo>_scspr
     <MODULO_UPPERCASE>_DB_PASSWORD=${POSTGRES_PASSWORD_<MODULO_UPPERCASE>}
     <MODULO_UPPERCASE>_DB_NAME=db_<modulo>
     <MODULO_UPPERCASE>_DATABASE_URL=postgresql://${<MODULO_UPPERCASE>_DB_USER}:${POSTGRES_PASSWORD_<MODULO_UPPERCASE>}@${<MODULO_UPPERCASE>_DB_HOST}:5432/${<MODULO_UPPERCASE>_DB_NAME}
     ```
4. **Ejecutar en la base de datos activa (`db_master_container`):**
   - Crear rol si no existe: `CREATE ROLE usr_<modulo>_scspr WITH LOGIN PASSWORD '...';`
   - Crear base de datos: `CREATE DATABASE db_<modulo> OWNER usr_<modulo>_scspr;`
   - Aplicar esquema: `cmd /c "docker exec -i db_master_container psql -U usr_<modulo>_scspr -d db_<modulo> < database/init_<modulo>.sql"`
   - Aplicar permisos a `db_global_users`: `cmd /c "docker exec -i db_master_container psql -U usr_global_users -d db_global_users < database/migrations/<script_permisos>.sql"`

---

### 2. Backend (API Central)
1. **Verificar dependencias adicionales en `api/package.json`:**
   - Si el módulo requiere dependencias como `qrcode`, agrégalas a `api/package.json`.
2. **Copiar archivos de Backend:**
   - Copiar controladores a `api/src/controllers/`. **REGLA CRÍTICA:** No sobrescribir nunca `api/src/controllers/auth.controller.js` (es la autenticación central). Si el módulo incluye su propio `auth.controller.js`, renómbralo a `<modulo>-auth.controller.js`.
   - Copiar servicios a `api/src/services/`.
   - Copiar configuraciones y utilidades (`db-<modulo>.js`, mock stores, helpers HATEOAS, etc.).
   - Copiar rutas a `api/src/routes/<modulo>.routes.js`.
3. **Montar rutas en `api/src/app.js`:**
   - Añadir:
     ```javascript
     app.use("/api/<modulo>", require("./routes/<modulo>.routes"));
     app.use("/api/v1/<modulo>", require("./routes/<modulo>.routes")); // Alias si usa HATEOAS
     ```
4. **Variables en `docker-compose.yml` (`denuncias_api_scspr`):**
   - Mapear las variables de entorno de la base de datos del módulo (`<MODULO_UPPERCASE>_DATABASE_URL`, etc.).

---

### 3. Micro-frontend (`<modulo>-app`)
1. **Copiar frontend:**
   - Copiar carpeta a `c:\gob.gt\denuncias-scsp\<modulo>-app`.
2. **Estandarizar Nginx interno:**
   - Asegurar que `<modulo>-app/nginx.conf` tenga el patrón estándar:
     ```nginx
     server {
         listen 80;
         server_name localhost;
         root /usr/share/nginx/html;
         index index.html;
         location / {
             try_files $uri $uri/ /index.html;
         }
     }
     ```
3. **Registrar servicio en `docker-compose.yml`:**
   ```yaml
   <modulo>_app:
     build:
       context: ./<modulo>-app
       dockerfile: Dockerfile
     container_name: <modulo>_app_container
     restart: unless-stopped
     networks:
       - app_main_network
     depends_on:
       - denuncias_api_scspr
   ```
4. **Añadir a `depends_on` de `nginx` en `docker-compose.yml`:**
   - Incluir `- <modulo>_app`.

---

### 4. Reverse Proxy Nginx & Admin Panel Dashboard
1. **Proxy en `nginx/default.conf`:**
   - Añadir bloque de redirección:
     ```nginx
     # Redirigir /<modulo> al contenedor <modulo>_app
     location /<modulo> {
         proxy_pass http://<modulo>_app_container:80/;
         proxy_set_header Host $host;
         proxy_set_header X-Real-IP $remote_addr;
         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
     }
     ```
2. **Admin Panel:**
   - En `admin-panel/src/stores/auth.store.ts`: agregar getter `hasAny<Modulo>Permission`.
   - En `admin-panel/src/views/HomeView.vue`: agregar la tarjeta correspondiente apuntando a `/<modulo>/`.

---

### 5. Compilación, Despliegue y Verificación
1. **Limpiar posibles contenedores huérfanos con el mismo nombre:**
   - `docker rm -f <modulo>_app_container` (si existe de pruebas previas).
2. **Construir y levantar:**
   - `docker compose up -d --build denuncias_api_scspr <modulo>_app admin_app nginx`
3. **Verificar estado:**
   - `docker compose ps`
   - Comprobar respuesta HTTP en `http://localhost:8080/<modulo>/`.
