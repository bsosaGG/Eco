// Avisos (campana + correo) cuando el expediente cambia de etapa, le toca a otra persona o se devuelve,
// y visibilidad de "mis solicitudes".
const env = require("./helpers/test-env"); // debe ir primero: prepara variables de entorno y BDs
const { describe, it, before, after, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

describe("Adquisiciones: avisos y mis solicitudes", () => {
  let server;
  let pg;
  let usersPg;
  let admin;
  let solicitante;
  let otroSolicitante;
  let jefe; // Jefe de Adquisiciones: recibe las solicitudes nuevas
  let analista; // el analista al que se turna
  let asistente; // Asistente de Presupuesto: le toca el CDP
  let supervisor; // Auditoría: ve todos los expedientes

  const as = (usuario) => ({
    get: (url) => server.request("GET", url, { token: usuario.token }),
    post: (url, json = {}) => server.request("POST", url, { token: usuario.token, json }),
  });
  const GESTION = ["adquisiciones:read", "adquisiciones:assign", "adquisiciones:manage-cotizaciones", "adquisiciones:devolver"];

  const correoDe = (usuario) => env.sentEmails.filter((m) => m.to === usuario.email);
  const avisosDe = async (usuario) => (await as(usuario).get("/notificaciones")).data;
  const estadosDeCorreo = async () =>
    (await pg.query("SELECT id_usuario, tipo, correo_estado FROM notificaciones ORDER BY id_notificacion")).rows;
  const conEmail = async (usuario) => {
    usuario.email = (await usersPg.query("SELECT email FROM usuarios WHERE id_usuario = $1", [usuario.id])).rows[0].email;
    return usuario;
  };

  before(async () => {
    usersPg = await env.createUsersDatabase();
    ({ pg } = await env.createDatabase());
    server = await env.startServer();
    admin = await conEmail(await env.createUser({ nombre: "Admin Prueba", rol: "admin" }));
    solicitante = await conEmail(await env.createUser({ nombre: "Sol Icitante", permisos: ["adquisiciones:read", "adquisiciones:create"] }));
    otroSolicitante = await conEmail(await env.createUser({ nombre: "Otro Solicitante", permisos: ["adquisiciones:read", "adquisiciones:create"] }));
    jefe = await conEmail(await env.createUser({ nombre: "Jorge Jefe", perfiles: ["Jefe de Adquisiciones"], permisos: GESTION }));
    analista = await conEmail(await env.createUser({ nombre: "Ana Analista", perfiles: ["Analista de Adquisiciones"], permisos: GESTION }));
    asistente = await conEmail(await env.createUser({ nombre: "Pía Presupuesto", perfiles: ["Asistente de Presupuesto"], permisos: ["adquisiciones:read"] }));
    supervisor = await conEmail(await env.createUser({ nombre: "Sara Supervisora", perfiles: ["Auditoría Interna"], permisos: ["adquisiciones:read", "adquisiciones:audit"] }));
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

    it("crear la solicitud le avisa a quien le toca recibirla (el Jefe), no al solicitante", async () => {
      const res = await as(solicitante).post("/expedientes", { id_unidad_solicitante: 1, objeto_compra: "Papelería", justificacion: "Reposición" });
      assert.equal(res.status, 201);
      id = res.data.id_expediente;

      const delJefe = (await avisosDe(jefe)).items;
      assert.equal(delJefe.length, 1);
      assert.equal(delJefe[0].tipo, "asignacion");
      assert.match(delJefe[0].titulo, /^Pendiente de su atención: Recibir la solicitud y turnarla a un analista \(DPL-1-\d{4}\)$/);
      assert.equal((await avisosDe(solicitante)).items.length, 0);
    });

    it("al recibir y turnar: «pendiente de su atención» al analista y, al solicitante, que cambió de etapa y quién es el responsable", async () => {
      const res = await as(jefe).post(`/expedientes/${id}/turnar`);
      assert.equal(res.status, 200);

      const delAnalista = (await avisosDe(analista)).items;
      assert.equal(delAnalista.length, 1);
      assert.match(delAnalista[0].titulo, /^Pendiente de su atención: Registrar las cotizaciones y adjudicar una/);

      const delSolicitante = (await avisosDe(solicitante)).items;
      assert.equal(delSolicitante.length, 1);
      assert.equal(delSolicitante[0].tipo, "cambio_etapa");
      assert.match(delSolicitante[0].mensaje, /Pasó de «Recibida por Adquisiciones» a «Pendiente Cotización»\. Responsable del siguiente paso: Ana Analista\./);
    });

    it("cada aviso sale también por correo, con enlace al expediente", async () => {
      assert.equal(correoDe(analista).length, 1);
      const correo = correoDe(solicitante)[0];
      assert.match(correo.subject, /^\[SICOMPRAS\] DPL-1-\d{4} avanzó a «Pendiente Cotización»/);
      assert.match(correo.htmlBody, new RegExp(`https://sicompras.test/adquisiciones/expedientes/${id}`));
      assert.match(correo.textBody, /Responsable del siguiente paso: Ana Analista/);
      assert.match(correoDe(analista)[0].textBody, /^Pendiente de su atención: Registrar las cotizaciones y adjudicar una \(DPL-1-\d{4}\)\n\nPendiente de su atención: Registrar las cotizaciones y adjudicar una\./);
      assert.ok((await estadosDeCorreo()).every((f) => f.correo_estado === "encolado"));
    });

    it("registrar una cotización no cambia nada; al adjudicar le toca al Asistente de Presupuesto", async () => {
      const cot = (await as(analista).post(`/expedientes/${id}/cotizaciones`, { id_proveedor: 1, monto_ofertado: 900 })).data.cotizaciones[0];
      const antes = env.sentEmails.length;
      assert.equal(antes, correoDe(analista).length + correoDe(solicitante).length + correoDe(jefe).length);

      const res = await as(analista).post(`/expedientes/${id}/cotizaciones/${cot.id_cotizacion}/adjudicar`);
      assert.equal(res.status, 200);

      const delAsistente = (await avisosDe(asistente)).items;
      assert.equal(delAsistente.length, 1);
      assert.match(delAsistente[0].titulo, /^Pendiente de su atención: Elaborar el CDP/);
      const delSolicitante = (await avisosDe(solicitante)).items[0];
      assert.match(delSolicitante.titulo, /avanzó a «En firma CDP»/);
      assert.match(delSolicitante.mensaje, /Responsable del siguiente paso: Pía Presupuesto\./);
      assert.equal(env.sentEmails.length, antes + 2);
    });

    it("el analista que hizo el paso no recibe aviso de que el expediente avanzó (ya no es suyo)", async () => {
      assert.equal((await avisosDe(analista)).items.length, 1, "solo el aviso inicial de asignación");
    });

    it("una devolución avisa al solicitante y a quien tenía el expediente, con el motivo", async () => {
      const antesAsistente = (await avisosDe(asistente)).items.length;
      const antesSolicitante = (await avisosDe(solicitante)).items.length;
      const res = await as(admin).post(`/expedientes/${id}/devolver`, { etapa_origen: "CDP", motivo: "Falta anexo" });
      assert.equal(res.status, 200);

      const items = (await avisosDe(solicitante)).items;
      assert.equal(items.length, antesSolicitante + 1, "un solo aviso: el de la devolución");
      assert.equal(items[0].tipo, "devolucion");
      assert.match(items[0].mensaje, /Motivo: Falta anexo/);
      assert.equal((await avisosDe(asistente)).items.length, antesAsistente + 1);
    });

    it("cambiar el estado a mano también avisa al solicitante", async () => {
      const antes = (await avisosDe(solicitante)).items.length;
      const res = await server.request("PUT", `/expedientes/${id}/estado`, { token: admin.token, json: { nuevoEstadoId: 3 } });
      assert.equal(res.status, 200);
      assert.equal((await avisosDe(solicitante)).items.length, antes + 1);
    });
  });

  describe("campana", () => {
    it("muestra los avisos de cada quien con el total sin leer", async () => {
      const { items, no_leidas } = await avisosDe(solicitante);
      assert.ok(items.length >= 3);
      assert.equal(no_leidas, items.length);
      assert.ok(items.every((i) => /^[A-Z]+-\d+-\d{4}$/.test(i.codigo_expediente)));
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

  describe("correo con plantilla", () => {
    it("el correo trae estado, quién lo hizo, cuándo, unidad, objeto y enlace", async () => {
      const nuevo = await as(solicitante).post("/expedientes", { id_unidad_solicitante: 2, tipo_compra: "Equipo", objeto_compra: "Laptops para diseño", justificacion: "x" });
      const antes = env.sentEmails.length;
      await as(jefe).post(`/expedientes/${nuevo.data.id_expediente}/turnar`);
      const correos = env.sentEmails.slice(antes);
      const alSolicitante = correos.find((c) => c.to === solicitante.email);
      const alAnalista = correos.find((c) => c.to === analista.email);

      for (const [correo, frase] of [
        [alSolicitante, /Su solicitud avanzó de «Recibida por Adquisiciones» a «Pendiente Cotización»\. Responsable del siguiente paso: Ana Analista\./],
        [alAnalista, /Pendiente de su atención: Registrar las cotizaciones y adjudicar una\./],
      ]) {
        assert.match(correo.textBody, frase);
        for (const dato of ["Laptops para diseño", "Unidad de Logística", "Sol Icitante", "Ana Analista", "Equipo", "Realizado por: Jorge Jefe"]) {
          assert.ok(correo.textBody.includes(dato), `falta «${dato}»`);
        }
        assert.match(correo.textBody, /Fecha y hora: \d{1,2} de \w+ de \d{4}/);
        assert.match(correo.htmlBody, /<!DOCTYPE html>/);
        assert.match(correo.htmlBody, new RegExp(`expedientes/${nuevo.data.id_expediente}`));
      }
      assert.match(alSolicitante.textBody, /Tiempo en «Recibida por Adquisiciones»: /);
    });

    it("quien emite la solicitud recibe el correo aunque él mismo la turne", async () => {
      const gestor = await conEmail(await env.createUser({ nombre: "Gina Gestora", perfiles: ["Jefe de Adquisiciones"], permisos: [...GESTION, "adquisiciones:create"] }));
      const propia = await as(gestor).post("/expedientes", { id_unidad_solicitante: 3, objeto_compra: "Emitida y turnada por la misma persona", justificacion: "x" });
      const antes = env.sentEmails.length;
      assert.equal((await as(gestor).post(`/expedientes/${propia.data.id_expediente}/turnar`)).status, 200);

      const nuevos = env.sentEmails.slice(antes);
      assert.ok(nuevos.some((c) => c.to === gestor.email), "la solicitante-gestora recibe el aviso de la etapa");
      assert.match(nuevos.find((c) => c.to === gestor.email).textBody, /Realizado por: Gina Gestora/);
    });
  });

  describe("el correo nunca rompe el trámite", () => {
    const nuevaSolicitud = async () => {
      const nuevo = await as(solicitante).post("/expedientes", { id_unidad_solicitante: 2, objeto_compra: "Equipo", justificacion: "x" });
      return as(jefe).post(`/expedientes/${nuevo.data.id_expediente}/turnar`);
    };

    it("si el SMTP falla, el trámite sigue y los avisos quedan anotados con error", async () => {
      global.__fallarCorreo = true;
      const res = await nuevaSolicitud();
      assert.equal(res.status, 200);
      const filas = await estadosDeCorreo();
      assert.ok(filas.slice(-2).every((f) => f.correo_estado === "error"));
    });

    it("quien no tiene correo registrado: el aviso en el sistema existe y el correo queda como sin_correo", async () => {
      await usersPg.query("UPDATE usuarios SET email = '' WHERE id_usuario = $1", [analista.id]);
      const antes = env.sentEmails.length;
      assert.equal((await nuevaSolicitud()).status, 200);
      const filas = (await estadosDeCorreo()).slice(-2);
      assert.equal(filas.find((f) => f.id_usuario === analista.id).correo_estado, "sin_correo");
      const enviados = env.sentEmails.slice(antes).map((c) => c.to);
      assert.ok(enviados.includes(solicitante.email), "al solicitante sí le llegó");
      assert.ok(!enviados.includes(""), "no se intentó enviar a un correo vacío");
      assert.equal(enviados.filter((a) => a === analista.email).length, 0);
    });

    it("sin servidor de correo configurado: sin_smtp", async () => {
      await usersPg.query("UPDATE usuarios SET email = $1 WHERE id_usuario = $2", [analista.email, analista.id]);
      const guardado = process.env.MAIL_HOST;
      delete process.env.MAIL_HOST;
      try {
        assert.equal((await nuevaSolicitud()).status, 200);
        assert.ok((await estadosDeCorreo()).slice(-2).every((f) => f.correo_estado === "sin_smtp"));
      } finally {
        process.env.MAIL_HOST = guardado;
      }
    });

    describe("redirección de pruebas (ADQUISICIONES_CORREO_REDIRIGIR_A)", () => {
      const BANDEJA = "bandeja.pruebas@example.test";
      afterEach(() => {
        delete process.env.ADQUISICIONES_CORREO_REDIRIGIR_A;
      });

      it("todos los correos salen a la bandeja de pruebas, marcados con para quién eran", async () => {
        process.env.ADQUISICIONES_CORREO_REDIRIGIR_A = BANDEJA;
        const antes = env.sentEmails.length;
        assert.equal((await nuevaSolicitud()).status, 200);

        const nuevos = env.sentEmails.slice(antes);
        assert.ok(nuevos.length >= 2, "hay correo para el solicitante y para el analista");
        assert.ok(nuevos.every((c) => c.to === BANDEJA), "ninguno salió a su destinatario real");
        assert.ok(nuevos.some((c) => c.subject.startsWith("[PRUEBA · para ") && c.subject.includes(solicitante.email)));
        assert.ok(nuevos.every((c) => /MODO PRUEBA: este aviso era para /.test(c.textBody) && /MODO PRUEBA/.test(c.htmlBody)));
        assert.ok((await estadosDeCorreo()).slice(-2).every((f) => f.correo_estado === "encolado"));
      });

      it("también llega el correo de quien no tiene correo registrado, que sin la redirección queda sin_correo", async () => {
        await usersPg.query("UPDATE usuarios SET email = '' WHERE id_usuario = $1", [analista.id]);
        process.env.ADQUISICIONES_CORREO_REDIRIGIR_A = BANDEJA;
        const antes = env.sentEmails.length;
        assert.equal((await nuevaSolicitud()).status, 200);
        assert.ok(env.sentEmails.slice(antes).every((c) => c.to === BANDEJA));
        assert.equal(env.sentEmails.slice(antes).length >= 2, true);
        await usersPg.query("UPDATE usuarios SET email = $1 WHERE id_usuario = $2", [analista.email, analista.id]);
      });

      it("sin la variable, los correos van a sus destinatarios", async () => {
        const antes = env.sentEmails.length;
        assert.equal((await nuevaSolicitud()).status, 200);
        assert.ok(env.sentEmails.slice(antes).every((c) => c.to !== BANDEJA && !c.subject.startsWith("[PRUEBA")));
      });
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
    before(async () => {
      // Un solo Jefe de Adquisiciones activo: así la solicitud nueva siempre le corresponde a `jefe`.
      await usersPg.query("UPDATE usuarios SET activo = FALSE WHERE nombre_completo = 'Gina Gestora'");
    });

    it("quien solo emite solicitudes ve únicamente las suyas, con su etapa", async () => {
      await as(otroSolicitante).post("/expedientes", { id_unidad_solicitante: 3, objeto_compra: "De otra persona", justificacion: "x" });

      const mias = (await as(solicitante).get("/expedientes")).data;
      assert.ok(mias.length >= 1);
      assert.ok(mias.every((e) => e.objeto_compra !== "De otra persona"));
      assert.ok(mias.every((e) => typeof e.estado_etapa === "string"));

      const deOtro = (await as(otroSolicitante).get("/expedientes")).data;
      assert.deepEqual(deOtro.map((e) => e.objeto_compra), ["De otra persona"]);
    });

    it("el admin y quien supervisa ven todos los expedientes", async () => {
      for (const quien of [supervisor, admin]) {
        const todos = (await as(quien).get("/expedientes")).data.map((e) => e.objeto_compra);
        assert.ok(todos.includes("De otra persona") && todos.includes("Papelería"));
      }
    });

    it("quien tiene el trámite ve solo lo que le corresponde: al pasar a otra persona deja de verlo", async () => {
      const nuevo = (await as(solicitante).post("/expedientes", { id_unidad_solicitante: 2, objeto_compra: "Pasa de mano", justificacion: "x" })).data.id_expediente;
      const lista = async (quien) => (await as(quien).get("/expedientes")).data.some((e) => e.id_expediente === nuevo);

      // Le corresponde al Jefe de Adquisiciones: lo ve; el analista todavía no.
      assert.equal((await as(jefe).get(`/expedientes/${nuevo}`)).status, 200);
      assert.equal(await lista(jefe), true);
      assert.equal((await as(analista).get(`/expedientes/${nuevo}`)).status, 404);
      assert.equal(await lista(analista), false);

      // Lo turna: pasa al analista y al Jefe deja de aparecerle (detalle, lista y PDF).
      assert.equal((await as(jefe).post(`/expedientes/${nuevo}/turnar`)).status, 200);
      assert.equal((await as(jefe).get(`/expedientes/${nuevo}`)).status, 404);
      assert.equal((await as(jefe).get(`/expedientes/${nuevo}/pdf`)).status, 404);
      assert.equal(await lista(jefe), false);
      assert.equal((await as(analista).get(`/expedientes/${nuevo}`)).status, 200);
      assert.equal(await lista(analista), true);

      // Quien lo emitió y la supervisión lo siguen viendo siempre.
      assert.equal(await lista(solicitante), true);
      assert.equal(await lista(supervisor), true);
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
      assert.equal((await as(supervisor).get(`/expedientes/${ajena.id_expediente}`)).status, 200);
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
