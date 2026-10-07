### 1. Análisis y Contraste con el Resto de Módulos

Para entender cómo encaja este nuevo endpoint, contrastamos cómo se manejan la autenticación, los permisos, los datos y las consultas cruzadas en la plataforma:

| Aspecto | Resto de Módulos (`adquisiciones`, `transportes`, `juridica`, etc.) | Estado Actual en `core-humanis` | Propuesta para el Nuevo Endpoint |
| :--- | :--- | :--- | :--- |
| **Autenticación (JWT)** | Global centralizada con `verifyToken` (`api/src/middleware/auth.middleware.js`). Valida token firmado con `JWT_SECRET_KEY_SCSCR` y verifica que el usuario esté activo en `db_global_users`. | Utiliza `verifyToken` en sus rutas canónicas y portal, pero tiene además endpoints standalone `/auth/tokens`. | **Mismo estándar global:** Utiliza `verifyToken`. Cualquier usuario o módulo autenticado en el sistema SCSPR puede enviar su token. |
| **Control de Acceso (RBAC)** | `checkPermission('<modulo>:<accion>')`. Los permisos viven en la tabla `permisos` de `db_global_users`. Los administradores (`rol = 'admin'`) tienen bypass universal. | Usa `core-humanis:read`, `core-humanis:write`, `core-humanis:constancias` y `core-humanis:admin`. | Se crea un permiso específico y acotado: **`core-humanis:usuario`**, registrado en `db_global_users.permisos`. |
| **Nivel de Exposición de Datos** | Módulos como `transportes` permiten a usuarios comunes crear solicitudes (`transportes:read`), exponiendo solo lo necesario para el solicitante. | `core-humanis:read` abre el acceso a **todo el expediente**: salarios, finiquitos CGC, suspensiones, auditoría, alertas de semáforo y documentos sensibles. | **Mínimo Privilegio (Data Minimization):** Solo expone la proyección básica requerida (DPI, Nombre completo, Puesto, Correo corporativo, Renglón y Unidad). **Nunca** expone salarios, sanciones ni datos privados. |
| **Bases de Datos y Aislamiento** | Cada módulo tiene su propia base de datos (`db_adquisiciones`, `db_transportes`, etc.). Cuando necesitan saber de usuarios, consultan `db_global_users` (`usuarios`). | Los datos formales de RRHH (contratos 011/022/029, puestos funcionales/nominales, CUI) solo viven en `db_core_humanis` (`personas`, `relaciones_laborales`). | **API Inter-modular Limpia:** Los otros módulos consumen la API de Humanis por HTTP, evitando que otros módulos hagan queries SQL directas o se acoplen a las tablas internas de `db_core_humanis`. |
| **Consultas Puntuales (Lookup)** | En `adquisiciones` se usa `GET /catalogos/unidades/:id/usuarios` o `GET /proveedores/:id`. En `user` se usa `GET /api/user/profile`. | Actualmente solo existía `/portal/profile` (self-service acoplado al usuario en sesión) o `/collaborators/:id` (requería `core-humanis:read` y UUID). | Se agrega un endpoint de búsqueda/lookup por correo institucional: `GET /api/core-humanis/collaborators/lookup?email=...` (y alias por ruta si aplica). |

---

### 2. Justificación Técnica del Permiso `core-humanis:usuario`

1. **Por qué NO usar `core-humanis:read`:**
   Actualmente, una persona con `core-humanis:read` puede listar y descargar expedientes confidenciales de RRHH en la interfaz de Humanis. Los usuarios de las otras aplicaciones solo necesitan consultar datos de un colaborador para autocompletar una solicitud o flujo institucional.
2. **Impacto en el Admin Panel:**
   En `admin-panel/src/stores/auth.store.ts`, el getter `hasAnyCoreHumanisPermission` condiciona la visibilidad de la tarjeta del sistema en el dashboard:
   ```typescript
   hasAnyCoreHumanisPermission: (state): boolean => {
     if (state.user?.role === 'admin') return true
     return [
       'core-humanis:read',
       'core-humanis:write',
       'core-humanis:constancias',
       'core-humanis:admin',
     ].some((p) => state.user?.permissions?.includes(p))
   }
   ```
   Al no incluir `core-humanis:usuario` en este getter, un usuario que pertenezca a otra app podrá consultar el endpoint desde su frontend o backend, **sin que se le active la tarjeta de gestión de Recursos Humanos** en el panel de administración central.

---

### 3. Especificación del Nuevo Endpoint

#### **A. Firma del Endpoint**
- **Método HTTP:** `GET`
- **Ruta Canónica:** `/api/core-humanis/collaborators/lookup` (también disponible bajo los alias montados en `api/src/app.js`: `/api/v1/core-humanis/collaborators/lookup`, `/api/rrhh/collaborators/lookup`, y `/api/core-humanis/colaboradores/consulta-correo`).
- **Autenticación:** Requerida (`verifyToken`).
- **Permiso Requerido:** `core-humanis:usuario` (o rol `admin`).

#### **B. Parámetros de Consulta (Query Params)**
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `email` | `string` | **Sí** | Correo electrónico corporativo / institucional del colaborador. | `jperez@scspr.gob.gt` |

*(Nota: Se prefiere Query Param `?email=` sobre Path Param `/:email` para evitar problemas con la codificación de caracteres especiales `@` o puntos `.` en proxies reversos Nginx).*

#### **C. Contrato de Respuesta**

##### **1. Caso de Éxito (HTTP 200 OK)**
```json
{
  "cui_dpi": "2541893210101",
  "nombre_completo": "Juan Carlos Pérez Gómez",
  "primer_nombre": "Juan",
  "segundo_nombre": "Carlos",
  "primer_apellido": "Pérez",
  "segundo_apellido": "Gómez",
  "correo_institucional": "jperez@scspr.gob.gt",
  "puesto": "Analista de Comunicación",
  "puesto_funcional": "Analista de Comunicación",
  "puesto_nominal": "Profesional I",
  "unidad_administrativa": "Dirección de Comunicación Digital",
  "renglon": "011",
  "activo": true
}
```

##### **2. Parámetro Inválido o Faltante (HTTP 400 Bad Request)**
```json
{
  "message": "Debe proporcionar un correo electrónico corporativo válido."
}
```

##### **3. Colaborador No Encontrado (HTTP 404 Not Found)**
```json
{
  "message": "No se encontró ningún colaborador activo con el correo institucional proporcionado."
}
```

##### **4. Sin Permisos (HTTP 403 Forbidden)**
```json
{
  "message": "Acceso denegado. Requiere el permiso [core-humanis:usuario]."
}
```

---

### 4. Componentes a Modificar / Crear

1. **Migración de Base de Datos (`database/migrations/20261008_core_humanis_permiso_usuario.sql`):**
   ```sql
   INSERT INTO permisos (clave_permiso, descripcion)
   VALUES ('core-humanis:usuario', 'Consulta básica de colaboradores por correo institucional para interoperabilidad')
   ON CONFLICT (clave_permiso) DO NOTHING;
   ```
2. **Rutas (`api/src/routes/core-humanis.routes.js`):**
   Registrar la ruta protegida con `verifyToken` y `checkPermission("core-humanis:usuario")`.
3. **Controlador (`api/src/controllers/collaborators.controller.js`):**
   Implementar la función `getColaboradorByEmail` que ejecute la consulta sobre `personas` unida a `relaciones_laborales` activas (`es_contrato_actual = true`), `puestos_funcionales`, `puestos_nominales` y `unidades_administrativas`.


