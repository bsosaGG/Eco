---
name: scspr-frontend-app
description: Estándares para nuevas aplicaciones Frontend (Vue 3 + Vite). Úsalo para crear interfaces de usuario, configurar Dockerfiles de frontend o builds de Vite.
---

# Estándar de Frontend SCSPR (Vue 3)

Las aplicaciones son SPAs independientes servidas por Nginx en contenedores Docker ligeros.

## Cuándo usar este skill
- Al inicializar una nueva aplicación (ej. `juridica-app`).
- Al configurar el `Dockerfile` de producción.

## Reglas de Implementación

### 1. Stack Tecnológico
- **Framework:** Vue 3 (Composition API).
- **Build Tool:** Vite.
- **Estilos:** TailwindCSS.

### 2. Dockerfile Estándar (Multi-stage)
SIEMPRE usar este patrón exacto para optimizar la imagen final:

1. **Build Stage:** `node:18-alpine`. Instala dependencias y ejecuta `npm run build`.
2. **Production Stage:** `nginx:stable-alpine`. Copia `/app/dist` a `/usr/share/nginx/html`.
3. **Configuración Nginx Interna:** Copiar `nginx.conf` local a `/etc/nginx/conf.d/default.conf` para manejar el routing de Vue (History Mode).

### 3. Integración
- La aplicación debe ser agnóstica de su ruta base si es posible, o configurarse en `vite.config.js` para usar base path relativo si se sirve bajo un subdirectorio.
- No incluir lógica de autenticación compleja en el front; confiar en el JWT y el API.

### 4. Seguridad y Control de Acceso (UI)
El frontend debe ocultar elementos visuales no autorizados para mejorar la UX, delegando la seguridad real al API.

- **Renderizado Condicional:**
  - Importar siempre el `useAuthStore`.
  - Usar `v-if="auth.hasPermission('modulo:accion')"` para ocultar botones, menús o secciones sensibles.
  - NO usar lógica compleja en el template; usar el helper `hasPermission`.

- **Protección de Rutas (Router Guards):**
  - Definir la metadata de permisos en `router/index.ts`:
    ```javascript
    { path: '/crear', component: ..., meta: { permission: 'juridica:create' } }
    ```
  - El router debe validar esto en `beforeEach` y redirigir si `!hasPermission()`.