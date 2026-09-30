# Core Humanis App &bull; Secretaría de Comunicación Social de la Presidencia (SCSPR)

Documentación del Módulo de Gestión Integral de Recursos Humanos, Expedientes Digitales, Contratación Asistida y Emisión Documental con Código QR adaptado a la normativa gubernamental de la República de Guatemala.

---

## 1. Visión General del Proyecto

**Core Humanis** es la plataforma institucional centralizada para la administración 360° del talento humano en la Secretaría de Comunicación Social de la Presidencia (**SCSPR**). El sistema automatiza el ciclo de vida del servidor público y contratista desde su postulación y contratación hasta la liquidación y archivo inmutable de expedientes.

### Principales Pilares Arquitectónicos:
* **Frontend**: Vue 3 (Composition API), Vite, Pinia, Tailwind CSS y componentes reactivos de alta precisión estética.
* **Backend API**: Node.js / Express con arquitectura canónica RESTful Nivel 3 de Richardson (recursos granulares y enlaces hipermedia HATEOAS).
* **Base de Datos**: PostgreSQL (`db_core_humanis`) con esquema relacional estricto y triggers de auditoría inmutable.
* **Motor Documental**: Inyección dinámica en plantillas OpenXML (`easy-template-x` / `JSZip`) y renderizado headless a PDF vía `LibreOffice` con código QR de validación pública criptográfica (SHA-256).

---

## 2. Índice de Módulos del Sistema (20 Módulos Integrados)

El sistema se compone de 20 módulos operativos parametrizados conforme a la Ley de Servicio Civil (Decreto 1748), Ley de Contrataciones del Estado (Decreto 57-92) y normativa de la Contraloría General de Cuentas (CGC):

1. **Directorio Institucional de Personal (`/collaborators`)**: Panel de búsqueda rápida del personal activo e inactivo por CUI/DPI, renglón presupuestario (011, 021, 022, 029, Subgrupo 18) y unidad administrativa.
2. **Ficha 360° & Expediente Digital (`/collaborators/:id`)**: Vista unificada del historial laboral, datos personales, remuneraciones y repositorio digitalizado de documentos obligatorios (DPI, RTU, Finiquito CGC, Colegiatura).
3. **Wizard de Contratación (`/hiring`)**: Flujo asistido de 4 pasos: `[1. Persona] -> [2. Candidato & Terna] -> [3. Empleado] -> [4. Contrato]` con validación de contrato activo único por CUI.
4. **Emisión Documental & QR (`/certificates`)**: Generación instantánea de constancias laborales y de servicios. Firma criptográfica SHA-256 e inyección de QR para verificación pública sin autenticación.
5. **Control de Vacaciones & Kardex (`/vacations`)**: Cómputo inteligente de días hábiles excluyendo fines de semana y asuetos oficiales de Guatemala, con aprobación multinivel de jefaturas.
6. **Licencias & Ausencias (`/leaves`)**: Gestión de suspensiones IGSS, permisos con/sin goce de sueldo, licencias por maternidad/paternidad y duelo.
7. **Control Biométrico (`/attendance`)**: Sincronización de marcas de relojes biométricos, tolerancia reglamentaria de 15 minutos y semáforo de puntualidad.
8. **Portal de Autogestión (`/portal`)**: Espacio del colaborador para consultar saldos de vacaciones, boletas de pago, marcajes y solicitudes de permisos.
9. **Nóminas & Sueldos (`/payrolls`)**: Cálculo de planillas 011, 022 y honorarios 029 (factura FEL), aplicando retenciones de ley (IGSS, Montepío, ISR) y Bonificación Incentivo.
10. **Acciones de Personal (`/personnel-actions`)**: Emisión de acuerdos internos, nombramientos, traslados entre dependencias, ascensos y actas de toma de posesión.
11. **Régimen Disciplinario (`/disciplinary`)**: Tramitación del debido proceso administrativo: amonestaciones verbales/escritas, audiencias de descargo y resoluciones sancionatorias.
12. **Reclutamiento & Selección (`/recruitments`)**: Gestión de convocatorias públicas, recepción de expedientes, evaluación por ternas y cuadro de méritos.
13. **Evaluación del Desempeño (`/evaluations`)**: Evaluación periódica de competencias técnicas y cumplimiento de metas homologadas ante ONSEC.
14. **Formación & Capacitaciones PAC (`/trainings`)**: Seguimiento del Plan Anual de Capacitaciones, control de horas de formación y diplomados institucionales.
15. **Salud & Seguridad Ocupacional (`/occupational-health`)**: Cumplimiento del A.G. 229-2014: brigadas de emergencia, botiquines y reporte de incidentes/accidentes laborales.
16. **Clima Organizacional (`/climate`)**: Medición del ambiente laboral con encuestas anónimas e indicador eNPS (Employee Net Promoter Score).
17. **Dashboard BI & LAIP (`/executive-dashboard`)**: Tablero ejecutivo de masa salarial, equidad de género, rotación y cumplimiento del Art. 10 de la Ley de Acceso a la Información Pública.
18. **Repositorio de Plantillas (`/templates`)**: Administrador de archivos `.docx` institucionales parametrizados en `kebab-case`.
19. **Semáforo de Alertas CGC (`/alerts`)**: Monitoreo preventivo del vencimiento de finiquitos de la Contraloría General de Cuentas (regla de 180 días) y contratos.
20. **Auditoría Forense (`/audit-logs`)**: Registro inmutable append-only de cada acción, IP, usuario y modificaciones JSON del sistema.

---

## 3. Marco Normativo Legal y Regla de Negocio BR-04

En cumplimiento de las auditorías de la **Contraloría General de Cuentas (CGC)**:
* **Personal en Relación de Dependencia (011, 021, 022, 031)**: Se emite "Constancia Laboral", devengan "salario/sueldo" y están afectos a descuentos de ley.
* **Contratistas por Servicios Técnicos y Profesionales (029, 183, 189)**: Se emite "Constancia de Prestación de Servicios". Por regla estricta **BR-04**, queda prohibido utilizar palabras como *salario*, *sueldo*, *empleado*, *trabajador* o *jornada*, debiendo emplearse exclusivamente *honorarios* y *prestador de servicios*.

---

## 4. Guía de Limpieza de Datos Demo y Poblamiento de Datos Reales

### 4.1. Estado Actual de las Fuentes de Datos

* **Datos de Prueba Iniciales**: Ubicados en [`database/init_core_humanis.sql`](../database/init_core_humanis.sql), contienen 3 colaboradores demo con IDs prefijados (`88888888-...`) para pruebas del sistema.
* **Catálogos Oficiales Extraídos**: Ubicados en [`database/seed_catalogs_core_humanis.sql`](../database/seed_catalogs_core_humanis.sql), contienen **29 Unidades Administrativas**, **53 Puestos Nominales** y **85 Puestos Funcionales**.
* **Personal y Contratos Activos**: Ubicados en [`database/seed_core_humanis_rawdata.sql`](../database/seed_core_humanis_rawdata.sql), contienen los **228 colaboradores/contratos** extraídos y validados tras auditar las 60 pestañas de los archivos Excel institucionales (`raw-data`).

### 4.2. Pasos para Reiniciar y Poblar la Base de Datos PostgreSQL

#### Paso 1: Limpieza de Datos Anonimizados de Prueba
Ejecute la siguiente consulta SQL en la base de datos `db_core_humanis`:

```sql
BEGIN;

-- 1. Eliminar relaciones laborales, constancias emitidas y expedientes de prueba
TRUNCATE TABLE expediente_documentos, constancias_emitidas, relaciones_laborales, personas CASCADE;

-- 2. Limpiar catálogos preliminares para reinicio estandarizado
TRUNCATE TABLE puestos_funcionales, puestos_nominales, unidades_administrativas CASCADE;

COMMIT;
```

#### Paso 2: Carga de Catálogos Oficiales y Data Real
Desde la terminal o consola de PostgreSQL (`psql`), aplique los scripts de poblamiento en el siguiente orden estricto:

```bash
# 1. Poblar Catálogos Base (Unidades Administrativas, Puestos Nominales y Funcionales)
psql -U postgres -d db_core_humanis -f database/seed_catalogs_core_humanis.sql

# 2. Poblar Personal Activo, Histórico y Contratos Reales (228 Colaboradores/Contratos)
psql -U postgres -d db_core_humanis -f database/seed_core_humanis_rawdata.sql
```

---

## 5. Estructura de Plantillas Oficiales de Impresión (.docx)

Las plantillas oficiales para generación automatizada se encuentran almacenadas en la carpeta:
* [`core-humanis-app/template/`](./template)

Cada archivo utiliza la convención de nomenclatura `kebab-case` para ser referenciado dinámicamente desde la API Node.js (`api/src/services/certificates.service.js` y `api/src/services/templates.service.js`):

* `plantilla-constancia-laboral.docx` (Renglones 011/021/022/031 - Relación de Dependencia)
* `plantilla-constancia-029-sg18.docx` (Renglones 029/183/189 - Servicios Técnicos y Profesionales)
* `plantilla-contrato-022.docx` / `plantilla-contrato-029.docx` (Modelos de Contratos)
* `boleta-solicitud-vacaciones.docx` (Solicitud de Vacaciones)
* `acta-notarial-de-declaracion-jurada-029-final-con-negrita.docx` (Declaración Jurada Notarial)
