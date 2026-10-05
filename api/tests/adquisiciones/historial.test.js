// Tiempo en cada estado: el trigger de la BD anota cada entrada a un estado y el API la devuelve.
const env = require("./helpers/test-env"); // debe ir primero: prepara variables de entorno y BDs
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");

describe("Adquisiciones: tiempo en cada estado", () => {
  let server;
  let pg;
  let token;
  let id;

  const call = (method, url, json) => server.request(method, url, { token, json });
  const historial = async () => (await call("GET", `/expedientes/${id}`)).data.historial_estados;
  const estados = async () => (await historial()).map((h) => h.estado);

  before(async () => {
    await env.createUsersDatabase();
    ({ pg } = await env.createDatabase());
    server = await env.startServer();
    ({ token } = await env.createUser({ nombre: "Admin Prueba", rol: "admin" }));
    const analista = await env.createUser({ nombre: "Ana Analista", perfiles: ["Analista de Adquisiciones"] });
    await call("POST", "/proveedores", { razon_social: "Proveedor Uno", nit: "1-1" });
    id = (await call("POST", "/expedientes", { id_unidad_solicitante: 1, objeto_compra: "Compra", justificacion: "x" })).data.id_expediente;
    env.analistaId = analista.id;
  });

  after(async () => {
    await server.close();
  });

  it("al crear el expediente queda la primera entrada, vigente", async () => {
    const h = await historial();
    assert.equal(h.length, 1);
    assert.equal(h[0].estado, "Recibida por Adquisiciones");
    assert.equal(h[0].actual, true);
    assert.equal(h[0].fecha_salida, null);
    assert.ok(h[0].fecha_entrada);
  });

  it("cada cambio de estado agrega una entrada, en orden, y cierra la anterior", async () => {
    await call("POST", `/expedientes/${id}/asignar`, { id_usuario_asignado: env.analistaId });
    const cot = (await call("POST", `/expedientes/${id}/cotizaciones`, { id_proveedor: 1, monto_ofertado: 500 })).data.cotizaciones[0];
    await call("POST", `/expedientes/${id}/cotizaciones/${cot.id_cotizacion}/adjudicar`);
    await call("POST", `/expedientes/${id}/devolver`, { etapa_origen: "CDP", motivo: "Falta" });

    assert.deepEqual(await estados(), ["Recibida por Adquisiciones", "Pendiente Cotización", "En firma CDP", "Devuelto con Observaciones"]);
    const h = await historial();
    assert.deepEqual(h.map((e) => e.actual), [false, false, false, true]);
    for (let i = 0; i < h.length - 1; i += 1) assert.equal(h[i].fecha_salida, h[i + 1].fecha_entrada);
    assert.equal(h[3].etapa, "Devolucion");
  });

  it("repetir el mismo estado no genera una entrada nueva", async () => {
    const antes = (await historial()).length;
    const estadoActual = (await call("GET", `/expedientes/${id}`)).data.id_estado_actual;
    await call("PUT", `/expedientes/${id}/estado`, { nuevoEstadoId: estadoActual });
    assert.equal((await historial()).length, antes);
  });

  it("un cambio hecho directo en la base también queda registrado (lo garantiza el trigger)", async () => {
    await pg.query("UPDATE expedientes SET id_estado_actual = 10 WHERE id_expediente = $1", [id]);
    assert.equal((await estados()).pop(), "Pagado y Archivado");
  });

  it("la lista indica desde cuándo está cada expediente en su estado actual", async () => {
    const lista = (await call("GET", "/expedientes")).data;
    const fila = lista.find((e) => e.id_expediente === id);
    const h = await historial();
    assert.equal(new Date(fila.en_estado_desde).getTime(), new Date(h[h.length - 1].fecha_entrada).getTime());
    assert.ok(fila.servidor_ahora);
  });

  it("el detalle trae la hora del servidor para medir el estado vigente", async () => {
    const detalle = (await call("GET", `/expedientes/${id}`)).data;
    assert.ok(new Date(detalle.servidor_ahora) >= new Date(detalle.historial_estados.at(-1).fecha_entrada));
  });

  it("borrar un expediente borra su historial", async () => {
    await pg.query("DELETE FROM expedientes WHERE id_expediente = $1", [id]);
    assert.equal((await pg.query("SELECT COUNT(*)::int AS n FROM historial_estados WHERE id_expediente = $1", [id])).rows[0].n, 0);
  });
});
