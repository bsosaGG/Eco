// Códigos HTTP de las reglas de negocio del módulo Adquisiciones: ValidationError (400),
// NotFoundError (404) y ConflictError (409), resueltos por el errorHandler global del core.
// (Antes de reorganizar el módulo estas reglas lanzaban `Error` simples y todas respondían 500.)
const env = require("./helpers/test-env"); // debe ir primero: prepara variables de entorno y BDs
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");

describe("Adquisiciones: errores de negocio con su código HTTP", () => {
  let server;
  let token;

  const post = (url, json = {}) => server.request("POST", url, { token, json });

  before(async () => {
    await env.createUsersDatabase();
    await env.createDatabase();
    server = await env.startServer();
    ({ token } = await env.createUser({ nombre: "Admin Prueba", rol: "admin" }));
    await env.createUser({ nombre: "Ana Analista", perfiles: ["Analista de Adquisiciones"] });
    await post("/expedientes", { id_unidad_solicitante: 1, objeto_compra: "Compra", justificacion: "Prueba" });
  });

  after(async () => {
    await server.close();
  });

  it("recurso inexistente: 404 con el mensaje en el cuerpo", async () => {
    const res = await server.request("GET", "/expedientes/999", { token });
    assert.equal(res.status, 404);
    assert.equal(res.data.statusCode, 404);
    assert.equal(res.data.message, "Expediente no encontrado.");
    assert.equal((await server.request("GET", "/proveedores/999", { token })).status, 404);
    assert.equal((await post("/cdp/999/aprobar")).status, 404);
    assert.equal((await post("/orden-compra/999/aprobar")).status, 404);
  });

  it("dato de entrada con referencia inválida: 400", async () => {
    const proveedor = await post("/expedientes/1/cotizaciones", { id_proveedor: 999, monto_ofertado: 10 });
    assert.equal(proveedor.status, 400);
    assert.equal(proveedor.data.message, "El proveedor especificado no existe.");
    assert.equal((await post("/expedientes/1/asignar", {})).status, 400);
    assert.equal((await post("/expedientes/1/cdp", { id_partida: 999, monto_reservado: 10 })).status, 400);
    assert.equal((await post("/expedientes/1/cdp", { id_partida: 1, monto_reservado: 999999 })).status, 400);
  });

  it("paso del flujo fuera de orden: 409", async () => {
    assert.equal((await post("/expedientes/1/orden-compra", { monto_total: 10 })).status, 409);
    assert.equal((await post("/expedientes/1/compromiso", { monto_comprometido: 10 })).status, 409);
    assert.equal((await post("/expedientes/1/trasladar-contabilidad")).status, 409);

    assert.equal((await post("/expedientes/1/cdp", { id_partida: 1, monto_reservado: 100 })).status, 201);
    const repetido = await post("/expedientes/1/cdp", { id_partida: 1, monto_reservado: 100 });
    assert.equal(repetido.status, 409);
    assert.equal(repetido.data.message, "Este expediente ya tiene un CDP elaborado.");
    assert.equal((await post("/cdp/1/vobo")).status, 409);
  });

  it("identificador mal formado en la ruta: 400 (antes llegaba a la BD y respondía 500)", async () => {
    const res = await post("/cdp/abc/aprobar");
    assert.equal(res.status, 400);
    assert.equal(res.data.errors[0].msg, "ID de CDP inválido.");
    assert.equal((await post("/orden-compra/xyz/autorizar")).status, 400);
    assert.equal((await post("/solicitud-pago/0/autorizar")).status, 400);
  });
});
