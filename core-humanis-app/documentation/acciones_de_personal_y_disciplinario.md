# Gestión de Nómina, Acciones de Personal y Expedientes Disciplinarios (Ola 3)

## 1. Visión General
Este documento detalla la especificación de negocio, arquitectura de base de datos y flujos normativos aplicables a la **Ola 3 de Core Humanis** (Nómina, Acciones de Personal y Expedientes Disciplinarios SCSPR), alineada con la **Ley de Servicio Civil (Decreto 1748)** y normativas de la **Contraloría General de Cuentas (CGC)** y la **Oficina Nacional de Servicio Civil (ONSEC)**.

---

## 2. Acciones de Personal y Cambios de Puesto (`acciones_personal`)

Permite registrar y dar seguimiento a los movimientos administrativos de los colaboradores dentro de la institución (nombramientos, ascensos, traslados, permutas, reubicaciones y rescisiones).

### Estructura de Datos
* **`persona_id`**: Referencia al colaborador afectado.
* **`tipo_accion`**: Categorización estandarizada (`NOMBRAMIENTO`, `ASCENSO`, `TRASLADO`, `PERMUTA`, `REUBICACION`, `AUMENTO_SALARIAL`, `RESCISION`, `OTRO`).
* **`fecha_efectiva` / `fecha_rige_hasta`**: Fechas de vigencia de la acción.
* **`acuerdo_numero` / `acta_toma_posesion`**: Identificadores documentales oficiales.
* **`puesto_nominal_id` / `puesto_funcional_id` / `unidad_admin_id`**: Nuevos cargos o dependencias asignadas.
* **`salario_nuevo`**: Nuevo valor de remuneración en Quetzales.
* **`estado`**: Ciclo de vida (`BORRADOR` -> `EN_FIRMA` -> `APROBADO` / `ANULADO`).
* **Requisitos CGC / ONSEC**:
  * **`notificado_onsec` / `fecha_notificacion_onsec`**: Control de notificación obligatoria a la ONSEC.
  * **`requiere_djp_cgc` / `fecha_limite_djp_cgc` / `djp_cumplida`**: Control de la Declaración Jurada Patrimonial ante la CGC para cargos de manejo o fiscalización.

---

## 3. Expedientes Disciplinarios (`expedientes_disciplinarios`)

Garantiza el registro institucional de procesos disciplinarios aplicados a colaboradores, registrando la falta, el debido proceso y la sanción definitiva.

### Estructura de Datos
* **`correlativo`**: Identificador único de expediente disciplinario.
* **`persona_id`**: Colaborador sujeto al expediente.
* **`jefatura_denunciante_id`**: Usuario que promueve la acción disciplinaria.
* **`gravedad_falta`**: Clasificación del hecho (`LEVE`, `GRAVE`, `GRAVISIMA`).
* **`tipo_sancion_propuesta` / `tipo_sancion_definitiva`**: Amonestación verbal, escrita, suspensión sin goce de sueldo o despido con justa causa.
* **`dias_suspension`**: Cantidad de días de suspensión si aplicara.
* **`base_legal`**: Fundamentación legal (por defecto *Ley de Servicio Civil Decreto 1748*).
* **`estado`**: Flujo de avance del proceso (`REGISTRADO` -> `AUDIENCIA_CONFERIDA` -> `DESCARGO_RECIBIDO` -> `RESUELTO` / `ARCHIVADO`).

---

## 4. Audiencias de Descargo (`audiencias_descargo`)

Garantiza formalmente el **Derecho de Defensa** de acuerdo con el **Artículo 12 de la Constitución Política de la República de Guatemala (CPRG)** y el Reglamento de la Ley de Servicio Civil.

### Estructura de Datos
* **`expediente_id`**: Enlace al expediente disciplinario correspondiente.
* **`fecha_notificacion`**: Fecha formal en que se le notifica al colaborador la audiencia concedida.
* **`fecha_limite_descargo`**: Plazo legal máximo para evacuar la audiencia.
* **`escrito_descargo_presentado`**: Indicador de si el colaborador presentó su memorial o escrito de descargo.
* **`pruebas_presentadas`**: Justificación, documentos o medios probatorios aportados por el colaborador.
* **`acta_audiencia_pdf_url`**: Enlace al PDF del acta firmada de la audiencia.
