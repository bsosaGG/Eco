# Módulo Plan de Medios

Formulario Automatizado de Plan de Medios, integrado al core de denuncias con el mismo patrón que
Adquisiciones: **API Express** (`api/`) + **app Vue** (`plan-medios-app/`). Reemplaza al proyecto Python
(`plan-medios/`, FastAPI + Jinja), que ya no interviene.

## Qué cambió respecto al proyecto Python

| Antes (Python) | Ahora |
| --- | --- |
| FastAPI + Jinja2 (`index.html` de 3000 líneas) | API Express + Vue 3 (componentes por etapa) |
| Login propio (cookie/JWT, mock login) | Login, roles y permisos **del core** (JWT de `/api/auth`, permisos `plan-medios:*`) |
| Modo "legacy" (JSON + SQLite) o PostgreSQL | **Solo PostgreSQL** (SQLite/JSON obsoletos, no se portaron) |
| Contenedor Python detrás de un proxy en el API | Lógica nativa en el API; sin proxy |
| Una pantalla con JS embebido | `ExpedientesView`, `ExpedienteCreateView`, `ExpedienteDetailView` (4 etapas), `ExpedienteAuditView` |

**Base de datos:** se usa la BD `planmedios` que ya existe, **sin modificarla** (no se crean ni alteran tablas;
`database/init_plan_medios.sql` queda vacío como estaba). El código se adapta al esquema existente: genera
él mismo los UUID, la versión y `updated_at`, y no depende de valores por defecto que la BD no tenga.

## Estructura

```
api/src/
  routes/planMedios.routes.js           rutas + permisos + validación de entrada
  controllers/planMedios.controller.js  capa HTTP delgada (sin reglas de negocio)
  middleware/uploadBriefPlanMedios.js   subida del Brief (PDF/DOCX, 25 MB)
  config/db-plan-medios.js              pool de la BD planmedios (con adaptador para pruebas)
  config/plan-medios.config.js          rutas de archivos, límites, URLs de LanguageTool/Ollama
  templates/plan-medios/                plantillas oficiales (Word y Excel)
  services/plan-medios/
    *.service.js                        casos de uso (expedientes, documento Word, solicitudes de compra,
                                        ranking, catálogo, auditoría, corrector ortográfico)
    expediente-persistence.js           guardado transaccional: expediente + medios + auditoría
    domain/                             reglas puras, sin I/O (justificación, auditoría, prioridades,
                                        scoring, solicitud de compra, aplicar cambios del formulario)
    documents/                          lectura del Brief (DOCX), generación de Word y Excel (OOXML)
    integrations/                       LanguageTool y Ollama (opcionales)
    repositories/                       SQL por tabla
    errors.js                           errores de dominio con `statusCode` (los resuelve el errorHandler del core)
    storage.js                          archivos de cada expediente
plan-medios-app/src/
  views/ components/stage1..4/ stores/expediente.store.js composables/ utils/ services/
```

Flujo de una petición: `routes → controller → service (caso de uso) → repository / domain / documents`.
Los errores se lanzan como `ValidationError` (400), `NotFoundError` (404), `ConflictError` (409),
`ExternalServiceError` (502) o `DocumentError` (422) y los traduce el `errorHandler` global.

## Permisos (ya existen en `db_global_users`)

| Permiso | Permite |
| --- | --- |
| `plan-medios:read` | Consultar expedientes, ranking, catálogo, auditoría y usar el corrector ortográfico |
| `plan-medios:create` | Subir un Brief (crear expediente) |
| `plan-medios:update` | Guardar el formulario, agregar términos al diccionario, borrador con IA |
| `plan-medios:export` | Generar y descargar el Plan de Medios (Word) y las Solicitudes de Compra (Excel) |

El rol `admin` tiene acceso a todo. La app Vue no tiene login propio: usa la sesión del login compartido
(`/login`, admin-panel) igual que `adquisiciones-app`.

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
  guardar (si no es borrador) y en la persistencia al marcar "Plan de Medios generado".
* **Auditoría inmutable** de selecciones, ordenada por `sequence` (no por fecha), registrada en la misma
  transacción que el guardado.
* **Neutralidad** de la Solicitud de Compra: nunca nombra al proveedor ni usa datos de scoring.
* **Scoring determinista** (`deterministic_weighted_rules_v1_2`). Las prioridades de la Etapa 2 se guardan
  pero todavía no alteran el ranking (igual que el sistema original).
* Identificadores de medios del catálogo: el formulario y los expedientes guardados usan un entero (posición
  del medio al ordenar el catálogo por UUID). Se mantiene para no invalidar expedientes existentes; **no
  agregar ni quitar medios del catálogo sin revisar el impacto** sobre ese número.

## Diferencias deliberadas

* Un **PDF** crea el expediente con los 17 campos en blanco para llenado manual (el manual lo describe así,
  pero el sistema original fallaba al abrirlo). La extracción con IA de PDFs sigue sin conectarse.
* Al volver a guardar el formulario no se duplica la Solicitud de Compra ya generada del mismo medio.
* El Word generado se inserta en el orden de esquema que Word espera (`tcPr`/`rPr`).
* El buscador de expedientes también encuentra por campaña (antes solo por id, archivo y estado).

## Configuración (variables del API, ya en `docker-compose.yml`)

### Usar el `.env` del proyecto antiguo

El módulo lee las **mismas variables** que el proyecto Python. Para reutilizar su `.env`, pegue sus líneas
`PLAN_MEDIOS_*` en el **`.env` de la raíz de `denuncias-scsp/`** (el que ya lee `docker-compose.yml`) y levante:

```bash
docker compose up -d --build denuncias_api_scspr plan_medios_app nginx
```

No hay seeds ni migraciones: se conecta a la BD existente tal como está.

| Variable (igual que el proyecto antiguo) | Uso |
| --- | --- |
| `PLAN_MEDIOS_DATABASE_URL` | Conexión completa. Acepta `postgresql://…` y el formato `postgresql+psycopg://…` del Python. Si está, gana sobre las siguientes. |
| `PLAN_MEDIOS_DB_HOST`, `_PORT`, `_USER`, `_PASSWORD`, `_NAME` | Conexión por partes. Sin definir nada se usa `db_master` / `planmedios` / `planmedios_admin` con `POSTGRES_PASSWORD_PLAN_MEDIOS`. |
| `PLAN_MEDIOS_LANGUAGE_TOOL_URL` | Corrector ortográfico (por defecto el contenedor `languagetool`). |
| `OLLAMA_API_URL`, `OLLAMA_JUSTIFICATION_MODEL`, `OLLAMA_JUSTIFICATION_TIMEOUT_SECONDS` | Redactor local opcional. |

Se **ignoran** las del proyecto antiguo que ya no aplican, porque el login es el del core:
`PLAN_MEDIOS_JWT_*`, `PLAN_MEDIOS_SESSION_*`, `PLAN_MEDIOS_*MOCK*`, `PLAN_MEDIOS_AUTH_BASE_URL`,
`PLAN_MEDIOS_*BASE_PATH`, `PLAN_MEDIOS_PERSISTENCE_BACKEND`, `PLAN_MEDIOS_ENV`.

**Atención con el host de la BD:** el API corre dentro de un contenedor, así que `localhost`/`127.0.0.1` del
`.env` viejo apuntaría al propio contenedor. Use el nombre `db_master` (misma red de Docker) o la IP del servidor.

**Archivos de expedientes anteriores** (briefs y Word/Excel generados): quedan en `uploads_scspr/plan-medios/`
(`PLAN_MEDIOS_STORAGE_PATH` es fijo dentro del contenedor). La estructura es la misma que la del proyecto antiguo
(`expedientes/<id>/brief.docx`, `plan_medios_generado.docx`, `documentos/solicitud_compra_N.xlsx`): para ver los
documentos de expedientes viejos, copie esa carpeta `expedientes/` allí. Los datos en la BD no dependen de eso.

Sin Docker (`npm run debug` en `api/`) se usa el `.env` de `api/` con los mismos nombres.

## Pruebas

```bash
cd api && npm run test:plan-medios      # 73 pruebas
cd plan-medios-app && npm test          # 13 pruebas
```

* `golden.test.js` compara contra resultados del sistema Python original (briefs reales en
  `api/tests/plan-medios/fixtures/`): extracción del Brief, 459 candidatos de scoring, Word y solicitudes de compra.
* `api.integration.test.js` recorre el flujo completo por HTTP contra PostgreSQL en memoria (PGlite) con el
  esquema original (`fixtures/schema.sql`, generado de los modelos SQLAlchemy) y el middleware de autenticación real.
