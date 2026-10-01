# scripts/plan-medios/

Todo lo que hay que correr a mano para el módulo **Plan de Medios**, en 2 comandos.
La base de datos es **nueva** (no reutiliza datos del proyecto Python anterior) y los usuarios, roles y
permisos siguen **centralizados en `db_global_users`**, igual que el resto de módulos.

| Qué | Dónde |
| --- | --- |
| Base de datos | `db_plan_medios_scspr` |
| Usuario de la base | `usr_plan_medios_scspr` |
| Contraseña | `POSTGRES_PASSWORD_PLAN_MEDIOS` (en el `.env` de la raíz de `denuncias-scsp/`) |
| Tablas (8) | `database/init_plan_medios.sql` |
| Permisos (4) | `plan-medios:read`, `create`, `update`, `export` en `db_global_users` (`database/migrations/20260907_add_plan_medios_permissions.sql`) |

## 1) Crear todo (usuario, base, tablas y permisos)

Con `db_master` corriendo:

```bash
docker compose exec -T db_master sh /sql_scripts/scripts/setup_plan_medios.sh
```

Es **idempotente**: se puede repetir sin perder datos (no borra nada). Al final verifica que existan las
8 tablas y los 4 permisos. En Git Bash de Windows anteponga `MSYS_NO_PATHCONV=1`; en PowerShell no hace falta.

> En un servidor nuevo (volumen de Postgres vacío) las tablas y el usuario se crean solos al arrancar
> `db_master` (`database/init_master.sh`); aun así hay que correr este comando una vez para los permisos.

## 2) Cargar el catálogo de medios

La base nace vacía y el ranking necesita medios. Se carga desde el Excel oficial del catálogo
(hojas Televisión, Radio, Cable, Exteriores, Impresos y Digital):

```bash
# Primero validar el archivo (no escribe nada):
docker compose exec -T denuncias_api_scspr node scripts/plan-medios/import-catalog.js /ruta/en/el/contenedor/Medios.xlsx --dry-run

# Cargarlo:
docker compose exec -T denuncias_api_scspr node scripts/plan-medios/import-catalog.js /ruta/en/el/contenedor/Medios.xlsx
```

El archivo debe estar dentro del contenedor; lo más simple es dejarlo en `uploads_scspr/` (carpeta montada
como `/usr/src/app/uploads`) y usar `/usr/src/app/uploads/Medios.xlsx`. Con el Excel actual carga
**144 medios y 269 productos**.

La carga se puede repetir cuando el catálogo se actualice: los medios que ya existen se actualizan **sin
cambiar su id** (los expedientes que los seleccionaron no se rompen) y los que no vienen en el archivo se
dejan como están. Cada carga queda registrada en `catalog_import_runs`.

## Reiniciar solo esta base

```bash
docker compose exec -T db_master psql -U postgres -d postgres -c "
  SELECT pg_terminate_backend(pid) FROM pg_stat_activity
  WHERE datname = 'db_plan_medios_scspr' AND pid <> pg_backend_pid();"
docker compose exec -T db_master psql -U postgres -d postgres -c "DROP DATABASE db_plan_medios_scspr;"
docker compose exec -T db_master sh /sql_scripts/scripts/setup_plan_medios.sh
```

(Después hay que volver a cargar el catálogo. **Borra todos los expedientes y su auditoría.**)

## Cambiar la contraseña

Edite `POSTGRES_PASSWORD_PLAN_MEDIOS` en el `.env` y vuelva a correr el comando del paso 1 (actualiza la
contraseña del usuario en la base) y reinicie el API: `docker compose up -d denuncias_api_scspr`.
