# Documentación Técnica: Editor Visual Interactivo de Organigramas (SCSPR)

## 1. Resumen Ejecutivo
Se implementó un **Editor Visual Interactivo** en el módulo de Organigramas de Core Humanis (`core-humanis-app/src/views/organigram.view.vue`), permitiendo construir, modificar, reorganizar y exportar la estructura jerárquica institucional directamente desde la interfaz gráfica de usuario sin depender exclusivamente de cargas manuales de archivos CSV.

---

## 2. Control de Acceso y Seguridad RBAC
El editor visual está estrictamente protegido por control de acceso basado en roles y permisos:
- **Roles y Permisos Autorizados**:
  - Rol `admin` (Administrador General).
  - Usuarios institucionales con permiso `core-humanis:write` o `core-humanis:admin`.
- **Comportamiento para Usuarios sin Permiso**:
  - Los controles del modo editor (botón `✏️ Modo Editor Visual`, barra de herramientas de lienzo y botones de acción en nodos) se ocultan completamente.
  - Los usuarios colaboradores o analistas sin permiso de escritura únicamente cuentan con la vista de consulta, filtrado institucional e impresión de plantillas.

---

## 3. Arquitectura de Componentes

### 3.1. Vista Principal (`organigram.view.vue`)
- **Estado de Modo Editor**: `isEditorMode` (ref booleano).
- **Barra de Herramientas de Edición**:
  - `➕ Nueva Unidad Raíz`: Despliega modal para crear una unidad administrativa de nivel superior.
  - `📄 Lienzo en Blanco`: Permite inicializar un lienzo vacío para proyectar una nueva estructura institucional desde cero.
  - `💾 Exportar CSV`: Descarga la estructura del organigrama en formato CSV estándar compatible con el dropzone.
  - `📋 Copiar CSV`: Copia el contenido CSV al portapapeles.
  - `🔄 Restaurar BD`: Restablece el organigrama original obtenido del endpoint de base de datos (`/catalogs/organigram`).
  - `✕ Cerrar Editor`: Desactiva el modo de edición y vuelve al modo de consulta.

### 3.2. Modal de Gestión de Unidades (`organigram-unit.modal.vue`)
- Permite la creación y edición de unidades administrativas.
- Campos:
  - **Código Identificador**: Cadena única (ej. `DIR_RRHH`, `DEP_CONT`, `SEC_GEN`).
  - **Nombre Oficial**: Nombre formal del área o unidad administrativa.
  - **Dependencia Jerárquica**: Selector de unidad superior / padre, evitando autoreferencias cíclicas en modo edición.

### 3.3. Modal de Asignación de Personal (`organigram-collaborator.modal.vue`)
Satisface el requerimiento de permitir asignar un colaborador existente o ingresar uno nuevo:
- **Pestaña 1 - Catálogo Institucional**:
  - Búsqueda en tiempo real por nombre, apellido o CUI conectada a `/collaborators`.
  - Tarjeta de vista previa con datos laborales y opción de personalizar el puesto funcional en el área.
- **Pestaña 2 - Ingreso Manual / Proyectado**:
  - Formulario con CUI/DPI, Nombres, Apellidos, Puesto Funcional y Renglón Presupuestario (011, 022, 029, 031, etc.).
- **Nivel Jerárquico dentro del Área**:
  - 👑 **Jefatura / Dirección (Nivel 1)**: Colaborador asignado a la cúspide directiva del área (Director, Jefe de Departamento, Encargado).
  - 👥 **Equipo Técnico / Subordinado (Nivel 2)**: Colaborador asignado al equipo operativo subordinado.

### 3.4. Nodo Jerárquico Recursivo (`organigram-node.vue`)
- Acciones en cabecera de cada área:
  - `👤+ Personal`: Abre modal de asignación de colaborador para esa unidad específica.
  - `➕ Subárea`: Crea una subunidad dependiente con la relación padre ya configurada.
  - `✏️`: Permite editar el código y nombre del área.
  - `🗑️`: Elimina el área y su rama de subunidades previa confirmación.
- Acciones en tarjetas de colaborador:
  - `👑` / `⬇️`: Permite alternar y promover colaboradores entre Jefatura (Nivel 1) y Equipo Técnico (Nivel 2).
  - `✕`: Desasigna al colaborador del área correspondiente.

---

## 4. Compatibilidad Bidireccional de Formato CSV
El editor visual genera y parsea archivos CSV con el siguiente formato canónico:
```csv
cod_unidad, nombre_unidad, cod_padre, cod_empleado, nombre_empleado, puesto
```
- **Unidades con personal**: Genera una fila por cada miembro asignado.
- **Unidades sin personal**: Genera una fila con campos de empleado vacíos, preservando la jerarquía completa al volver a importar.

---

## 5. Pruebas Automatizadas
Se implementó la suite de pruebas unitarias en `src/stores/__tests__/organigram.test.js` con Vitest:
- Verificación de guardas de seguridad RBAC para roles `admin`, `JEFA_RRHH`, `COLABORADOR` y permisos granulares.
- Verificación de jerarquía Nivel 1 vs Nivel 2 y transición de roles.
- Verificación de serialización y compatibilidad de formato CSV.
