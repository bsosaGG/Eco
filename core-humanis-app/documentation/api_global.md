### 1. Análisis y Contraste con el Resto de Módulos

Para entender cómo encaja este nuevo endpoint, contrastamos cómo se manejan la autenticación, los permisos, los datos y las consultas cruzadas en la plataforma:

| Aspecto | Resto de Módulos (`adquisiciones`, `transportes`, `juridica`, etc.) | Estado Actual en `core-humanis` | Propuesta para el Nuevo Endpoint |
| :--- | :--- | :--- | :--- |
| **Autenticación (JWT)** | Global centralizada con `verifyToken` (`api/src/middleware/auth.middleware.js`). Valida token firmado con `JWT_SECRET_KEY_SCSCR` y verifica que el usuario esté activo en `db_global_users`. | Utiliza `verifyToken` en sus rutas canónicas y portal, pero tiene además endpoints standalone `/auth/tokens`. | **Mismo estándar global:** Utiliza `verifyToken`. Cualquier usuario o módulo autenticado en el sistema SCSPR puede enviar su token. |
| **Control de Acceso (RBAC)** | `checkPermission('<modulo>:<accion>')`. Los permisos viven en la tabla `permisos` de `db_global_users`. Los administradores (`rol = 'admin'`) tienen bypass universal. | Usa `core-humanis:read`, `core-humanis:write`, `core-humanis:constancias` y `core-humanis:admin`. | Se crea un permiso específico y acotado: **`core-humanis:user`**, registrado en `db_global_users.permisos`. |
| **Nivel de Exposición de Datos** | Módulos como `transportes` permiten a usuarios comunes crear solicitudes (`transportes:read`), exponiendo solo lo necesario para el solicitante. | `core-humanis:read` abre el acceso a **todo el expediente**: salarios, finiquitos CGC, suspensiones, auditoría, alertas de semáforo y documentos sensibles. | **Mínimo Privilegio (Data Minimization):** Solo expone la proyección básica requerida (DPI, Nombre completo, Puesto, Correo corporativo, Renglón y Unidad). **Nunca** expone salarios, sanciones ni datos privados. |
| **Bases de Datos y Aislamiento** | Cada módulo tiene su propia base de datos (`db_adquisiciones`, `db_transportes`, etc.). Cuando necesitan saber de usuarios, consultan `db_global_users` (`usuarios`). | Los datos formales de RRHH (contratos 011/022/029, puestos funcionales/nominales, CUI) solo viven en `db_core_humanis` (`personas`, `relaciones_laborales`). | **API Inter-modular Limpia:** Los otros módulos consumen la API de Humanis por HTTP, evitando que otros módulos hagan queries SQL directas o se acoplen a las tablas internas de `db_core_humanis`. |
| **Consultas Puntuales (Lookup)** | En `adquisiciones` se usa `GET /catalogos/unidades/:id/usuarios` o `GET /proveedores/:id`. En `user` se usa `GET /api/user/profile`. | Actualmente solo existía `/portal/profile` (self-service acoplado al usuario en sesión) o `/collaborators/:id` (requería `core-humanis:read` y UUID). | Se agrega un endpoint de búsqueda/lookup por correo institucional: `GET /api/core-humanis/collaborators/lookup?email=...` (y alias por ruta si aplica). |

---

### 2. Justificación Técnica del Permiso `core-humanis:user`

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
   Al no incluir `core-humanis:user` en este getter, un usuario que pertenezca a otra app podrá consultar el endpoint desde su frontend o backend, **sin que se le active la tarjeta de gestión de Recursos Humanos** en el panel de administración central.

---

### 3. Especificación del Nuevo Endpoint

#### **A. Firma del Endpoint**
- **Método HTTP:** `GET`
- **Ruta Canónica:** `/api/core-humanis/collaborators/lookup` (también disponible bajo los alias montados en `api/src/app.js`: `/api/v1/core-humanis/collaborators/lookup`, `/api/rrhh/collaborators/lookup`, y `/api/core-humanis/colaboradores/consulta-correo`).
- **Autenticación:** Requerida (`verifyToken`).
- **Permiso Requerido:** `core-humanis:user` (o rol `admin`).

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
  "message": "Acceso denegado. Requiere el permiso [core-humanis:user]."
}
```

---

### 4. Arquitectura de Base de Datos y Manejo de Migraciones

#### **¿Por qué la migración va en un archivo separado y NO en `database/init_core_humanis.sql`?**

En el contenedor `db_master_container` (PostgreSQL), cada módulo opera sobre su propia base de datos física independiente para garantizar aislamiento:

```
PostgreSQL (db_master_container)
 ├── db_core_humanis       <-- Ejecuta database/init_core_humanis.sql (Usuario: usr_core_humanis_scspr)
 │    ├── personas
 │    ├── relaciones_laborales
 │    └── puestos_funcionales... (Aquí NO existe la tabla "permisos")
 │
 └── db_global_users       <-- Ejecuta database/init_users.sql y database/migrations/ (Usuario: usr_global_users)
      ├── usuarios
      ├── perfiles
      └── permisos         <-- ¡AQUÍ reside la tabla "permisos"!
```

**Motivos técnicos críticos para mantenerlo separado:**
1. **Destino de base de datos diferente:** El archivo `database/init_core_humanis.sql` se ejecuta exclusivamente sobre `db_core_humanis`. Si se agregara la sentencia `INSERT INTO permisos` dentro de `init_core_humanis.sql`, PostgreSQL fallará inmediatamente con:
   ```text
   ERROR: relation "permisos" does not exist
   ```
2. **Origen de validación en tiempo real:** El middleware `checkPermission('core-humanis:user')` (`api/src/middleware/auth.middleware.js`) consulta a través del pool `db-users.js` directamente la base de datos `db_global_users`.
3. **Contenedores ya inicializados:** En entornos de desarrollo y producción donde los contenedores ya están levantados (`docker compose up`), los archivos `init_*.sql` solo corren una única vez durante el primer arranque del volumen. Cualquier cambio posterior requiere un script de migración incremental.

#### **Protocolo de Ejecución de Migraciones de Permisos (Estándar del Monorepo)**

En este repositorio, **todos los módulos** siguen el mismo protocolo para registrar permisos contra `db_global_users`:

- **Adquisiciones** (documentado en `scripts/adquisiciones/README.md`):
  ```bash
  docker exec -i db_master_container psql -U usr_global_users -d db_global_users < scripts/adquisiciones/20260918_add_adquisiciones_permissions.sql
  ```
- **Jurídica** (`scripts/insert_juridica_permissions.sql`):
  ```bash
  docker exec -i db_master_container psql -U usr_global_users -d db_global_users < scripts/insert_juridica_permissions.sql
  ```
- **Core Humanis (permisos iniciales)** (`database/migrations/20260916_core_humanis_permisos.sql`):
  ```bash
  docker exec -i db_master_container psql -U usr_global_users -d db_global_users < database/migrations/20260916_core_humanis_permisos.sql
  ```
- **Protocolo Institucional de Integración** (`.agents/skills/integrar-modulo/SKILL.md`):
  ```bash
  docker exec -i db_master_container psql -U usr_global_users -d db_global_users < database/migrations/<script_permisos>.sql
  ```

> **¿Por qué `scripts/run_migrations.sh` no ejecuta los permisos automáticamente?**  
> En `scripts/run_migrations.sh`, la regla de mapeo tiene por diseño:  
> ```bash
> case "$filename" in
>   *permisos*)
>     # Scripts de permisos corresponden a db_global_users; ignorados por seguridad en este script
>     echo "IGNORED"
>     ;;
> ```  
> El runner automático solo migra bases operativas (`db_core_humanis`, etc.) y **omite intencionalmente** los scripts de permisos para proteger `db_global_users` (la base de datos compartida de seguridad de toda la institución). Por tanto, en todos los módulos, los permisos se aplican de forma explícita vía `psql`.

---

### 5. Componentes a Modificar / Crear y Ejecución

#### 1. Migración de Base de Datos (`database/migrations/20261008_core_humanis_permiso_user.sql`)
```sql
-- ============================================================================
-- MIGRACIÓN DE PERMISOS: CORE HUMANIS (INTEROPERABILIDAD)
-- Para ejecutar en db_global_users de denuncias-scsp
-- ============================================================================

INSERT INTO permisos (clave_permiso, descripcion)
VALUES
    ('core-humanis:user', 'Consulta básica de colaboradores por correo institucional para interoperabilidad')
ON CONFLICT (clave_permiso) DO NOTHING;
```

**Paso a Paso de Ejecución (Igual que en los demás módulos):**

1. **Aplicar la migración contra `db_global_users`:**
   ```bash
   docker exec -i db_master_container psql -U usr_global_users -d db_global_users \
     < database/migrations/20261008_core_humanis_permiso_user.sql
   ```
   *(Nota: Es totalmente idempotente gracias a `ON CONFLICT DO NOTHING`, se puede ejecutar múltiples veces sin duplicar datos ni causar errores).*

2. **Verificar que el permiso quedó registrado:**
   ```bash
   docker exec -i db_master_container psql -U usr_global_users -d db_global_users -c \
     "SELECT id_permiso, clave_permiso, descripcion FROM permisos WHERE clave_permiso = 'core-humanis:user';"
   ```

3. **Asignación a roles/usuarios:**
   - Para usuarios con rol `'admin'`, el acceso es automático por bypass universal en `checkPermission`.
   - Si se requiere asignar a un perfil institucional específico (ej. `Usuario Institucional`):
     ```sql
     INSERT INTO perfil_permisos (id_perfil, id_permiso)
     VALUES (
         (SELECT id_perfil FROM perfiles WHERE nombre_perfil = 'Usuario Institucional'),
         (SELECT id_permiso FROM permisos WHERE clave_permiso = 'core-humanis:user')
     ) ON CONFLICT DO NOTHING;
     ```

#### 2. Rutas (`api/src/routes/core-humanis.routes.js`)
Registrar la ruta protegida con `verifyToken` y `checkPermission("core-humanis:user")`:
```javascript
router.get(
  "/collaborators/lookup",
  verifyToken,
  checkPermission("core-humanis:user"),
  collaboratorsCtrl.getColaboradorByEmail
);
```

#### 3. Controlador (`api/src/controllers/collaborators.controller.js`)
Implementar la función `getColaboradorByEmail` que ejecute la consulta sobre `personas` unida a `relaciones_laborales` activas (`es_contrato_actual = true`), `puestos_funcionales`, `puestos_nominales` y `unidades_administrativas`.

