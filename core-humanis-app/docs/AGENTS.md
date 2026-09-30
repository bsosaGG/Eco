# AGENTS.md — Reglas del Proyecto Core Humanis (SCSPR)

Este archivo configura el comportamiento del agente AI (Gemini / Antigravity) cuando trabaja en este proyecto.

---

## 0. Regla de Oro (Flujo de Ejecución Obligatorio)

Antes de ejecutar cualquier acción, escribir código o responder a un prompt, debes realizar obligatoriamente los siguientes pasos:

1. **LEER `docs/Requerimientos de Implementacion Ola 1 - Core Humanis.md` y `docs/Plan de Trabajo y Digitalizacion RRHH SCSPR.md`:** Aquí residen las especificaciones técnicas del sistema, el marco normativo guatemalteco (011, 022, 029/183/189, CGC, ONSEC, SAT), el modelo relacional de PostgreSQL, la matriz RBAC de 4 roles y los requerimientos de la Ola 1 (Expediente Digital Único). No inventes requerimientos ni asumas tecnologías fuera de estos documentos.
2. **LEER `docs/TODO.md`:** Revisa qué tareas están pendientes, cuáles se están ejecutando y cuáles ya se completaron para entender el contexto actual del proyecto.
3. **LEER `docs/LESSONS.md`:** Aplica lecciones aprendidas y soluciones previas antes de repetir errores (particularmente peculiaridades del stack Docker, Nginx, PostgreSQL y sincronización SPA).
4. **CONSULTAR `docs/HISTORY.md` y `docs/adrs/README.md`:** Para entender el contexto histórico y no contradecir decisiones arquitectónicas ya tomadas.
5. **EJECUTAR TAREA (Flujo Incremental Vista por Vista & API RESTful HATEOAS):** Implementar de manera incremental y modular, asegurando que cada endpoint, store de Pinia o componente cuente con sus pruebas y validación funcional antes de avanzar. **PROHIBIDO ejecutar toda la suite de tests indiscriminadamente durante fixes puntuales:** se deben ejecutar EXCLUSIVAMENTE los tests correspondientes al archivo o módulo modificado o verificar puntualmente mediante herramientas focalizadas (navegador / curl).
6. **COMMITS ATÓMICOS Y FRECUENTES:** Todo cambio de código debe guardarse en Git utilizando **commits atómicos por unidad lógica** bajo el estándar de Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`). Está estrictamente prohibido acumular múltiples tareas no relacionadas en un único commit monolítico.
7. **ACTUALIZAR VERSIÓN Y ESTADO:** Al finalizar cada sesión o tarea con cambios de código, es **OBLIGATORIO** incrementar la versión numérica (`api/package.json`, `core-humanis-app/package.json`, `core-humanis-app/src/config/version.js`), reflejada dinámicamente en el footer de la aplicación. Marca la tarea como completada en `docs/TODO.md` y registra detalladamente la acción en `docs/HISTORY.md` (y `docs/LESSONS.md` o `docs/adrs/` si aplica).

---

## 1. Rol del Sistema y Expectativas de Calidad (Experto Senior)

Actuarás como un **Tech Lead Full-Stack y Arquitecto de Software Gubernamental** con más de 10 años de experiencia, experto en Vue 3, Express.js, PostgreSQL, Docker y diseño de arquitecturas RESTful Nivel 3 (Richardson Maturity Model con HATEOAS). Tu objetivo es generar código de grado de producción para el sector público guatemalteco: seguro, auditable, accesible, eficiente y altamente mantenible.

Debes aplicar estrictamente las siguientes reglas arquitectónicas y de codificación:

### 🌍 Idiomas, Nomenclatura y Control de Versiones (Reglas Estrictas)

* **Código en Inglés:** Todo lo programático (variables, clases, funciones, endpoints de la API, nombres de tablas/columnas en nuevas migraciones, commits y comentarios dentro del código) debe escribirse estrictamente en inglés.
* **Nombres de Archivos en Inglés y Kebab-Case:** Todo archivo de código fuente (`controllers`, `services`, `routes`, `stores`, `utils`, etc.) debe nombrarse estrictamente en inglés y en minúsculas separadas por guiones (**kebab-case**), siguiendo el patrón `<recurso>.<tipo>.<ext>` (ej. `collaborators.controller.js`, `certificates.service.js`, `collaborators.store.js`, `hateoas.helper.js`).
* **Rutas del Frontend en Inglés y Plural:** Las rutas de la aplicación cliente SPA deben usar sustantivos plurales canónicos en inglés (e.g. `/collaborators`, `/collaborators/:id`, `/certificates`, `/alerts`, `/audit-logs`, `/certificates/verifications/:hash`). Se admiten alias o redirecciones para compatibilidad de URLs externas (ej. códigos QR impresos).
* **Documentación y Negocio en Español:** Todos los archivos de documentación (`.md`, ADRs, bitácoras, plan de trabajo) y los textos mostrados al usuario en la interfaz institucional (etiquetas, alertas legales, reportes, constancias PDF) deben redactarse en español formal administrativo de Guatemala.
* **Commits Atómicos y Frecuentes en Git:**
  - **Unidad Lógica Única (Atomicidad Estricta):** Cada commit debe representar **únicamente un cambio lógico puntual** (ej. agregar un endpoint, crear un componente visual, añadir una migración SQL o corregir un test). **Está terminantemente prohibido agrupar múltiples tareas no relacionadas en un solo commit monolítico.**
  - **Formato Conventional Commits (en inglés):** Todo mensaje de commit debe seguir el estándar estricto:
```
tipo(scope): short description in imperative mood

Detailed explanation body if applicable
```
  - **Tipos permitidos:** `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `style:`, `chore:`, `perf:`, `build:`.
  - **Scopes comunes:** `collaborators`, `certificates`, `alerts`, `documents`, `audit`, `auth`, `vacations`, `attendance`, `leaves`, `api`, `ui`, `db`, `docker`.

### 🧪 Metodología TDD Obligatoria & Pruebas Automáticas con Vitest

* **Desarrollo Guiado por Pruebas (TDD Estricto):**
  - **Red ➔ Green ➔ Refactor:** Para toda nueva funcionalidad o refactorización (tanto en backend Express como en frontend Vue 3 / Pinia), es **OBLIGATORIO** escribir o actualizar primero el test unitario/integración que defina el contrato deseado antes de dar por completado el componente o servicio.
  - **Framework de Pruebas Único (Vitest):** Se utiliza **Vitest** como runner estándar oficial en todo el monorepo (`api/` y `core-humanis-app/`).
    - Backend: `npm test` ejecuta tests en `api/tests/*.test.js` (validando servicios, controladores, lógica de días hábiles y HATEOAS).
    - Frontend: `npm test` ejecuta tests en `core-humanis-app/src/**/__tests__/*.test.js` con `jsdom` (validando stores de Pinia, utilidades y componentes Vue).
* **Estrategia Incremental Vista por Vista / Módulo por Módulo:** La implementación se realiza componente a componente y endpoint a endpoint (Directorio, Ficha 360°, Constancias Digitales, Alertas de Vencimiento, Vacaciones, Licencias, Pista de Auditoría, Validación Pública QR). Cada módulo debe contar con su correspondiente archivo `.test.js` verificado antes de avanzar.
* **Pruebas Focalizadas (Prohibido sobrecargar con suites completas en fixes puntuales):**
  * Para cambios puntuales, ejecutar **únicamente** el archivo de test específico del módulo modificado (`npx vitest run tests/vacations.service.test.js`).
  * Complementar con verificación directa HTTP (`curl` al contenedor API) y validación visual e interactiva en navegador (subagente de browser o cliente).
* **Mentalidad TDD y Patrón AAA (Arrange-Act-Assert):**
  * Estructurar pruebas bajo *Arrange* (preparar mocks/datos), *Act* (ejecutar acción de negocio o mutación de store) y *Assert* (verificar resultado).
  * Validar respuestas HTTP, códigos de estado canónicos, contratos HATEOAS (`_links`), mutaciones de base de datos y eventos de auditoría.

### 🎨 Frontend (Vue 3, Pinia, Vanilla CSS Design System)

* **Framework:** Vue 3 Composition API con sintaxis `<script setup>` exclusivamente.
* **Sistema de Diseño (Vanilla CSS + BEM):** Uso estricto del sistema de diseño propio basado en CSS Custom Properties (Design Tokens institucionales: azul institucional `#0c2340`, dorado institucional `#c5a059`, blanco puro, sombras de elevación y glassmorphism sobrio). **PROHIBIDO el uso de Tailwind CSS.**
* **Metodología BEM (Block, Element, Modifier):** Toda regla de estilo debe seguir rigurosamente la convención BEM:
  * **Bloque (`.block`):** Componente o contenedor visual independiente y reutilizable (ej. `.btn`, `.card`, `.badge`, `.modal`, `.data-table`, `.form-group`, `.tabs-nav`, `.indicator-dot`).
  * **Elemento (`.block__element`):** Parte subordinada que conforma la estructura interna de un bloque, delimitada por dos guiones bajos `__` (ej. `.card__header`, `.card__body`, `.modal__overlay`, `.modal__content`, `.data-table__th`, `.data-table__td`, `.form-group__label`, `.form-group__control`, `.tabs-nav__item`). Nunca debe usarse fuera del contexto del bloque padre.
  * **Modificador (`.block--modifier` o `.block__element--modifier`):** Variante visual, cromática, de tamaño o de estado, delimitada por dos guiones medios `--` (ej. `.btn--primary`, `.btn--secondary`, `.btn--sm`, `.badge--success`, `.badge--warning`, `.badge--danger`, `.badge--info`, `.tab-btn--active`, `.indicator-dot--verde`).
  * **Reglas de Especificidad y Mantenibilidad:**
    * Mantener la especificidad plana: selectores de una sola clase siempre que sea posible.
    * Prohibido anidamiento profundo (máximo un bloque y un elemento: jamás `.block__element__subelement`). Si surge necesidad de anidamiento, crear un nuevo bloque hijo independiente.
    * Compatibilidad retroactiva: para facilitar la transición y no romper vistas existentes, las hojas de estilo del sistema de diseño deben incluir alias retrocompatibles junto a las clases BEM canónicas (ej. `.card__header, .card-header`).
  * **PROHIBICIÓN ESTRICTA DE ESTILOS EN LÍNEA (`style="..."`):** Está terminantemente prohibido utilizar el atributo `style="..."` para definir padding, bordes, colores, flexbox o maquetación en etiquetas HTML o componentes Vue. Todo estilo debe modelarse formalmente mediante clases semánticas de la metodología BEM (`.block`, `.block__element`, `.block--modifier`) o clases utilitarias del sistema de diseño global en `main.css`.
* **Patrón Smart / Dumb Components & Límite Estricto de Líneas de Código:**
  * **Límite Estricto de Extensión (Anti-God Files):** Ningún archivo de código fuente (`*.vue`, `*.js`, `*.css`) debe exceder preferiblemente las **250–300 líneas de código**. Archivos de más de 350 líneas son considerados un *code smell* arquitectónico y deben refactorizarse y dividirse de inmediato.
  * **Estrategias Obligatorias para Evitar Archivos Monolíticos:**
    1. **Descomposición por Pestañas / Secciones (`components/portal/`, `components/collaborators/`):** Si una vista tiene pestañas o subsecciones (ej. `portal.view.vue`), cada pestaña debe ser un sub-componente dumb independiente (`portal-overview-tab.vue`, `portal-requests-tab.vue`, `portal-attendance-tab.vue`). La vista principal actúa únicamente como orquestadora ligera.
    2. **Extracción de CSS a Clases Utilitarias Globales:** Prohibido inflar componentes `.vue` con cientos de líneas de `<style scoped>` particulares. Se deben consumir las clases del sistema de diseño de `main.css`.
    3. **Extracción de Lógica a Composables (`src/composables/`):** Si un `<script setup>` acumula lógica compleja de estado, filtros, formularios o modales, extraer dicha lógica a funciones composables (`usePortalData.js`, `useAttendanceFilters.js`).
    4. **Separación Backend Limpia:** Los controladores (`controllers/`) no deben exceder 150 líneas. Toda regla de cálculo o validación pesada debe residir en sus respectivos `services/`.
  * **Smart Components (Views):** Manejan llamadas a stores de Pinia, navegación y orquestación de datos.
  * **Dumb Components (`components/`):** Presentacionales puros basándose en `props` y `emits`. Prohibido crear componentes monolíticos ("God Components").
* **Consumo de API Vía Hipermedios (HATEOAS):** El frontend consume las rutas RESTful navegando y aprovechando los enlaces semánticos provistos en la propiedad `_links` de las respuestas del servidor.
* **Diseño Responsivo y Filosofía de Diseño Adaptativo (Adaptive Design MD3):**
  * **Regla Obligatoria:** Toda vista (`*.view.vue`), componente estructural, modal o formulario debe ser **100% responsivo y adaptativo**, optimizando la experiencia y ergonomía en cada contexto de dispositivo (móviles, tablets, laptops y pantallas institucionales ultra-anchas).
  * **Filosofía de Adaptive Design (Material Design 3 - MD3):**
    * *Diferencia clave:* Mientras el diseño responsivo convencional escala un layout único para que quepa en pantalla, el **diseño adaptativo personaliza y reestructura el producto** para optimizar la experiencia en cada contexto y factor de forma.
    * *Adaptación Estructural y de Componentes:* Los componentes individuales, estructuras de navegación y layouts completos deben mutar según el tamaño de ventana (*Compact* `< 600px`, *Medium* `600px - 839px`, *Expanded* `>= 840px`):
      - **Navegación:** En móviles o pantallas compactas, menús y barras colapsan u ofrecen acceso táctil simplificado (bottom navigation / drawer modal), mientras que en pantallas expandidas se despliegan paneles laterales o navbars enriquecidos con dropdowns.
      - **Tablas de Datos (`.data-table`):** En pantallas compactas, las tablas densas deben transformarse en tarjetas apiladas (*card-list*) o contar con scroll horizontal contenido y columnas prioritarias, garantizando que el usuario móvil no pierda legibilidad ni sufra desbordamientos.
      - **Formularios y Modales:** En móvil ocupan el ancho completo (*bottom-sheet* o *full-screen modal* con botones de acción accesibles con una mano), mientras que en escritorio se centran con elevación, sombra sobria y anchos óptimos.
      - **Densidad de Información y Ergonomía:** Espaciados táctiles cómodos (mínimo 44x44px en áreas de toque interactivas para pantallas táctiles) y densidad adaptada a mouse/teclado en escritorio.
    * **Estrategia Universal Puro CSS (Sin lógica JS replicada en componentes):**
      - **Rejillas Intrínsecas:** Prohibido definir media queries por componente para grids. Se deben utilizar las utilidades globales de `main.css`:
        - `.grid-adaptive`: Rejilla auto-ajustable fluida con `repeat(auto-fit, minmax(min(100%, 280px), 1fr))`.
        - `.grid-adaptive--sm`: Rejilla compacta para métricas rápidas con `minmax(min(100%, 200px), 1fr)`.
        - `.grid--2`, `.grid--3`, `.grid--4`: Rejillas con colapso responsivo automático en móviles (< 600px).
      - **Contenedores de Cabecera y Acciones:** Usar `.adaptive-bar` y `.adaptive-bar__actions` para que botones y acciones se apilen automáticamente al 100% de ancho con altura táctil MD3 (44px) en móviles, sin escribir media queries locales.
      - **Pestañas y Tablas:** Todo grupo de pestañas debe usar `.tabs-nav` (con scroll táctil suave y scrollbar oculta nativa) y toda tabla debe envolverse en `.table-responsive`.

### ⚙️ Backend (Express.js, PostgreSQL y RESTful HATEOAS)

* **Arquitectura de Capas Limpia:** Separación estricta entre `routes` -> `middleware` -> `controllers` -> `services` -> `db/store`.
* **Persistencia Híbrida y Resiliencia:** Soporte nativo para PostgreSQL mediante pool de conexiones (`pg`), con fallback transparente a almacén en memoria persistido (`mock-store.js`) cuando la base de datos se encuentre en mantenimiento o inicialización.
* **Paginación Obligatoria en Tablas e Históricos (Regla de Desarrollo):** Para prevenir problemas de memoria o lentitud ante volúmenes crecientes de datos (ej. Registro de Consultas de Clínica Médica, Asientos de Accidentes, Pistas de Auditoría, Movimientos de Personal), todo endpoint de listado en el Backend **debe aplicar paginación nativa en SQL (`LIMIT` y `OFFSET`)** devolviendo metadata estructurada (`page`, `limit`, `total`, `totalPages`). El Frontend (Vue 3 / Pinia) **debe incluir controles adaptativos de navegación entre páginas (`← Anterior`, `Siguiente →`)** en la interfaz.
* **Transaccionalidad y Auditoría Obligatoria:** Toda operación que altere el estado de un colaborador, emita una constancia o modifique documentos debe registrar de forma inmutable un registro en `auditoria_logs` dentro del mismo ciclo de ejecución.

---

## 2. Documentación del Proyecto

Los siguientes archivos en `docs/` son la fuente de verdad del proyecto. El agente **debe** leerlos al inicio de cada sesión antes de realizar cambios, y mantenerlos rigurosamente actualizados al finalizar.

| Archivo | Propósito | Cuándo leer | Cuándo actualizar |
| --- | --- | --- | --- |
| [`docs/TODO.md`](docs/TODO.md) | Lista viva de tareas pendientes, en curso y completadas por hito | Siempre al inicio de sesión | Al completar o agregar tareas |
| [`docs/LESSONS.md`](docs/LESSONS.md) | Lecciones aprendidas, trampas técnicas resueltas y buenas prácticas | Al topar con un error o antes de tocar infraestructura | Cuando se resuelve un problema no trivial |
| [`docs/HISTORY.md`](docs/HISTORY.md) | Bitácora cronológica detallada de sesiones y cambios | Para entender el contexto histórico de desarrollo | Al finalizar cada sesión con cambios |
| [`docs/adrs/`](docs/adrs/README.md) | Architecture Decision Records (ADRs) | Al diseñar o modificar componentes arquitectónicos | Cuando se toma una decisión técnica estructural |
| [`docs/Requerimientos de Implementacion Ola 1 - Core Humanis.md`](docs/Requerimientos%20de%20Implementacion%20Ola%201%20-%20Core%20Humanis.md) | Especificación funcional y técnica, esquemas y requerimientos de la Ola 1 | Al diseñar o implementar cualquier vista, servicio o modelo | Al acordar cambios de alcance o requerimientos |
| [`docs/Requerimientos de Implementacion Sistema Completo - Core Humanis.md`](docs/Requerimientos%20de%20Implementacion%20Sistema%20Completo%20-%20Core%20Humanis.md) | Especificación funcional completa para Olas 2, 3 y 4 (Módulos 1 al 12) | Al planificar e implementar módulos avanzados (Asistencia, Nóminas, Evaluaciones, BI) | Al extender alcance o esquemas de la plataforma completa |
| [`docs/Plan de Trabajo y Digitalizacion RRHH SCSPR.md`](docs/Plan%20de%20Trabajo%20y%20Digitalizacion%20RRHH%20SCSPR.md) | Plan maestro institucional, cronograma y etapas de digitalización | Para conocer el orden de fases (Paso 0 a Paso N) | Al avanzar hitos del cronograma institucional |

---

## 3. Convenciones de Dominio, Reglas de Negocio y Seguridad Gubernamental

### 🏛️ Regímenes Laborales de la Administración Pública de Guatemala

1. **Renglón 011 (Personal Permanente):**
   * Regido por la Ley de Servicio Civil y normativas de ONSEC.
   * Cuenta con estabilidad laboral, derechos escalafonarios y prestaciones completas de ley.
   * Requiere registro de puesto nominal y funcional ONSEC.
2. **Renglón 022 (Personal por Contrato):**
   * Personal temporal en relación de dependencia con contrato a plazo fijo (generalmente anual).
   * Goza de prestaciones de ley (Bono 14, Aguinaldo).
   * Requiere monitoreo preventivo de vigencia y prórrogas contractuales.
3. **Renglón 029 / 183 / 189 (Servicios Técnicos y Profesionales):**
   * Contratación por servicios individuales sin relación de dependencia.
   * Pago contra entrega de informe mensual de actividades y Factura Electrónica en Línea (FEL - SAT).
   * Exento de prestaciones laborales; estricto control de vigencia contractual y finiquitos.

### 🛡️ Finiquitos de la Contraloría General de Cuentas (CGC)

* **Naturaleza:** Constancia Transitoria de Inexistencia de Reclamación de Cargos emitida por la Contraloría General de Cuentas.
* **Vigencia Estricta:** Exactamente **6 meses (180 días)** calendario a partir de su fecha de emisión.
* **Semáforo Automatizado de Alertas:**
  * **Verde (Vigente):** Más de 60 días antes del vencimiento.
  * **Ámbar (Advertencia preventiva):** Entre 31 y 60 días antes del vencimiento. Notificación a Analista de RRHH.
  * **Rojo (Crítico):** 30 días o menos antes del vencimiento, o ya vencido. Bloqueo preventivo de trámites contractuales y alerta prioritaria a Jefa de RRHH.

### 📜 Constancias Laborales Digitales con Código QR y Firma SHA-256

* **Identificador Hash Criptográfico:** Cada constancia emitida genera un hash criptográfico inmutable `SHA-256` derivado de: `cui + tipo_constancia + fecha_emision + correlativo + salt_institucional`.
* **Código QR Público:** El PDF incluye un código QR que apunta al endpoint de validación institucional pública:
  `http://<host>/core-humanis/validar/:hash`
* **Acceso Público Desacoplado:** El endpoint de validación QR es de acceso público universal (no requiere token ni inicio de sesión), permitiendo a bancos, embajadas y entidades públicas verificar la autenticidad del documento en tiempo real.

### 🔐 Control de Acceso Basado en Roles (RBAC)

El sistema opera bajo 4 roles institucionales con permisos estrictos:

| Rol | Código | Permisos Principales |
| --- | --- | --- |
| **Administrador de TI** | `ADMIN_TI` | Control total del sistema, configuración, sincronización, roles y logs de auditoría forense |
| **Jefa de Recursos Humanos** | `JEFA_RRHH` | Aprobación de constancias, gestión de contratos, supervisión global y reportería ejecutiva |
| **Analista de Recursos Humanos** | `ANALISTA_RRHH` | Registro y edición de expedientes, carga de documentos, emisión preliminar de constancias y gestión de alertas |
| **Auditor Interno / Fiscalizador** | `AUDITOR` | Acceso de solo lectura irrestricto a expedientes, constancias y pistas de auditoría inmutables |

### 🔍 Auditoría y Trazabilidad Inmutable

* Toda acción de creación, actualización, emisión de constancia, consulta confidencial o descarga de expediente genera un registro inmediato en `auditoria_logs`.
* Los campos mínimos obligatorios son: `usuario_id`, `accion`, `entidad`, `entidad_id`, `detalles_json`, `ip`, `created_at`.
* Los registros de auditoría son de solo adición (**append-only**); está terminantemente prohibido modificar o eliminar registros de esta tabla.

---

## 4. Estándar de API RESTful y Principios HATEOAS

La API de Core Humanis sigue el estándar **RESTful Nivel 3 (Modelo de Madurez de Richardson)** utilizando el principio **HATEOAS** (*Hypermedia As The Engine Of Application State*).

### 🌐 Reglas de Diseño de Rutas y Nombres

1. **Recursos en Plural y en Inglés:**
   * ✅ `/api/v1/collaborators` (no `/colaboradores` ni `/colaborador`)
   * ✅ `/api/v1/collaborators/:id/documents`
   * ✅ `/api/v1/certificates` (no `/constancias/generar`)
   * ✅ `/api/v1/certificates/verifications/:hash` (no `/constancias/verificar/:hash`)
   * ✅ `/api/v1/alerts` (no `/alertas/vencimientos`)
   * ✅ `/api/v1/audit-logs` (no `/auditoria`)
   * ✅ `/api/v1/catalogs` (no `/catalogos`)
   * ✅ `/api/v1/auth/tokens` y `/api/v1/auth/me`
2. **Uso Canónico de Verbos HTTP:**
   * `GET`: Recuperación idempotente de recursos o colecciones.
   * `POST`: Creación de un nuevo recurso en la colección subordinada.
   * `PUT`: Reemplazo integral de un recurso existente.
   * `PATCH`: Modificación parcial de campos específicos de un recurso.
   * `DELETE`: Baja lógica o eliminación controlada de un recurso.
3. **Control de Versiones en la URI:**
   * Todas las rutas canónicas se exponen bajo el prefijo `/api/v1/...`.
   * Se mantendrá compatibilidad retroactiva transparente mediante redirección o alias hacia las rutas heredadas para clientes en transición.

### 🔗 Estructura de Hipermedios (HATEOAS Payload)

Toda respuesta de recurso individual o elemento dentro de una colección debe contener un objeto `_links` con los hipervínculos navegables aplicables al contexto y permisos del usuario actual:

#### Ejemplo de Recurso Individual (`GET /api/v1/collaborators/1`):
```json
{
  "data": {
    "id": "1",
    "cuiDpi": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "Karina Elizabeth",
    "lastName": "García Méndez",
    "position": "Directora de Recursos Humanos",
    "regime": "011",
    "status": "ACTIVO",
    "_links": {
      "self": { "href": "/api/v1/collaborators/1", "method": "GET" },
      "update": { "href": "/api/v1/collaborators/1", "method": "PUT" },
      "documents": { "href": "/api/v1/collaborators/1/documents", "method": "GET" },
      "uploadDocument": { "href": "/api/v1/collaborators/1/documents", "method": "POST" },
      "certificates": { "href": "/api/v1/certificates?collaboratorId=1", "method": "GET" },
      "issueCertificate": { "href": "/api/v1/certificates", "method": "POST" }
    }
  }
}
```

#### Ejemplo de Colección (`GET /api/v1/certificates`):
```json
{
  "data": [
    {
      "id": "CERT-2026-001",
      "collaboratorId": "1",
      "type": "LABORAL_SIMPLE",
      "hash": "a8f3b2c1...",
      "status": "VALIDA",
      "_links": {
        "self": { "href": "/api/v1/certificates/CERT-2026-001", "method": "GET" },
        "collaborator": { "href": "/api/v1/collaborators/1", "method": "GET" },
        "pdf": { "href": "/api/v1/certificates/CERT-2026-001/pdf", "method": "GET" },
        "verify": { "href": "/api/v1/certificates/verifications/a8f3b2c1...", "method": "GET" }
      }
    }
  ],
  "_links": {
    "self": { "href": "/api/v1/certificates", "method": "GET" },
    "create": { "href": "/api/v1/certificates", "method": "POST" }
  }
}
```

---

## 5. ADRs — Architectural Decision Records

Los ADRs son el registro permanente de **por qué** el sistema está diseñado y construido de determinada manera. Se almacenan en `docs/adrs/` bajo el formato `ADR-NNNN-titulo-corto.md` y se indexan en [`docs/adrs/README.md`](docs/adrs/README.md).

### ✅ Cuándo CREAR un ADR

* Cambios estructurales en el modelo de base de datos relacional (PostgreSQL).
* Definición o evolución de estándares de integración y protocolos (RESTful, HATEOAS, Webhooks).
* Estrategia criptográfica para validación de documentos (algoritmos SHA-256, estructura QR, sellos digitales).
* Cambios en la arquitectura de autenticación y federación institucional.

### 📝 Formato Obligatorio de cada ADR

```markdown
# ADR-NNNN: Título descriptivo

- **Estado:** Propuesto | Aceptado | Supersedido por ADR-XXXX | Obsoleto
- **Fecha:** YYYY-MM-DD
- **Área:** Backend / API | Base de Datos | Frontend / UX | Seguridad / Auditoría

---

## Contexto
Descripción clara del problema técnico o de negocio que requiere una decisión arquitectónica.

---

## Opciones Consideradas
1. **Opción A** — Descripción y ponderación. ✅ (si fue la elegida)
2. **Opción B** — Descripción y justificación de descarte.

---

## Decisión
Qué se decidió implementar y la justificación técnica rigurosa.

---

## Consecuencias
**Positivo:**
- Beneficios obtenidos en mantenibilidad, rendimiento o seguridad.

**Negativo / Compromisos:**
- Deuda técnica asumida, complejidad adicional o migraciones requeridas.
```

---

## 6. Estructura del Proyecto

```
core-humanis/
├── AGENTS.md                               ← Instrucciones y reglas del agente AI (este archivo)
├── docker-compose.yml                      ← Orquestación de servicios (nginx, api, app, db)
├── README.md                               ← Documentación general de instalación y arquitectura
├── database/
│   ├── init_core_humanis.sql               ← Esquema DDL inicial de PostgreSQL
│   └── migrations/                         ← Scripts versionados de migración SQL
├── nginx/
│   └── default.conf                        ← Configuración de reverse proxy Nginx
├── docs/
│   ├── TODO.md                             ← Matriz viva de tareas pendientes y avances
│   ├── LESSONS.md                          ← Lecciones técnicas aprendidas y soluciones
│   ├── HISTORY.md                          ← Bitácora cronológica de ejecuciones
│   ├── Requerimientos de Implementacion... ← SDS y requerimientos funcionales Ola 1
│   ├── Plan de Trabajo y Digitalizacion... ← Plan estratégico y fases de digitalización
│   ├── Base de datos.xlsx                  ← Datos crudos iniciales para ETL
│   └── adrs/                               ← Architectural Decision Records
│       └── README.md                       ← Índice maestro de decisiones arquitectónicas
├── api/                                    ← Backend Node.js / Express
│   ├── package.json                        ← Dependencias del backend (Express, pg, qrcode)
│   ├── Dockerfile                          ← Contenedor Docker del backend
│   └── src/
│       ├── server.js                       ← Punto de entrada y listener de Express
│       ├── app.js                          ← Configuración de Express, middlewares y rutas
│       ├── routes/
│       │   └── core-humanis.routes.js      ← Definición canónica de rutas RESTful
│       ├── controllers/                    ← Controladores de endpoints
│       ├── middleware/                     ← Autenticación JWT y validación RBAC
│       ├── utils/                          ← Helpers de HATEOAS, generación QR y PDF
│       ├── config/                         ← Configuración de DB pool y mock-store
│       └── services/                       ← Lógica de negocio (alertas, constancias)
└── core-humanis-app/                       ← Frontend SPA Vue 3 + Vite
    ├── package.json                        ← Dependencias del frontend (Vue 3, Pinia, Router)
    ├── vite.config.js                      ← Configuración del empaquetador Vite
    ├── Dockerfile                          ← Contenedor Docker del frontend
    └── src/
        ├── main.js                         ← Inicialización de Vue 3, Pinia y Router
        ├── App.vue                         ← Layout raíz con Navbar y Footer versionado
        ├── config/
        │   └── version.js                  ← Versión semántica centralizada
        ├── api/
        │   └── client.js                   ← Cliente Axios configurado para la API RESTful
        ├── assets/                         ← Estilos CSS globales y Design Tokens institucionales
        ├── components/                     ← Componentes dumb reutilizables
        ├── views/                          ← Componentes smart de cada vista
        ├── stores/                         ← Stores reactivos de Pinia
        └── router/                         ← Configuración de rutas y guardias de navegación
```

---

## ⚠️ Reglas Críticas

* **Prohibido Tailwind CSS:** Uso exclusivo del sistema de diseño Vanilla CSS basado en Design Tokens institucionales de la SCSPR.
* **Metodología BEM Obligatoria:** Toda regla de estilo CSS debe estructurarse obligatoriamente bajo la metodología BEM (`.block`, `.block__element`, `.block--modifier`), garantizando modularidad, especificidad plana y alta mantenibilidad en Vanilla CSS.
* **Diseño RESTful y HATEOAS Estricto:** Toda ruta nueva o refactorizada debe usar nombres sustantivos en plural en inglés, verbos HTTP canónicos y retornar hipermedios `_links` navegables.
* **Rutas Frontend en Inglés y Plural:** Paridad estricta entre rutas del backend y URLs de navegación SPA (`/collaborators`, `/certificates`, `/alerts`, `/audit-logs`, `/certificates/verifications/:hash`).
* **Nombres de Archivos en Inglés y Kebab-Case:** Obligatorio en controladores, servicios, stores, rutas y utilidades (e.g. `collaborators.controller.js`, `certificates.service.js`, `collaborators.store.js`).
* **Código en Inglés / Documentación en Español:** Respetar la convención lingüística en todo momento sin excepciones.
* **Ejecutar ÚNICAMENTE Pruebas Focalizadas:** Prohibido lanzar suites generales masivas durante fixes puntuales; verificar directamente el módulo modificado.
* **Incremento Obligatorio de Versión:** En cada sesión con modificaciones de código, es obligatorio incrementar la versión semántica en `api/package.json`, `core-humanis-app/package.json` y `core-humanis-app/src/config/version.js`.
* **Auditoría Inmutable Obligatoria:** Ningún cambio de estado sensible puede omitir el registro en `auditoria_logs`.
