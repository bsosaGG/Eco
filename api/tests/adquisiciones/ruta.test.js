// Enrutamiento automático: después de cada paso el expediente pasa solo a una persona con el perfil del paso
// siguiente. Se recorre todo el procedimiento de Baja Cuantía verificando a quién le toca en cada momento.
const env = require("./helpers/test-env"); // debe ir primero: prepara variables de entorno y BDs
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");

describe("Adquisiciones: ruta automática del expediente", () => {
  let server;
  let usersPg;
  let admin;
  let sol; // solicitante
  let lector;
  const u = {}; // usuarios por perfil

  const as = (usuario) => ({
    get: (url) => server.request("GET", url, { token: usuario.token }),
    post: (url, json = {}) => server.request("POST", url, { token: usuario.token, json }),
  });
  const detalle = async (id) => (await as(admin).get(`/expedientes/${id}`)).data;
  const estado = async (id) => {
    const d = await detalle(id);
    return { estado: d.estado, quien: d.responsable_actual_nombre, paso: d.siguiente_paso };
  };
  const crear = async (extra = {}) =>
    (await as(sol).post("/expedientes", { id_unidad_solicitante: 1, objeto_compra: "Compra de prueba", justificacion: "x", ...extra })).data.id_expediente;

  before(async () => {
    usersPg = await env.createUsersDatabase();
    await env.createDatabase();
    server = await env.startServer();
    admin = await env.createUser({ nombre: "Admin Prueba", rol: "admin" });
    sol = await env.createUser({ nombre: "Sol Icitante", permisos: ["adquisiciones:read", "adquisiciones:create"] });
    lector = await env.createUser({ nombre: "Luis Lector", permisos: ["adquisiciones:read"] });
    // Un usuario por perfil del proceso (y dos analistas para probar el reparto).
    const perfiles = {
      jefe: ["Jorge Jefe", "Jefe de Adquisiciones"], ana: ["Ana Analista", "Analista de Adquisiciones"], beto: ["Beto Analista", "Analista de Adquisiciones"],
      pia: ["Pía Presupuesto", "Asistente de Presupuesto"], enzo: ["Enzo Encargado", "Encargado de Presupuesto"], uma: ["Uma UDAF", "Jefe UDAF"],
      diana: ["Diana Directora", "Directora General"], cora: ["Cora Contabilidad", "Encargado de Contabilidad"], sara: ["Sara Sub", "Sub Despacho"],
    };
    for (const [clave, [nombre, perfil]] of Object.entries(perfiles)) u[clave] = await env.createUser({ nombre, perfiles: [perfil], permisos: ["adquisiciones:read"] });
    await as(admin).post("/proveedores", { razon_social: "Proveedor Uno", nit: "1-1" });
  });

  after(async () => {
    await server.close();
  });

  describe("recorrido completo del procedimiento", () => {
    let id;

    it("al crear la solicitud le toca recibirla al Jefe de Adquisiciones", async () => {
      id = await crear({ items: [{ descripcion: "a", cantidad: 1, unidad_medida: "u" }] });
      const e = await estado(id);
      assert.equal(e.quien, "Jorge Jefe");
      assert.equal(e.estado, "Recibida por Adquisiciones");
      assert.equal(e.paso.accion, "turnar");
      assert.equal(e.paso.perfil, "Jefe de Adquisiciones");
    });

    it("«Recibir y turnar» pasa a cotización y asigna solo al analista; quien no puede asignar no puede turnar", async () => {
      assert.equal((await as(lector).post(`/expedientes/${id}/turnar`)).status, 403);
      const res = await as(admin).post(`/expedientes/${id}/turnar`);
      assert.equal(res.status, 200);
      assert.equal(res.data.estado, "Pendiente Cotización");
      assert.equal(res.data.responsable_actual_nombre, "Ana Analista");
      assert.equal(res.data.analista_usuario_id, u.ana.id);
      assert.equal(res.data.siguiente_paso.titulo, "Registrar las cotizaciones y adjudicar una");
      assert.equal((await as(admin).post(`/expedientes/${id}/turnar`)).status, 409, "no se puede turnar dos veces");
    });

    it("cotizar no cambia de responsable; al adjudicar le toca al Asistente de Presupuesto", async () => {
      const cot = (await as(admin).post(`/expedientes/${id}/cotizaciones`, { id_proveedor: 1, monto_ofertado: 5000 })).data.cotizaciones[0];
      assert.equal((await estado(id)).quien, "Ana Analista");
      await as(admin).post(`/expedientes/${id}/cotizaciones/${cot.id_cotizacion}/adjudicar`);
      const e = await estado(id);
      assert.deepEqual([e.estado, e.quien, e.paso.titulo], ["En firma CDP", "Pía Presupuesto", "Elaborar el CDP"]);
    });

    it("CDP: elaborar → Encargado de Presupuesto → Jefe UDAF → de vuelta al analista", async () => {
      await as(admin).post(`/expedientes/${id}/cdp`, { id_partida: 1, monto_reservado: 4000 });
      let e = await estado(id);
      assert.deepEqual([e.quien, e.paso.titulo], ["Enzo Encargado", "Aprobar técnicamente el CDP"]);
      const idCdp = (await detalle(id)).cdp.id_cdp;
      await as(admin).post(`/cdp/${idCdp}/aprobar`);
      e = await estado(id);
      assert.deepEqual([e.quien, e.paso.titulo], ["Uma UDAF", "Dar el Vo.Bo. financiero del CDP"]);
      await as(admin).post(`/cdp/${idCdp}/vobo`);
      e = await estado(id);
      assert.deepEqual([e.estado, e.quien, e.paso.titulo], ["Revisión Jurídica", "Ana Analista", "Elaborar la Orden de Compra"]);
    });

    it("Orden de Compra: analista → Jefe de Adquisiciones → Directora General → de vuelta al analista", async () => {
      await as(admin).post(`/expedientes/${id}/orden-compra`, { monto_total: 3900 });
      let e = await estado(id);
      assert.deepEqual([e.estado, e.quien, e.paso.titulo], ["Aprobación Jefatura", "Jorge Jefe", "Aprobar la Orden de Compra"]);
      const idOc = (await detalle(id)).orden_compra.id_orden_compra;
      await as(admin).post(`/orden-compra/${idOc}/aprobar`);
      e = await estado(id);
      assert.deepEqual([e.quien, e.paso.titulo], ["Diana Directora", "Autorizar la Orden de Compra"]);
      await as(admin).post(`/orden-compra/${idOc}/autorizar`);
      e = await estado(id);
      assert.deepEqual([e.estado, e.quien, e.paso.titulo], ["Expediente en Conformación", "Ana Analista", "Registrar la recepción del bien o servicio"]);
    });

    it("recepción y documentos los hace el analista; al trasladar le toca al Encargado de Presupuesto", async () => {
      const idOc = (await detalle(id)).orden_compra.id_orden_compra;
      await as(admin).post(`/orden-compra/${idOc}/recepcion`, { recibido_conforme: true });
      let e = await estado(id);
      assert.deepEqual([e.quien, e.paso.titulo], ["Ana Analista", "Adjuntar los documentos de soporte"]);

      const form = new FormData();
      form.append("tipo_documento", "FACTURA");
      form.append("archivo", new Blob(["%PDF-1.4"]), "factura.pdf");
      assert.equal((await server.request("POST", `/expedientes/${id}/documentos-soporte`, { token: admin.token, form })).status, 201);
      e = await estado(id);
      assert.deepEqual([e.quien, e.paso.titulo], ["Ana Analista", "Trasladar el expediente a Contabilidad"]);

      await as(admin).post(`/expedientes/${id}/trasladar-contabilidad`);
      e = await estado(id);
      assert.deepEqual([e.estado, e.quien, e.paso.titulo], ["Fase Financiera / Liquidación", "Enzo Encargado", "Registrar el compromiso presupuestario"]);
    });

    it("fase financiera: compromiso → devengado → solicitud de pago → Sub Despacho → archivado", async () => {
      await as(admin).post(`/expedientes/${id}/compromiso`, { monto_comprometido: 3900 });
      let e = await estado(id);
      assert.deepEqual([e.quien, e.paso.titulo], ["Cora Contabilidad", "Registrar el devengado"]);

      const idCompromiso = (await detalle(id)).compromiso.id_compromiso;
      await as(admin).post(`/compromiso/${idCompromiso}/devengado`, { monto_devengado: 3900 });
      e = await estado(id);
      assert.deepEqual([e.quien, e.paso.titulo], ["Cora Contabilidad", "Trasladar la solicitud de pago"]);

      const idDevengado = (await detalle(id)).devengado.id_devengado;
      await as(admin).post(`/devengado/${idDevengado}/solicitar-pago`, { entidad_bancaria: "Banrural", tipo_cuenta: "Monetaria", numero_cuenta: "123" });
      e = await estado(id);
      assert.deepEqual([e.quien, e.paso.titulo], ["Sara Sub", "Autorizar el pago"]);

      const idSolicitud = (await detalle(id)).solicitud_pago.id_solicitud_pago;
      await as(admin).post(`/solicitud-pago/${idSolicitud}/autorizar`);
      e = await estado(id);
      assert.deepEqual([e.estado, e.paso.tipo], ["Pagado y Archivado", "cerrado"]);
    });

    it("cada traspaso avisó a quien le tocaba, y al solicitante de los cambios de etapa", async () => {
      const avisos = (await as(u.pia).get("/notificaciones")).data.items;
      assert.equal(avisos.length, 1);
      assert.match(avisos[0].titulo, /^Pendiente de su atención: Elaborar el CDP \(DPL-1-\d{4}\)$/);

      const delSolicitante = (await as(sol).get("/notificaciones")).data.items.map((a) => a.titulo);
      assert.ok(delSolicitante.some((t) => /avanzó a «En firma CDP»/.test(t)));
      assert.ok(delSolicitante.some((t) => /avanzó a «Pagado y Archivado»/.test(t)));
      const cdp = (await as(sol).get("/notificaciones")).data.items.find((a) => /En firma CDP/.test(a.titulo));
      assert.match(cdp.mensaje, /Responsable del siguiente paso: Pía Presupuesto\./);
    });

    it("el seguimiento queda en el historial: un estado por cada avance", async () => {
      const estados = (await detalle(id)).historial_estados.map((h) => h.estado);
      assert.deepEqual(estados, [
        "Recibida por Adquisiciones", "Pendiente Cotización", "En firma CDP", "Revisión Jurídica", "Aprobación Jefatura",
        "Pendiente Autorización Final", "Expediente en Conformación", "Fase Financiera / Liquidación", "Pagado y Archivado",
      ]);
    });
  });

  describe("reparto, reasignación y casos límite", () => {
    it("los expedientes se reparten entre los analistas según su carga", async () => {
      // Ana ya cerró el suyo (no cuenta como abierto); los dos analistas empatan en 0 y gana el más antiguo.
      const a = await crear();
      await as(admin).post(`/expedientes/${a}/turnar`);
      assert.equal((await estado(a)).quien, "Ana Analista");
      const b = await crear();
      await as(admin).post(`/expedientes/${b}/turnar`);
      assert.equal((await estado(b)).quien, "Beto Analista", "Ana ya tiene uno abierto: le toca a Beto");
      const c = await crear();
      await as(admin).post(`/expedientes/${c}/turnar`);
      assert.equal((await estado(c)).quien, "Ana Analista", "ahora cada uno tiene uno: empatan y gana el más antiguo");
    });

    it("la reasignación manual cambia el analista; elegir a alguien sin perfil de analista también se respeta", async () => {
      const id = await crear();
      await as(admin).post(`/expedientes/${id}/turnar`);
      const antes = (await estado(id)).quien;
      const otro = antes === "Ana Analista" ? u.beto : u.ana;

      const res = await as(admin).post(`/expedientes/${id}/asignar`, { id_usuario_asignado: otro.id });
      assert.equal(res.status, 200);
      assert.equal(res.data.funcionario_responsable_id, otro.id);
      assert.equal(res.data.analista_usuario_id, otro.id);

      const aJefe = await as(admin).post(`/expedientes/${id}/asignar`, { id_usuario_asignado: u.jefe.id });
      assert.equal(aJefe.data.responsable_actual_nombre, "Jorge Jefe");
      const aviso = (await as(u.jefe).get("/notificaciones")).data.items[0];
      assert.match(aviso.titulo, /^Pendiente de su atención: Registrar las cotizaciones/);
    });

    it("reasignar un expediente que ya avanzó no le quita el paso a quien le toca", async () => {
      const id = await crear();
      await as(admin).post(`/expedientes/${id}/turnar`);
      const cot = (await as(admin).post(`/expedientes/${id}/cotizaciones`, { id_proveedor: 1, monto_ofertado: 100 })).data.cotizaciones[0];
      await as(admin).post(`/expedientes/${id}/cotizaciones/${cot.id_cotizacion}/adjudicar`);
      assert.equal((await estado(id)).quien, "Pía Presupuesto");

      const res = await as(admin).post(`/expedientes/${id}/asignar`, { id_usuario_asignado: u.beto.id });
      assert.equal(res.data.estado, "En firma CDP", "no regresa a cotización");
      assert.equal(res.data.responsable_actual_nombre, "Pía Presupuesto");
      assert.equal(res.data.analista_usuario_id, u.beto.id, "pero Beto queda como el analista que lo lleva");
    });

    it("al devolverlo le toca al solicitante, y recibe el aviso de la devolución (no uno de «te toca»)", async () => {
      const id = await crear();
      await as(admin).post(`/expedientes/${id}/turnar`);
      const antes = (await as(sol).get("/notificaciones")).data.items.length;
      const res = await as(admin).post(`/expedientes/${id}/devolver`, { etapa_origen: "Cotización", motivo: "Falta el anexo" });
      assert.equal(res.data.estado, "Devuelto con Observaciones");
      assert.equal(res.data.responsable_actual_nombre, "Sol Icitante");
      assert.equal(res.data.siguiente_paso.tipo, "devuelto");
      const nuevos = (await as(sol).get("/notificaciones")).data.items.slice(0, (await as(sol).get("/notificaciones")).data.items.length - antes);
      assert.deepEqual(nuevos.map((a) => a.tipo), ["devolucion"]);
    });

    it("si nadie tiene el perfil del paso, el expediente queda sin responsable y el siguiente paso lo dice", async () => {
      await usersPg.query("UPDATE usuarios SET activo = FALSE WHERE id_usuario = $1", [u.pia.id]);
      const id = await crear();
      await as(admin).post(`/expedientes/${id}/turnar`);
      const cot = (await as(admin).post(`/expedientes/${id}/cotizaciones`, { id_proveedor: 1, monto_ofertado: 100 })).data.cotizaciones[0];
      const res = await as(admin).post(`/expedientes/${id}/cotizaciones/${cot.id_cotizacion}/adjudicar`);
      assert.equal(res.status, 200);
      assert.equal(res.data.funcionario_responsable_id, null);
      assert.equal(res.data.responsable_actual_nombre, null);
      assert.equal(res.data.siguiente_paso.perfil, "Asistente de Presupuesto");
    });

    it("sin ningún analista no se puede turnar, y el mensaje dice por qué", async () => {
      for (const clave of ["ana", "beto"]) await usersPg.query("UPDATE usuarios SET activo = FALSE WHERE id_usuario = $1", [u[clave].id]);
      const id = await crear();
      const res = await as(admin).post(`/expedientes/${id}/turnar`);
      assert.equal(res.status, 409);
      assert.match(res.data.message, /Analista de Adquisiciones/);
      assert.equal((await estado(id)).estado, "Recibida por Adquisiciones");
    });

    it("un id que no existe da 404 y uno mal formado 400", async () => {
      assert.equal((await as(admin).post("/expedientes/9999/turnar")).status, 404);
      assert.equal((await as(admin).post("/expedientes/abc/turnar")).status, 400);
    });
  });
});
