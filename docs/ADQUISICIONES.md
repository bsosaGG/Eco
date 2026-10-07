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
| `components/expediente/` | Encabezado compacto, "siguiente paso" (con "Recibir y turnar"), stepper, menú de acciones con modales, resumen, documentos, historial, tiempo en estado y editor de renglones |
| `components/tramite/` | Una tarjeta por etapa del trámite (cotizaciones, CDP, OC, recepción, fase financiera) |
| `components/common/` | `ModalBase` (todos los CRUD), asistente por pasos, selector con búsqueda, modal de firma, campana de avisos, pestañas, estado vacío, cargando y texto expandible |
| `composables/` | `useCarruselPasos` (carrusel de pasos del proceso) |
| `utils/` | `alertas` (SweetAlert2), `format` (montos y fechas), `estados` (colores y etapas), `errors`, `permisos`, `pasos`, `renglones`, `documentos`, `archivos` |

## Permisos (en `db_global_users`)

`adquisiciones:read` · `create` · `assign` · `config` · `audit` · `devolver` · `manage-cotizaciones` ·
`elaborar-cdp` · `aprobar-cdp` · `vobo-financiero` · `elaborar-oc` · `aprobar-oc` · `autorizar-oc` ·
`confirmar-recepcion` · `conformar-pago` · `registrar-compromiso` · `registrar-devengado` · `solicitar-pago` ·
`autorizar-pago`. El rol `admin` tiene todos.

El **cambio manual de estado** (`PUT /expedientes/:id/estado`) exige `adquisiciones:config`: se salta las validaciones del
flujo, así que es solo administrativo. Los pasos normales del trámite usan cada uno su propio permiso.

## Reglas que conviene saber

- El detalle de un expediente se consulta por id numérico o por código (`/expedientes/UA-1-2026`).
- `firma2_cargo` es una foto del cargo que el firmante tiene asignado en la unidad al crear la solicitud
  (`usuarios_unidad_solicitante`); si no está asignado queda vacío.
- Al adjudicar una cotización, su monto pasa a ser el `monto_estimado` del expediente (y se actualiza si se
  readjudica). Si el expediente tiene un solo renglón, su costo unitario es ese monto entre la cantidad; con varios
  renglones los costos no se tocan porque la cotización es un total.

## Pantalla del expediente

Una sola tarjeta, sin tener que desplazarse para encontrar el detalle:

1. **El proceso (siempre visible, arriba):** encabezado con código, estado y tiempo en el estado, botón "Ver solicitud" (abre el
   PDF) y el menú "Acciones"; debajo el **siguiente paso** (qué falta y quién es el responsable; "Pendiente de su atención"
   si es quien consulta) y el **stepper** de etapas, que es el foco de la pantalla.
2. **Pestañas debajo del stepper:** *Trámite* (el paso elegido con sus opciones: cotizaciones, CDP, OC, recepción o fase
   financiera; el paso activo se abre solo y al elegir una etapa en el stepper se muestra aquí), *Resumen* (datos clave,
   justificación, anexo y renglones con total), *Documentos* (la solicitud y los soportes) e *Historial* (tiempo por estado y,
   dentro de cada estado, las acciones de la bitácora, solo para quien tiene permiso de auditoría).

**Tono de los mensajes.** Todos los textos de la interfaz y de los correos son formales e impersonales (por ejemplo,
«Pendiente de su atención» y «Responsable: …»); no usar expresiones coloquiales.

El menú **Acciones** abre modales: *Reasignar analista* (`adquisiciones:assign`), *Devolver con observaciones*
(`adquisiciones:devolver`) y *Cambiar estado* (`adquisiciones:config`).

**Avisos de la interfaz (SweetAlert2, `utils/alertas.js`).** Las confirmaciones (adjudicar, trasladar a Contabilidad,
autorizar el pago, devolver, enviar la solicitud, turnar...) salen **al centro** con `confirmar()`; los resultados y errores
salen como aviso corto **arriba a la derecha** con `notificar`. Todos los alta/edición (proveedores, unidades, firmantes de la
unidad, registros de cada etapa) se hacen en modales (`components/common/ModalBase.vue`). La solicitud nueva es un asistente de
4 pasos (solicitante, la compra, renglones, revisión) que valida cada paso antes de avanzar.

## Ruta automática del trámite

Ya no se elige a alguien y luego se cambia el estado por separado: cada paso del trámite **asigna solo al responsable del
siguiente paso**, según el perfil que le toca (`domain/siguiente-paso.js`, la única fuente de la regla; la usan el
enrutamiento y el detalle del expediente). `ruta.service.js` (`enrutar`) corre al final de cada caso de uso, dentro de la
misma transacción:

- Elige entre los usuarios con el perfil del paso al que tenga menos expedientes abiertos; si el expediente ya lo tiene
  alguien con ese perfil, sigue con esa persona. Respeta una elección manual y mantiene fijo al analista del expediente en los
  pasos de analista. En un expediente devuelto le toca a quien emitió la solicitud.
- Guarda el responsable en `expedientes.funcionario_responsable_id` (el texto `funcionario_responsable` es el de la solicitud y
  sale en el PDF: no se toca) y avisa a esa persona y al solicitante.
- **Recibir y turnar** (`POST /expedientes/:id/turnar`, permiso `adquisiciones:assign`) recibe la solicitud, elige al analista,
  pasa a cotización y se lo asigna en un solo paso. Reasignar a mano sigue disponible en el menú Acciones.
- Si no hay nadie con el perfil, el trámite sigue y el expediente queda sin responsable (el siguiente paso muestra el perfil).

## Avisos y "mis solicitudes"

**Avisos.** Cuando un expediente cambia de etapa, se asigna o se devuelve, se avisa al **solicitante** (quien emitió la
solicitud) y a la **persona asignada**, incluso si es esa misma persona quien hizo la acción (el correo dice quién fue). Cada aviso aparece en la campana de la barra
superior (se actualiza cada minuto) y sale también por **correo**. Pasa en cada transición del trámite: adjudicar,
CDP con Vo.Bo., Orden de Compra, traslado a Contabilidad, pago y archivo, cambio manual de estado y devolución.

- El aviso dentro del sistema se guarda en la misma transacción del cambio; el correo se envía después de confirmarla,
  con la cola del core (`services/email.service.js`, variables `MAIL_*`, cuenta de Gmail de `config/mailer.js`).
- Un fallo del correo nunca rompe el trámite. Cómo salió cada correo queda en `notificaciones.correo_estado`:
  `encolado`, `sin_correo` (el usuario no tiene email), `sin_smtp` (el servidor no tiene `MAIL_HOST`) o `error`.
- El correo usa una plantilla HTML (`domain/plantilla-correo.js`) que dice qué pasó, de qué estado a cuál (con cuánto tiempo
  estuvo en el anterior), quién lo hizo, cuándo (hora de Guatemala), el objeto, la unidad, el solicitante, la persona
  asignada, el tipo y el monto, el motivo si es una devolución y un botón para abrir el expediente.
- Cada correo deja una línea en el log del API (`Aviso N (tipo, expediente X) -> destino: estado`) para ver qué pasó sin
  entrar a la base.
- `ADQUISICIONES_APP_URL` (opcional, p. ej. `https://dominio/adquisiciones`) agrega al correo un enlace al expediente.
- `ADQUISICIONES_CORREO_REDIRIGIR_A` (solo pruebas; una o varias direcciones separadas por coma) desvía **todos** los correos del
  módulo a esa bandeja. El asunto lleva `[PRUEBA · para Nombre (correo)]` y el cuerpo un aviso "MODO PRUEBA", y también se envía
  el de quien no tiene correo registrado. En local se define en `docker-compose.override.yml` (que no se sube y no usa el
  servidor); `docker-compose.yml` no la pasa, así que en producción nunca está activa. Guía de pruebas: `docs/ADQUISICIONES_PRUEBAS.md`.
- API: `GET /notificaciones`, `POST /notificaciones/:id/leida`, `POST /notificaciones/leer-todas` (cada quien ve y
  marca solo los suyos).

**Quién ve qué (`domain/visibilidad.js`).**
- **Expedientes:** cada persona ve los que le **corresponden** (es el responsable actual) y los que **emitió**. Cuando un
  expediente pasa a otra persona, deja de aparecerle en la bandeja, en el detalle y en el PDF (el API responde 404), de modo
  que su bandeja contiene solo lo pendiente de su atención. Ven todos el rol `admin` y quien supervisa: `adquisiciones:audit`
  (Auditoría, Jefe UDAF) y `adquisiciones:config` (Administración TI).
- **Al trasladar:** la persona que ejecuta una acción y el expediente pasa a otra recibe un aviso al centro de la pantalla
  («Expediente trasladado a …») y regresa a la bandeja.
- **Reportes de todo el módulo:** el rol `admin` y quien tenga cualquier permiso de gestión del trámite; el resto responde 403.
  Una prueba compara la lista de gestión con los permisos que usan las rutas, para que no se desfase.

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

`database/init_adquisiciones.sql` es el **único** script del esquema (no hay migraciones): crea todas las tablas del
módulo, incluidas `notificaciones` e `historial_estados` (con su trigger), los catálogos iniciales y el acceso del usuario
`usr_adquisiciones_scspr`. Es destructivo (borra y recrea las tablas del módulo, con sus datos) y solo afecta a
`db_adquisiciones_scspr`:

```bash
docker exec -i db_master_container psql -U postgres -d db_adquisiciones_scspr < database/init_adquisiciones.sql
```

Mientras los datos de producción sean de prueba esto es lo más simple. Cuando haya datos reales que conservar, cada
cambio de esquema tendrá que hacerse con una migración aditiva en vez de volver a correr este script. **No correr `init_adquisiciones.sql` en producción: borra todo el módulo al empezar.**

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
