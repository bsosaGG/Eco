# Módulo Adquisiciones (SICOMPRAS · Baja Cuantía)

Expediente de compra de principio a fin: solicitud de compra (CU-01), cotizaciones (CU-02), CDP (CU-03),
Orden de Compra (CU-04), recepción y documentos de soporte (CU-05/06) y fase financiera —compromiso,
devengado y solicitud de pago— (CU-07/08/09). Corre dentro del core (`/api/adquisiciones`) con su propia
base de datos (`db_adquisiciones_scspr`, esquema en `database/init_adquisiciones.sql`).

## Estructura

```
api/src/
  routes/adquisiciones.routes.js          rutas + permisos (adquisiciones:<acción>) + validación de entrada
  controllers/adquisiciones.controller.js capa HTTP delgada (sin reglas de negocio ni SQL)
  middleware/uploadDocumentoSoporteAdquisiciones.js   subida de documentos de soporte (15 MB, a disco)
  config/db-adquisiciones.js              conexión a la BD (query + transaction; ADQUISICIONES_DATABASE_URL)
  config/adquisiciones.config.js          rutas de archivos, límites, Chromium, catálogo MAGA
  templates/adquisiciones/                plantilla HTML de la Solicitud de Compra (FOR-DG-UA-00-01)
  services/adquisiciones/
    *.service.js                          casos de uso, uno por área:
                                            catalogos, unidades, proveedores, firmantes, usuarios-modulo,
                                            expedientes (CU-01), cotizaciones (CU-02), cdp (CU-03),
                                            ordenes-compra (CU-04), recepcion (CU-05/06),
                                            fase-financiera (CU-07/08/09), bitacora, reportes,
                                            insumos (catálogo MAGA), solicitud-pdf
    expediente-detalle.service.js         detalle completo del expediente (lo devuelven casi todos los pasos)
    expediente-estado.js                  avanzar el expediente al siguiente estado del flujo (y avisar)
    notificaciones.service.js             avisos: campana + correo al solicitante y a la persona asignada
    domain/                               reglas puras, sin I/O: estados, perfiles del módulo, numeración
                                          (CDP-2026-0001, UA-1-2026), firma provisional, montos, personas
                                          del expediente, datos del PDF, lectura del HTML de MAGA, avisos
                                          (a quién y con qué texto) y visibilidad (quién ve todo)
    repositories/                         SQL por tabla (reciben `db` o la transacción `tx`)
    documents/                            PDF de la Solicitud de Compra (Chromium + puppeteer-core)
    integrations/                         catálogo público de insumos MAGA/SIGES (opcional)
    errors.js                             errores de dominio con `statusCode` (los resuelve el errorHandler del core)
api/tests/adquisiciones/                  pruebas (ver abajo)
database/init_adquisiciones.sql           esquema
adquisiciones-app/src/
  views/ auth/ expedientes/ catalogos/ reportes/
  components/ common/ expediente/ tramite/
  composables/ utils/ services/ layouts/ router/
```

Flujo de una petición: `routes → controller → service (caso de uso) → repository / domain / documents`.
Cada paso del trámite abre **una transacción** (`adquisicionesDb.transaction`), valida la regla, escribe,
deja constancia en la bitácora y, al terminar, devuelve el detalle del expediente.

Los errores se lanzan como `ValidationError` (400), `NotFoundError` (404), `ConflictError` (409: el expediente no
está en el estado que pide el paso, o el documento ya existe) o `ConfigurationError` (500) y los traduce el
`errorHandler` global.

### Frontend

| Carpeta | Contenido |
|---|---|
| `views/expedientes/` | Bandeja, nueva solicitud y detalle del expediente |
| `views/catalogos/` | Proveedores y Unidades solicitantes |
| `views/reportes/` | Cotizaciones, CDP y OC, fase financiera, resumen y detalle de registro |
| `components/expediente/` | Encabezado, renglones, justificación, stepper, acciones, bitácora y editor de renglones |
| `components/tramite/` | Una tarjeta por etapa del trámite (cotizaciones, CDP, OC, recepción, fase financiera) |
| `components/common/` | Selector con búsqueda, modal de firma y campana de avisos |
| `composables/` | `useCarruselPasos` (carrusel de pasos del proceso) |
| `utils/` | `format` (montos y fechas), `estados` (colores y etapas), `errors`, `permisos`, `pasos`, `renglones` |

## Permisos (en `db_global_users`)

`adquisiciones:read` · `create` · `assign` · `config` · `audit` · `devolver` · `manage-cotizaciones` ·
`elaborar-cdp` · `aprobar-cdp` · `vobo-financiero` · `elaborar-oc` · `aprobar-oc` · `autorizar-oc` ·
`confirmar-recepcion` · `conformar-pago` · `registrar-compromiso` · `registrar-devengado` · `solicitar-pago` ·
`autorizar-pago`. El rol `admin` tiene todos.

## Reglas que conviene saber

- El detalle de un expediente se consulta por id numérico o por código (`/expedientes/UA-1-2026`).
- `firma2_cargo` es una foto del cargo que el firmante tiene asignado en la unidad al crear la solicitud
  (`usuarios_unidad_solicitante`); si no está asignado queda vacío.
- Al adjudicar una cotización, su monto pasa a ser el `monto_estimado` del expediente (y se actualiza si se
  readjudica). Si el expediente tiene un solo renglón, su costo unitario es ese monto entre la cantidad; con varios
  renglones los costos no se tocan porque la cotización es un total.

## Avisos y "mis solicitudes"

**Avisos.** Cuando un expediente cambia de etapa, se asigna o se devuelve, se avisa al **solicitante** (quien emitió la
solicitud) y a la **persona asignada**, salvo a quien hizo la acción. Cada aviso aparece en la campana de la barra
superior (se actualiza cada minuto) y sale también por **correo**. Pasa en cada transición del trámite: adjudicar,
CDP con Vo.Bo., Orden de Compra, traslado a Contabilidad, pago y archivo, cambio manual de estado y devolución.

- El aviso dentro del sistema se guarda en la misma transacción del cambio; el correo se envía después de confirmarla,
  con la cola del core (`services/email.service.js`, variables `MAIL_*`, cuenta de Gmail de `config/mailer.js`).
- Un fallo del correo nunca rompe el trámite. Cómo salió cada correo queda en `notificaciones.correo_estado`:
  `encolado`, `sin_correo` (el usuario no tiene email), `sin_smtp` (el servidor no tiene `MAIL_HOST`) o `error`.
- `ADQUISICIONES_APP_URL` (opcional, p. ej. `https://dominio/adquisiciones`) agrega al correo un enlace al expediente.
- API: `GET /notificaciones`, `POST /notificaciones/:id/leida`, `POST /notificaciones/leer-todas` (cada quien ve y
  marca solo los suyos).

**Mis solicitudes.** Quien solo emite solicitudes (permisos `read` y `create`) ve únicamente las que emitió y la etapa en
que va cada una; abrir una ajena responde 404 y los reportes de todo el módulo responden 403. Quien tiene cualquier
permiso de gestión del trámite (asignar, cotizar, CDP, OC, recepción, fase financiera, auditar, devolver, administrar
catálogos) y el rol `admin` ven todo. La lista vive en `domain/visibilidad.js` (y una prueba la compara con los permisos
que usan las rutas, para que no se desfase).

## Tiempo en cada estado

Un trigger de la BD anota en `historial_estados` cada vez que un expediente nace o cambia de estado, venga de donde
venga el cambio. El detalle del expediente trae `historial_estados` (cada entrada con `fecha_entrada`, `fecha_salida`
y `actual`) y la hora del servidor (`servidor_ahora`); la bandeja trae `en_estado_desde`. El tiempo se calcula en el
frontend restando fechas, usando la hora del servidor para el estado vigente.

En la pantalla: un indicador junto al estado (bandeja y encabezado del expediente) que pasa de verde a ámbar a los 2 días
y a rojo parpadeante a los 5 en el mismo estado (en un expediente cerrado muestra cuánto duró todo el trámite), y en el
detalle una **línea de tiempo** con el estado actual en grande, una barra proporcional al tiempo de cada estado y la
lista con entrada, salida y duración. Los plazos (2 y 5 días corridos) están en `adquisiciones-app/src/utils/tiempos.js`.

## Base de datos

Las tablas `notificaciones` e `historial_estados` (con su trigger) están en `database/init_adquisiciones.sql`
(instalaciones nuevas) y en `database/migrations/20261005_adquisiciones_notificaciones.sql` y
`20261006_adquisiciones_historial_estados.sql` (producción: solo agregan, se pueden correr más de una vez; la segunda
rellena el historial de los expedientes que ya existen con su estado actual). **No correr `init_adquisiciones.sql` en producción: borra todo el módulo al empezar.**

## Archivos

Los documentos de soporte se guardan en `uploads/adquisiciones/documentos-soporte/` (volumen persistente
`./uploads_scspr`; se puede mover con `ADQUISICIONES_STORAGE_PATH`) y en la BD queda la ruta relativa a
`uploads/` (`adquisiciones/documentos-soporte/<archivo>`).

## Pruebas

```bash
cd api && npm run test:adquisiciones
```

Usan PostgreSQL en memoria (PGlite) creado con el `init_adquisiciones.sql` real, el middleware de
autenticación real del core y una BD de usuarios simulada; no tocan ninguna base real.

- `flow.test.js`: recorre CU-01 a CU-09 por HTTP (incluyendo validaciones, saldos, firmas, subida de archivos,
  reportes y bitácora) y compara cada respuesta con `fixtures/golden/flow.json`. Esa transcripción se generó con la
  implementación anterior (un único `adquisiciones.service.js` de 2 400 líneas), por lo que demuestra que la
  reorganización no cambió el contrato HTTP (la única diferencia posterior es `monto_estimado`, que ahora fija la
  cotización adjudicada). Para regenerarla a propósito: `UPDATE_GOLDEN=1 npm run test:adquisiciones`.
- `fixes.test.js`: búsqueda del expediente por código, cargo de la segunda firma y monto fijado al adjudicar.
- `historial.test.js`: el trigger anota cada entrada a un estado y el API la devuelve.
- `notificaciones.test.js`: avisos, correo (simulado), campana y visibilidad de "mis solicitudes".
- `errors.test.js`: códigos HTTP de las reglas de negocio (400/404/409).
- `domain.test.js`: reglas puras (numeración, montos, personas del expediente, lectura de MAGA, datos del PDF).

El PDF de la Solicitud de Compra necesita Chromium (imagen Docker); las pruebas cubren los datos que alimentan la
plantilla, no el renderizado.
