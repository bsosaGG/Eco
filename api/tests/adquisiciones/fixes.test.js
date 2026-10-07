// Tres correcciones: búsqueda del expediente por su código, cargo de la segunda firma y monto del
// expediente fijado por la cotización adjudicada.
const env = require("./helpers/test-env"); // debe ir primero: prepara variables de entorno y BDs
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");

describe("Adquisiciones: correcciones", () => {
  let server;
  let token;
  let jefe;
  const anio = new Date().getFullYear();

  const call = (method, url, json) => server.request(method, url, { token, json });
  const crear = (extra = {}) =>
    call("POST", "/expedientes", { id_unidad_solicitante: 1, objeto_compra: "Compra", justificacion: "Prueba", ...extra });
  const cotizar = (idExpediente, idProveedor, monto) =>
    call("POST", `/expedientes/${idExpediente}/cotizaciones`, { id_proveedor: idProveedor, monto_ofertado: monto });

  before(async () => {
    await env.createUsersDatabase();
    await env.createDatabase();
    server = await env.startServer();
    ({ token } = await env.createUser({ nombre: "Admin Prueba", rol: "admin" }));
    jefe = await env.createUser({ nombre: "Jorge Jefe", perfiles: ["Jefe de Adquisiciones"] });
    await call("POST", "/proveedores", { razon_social: "Proveedor Uno", nit: "1-1" });
    await call("POST", "/proveedores", { razon_social: "Proveedor Dos", nit: "2-2" });
  });

  after(async () => {
    await server.close();
  });

  describe("buscar el expediente por código", () => {
    it("el detalle responde igual por id numérico que por código", async () => {
      const creado = await crear({ items: [{ descripcion: "a", cantidad: 1, unidad_medida: "u" }] });
      assert.equal(creado.status, 201);
      const codigo = `DPL-1-${anio}`;
      assert.equal(creado.data.codigo_expediente, codigo);

      const porId = await call("GET", `/expedientes/${creado.data.id_expediente}`);
      const porCodigo = await call("GET", `/expedientes/${codigo}`);
      assert.equal(porCodigo.status, 200);
      // La hora del servidor cambia entre una llamada y otra.
      delete porId.data.servidor_ahora;
      delete porCodigo.data.servidor_ahora;
      assert.deepEqual(porCodigo.data, porId.data);
    });

    it("un código que no existe da 404, no 500", async () => {
      const res = await call("GET", `/expedientes/DPL-99-${anio}`);
      assert.equal(res.status, 404);
      assert.equal(res.data.message, "Expediente no encontrado.");
    });

    it("un id que no existe sigue dando 404", async () => {
      assert.equal((await call("GET", "/expedientes/999")).status, 404);
    });
  });

  describe("cargo de la segunda firma", () => {
    it("toma el cargo con el que el firmante está asignado a la unidad", async () => {
      await call("POST", "/catalogos/unidades/1/asignaciones", { id_usuario: jefe.id, cargo: "Jefe de Logística" });
      const res = await crear({ firma2_usuario_id: jefe.id });
      assert.equal(res.status, 201);
      assert.equal(res.data.firma2_usuario_nombre, "Jorge Jefe");
      assert.equal(res.data.firma2_cargo, "Jefe de Logística");
    });

    it("la foto del cargo no cambia si después lo cambian en la unidad", async () => {
      const creado = await crear({ firma2_usuario_id: jefe.id });
      await call("POST", "/catalogos/unidades/1/asignaciones", { id_usuario: jefe.id, cargo: "Director" });
      const detalle = await call("GET", `/expedientes/${creado.data.id_expediente}`);
      assert.equal(detalle.data.firma2_cargo, "Jefe de Logística");
    });

    it("sin asignación activa en la unidad el cargo queda vacío", async () => {
      const otraUnidad = await crear({ id_unidad_solicitante: 2, firma2_usuario_id: jefe.id });
      assert.equal(otraUnidad.status, 201);
      assert.equal(otraUnidad.data.firma2_cargo, null);

      await call("DELETE", `/catalogos/unidades/1/asignaciones/${jefe.id}`);
      const desactivada = await crear({ firma2_usuario_id: jefe.id });
      assert.equal(desactivada.data.firma2_cargo, null);
    });

    it("sin segunda firma no hay cargo", async () => {
      assert.equal((await crear()).data.firma2_cargo, null);
    });
  });

  describe("la adjudicación fija el monto del expediente", () => {
    it("monto estimado = monto de la cotización adjudicada, y se actualiza al readjudicar", async () => {
      const exp = (await crear({ items: [{ descripcion: "a", cantidad: 1, unidad_medida: "u" }, { descripcion: "b", cantidad: 1, unidad_medida: "u" }] })).data;
      assert.equal(exp.monto_estimado, null);
      const primera = (await cotizar(exp.id_expediente, 1, 5000)).data.cotizaciones.find((c) => Number(c.monto_ofertado) === 5000);
      const segunda = (await cotizar(exp.id_expediente, 2, 4200.5)).data.cotizaciones.find((c) => Number(c.monto_ofertado) === 4200.5);

      // Registrar cotizaciones todavía no mueve el monto.
      assert.equal((await call("GET", `/expedientes/${exp.id_expediente}`)).data.monto_estimado, null);

      const adj1 = await call("POST", `/expedientes/${exp.id_expediente}/cotizaciones/${primera.id_cotizacion}/adjudicar`);
      assert.equal(adj1.data.monto_estimado, "5000.00");
      const adj2 = await call("POST", `/expedientes/${exp.id_expediente}/cotizaciones/${segunda.id_cotizacion}/adjudicar`);
      assert.equal(adj2.data.monto_estimado, "4200.50");
    });

    it("con varios renglones el costo de cada uno no se toca (el monto es un total)", async () => {
      const exp = (await crear({ items: [{ descripcion: "a", cantidad: 2, unidad_medida: "u" }, { descripcion: "b", cantidad: 3, unidad_medida: "u" }] })).data;
      const cot = (await cotizar(exp.id_expediente, 1, 1000)).data.cotizaciones[0];
      const adj = await call("POST", `/expedientes/${exp.id_expediente}/cotizaciones/${cot.id_cotizacion}/adjudicar`);
      assert.deepEqual(adj.data.items.map((i) => i.costo_unitario_estimado), [0, 0]);
    });

    it("con un solo renglón su costo unitario es el monto entre la cantidad", async () => {
      const exp = (await crear({ items: [{ descripcion: "a", cantidad: 4, unidad_medida: "u" }] })).data;
      const cot = (await cotizar(exp.id_expediente, 1, 1000)).data.cotizaciones[0];
      const adj = (await call("POST", `/expedientes/${exp.id_expediente}/cotizaciones/${cot.id_cotizacion}/adjudicar`)).data;
      assert.equal(adj.items[0].costo_unitario_estimado, 250);
      assert.equal(adj.items[0].subtotal_estimado, 1000);
    });

    it("un expediente sin renglones solo fija el monto", async () => {
      const exp = (await crear()).data;
      const cot = (await cotizar(exp.id_expediente, 1, 750)).data.cotizaciones[0];
      const adj = await call("POST", `/expedientes/${exp.id_expediente}/cotizaciones/${cot.id_cotizacion}/adjudicar`);
      assert.equal(adj.status, 200);
      assert.equal(adj.data.monto_estimado, "750.00");
    });
  });
});
