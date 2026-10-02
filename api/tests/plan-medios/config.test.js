// La conexión a la BD debe poder configurarse con las variables del .env del proyecto Python.
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { SRC } = require("./helpers/golden-paths");

const { resolveConnection } = require(path.join(SRC, "config/db-plan-medios"));

describe("configuración de la base de datos (variables del .env antiguo)", () => {
  it("acepta PLAN_MEDIOS_DATABASE_URL y quita el prefijo del driver de Python", () => {
    const env = { PLAN_MEDIOS_DATABASE_URL: "postgresql+psycopg://usr:clave@db:5432/planmedios" };
    assert.deepEqual(resolveConnection(env), { connectionString: "postgresql://usr:clave@db:5432/planmedios" });
    assert.equal(resolveConnection({ PLAN_MEDIOS_DATABASE_URL: "postgresql+psycopg2://a:b@h/x" }).connectionString, "postgresql://a:b@h/x");
    assert.equal(resolveConnection({ PLAN_MEDIOS_DATABASE_URL: "postgresql://a:b@h/x" }).connectionString, "postgresql://a:b@h/x");
  });

  it("acepta los componentes PLAN_MEDIOS_DB_* sin alterar contraseñas con caracteres especiales", () => {
    const env = {
      PLAN_MEDIOS_DB_HOST: "db_master", PLAN_MEDIOS_DB_PORT: "5433", PLAN_MEDIOS_DB_USER: "planmedios_admin",
      PLAN_MEDIOS_DB_PASSWORD: "p@ss:/w#rd?", PLAN_MEDIOS_DB_NAME: "planmedios",
    };
    assert.deepEqual(resolveConnection(env), {
      host: "db_master", port: 5433, user: "planmedios_admin", password: "p@ss:/w#rd?", database: "planmedios",
    });
  });

  it("usa el puerto 5432 por defecto", () => {
    const { port } = resolveConnection({ PLAN_MEDIOS_DB_HOST: "h", PLAN_MEDIOS_DB_USER: "u", PLAN_MEDIOS_DB_NAME: "n" });
    assert.equal(port, 5432);
  });

  it("la URL tiene prioridad sobre los componentes (como en el sistema original)", () => {
    const env = { PLAN_MEDIOS_DATABASE_URL: "postgresql://a:b@urlhost/x", PLAN_MEDIOS_DB_HOST: "otro", PLAN_MEDIOS_DB_USER: "u", PLAN_MEDIOS_DB_NAME: "n" };
    assert.equal(resolveConnection(env).connectionString, "postgresql://a:b@urlhost/x");
  });

  it("trata las variables vacías como no definidas (docker compose las pasa vacías)", () => {
    const env = { PLAN_MEDIOS_DATABASE_URL: "  ", PLAN_MEDIOS_DB_HOST: "h", PLAN_MEDIOS_DB_USER: "u", PLAN_MEDIOS_DB_NAME: "n", PLAN_MEDIOS_DB_PASSWORD: "" };
    const connection = resolveConnection(env);
    assert.equal(connection.host, "h");
    assert.equal(connection.password, undefined);
  });

  it("explica qué falta", () => {
    assert.throws(() => resolveConnection({}), /defina PLAN_MEDIOS_DATABASE_URL/);
    assert.throws(() => resolveConnection({ PLAN_MEDIOS_DB_HOST: "h" }), /falta PLAN_MEDIOS_DB_USER, PLAN_MEDIOS_DB_NAME/);
    assert.throws(() => resolveConnection({ PLAN_MEDIOS_DB_HOST: "h", PLAN_MEDIOS_DB_USER: "u", PLAN_MEDIOS_DB_NAME: "n", PLAN_MEDIOS_DB_PORT: "abc" }), /numérico/);
  });
});
