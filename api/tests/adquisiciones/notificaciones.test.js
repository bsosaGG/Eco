// Avisos (campana + correo) al solicitante y a la persona asignada, y visibilidad de "mis solicitudes".
const env = require("./helpers/test-env"); // debe ir primero: prepara variables de entorno y BDs
const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

describe("Adquisiciones: avisos y mis solicitudes", () => {
  let server;
  let pg;
  let usersPg;
  let admin;
  let solicitante;
  let otroSolicitante;
  let analista; // quien opera el trámite
  let asignado; // analista al que se le asigna el expediente

  const as = (usuario) => ({
    get: (url) => server.request("GET", url, { token: usuario.token }),
    post: (url, json = {}) => server.request("POST", url, { token: usuario.token, json }),
  });
  const GESTION = ["adquisiciones:read", "adquisiciones:assign", "adquisiciones:manage-cotizaciones", "adquisiciones:devolver"];

  const correoDe = (usuario) => env.sentEmails.filter((m) => m.to === usuario.email);
  const avisosDe = async (usuario) => (await as(usuario).get("/notificaciones")).data;
  const estadosDeCorreo = async () =>
    (await pg.query("SELECT id_usuario, tipo, correo_estado FROM notificaciones ORDER BY id_notificacion")).rows;

  before(async () => {
    usersPg = await env.createUsersDatabase();
    ({ pg } = await env.createDatabase());
    server = await env.startServer();
    admin = { ...(await env.createUser({ nombre: "Admin Prueba", rol: "admin" })), email: "admin.prueba@scspr.test" };
    solicitante = await env.createUser({ nombre: "Sol Icitante", permisos: ["adquisiciones:read", "adquisiciones:create"] });
    otroSolicitante = await env.createUser({ nombre: "Otro Solicitante", permisos: ["adquisiciones:read", "adquisiciones:create"] });
    analista = await env.createUser({ nombre: "Ana Analista", perfiles: ["Analista de Adquisiciones"], permisos: GESTION });
    asignado = await env.createUser({ nombre: "Beto Asignado", perfiles: ["Analista de Adquisiciones"], permisos: GESTION });
    for (const u of [solicitante, otroSolicitante, analista, asignado]) {
      u.email = (await usersPg.query("SELECT email FROM usuarios WHERE id_usuario = $1", [u.id])).rows[0].email;
    }
    await as(admin).post("/proveedores", { razon_social: "Proveedor Uno", nit: "1-1" });
  });

  beforeEach(() => {
    global.__fallarCorreo = false;
  });

  after(async () => {
    await server.close();
  });

  describe("avisos del trámite", () => {
    let id;

    it("crear la solicitud no genera avisos (quien la emite ya lo sabe)", async () => {
      const res = await as(solicitante).post("/expedientes", { id_unidad_solicitante: 1, objeto_compra: "Papelería", justificacion: "Reposición" });
      assert.equal(res.status, 201);
      id = res.data.id_expediente;
      assert.equal((await avisosDe(solicitante)).items.length, 0);
      assert.equal(env.sentEmails.length, 0);
    });

    it("al asignar: avisa a la persona asignada y al solicitante, no a quien asigna", async () => {
      const res = await as(analista).post(`/expedientes/${id}/asignar`, { id_usuario_asignado: asignado.id });
      assert.equal(res.status, 200);

      const paraAsignado = (await avisosDe(asignado)).items;
      assert.equal(paraAsignado.length, 1);
      assert.equal(paraAsignado[0].tipo, "asignacion");
      assert.match(paraAsignado[0].titulo, /Se te asignó el expediente DPL-1-/);

      const paraSolicitante = (await avisosDe(solicitante)).items;
      assert.equal(paraSolicitante.length, 1);
      assert.equal(paraSolicitante[0].tipo, "cambio_etapa");
      assert.match(paraSolicitante[0].titulo, /fue asignado a Beto Asignado/);
      assert.match(paraSolicitante[0].mensaje, /Pendiente Cotización/);

      assert.equal((await avisosDe(analista)).items.length, 0);
    });

    it("cada aviso sale también por correo, con enlace al expediente", async () => {
      assert.equal(correoDe(asignado).length, 1);
      const correo = correoDe(solicitante)[0];
      assert.match(correo.subject, /^\[SICOMPRAS\] DPL-1-\d{4} fue asignado a Beto Asignado/);
      assert.match(correo.htmlBody, new RegExp(`https://sicompras.test/adquisiciones/expedientes/${id}`));
      assert.match(correo.textBody, /Pendiente Cotización/);
      assert.equal(correoDe(analista).length, 0);
      assert.deepEqual((await estadosDeCorreo()).map((f) => f.correo_estado), ["encolado", "encolado"]);
    });

    it("al cambiar de etapa: avisa al solicitante y a la persona asignada", async () => {
      const cot = (await as(analista).post(`/expedientes/${id}/cotizaciones`, { id_proveedor: 1, monto_ofertado: 900 })).data.cotizaciones[0];
      const antes = env.sentEmails.length;
      assert.equal(antes, 2, "registrar una cotización no cambia la etapa, no avisa");

      const res = await as(analista).post(`/expedientes/${id}/cotizaciones/${cot.id_cotizacion}/adjudicar`);
      assert.equal(res.status, 200);
      for (const quien of [solicitante, asignado]) {
        const ultimo = (await avisosDe(quien)).items[0];
        assert.equal(ultimo.tipo, "cambio_etapa");
        assert.match(ultimo.titulo, /avanzó a «En firma CDP»/);
      }
      assert.equal(env.sentEmails.length, antes + 2);
      assert.equal((await avisosDe(analista)).items.length, 0, "quien hizo la acción no se avisa a sí mismo");
    });

    it("si la persona que actúa es la asignada, solo se avisa al solicitante", async () => {
      const antes = (await avisosDe(solicitante)).items.length;
      const res = await as(asignado).post(`/expedientes/${id}/devolver`, { etapa_origen: "Cotización", motivo: "Falta anexo" });
      assert.equal(res.status, 200);
      const items = (await avisosDe(solicitante)).items;
      assert.equal(items.length, antes + 1);
      assert.equal(items[0].tipo, "devolucion");
      assert.match(items[0].mensaje, /Motivo: Falta anexo/);
      assert.equal((await avisosDe(asignado)).items.filter((i) => i.tipo === "devolucion").length, 0);
    });

    it("cambiar el estado a mano también avisa", async () => {
      const antes = (await avisosDe(solicitante)).items.length;
      const res = await as(admin).post("/expedientes/1/devolver", { etapa_origen: "x", motivo: "y" });
      assert.equal(res.status, 200);
      assert.equal((await avisosDe(solicitante)).items.length, antes + 1);
    });
  });

  describe("campana", () => {
    it("muestra los avisos de cada quien con el total sin leer", async () => {
      const { items, no_leidas } = await avisosDe(solicitante);
      assert.ok(items.length >= 3);
      assert.equal(no_leidas, items.length);
      assert.ok(items.every((i) => i.codigo_expediente?.startsWith("DPL-1-")));
      assert.ok(items[0].id_notificacion > items[items.length - 1].id_notificacion, "el más reciente primero");
    });

    it("solo_no_leidas y limite", async () => {
      const res = await as(solicitante).get("/notificaciones?solo_no_leidas=true&limite=1");
      assert.equal(res.data.items.length, 1);
    });

    it("marcar uno como leído baja el contador; otra persona no puede marcarlo", async () => {
      const { items, no_leidas } = await avisosDe(solicitante);
      const ajeno = await as(otroSolicitante).post(`/notificaciones/${items[0].id_notificacion}/leida`);
      assert.equal(ajeno.status, 404);
      assert.equal((await avisosDe(solicitante)).no_leidas, no_leidas);

      const propio = await as(solicitante).post(`/notificaciones/${items[0].id_notificacion}/leida`);
      assert.equal(propio.status, 200);
      const despues = await avisosDe(solicitante);
      assert.equal(despues.no_leidas, no_leidas - 1);
      assert.equal(despues.items.find((i) => i.id_notificacion === items[0].id_notificacion).leida, true);
    });

    it("un id inválido da 400 y marcar todas deja el contador en cero", async () => {
      assert.equal((await as(solicitante).post("/notificaciones/abc/leida")).status, 400);
      const res = await as(solicitante).post("/notificaciones/leer-todas");
      assert.equal(res.status, 200);
      assert.ok(res.data.marcadas >= 1);
      assert.equal((await avisosDe(solicitante)).no_leidas, 0);
      assert.equal((await avisosDe(otroSolicitante)).items.length, 0);
    });

    it("sin sesión o sin permiso de lectura no hay acceso", async () => {
      assert.equal((await server.request("GET", "/notificaciones")).status, 403);
      const sinPermiso = await env.createUser({ nombre: "Sin Permisos" });
      assert.equal((await as(sinPermiso).get("/notificaciones")).status, 403);
    });
  });

  describe("el correo nunca rompe el trámite", () => {
    const nuevaAsignacion = async () => {
      const nuevo = await as(solicitante).post("/expedientes", { id_unidad_solicitante: 2, objeto_compra: "Equipo", justificacion: "x" });
      return as(analista).post(`/expedientes/${nuevo.data.id_expediente}/asignar`, { id_usuario_asignado: asignado.id });
    };

    it("si el SMTP falla, el trámite sigue y el aviso queda anotado con error", async () => {
      global.__fallarCorreo = true;
      const res = await nuevaAsignacion();
      assert.equal(res.status, 200);
      const filas = await estadosDeCorreo();
      assert.deepEqual(filas.slice(-2).map((f) => f.correo_estado), ["error", "error"]);
    });

    it("quien no tiene correo registrado: el aviso en el sistema existe y el correo queda como sin_correo", async () => {
      await usersPg.query("UPDATE usuarios SET email = '' WHERE id_usuario = $1", [asignado.id]);
      const antes = env.sentEmails.length;
      assert.equal((await nuevaAsignacion()).status, 200);
      const filas = (await estadosDeCorreo()).slice(-2);
      assert.equal(filas.find((f) => f.id_usuario === asignado.id).correo_estado, "sin_correo");
      assert.equal(env.sentEmails.length, antes + 1, "solo salió el del solicitante");
    });

    it("sin servidor de correo configurado: sin_smtp", async () => {
      await usersPg.query("UPDATE usuarios SET email = $1 WHERE id_usuario = $2", [asignado.email, asignado.id]);
      const guardado = process.env.MAIL_HOST;
      delete process.env.MAIL_HOST;
      try {
        assert.equal((await nuevaAsignacion()).status, 200);
        assert.ok((await estadosDeCorreo()).slice(-2).every((f) => f.correo_estado === "sin_smtp"));
      } finally {
        process.env.MAIL_HOST = guardado;
      }
    });

    it("una acción que falla no deja avisos ni correos", async () => {
      const avisos = (await pg.query("SELECT COUNT(*)::int AS n FROM notificaciones")).rows[0].n;
      const correos = env.sentEmails.length;
      const res = await as(analista).post("/expedientes/1/cotizaciones/999/adjudicar");
      assert.equal(res.status, 404);
      assert.equal((await pg.query("SELECT COUNT(*)::int AS n FROM notificaciones")).rows[0].n, avisos);
      assert.equal(env.sentEmails.length, correos);
    });
  });

  describe("mis solicitudes", () => {
    it("quien solo emite solicitudes ve únicamente las suyas, con su etapa", async () => {
      await as(otroSolicitante).post("/expedientes", { id_unidad_solicitante: 3, objeto_compra: "De otra persona", justificacion: "x" });

      const mias = (await as(solicitante).get("/expedientes")).data;
      assert.ok(mias.length >= 1);
      assert.ok(mias.every((e) => e.objeto_compra !== "De otra persona"));
      assert.ok(mias.every((e) => typeof e.estado_etapa === "string"));

      const deOtro = (await as(otroSolicitante).get("/expedientes")).data;
      assert.deepEqual(deOtro.map((e) => e.objeto_compra), ["De otra persona"]);
    });

    it("la gestión y el admin ven todas", async () => {
      for (const quien of [analista, admin]) {
        const todos = (await as(quien).get("/expedientes")).data.map((e) => e.objeto_compra);
        assert.ok(todos.includes("De otra persona") && todos.includes("Papelería"));
      }
    });

    it("el filtro por texto no permite ver lo ajeno", async () => {
      const res = await as(solicitante).get("/expedientes?search=otra%20persona");
      assert.deepEqual(res.data, []);
    });

    it("abrir el detalle o el PDF de una solicitud ajena responde 404; la propia sí abre", async () => {
      const ajena = (await as(otroSolicitante).get("/expedientes")).data[0];
      for (const ruta of [`/expedientes/${ajena.id_expediente}`, `/expedientes/${ajena.codigo_expediente}`, `/expedientes/${ajena.id_expediente}/pdf`]) {
        const res = await as(solicitante).get(ruta);
        assert.equal(res.status, 404, ruta);
        assert.equal(res.data.message, "Expediente no encontrado.");
      }
      const propia = await as(solicitante).get("/expedientes/1");
      assert.equal(propia.status, 200);
      assert.equal(propia.data.usuario_solicitante_id, solicitante.id);
      assert.equal((await as(analista).get(`/expedientes/${ajena.id_expediente}`)).status, 200);
    });

    it("los reportes de todo el módulo son solo para la gestión", async () => {
      for (const ruta of ["cotizaciones", "cdp", "ordenes-compra", "financiera", "resumen"]) {
        assert.equal((await as(solicitante).get(`/reportes/${ruta}`)).status, 403, ruta);
      }
      assert.equal((await as(analista).get("/reportes/resumen")).status, 200);
      assert.equal((await as(admin).get("/reportes/cotizaciones")).status, 200);
    });
  });
});
