---
name: scspr-infra-db
description: Define la arquitectura de infraestructura SCSPR. Úsalo para agregar nuevos módulos, configurar bases de datos PostgreSQL aisladas, editar docker-compose.yml o configurar el proxy inverso Nginx.
---

# Estándar de Infraestructura SCSPR

Este proyecto utiliza una arquitectura de microservicios orquestada con Docker Compose. Sigue estas reglas estrictas al agregar nuevos módulos.

## Cuándo usar este skill
- Al crear un nuevo módulo (ej. Jurídico, Inventario).
- Al agregar un nuevo servicio de base de datos.
- Al exponer una nueva aplicación a través del Nginx Proxy.

## Reglas de Implementación

### 1. Bases de Datos (Aislamiento)
Cada módulo DEBE tener su propio contenedor de base de datos independiente. NO reutilizar bases de datos existentes para dominios diferentes.

- **Imagen:** `postgres:15-alpine`
- **Naming Convention:**
  - Servicio: `[nombre_modulo]_db_scspr`
  - Contenedor: `[nombre_modulo]_db_scspr_container`
  - Volumen: `postgres_data_[nombre_modulo]`
  - Usuario DB: `usr_[nombre_modulo]_scspr`
- **Inicialización:** Crear siempre un script `database/init_[nombre_modulo].sql` y montarlo en `/docker-entrypoint-initdb.d/`.

### 1.1 Registro de Permisos Globales
Aunque el módulo tenga su propia BD, los **Permisos de Acceso** se definen centralizadamente en `global_users_db`.

- **Script de Definición:**
  - Al crear un módulo, generar un snippet SQL con los `INSERT INTO permisos` requeridos (ej. `juridica:read`, `juridica:create`).
  - Este script debe ejecutarse sobre el contenedor `users_db`, no sobre la BD del módulo nuevo.
- **Nomenclatura:** Usar formato `[modulo]:[accion]` (ej. `juridica:audit`) para evitar colisiones con otros módulos.

### 2. Docker Compose
- Definir variables de entorno para contraseñas en `.env` (nunca hardcodeadas).
- Agregar `healthcheck` estándar (interval: 5s, timeout: 5s, retries: 5).
- Conectar a la red `app_main_network`.

### 3. Nginx Reverse Proxy
El contenedor `nginx` actúa como Gateway.
- Editar `nginx/default.conf`.
- Usar `location /[nombre_modulo]` para aplicaciones frontend.
- Usar `proxy_pass http://[nombre_contenedor]:80/`.
- Incluir headers estándar: `Host`, `X-Real-IP`, `X-Forwarded-For`.