# Módulo Plan de Medios

Formulario Automatizado de Plan de Medios, integrado al core de denuncias con el mismo patrón que
Adquisiciones: **API Express** (`api/`) + **app Vue** (`plan-medios-app/`). Reemplaza al proyecto Python
(`plan-medios/`, FastAPI + Jinja), que ya no interviene.

## Puesta en marcha (2 comandos)

```bash
# 1) Crea usuario, base, tablas y permisos (idempotente; db_master corriendo)
docker compose exec -T db_master sh /sql_scripts/scripts/setup_plan_medios.sh

# 2) Carga el catálogo de medios desde el Excel oficial
docker compose exec -T denuncias_api_scspr node scripts/plan-medios/import-catalog.js /usr/src/app/uploads/Medios.xlsx
```

Detalle, reinicio y cambio de contraseña: `scripts/plan-medios/README.md`.
Luego `docker compose up -d --build denuncias_api_scspr plan_medios_app nginx`.

## Base de datos nueva (desde cero)

* Base `db_plan_medios_scspr`, usuario `usr_plan_medios_scspr`, contraseña en `POSTGRES_PASSWORD_PLAN_MEDIOS`
  del `.env` (misma convención que `db_adquisiciones_scspr`). No reutiliza la base ni los datos del proyecto
  Python.
* **Usuarios, roles y permisos siguen centralizados en `db_global_users`**: el módulo no tiene tablas de
  usuarios. Las columnas `*_user_id` son referencias lógicas a `usuarios.id_usuario` (sin FK entre bases),
  acompañadas de una copia del correo/nombre para que el historial siga legible.
* Esquema en `database/init_plan_medios.sql` (8 tablas, idempotente). Respecto al diseño del proyecto
  anterior:

| Cambio | Por qué |
| --- | --- |
| `media_catalog.id` es un **entero** (identidad) en vez de UUID + "alias" calculado | Desaparece el número frágil que dependía del orden de los UUID; el id del medio es estable y real (FK en medios y auditoría). |
| `purchase_requests` se identifica por `(expediente_id, media_position)` (único) | Antes se perdía el enlace al reescribir los medios y había que buscar duplicados. |
| `selection_audit_events.id` es el orden oficial (en vez de `sequence` aparte) y la tabla es **inmutable en la BD** (triggers contra UPDATE/DELETE/TRUNCATE) | La inmutabilidad deja de depender de la aplicación. El expediente con historial no se puede borrar. |
| Trigger de **justificación obligatoria** en `expedientes` | Tercera capa de la regla de la Secretaría, ahora garantizada por la propia BD. |
| `created_by_*` en `expedientes` y `purchase_requests` | Trazabilidad de quién creó/generó, con usuarios centralizados. |

## Qué cambió respecto al proyecto Python

| Antes (Python) | Ahora |
| --- | --- |
| FastAPI + Jinja2 (`index.html` de 3000 líneas) | API Express + Vue 3 (componentes por etapa) |
| Login propio (cookie/JWT, mock login) | Login, roles y permisos **del core** (JWT de `/api/auth`, permisos `plan-medios:*`) |
| Modo "legacy" (JSON + SQLite) o PostgreSQL | **Solo PostgreSQL** (SQLite/JSON obsoletos, no se portaron) |
| Importador del catálogo a SQLite | Comando de Node que carga el Excel oficial a PostgreSQL |
| Contenedor Python detrás de un proxy en el API | Lógica nativa en el API; sin proxy |

## Estructura

```
api/src/
  routes/planMedios.routes.js           rutas + permisos + validación de entrada
  controllers/planMedios.controller.js  capa HTTP delgada (sin reglas de negocio)
  middleware/uploadBriefPlanMedios.js   subida del Brief (PDF/DOCX, 25 MB)
  config/db-plan-medios.js              conexión a la BD (acepta URL o PLAN_MEDIOS_DB_*)
  config/plan-medios.config.js          rutas de archivos, límites, URLs de LanguageTool/Ollama
  templates/plan-medios/                plantillas oficiales (Word y Excel)
  services/plan-medios/
    *.service.js                        casos de uso (expedientes, documento Word, solicitudes de compra,
                                        ranking, catálogo, auditoría, corrector, importación del catálogo)
    expediente-persistence.js           guardado transaccional: expediente + medios + auditoría
    domain/                             reglas puras, sin I/O (justificación, auditoría, prioridades,
                                        scoring, solicitud de compra, aplicar cambios del formulario)
    documents/                          lectura del Brief (DOCX), Word y Excel (OOXML), lectura del catálogo
    integrations/                       LanguageTool y Ollama (opcionales)
    repositories/                       SQL por tabla
    errors.js                           errores de dominio con `statusCode` (los resuelve el errorHandler del core)
    storage.js                          archivos de cada expediente
api/scripts/plan-medios/import-catalog.js   comando de carga del catálogo
database/init_plan_medios.sql               esquema
database/scripts/setup_plan_medios.sh       comando que crea usuario, base, tablas y permisos
plan-medios-app/src/
  views/ components/stage1..4/ stores/expediente.store.js composables/ utils/ services/
```

Flujo de una petición: `routes → controller → service (caso de uso) → repository / domain / documents`.
Los errores se lanzan como `ValidationError` (400), `NotFoundError` (404), `ConflictError` (409),
`ExternalServiceError` (502) o `DocumentError` (422) y los traduce el `errorHandler` global.

## Permisos (en `db_global_users`)

| Permiso | Permite |
| --- | --- |
| `plan-medios:read` | Consultar expedientes, ranking, catálogo, auditoría y usar el corrector ortográfico |
| `plan-medios:create` | Subir un Brief (crear expediente) |
| `plan-medios:update` | Guardar el formulario, agregar términos al diccionario, borrador con IA |
| `plan-medios:export` | Generar y descargar el Plan de Medios (Word) y las Solicitudes de Compra (Excel) |

El rol `admin` tiene acceso a todo. El comando de creación los inserta si faltan. La app Vue no tiene login
propio: usa la sesión del login compartido (`/login`, admin-panel) igual que `adquisiciones-app`, y el
admin-panel ya muestra la tarjeta "Plan de Medios" a quien tenga alguno de estos permisos.

## API (`/api/plan-medios`)

`GET /health` (sin sesión) · `GET /medios/catalogo/estado` · `GET /medios` · `GET /medios/:id` ·
`GET|POST /expedientes` · `GET /expedientes/:id` · `PUT /expedientes/:id/resumen` ·
`GET /expedientes/:id/ranking-medios` · `GET /expedientes/:id/auditoria` ·
`POST /expedientes/:id/plan-medios` · `GET /expedientes/:id/documentos/plan-medios` ·
`POST /expedientes/:id/solicitudes-compra/:n/{preparar|generar|justificacion-ia}` ·
`GET /expedientes/:id/documentos/solicitud-compra/:n` · `POST /revision-ortografica` ·
`POST /diccionario-institucional`.

`PUT .../resumen` recibe `version` (la que el cliente leyó): si otra persona guardó antes responde **409**
(bloqueo optimista, el control de concurrencia que describe el manual).

## Reglas que se conservaron

* **Justificación de selección:** obligatoria salvo la opción #1 del ranking. Se valida en el navegador, al
  guardar (si no es borrador), en la persistencia y ahora también con un trigger en la base de datos.
* **Auditoría inmutable** de selecciones, ordenada por `id` (no por fecha), registrada en la misma
  transacción que el guardado.
* **Neutralidad** de la Solicitud de Compra: nunca nombra al proveedor ni usa datos de scoring.
* **Scoring determinista** (`deterministic_weighted_rules_v1_2`). Las prioridades de la Etapa 2 se guardan
  pero todavía no alteran el ranking (igual que el sistema original).

## Diferencias deliberadas

* Un **PDF** crea el expediente con los 17 campos en blanco para llenado manual (el manual lo describe así,
  pero el sistema original fallaba al abrirlo). La extracción con IA de PDFs sigue sin conectarse.
* Al volver a guardar el formulario no se duplica la Solicitud de Compra ya generada del mismo medio.
* Un medio de catálogo inexistente se rechaza con un mensaje claro (400).
* El Word generado se inserta en el orden de esquema que Word espera (`tcPr`/`rPr`).
* El buscador de expedientes también encuentra por campaña (antes solo por id, archivo y estado).

## Configuración (variables del API, ya en `docker-compose.yml`)

El módulo lee las **mismas variables** que usaba el proyecto Python; basta con definirlas en el **`.env` de la
raíz de `denuncias-scsp/`**. El `.env` ya trae el bloque `PLAN_MEDIOS_DB_*` / `PLAN_MEDIOS_DATABASE_URL` (mismo
patrón que `ADQUISICIONES_*` y `CORE_HUMANIS_*`, apuntando a `db_plan_medios_scspr` con el usuario y la
contraseña de arriba); si se borra, el compose usa esos mismos valores por defecto.

| Variable | Uso |
| --- | --- |
| `POSTGRES_PASSWORD_PLAN_MEDIOS` | Contraseña de `usr_plan_medios_scspr` (la usa el comando de creación y el API). |
| `PLAN_MEDIOS_DATABASE_URL` | Conexión completa (opcional). Acepta `postgresql://…` y el formato `postgresql+psycopg://…`. Si está, gana sobre las siguientes. |
| `PLAN_MEDIOS_DB_HOST`, `_PORT`, `_USER`, `_PASSWORD`, `_NAME` | Conexión por partes (opcional). |
| `PLAN_MEDIOS_LANGUAGE_TOOL_URL` | Corrector ortográfico (por defecto el contenedor `languagetool`). |
| `OLLAMA_API_URL`, `OLLAMA_JUSTIFICATION_MODEL`, `OLLAMA_JUSTIFICATION_TIMEOUT_SECONDS` | Redactor local opcional. |

`PLAN_MEDIOS_STORAGE_PATH` es fijo dentro del contenedor (`/usr/src/app/uploads/plan-medios`, carpeta
persistente `uploads_scspr/`): briefs y documentos generados. Las variables de login/sesión del proyecto
antiguo (`PLAN_MEDIOS_JWT_*`, `PLAN_MEDIOS_SESSION_*`, `*MOCK*`, `*BASE_PATH`) se ignoran: el login es el del
core. LanguageTool y Ollama son opcionales: si no responden, el formulario sigue funcionando. Si usa un
host propio en la URL de la base, recuerde que dentro del contenedor `localhost` es el propio contenedor
(use `db_master`).

> El `.env` de esta carpeta está **versionado en git** (contiene contraseñas): no lo suba con valores reales.

## Pruebas

```bash
cd api && npm run test:plan-medios      # pruebas del API y de la base de datos
cd plan-medios-app && npm test          # pruebas del frontend
```

* `schema.test.js` ejecuta el `init_plan_medios.sql` real en PostgreSQL en memoria (PGlite) y prueba las
  reglas de la base: idempotencia, auditoría inmutable, justificación, llaves e integridad.
* `api.integration.test.js` recorre el flujo completo por HTTP contra ese mismo esquema, con el middleware de
  autenticación real del core.
* `catalog-import.test.js` carga el Excel oficial y lo compara campo por campo con lo que cargó el sistema
  Python (144 medios, 269 productos); prueba la re-carga sin cambiar ids.
* `golden.test.js` compara contra resultados del sistema Python original (briefs reales en
  `api/tests/plan-medios/fixtures/`): extracción del Brief, 459 candidatos de scoring, Word y solicitudes de compra.
