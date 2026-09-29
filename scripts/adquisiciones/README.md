# scripts/adquisiciones/

Todo lo del módulo de Adquisiciones (SICOMPRAS, Baja Cuantía) que hay que correr a
mano queda reducido a lo mínimo posible:

- El **schema completo** de `db_adquisiciones_scspr` (todas las tablas, incluyendo las
  16 unidades oficiales, `usuarios_unidad_solicitante`, y los campos del formulario
  real FOR-DG-UA-00-01) vive directamente en `database/init_adquisiciones.sql` — ya
  no hay migraciones sueltas para esa base. Si necesitas reiniciar el módulo desde
  cero, ver la sección "Reiniciar la base del módulo" abajo.
- Lo único que queda en esta carpeta son 3 scripts contra `db_global_users` (permisos,
  perfiles y usuarios de prueba), porque esa base es compartida por toda la
  plataforma y `init_adquisiciones.sql` no la toca.

## Scripts (contra `db_global_users`)

1. **`20260918_add_adquisiciones_permissions.sql`** — los 19 permisos `adquisiciones:*`.
2. **`20260918_add_adquisiciones_perfiles.sql`** — los 12 perfiles del módulo y su
   relación con los permisos.
3. **`20260925_seed_adquisiciones_usuarios.sql`** — 12 usuarios de prueba (uno por
   perfil) + 1 superadministrador.

```bash
docker exec -i db_master_container psql -U usr_global_users -d db_global_users \
  < scripts/adquisiciones/20260918_add_adquisiciones_permissions.sql

docker exec -i db_master_container psql -U usr_global_users -d db_global_users \
  < scripts/adquisiciones/20260918_add_adquisiciones_perfiles.sql

docker exec -i db_master_container psql -U usr_global_users -d db_global_users \
  < scripts/adquisiciones/20260925_seed_adquisiciones_usuarios.sql
```

Son idempotentes (`ON CONFLICT DO NOTHING`) — se pueden correr más de una vez sin
duplicar datos.

## Reiniciar la base del módulo (`db_adquisiciones_scspr`)

`database/init_master.sh` solo corre automáticamente cuando el volumen de Postgres
se crea desde cero (primera vez que arranca `db_master`), así que para reiniciar
*solo* Adquisiciones sin tocar las demás bases hay que borrar y recrear la base a
mano y volver a correr `init_adquisiciones.sql` directamente:

```bash
# 1) Cortar conexiones activas y borrar la base
docker exec -i db_master_container psql -U postgres -d postgres -c "
  SELECT pg_terminate_backend(pid) FROM pg_stat_activity
  WHERE datname = 'db_adquisiciones_scspr' AND pid <> pg_backend_pid();"
docker exec -i db_master_container psql -U postgres -d postgres -c "DROP DATABASE db_adquisiciones_scspr;"

# 2) Recrearla
docker exec -i db_master_container psql -U postgres -d postgres -c \
  "CREATE DATABASE db_adquisiciones_scspr OWNER usr_adquisiciones_scspr;"

# 3) Volver a correr el schema completo (ya incluye las 16 unidades, usuarios_unidad_solicitante, etc.)
docker exec -i db_master_container psql -U postgres -d db_adquisiciones_scspr \
  < database/init_adquisiciones.sql

# 4) Otorgar permisos (mismo paso que hace init_master.sh en el primer arranque)
docker exec -i db_master_container psql -U postgres -d db_adquisiciones_scspr -c "
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO usr_adquisiciones_scspr;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO usr_adquisiciones_scspr;"
```

**Esto borra TODOS los expedientes, cotizaciones, CDP, etc. que existan en
Adquisiciones** — úsalo solo en ambiente de prueba, nunca contra datos reales en
producción. No toca `db_global_users` (permisos/perfiles/usuarios siguen intactos).

Después de reiniciar, `usuarios_unidad_solicitante` queda vacía otra vez — hay que
volver a poblarla a mano con las asignaciones reales que existan por unidad.

## Datos dummy (seed) de Adquisiciones

`seed_adquisiciones_data.sh` (+ `seed_adquisiciones_data.sql`) puebla `db_adquisiciones_scspr`
con **27 expedientes** repartidos en los 11 estados del ciclo de vida, cada uno con la cadena
completa hasta donde llega su etapa: renglones, cotizaciones, CDP (Borrador / Aprobado
Técnicamente / Aprobado), OC (Borrador / Aprobada Jefatura / Emitida), recepción (una conforme
y una con observaciones), documentos de soporte, compromiso, devengado, solicitud de pago
(Pendiente / Tramitado), devoluciones (2 pendientes, una de ellas vencida, y 1 subsanada) y
bitácora. Incluye 8 proveedores, partidas 2026 con saldo recalculado y las asignaciones
usuario-unidad.

Requiere haber corrido antes el seed de usuarios (`20260925_seed_adquisiciones_usuarios.sql`):
el `.sh` busca los `id_usuario` reales en `db_global_users` y se los pasa al `.sql`.

```bash
bash scripts/adquisiciones/seed_adquisiciones_data.sh
```

**Borra** los datos operativos del módulo (expedientes, cotizaciones, CDP, OC, etc.) y los
vuelve a crear; conserva catálogos y proveedores. Es re-ejecutable. Solo ambiente de prueba.

## Nomenclatura de expedientes

Cada expediente se identifica con:

```
ABREVIATURA-CORRELATIVO-AÑO
```

Por ejemplo `UA-1-2026`, `DPL-4-2026`. El correlativo es independiente por unidad y por
año (arranca en 1 cada año, sin cero relleno). Se genera en
`AdquisicionesService._generarSiguienteCodigo()` (`api/src/services/adquisiciones.service.js`).

## Unidades Solicitantes oficiales y sus abreviaturas

| Abreviatura | Unidad |
|---|---|
| DPL  | Dirección de Producción y Logística |
| UL   | Unidad de Logística |
| UT   | Unidad de Televisión |
| UM   | Unidad de Medios |
| DIP  | Dirección de Información y Prensa |
| DRI  | Dirección de Relaciones Interinstitucionales |
| DG   | Dirección General |
| DS   | Despacho Superior |
| URH  | Unidad de Recursos Humanos |
| UDAF | Unidad de Administración Financiera |
| UA   | Unidad de Adquisiciones |
| AJ   | Asesoría Jurídica |
| USG  | Unidad de Servicios Generales |
| UP   | Unidad de Planificación |
| UDAI | Unidad de Auditoría Interna |
| UI   | Unidad de Informática |
