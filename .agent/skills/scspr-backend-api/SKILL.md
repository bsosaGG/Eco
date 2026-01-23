---
name: scspr-backend-api
description: Estándares de desarrollo para el API Node.js/Express de SCSPR. Úsalo al crear rutas, controladores, servicios o middleware.
---

# Estándar de Backend SCSPR (Node.js)

El API es un monolito modularizado. Sigue el patrón MVC (Router -> Controller -> Service -> Repository/DB).

## Cuándo usar este skill
- Al crear endpoints para un nuevo módulo.
- Al implementar lógica de negocio.

## Reglas de Implementación

### 1. Estructura de Archivos
- `api/src/routes/[modulo].routes.js`: Definición de endpoints.
- `api/src/controllers/[modulo].controller.js`: Manejo de Request/Response HTTP.
- `api/src/services/[modulo].service.js`: Lógica de negocio y consultas SQL.
- `api/src/config/db-[modulo].js`: Configuración de conexión `pg` (Pool) específica para la BD del módulo.

### 2. Seguridad y Autenticación (MANDATORIO)
Todo endpoint protegido debe usar los middlewares existentes en `api/src/middleware/auth.middleware.js`:
- **verifyToken:** Valida el JWT y estado del usuario.
- **checkPermission('clave:permiso'):** Valida permisos granulares.

**Ejemplo:**
    ```javascript
    router.get("/", verifyToken, checkPermission("modulo:read"), controller.getAll);
    ```

### 3. Manejo de Errores
- Usar bloques `try/catch` en controladores.
- Pasar errores al middleware global con `next(error)`.
- Validar inputs antes de llamar al servicio.
