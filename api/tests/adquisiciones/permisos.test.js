// Permiso del cambio manual de estado: se salta las validaciones del flujo, así que es solo administrativo.
const env = require("./helpers/test-env"); // debe ir primero: prepara variables de entorno y BDs
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");

describe("Adquisiciones: cambio manual de estado", () => {
  let server;
  let id;
  let admin;
  let configurador;
  let gestor;
  let lector;

  const cambiar = (usuario, nuevoEstadoId) =>
    server.request("PUT", `/expedientes/${id}/estado`, { token: usuario.token, json: { nuevoEstadoId } });
  const estadoActual = async () => (await server.request("GET", `/expedientes/${id}`, { token: admin.token })).data.estado;

  before(async () => {
    await env.createUsersDatabase();
    await env.createDatabase();
    server = await env.startServer();
    admin = await env.createUser({ nombre: "Admin Prueba", rol: "admin" });
    configurador = await env.createUser({ nombre: "Cora Config", permisos: ["adquisiciones:read", "adquisiciones:config"] });
    // Todo lo de gestión del trámite, menos administrar catálogos.
    gestor = await env.createUser({
      nombre: "Gina Gestora",
      permisos: ["adquisiciones:read", "adquisiciones:assign", "adquisiciones:devolver", "adquisiciones:manage-cotizaciones", "adquisiciones:autorizar-pago"],
    });
    lector = await env.createUser({ nombre: "Luis Lector", permisos: ["adquisiciones:read", "adquisiciones:create"] });
    id = (await server.request("POST", "/expedientes", { token: admin.token, json: { id_unidad_solicitante: 1, objeto_compra: "Compra", justificacion: "x" } })).data.id_expediente;
  });

  after(async () => {
    await server.close();
  });

  it("quien solo lee o crea solicitudes no puede cambiar el estado", async () => {
    const res = await cambiar(lector, 10);
    assert.equal(res.status, 403);
    assert.match(res.data.message, /adquisiciones:config/);
    assert.equal(await estadoActual(), "Recibida por Adquisiciones");
  });

  it("tampoco con los permisos de gestión del trámite (asignar, devolver, cotizar, autorizar pago)", async () => {
    assert.equal((await cambiar(gestor, 10)).status, 403);
    assert.equal(await estadoActual(), "Recibida por Adquisiciones");
  });

  it("sin sesión no hay acceso", async () => {
    assert.equal((await server.request("PUT", `/expedientes/${id}/estado`, { json: { nuevoEstadoId: 10 } })).status, 403);
  });

  it("quien administra (config) y el admin sí pueden", async () => {
    const res = await cambiar(configurador, 2);
    assert.equal(res.status, 200);
    assert.equal(res.data.estado, "Pendiente Cotización");
    assert.equal((await cambiar(admin, 1)).status, 200);
    assert.equal(await estadoActual(), "Recibida por Adquisiciones");
  });
});
