// Pruebas de integración del módulo Plan de Medios: HTTP -> Express -> casos de uso ->
// repositorios -> PostgreSQL (en memoria, con el esquema original).
const env = require("./helpers/test-env"); // debe ir primero: prepara variables de entorno y BD de usuarios
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");

describe("API Plan de Medios", () => {
  let server;
  let db;
  let analyst; // todos los permisos
  let reader; // solo lectura
  let outsider; // sin permisos
  let expedienteId;
  let version;
  let detail;

  const uploadBrief = (token, filename, buffer) => {
    const form = new FormData();
    form.append("brief", new Blob([buffer]), filename);
    return server.request("POST", "/expedientes", { token, form });
  };

  before(async () => {
    ({ db } = await env.createDatabase());
    await env.loadCatalogFixture(db, env.readJsonFixture("golden/catalog.json"));
    server = await env.startServer();
    analyst = env.createUser({
      userId: 1,
      permissions: ["plan-medios:read", "plan-medios:create", "plan-medios:update", "plan-medios:export"],
    });
    reader = env.createUser({ userId: 2, permissions: ["plan-medios:read"] });
    outsider = env.createUser({ userId: 3, permissions: [] });
  });

  after(async () => {
    await server.close();
  });

  describe("seguridad", () => {
    it("health no requiere sesión", async () => {
      const res = await server.request("GET", "/health");
      assert.equal(res.status, 200);
      assert.equal(res.data.database, "up");
    });

    it("rechaza peticiones sin token (403) y con token inválido (401)", async () => {
      assert.equal((await server.request("GET", "/expedientes")).status, 403);
      assert.equal((await server.request("GET", "/expedientes", { token: "no-es-un-jwt" })).status, 401);
    });

    it("exige el permiso de cada acción", async () => {
      assert.equal((await server.request("GET", "/expedientes", { token: outsider })).status, 403);
      assert.equal((await server.request("GET", "/expedientes", { token: reader })).status, 200);
      const brief = env.readFixture("briefs/brief-B.docx");
      assert.equal((await uploadBrief(reader, "brief.docx", brief)).status, 403);
    });

    it("rechaza identificadores de expediente con intentos de salir del directorio", async () => {
      const res = await server.request("GET", "/expedientes/..%2F..%2Fetc", { token: analyst });
      assert.ok([400, 404].includes(res.status));
    });
  });

  describe("crear expediente", () => {
    it("valida el tipo de archivo", async () => {
      const res = await uploadBrief(analyst, "brief.txt", Buffer.from("hola"));
      assert.equal(res.status, 400);
      assert.match(res.data.message, /Formato no permitido/);
    });

    it("exige adjuntar el archivo", async () => {
      const res = await server.request("POST", "/expedientes", { token: analyst, form: new FormData() });
      assert.equal(res.status, 400);
    });

    it("extrae los campos de un DOCX estructurado", async () => {
      const res = await uploadBrief(analyst, "brief-B.docx", env.readFixture("briefs/brief-B.docx"));
      assert.equal(res.status, 201);
      assert.match(res.data.expediente_id, /^\d{8}-[0-9a-f]{8}$/);
      assert.equal(res.data.status, "resumen_extraido");
      expedienteId = res.data.expediente_id;

      const stored = path.join(process.env.PLAN_MEDIOS_STORAGE_PATH, "expedientes", expedienteId, "brief.docx");
      assert.ok(fs.existsSync(stored), "el brief original debe guardarse en disco");
    });

    it("un PDF crea el expediente con el formulario en blanco para llenado manual", async () => {
      const res = await uploadBrief(analyst, "brief.pdf", Buffer.from("%PDF-1.4 falso"));
      assert.equal(res.status, 201);
      assert.equal(res.data.status, "documentos_cargados");
      const opened = await server.request("GET", `/expedientes/${res.data.expediente_id}`, { token: analyst });
      assert.equal(opened.status, 200);
      assert.equal(Object.keys(opened.data.summary_fields).length, 17);
      assert.equal(opened.data.summary_fields["1.1"].status, "not_found");
    });
  });

  describe("consultar y listar", () => {
    it("devuelve el detalle del expediente", async () => {
      const res = await server.request("GET", `/expedientes/${expedienteId}`, { token: reader });
      assert.equal(res.status, 200);
      detail = res.data;
      version = detail.version;
      assert.equal(version, 1);
      assert.equal(detail.status, "resumen_extraido");
      assert.equal(detail.word_generated, false);
      assert.ok(detail.media_recommendations.length > 0);
      assert.ok(detail.summary_fields["1.1"].value);
    });

    it("404 si el expediente no existe", async () => {
      const res = await server.request("GET", "/expedientes/20200101-deadbeef", { token: reader });
      assert.equal(res.status, 404);
    });

    it("lista y busca por campaña, estado o identificador", async () => {
      const all = await server.request("GET", "/expedientes", { token: reader });
      assert.equal(all.data.expedientes.length, 2);
      assert.ok(all.data.expedientes.every((item) => item.created_by === "Analista de Prueba"), "el listado muestra quién creó cada expediente");
      const campaign = detail.summary_fields["1.1"].value;
      const byCampaign = await server.request("GET", `/expedientes?q=${encodeURIComponent(campaign.slice(0, 12))}`, { token: reader });
      assert.ok(byCampaign.data.expedientes.some((item) => item.expediente_id === expedienteId));
      const byStatus = await server.request("GET", "/expedientes?q=documentos_cargados", { token: reader });
      assert.equal(byStatus.data.expedientes.length, 1);
      const none = await server.request("GET", "/expedientes?q=xyz-no-existe", { token: reader });
      assert.equal(none.data.expedientes.length, 0);
    });

    it("trata % y _ de la búsqueda como texto literal", async () => {
      const res = await server.request("GET", "/expedientes?q=%25", { token: reader });
      assert.equal(res.data.expedientes.length, 0);
    });
  });

  describe("catálogo y ranking", () => {
    it("informa el estado del catálogo", async () => {
      const res = await server.request("GET", "/medios/catalogo/estado", { token: reader });
      assert.equal(res.data.media_count, 144);
      assert.equal(res.data.product_count, 269);
    });

    it("lista medios por tipo y devuelve el detalle por id", async () => {
      const list = await server.request("GET", "/medios?tipo=radio&limite=5", { token: reader });
      assert.equal(list.data.count, 5);
      const first = list.data.items[0];
      assert.ok(Number.isInteger(first.id));
      const one = await server.request("GET", `/medios/${first.id}`, { token: reader });
      assert.equal(one.data.item.name, first.name);
      assert.ok(Array.isArray(one.data.item.products));
      assert.equal((await server.request("GET", "/medios/99999", { token: reader })).status, 404);
      assert.equal((await server.request("GET", "/medios/abc", { token: reader })).status, 400);
    });

    it("calcula el ranking explicable de cada recomendación del Brief", async () => {
      const res = await server.request("GET", `/expedientes/${expedienteId}/ranking-medios?limite=3`, { token: reader });
      assert.equal(res.status, 200);
      assert.equal(res.data.method, "deterministic_weighted_rules_v1_2");
      assert.equal(res.data.rankings.length, detail.media_recommendations.length);
      const withItems = res.data.rankings.find((ranking) => ranking.status === "completed");
      assert.ok(withItems.items.length <= 3 && withItems.items.length > 0);
      const [top, second] = withItems.items;
      assert.ok(top.score >= second.score);
      assert.equal(top.criteria.length, 7);
      assert.equal(top.score_max, 100);
    });

    it("valida el límite del ranking", async () => {
      const res = await server.request("GET", `/expedientes/${expedienteId}/ranking-medios?limite=50`, { token: reader });
      assert.equal(res.status, 400);
    });
  });

  describe("guardar el formulario (Etapas 1 a 3)", () => {
    let ranking;
    const buildEntry = (recommendation, candidate, position, justification) => ({
      medium: candidate.media_name,
      selection_justification: justification,
      profile: recommendation.profile,
      category: recommendation.category,
      selection_source: "catalog_scoring",
      catalog_media_id: candidate.media_id,
      catalog_media_name: candidate.media_name,
      scoring_method: "deterministic_weighted_rules_v1_2",
      scoring_score: candidate.score,
      scoring_confidence: candidate.data_confidence,
      scoring_compatibility: candidate.compatibility,
      scoring_position: position,
      fields: Object.fromEntries(
        Object.entries(recommendation.fields).map(([id, field]) => [id, { value: field.value, ignored_keys: [] }])
      ),
    });

    before(async () => {
      ranking = (await server.request("GET", `/expedientes/${expedienteId}/ranking-medios?limite=3`, { token: reader })).data.rankings;
    });

    it("guarda un borrador y sube la versión", async () => {
      const res = await server.request("PUT", `/expedientes/${expedienteId}/resumen`, {
        token: analyst,
        json: {
          version,
          planning_action: "draft",
          fields: { "1.1": { value: "  Campaña editada  ", ignored_keys: ["REGLA:1:2:x"] } },
          priorities: { preset: "territorial", weights: { audience: 20, geography: 40, reach: 10, cost: 15, affinity: 15 } },
        },
      });
      assert.equal(res.status, 200, JSON.stringify(res.data));
      assert.equal(res.data.version, version + 1);
      assert.equal(res.data.status, "borrador");
      assert.equal(res.data.summary_fields["1.1"].value, "Campaña editada");
      assert.equal(res.data.summary_fields["1.1"].source, "user_review");
      assert.deepEqual(res.data.summary_fields["1.1"].language_review.ignored_keys, ["REGLA:1:2:x"]);
      assert.equal(res.data.campaign_priorities.preset, "territorial");
      version = res.data.version;
    });

    it("rechaza una versión desactualizada con 409 (bloqueo optimista)", async () => {
      const res = await server.request("PUT", `/expedientes/${expedienteId}/resumen`, {
        token: analyst,
        json: { version: version - 1, planning_action: "draft" },
      });
      assert.equal(res.status, 409);
    });

    it("rechaza prioridades que no suman 100", async () => {
      const res = await server.request("PUT", `/expedientes/${expedienteId}/resumen`, {
        token: analyst,
        json: { version, priorities: { preset: "custom", weights: { audience: 50, geography: 50, reach: 10, cost: 0, affinity: 0 } } },
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /100%/);
    });

    it("rechaza el guardado de lectores (permiso update)", async () => {
      const res = await server.request("PUT", `/expedientes/${expedienteId}/resumen`, { token: reader, json: { version } });
      assert.equal(res.status, 403);
    });

    it("exige justificación salvo para la opción #1 del ranking", async () => {
      const recommendation = detail.media_recommendations[0];
      const items = ranking[0].items;
      assert.ok(items.length >= 2, "se necesitan al menos dos candidatos");

      // #2 sin justificación al continuar -> 400
      const without = await server.request("PUT", `/expedientes/${expedienteId}/resumen`, {
        token: analyst,
        json: { version, planning_action: "continue", media_entries: [buildEntry(recommendation, items[1], 2, "")] },
      });
      assert.equal(without.status, 400);
      assert.match(without.data.message, /justificar/);

      // #1 sin justificación -> permitido
      const top = await server.request("PUT", `/expedientes/${expedienteId}/resumen`, {
        token: analyst,
        json: { version, planning_action: "continue", media_entries: [buildEntry(recommendation, items[0], 1, "")] },
      });
      assert.equal(top.status, 200, JSON.stringify(top.data));
      assert.equal(top.data.status, "resumen_revisado");
      assert.equal(top.data.media_entries.length, 1);
      assert.equal(top.data.media_entries[0].catalog_media_id, items[0].media_id);
      version = top.data.version;
    });

    it("registra la auditoría de selecciones (más reciente primero)", async () => {
      const recommendation = detail.media_recommendations[0];
      const items = ranking[0].items;

      // Cambia el medio: se remueve el anterior y se selecciona otro (misma transacción).
      const swap = await server.request("PUT", `/expedientes/${expedienteId}/resumen`, {
        token: analyst,
        json: {
          version,
          planning_action: "continue",
          media_entries: [buildEntry({ ...recommendation, profile: "Otro perfil" }, items[1], 2, "Porque sí, con criterio.")],
        },
      });
      assert.equal(swap.status, 200, JSON.stringify(swap.data));
      version = swap.data.version;

      const res = await server.request("GET", `/expedientes/${expedienteId}/auditoria`, { token: reader });
      assert.equal(res.status, 200);
      const types = res.data.events.map((event) => event.event_type);
      assert.deepEqual(types.slice().sort(), ["removed", "selected", "selected"]);
      // Orden estrictamente decreciente por secuencia
      const sequences = res.data.events.map((event) => event.sequence);
      assert.deepEqual(sequences, [...sequences].sort((a, b) => b - a));
      // El primer evento registrado (selected #1) coincide con la recomendación #1
      const first = res.data.events[res.data.events.length - 1];
      assert.equal(first.event_type, "selected");
      assert.equal(first.matched_top_recommendation, true);
      assert.equal(first.analyst_user_id, 1);
      assert.equal(first.analyst_email, "usuario1@scspr.test");
      assert.ok(first.provider_legal_name !== undefined);
      assert.ok(res.data.campaign);
    });

    it("un guardado sin cambios de medios no genera eventos nuevos", async () => {
      const before = (await server.request("GET", `/expedientes/${expedienteId}/auditoria`, { token: reader })).data.count;
      const res = await server.request("PUT", `/expedientes/${expedienteId}/resumen`, {
        token: analyst,
        json: { version, planning_action: "draft" },
      });
      assert.equal(res.status, 200);
      version = res.data.version;
      const after = (await server.request("GET", `/expedientes/${expedienteId}/auditoria`, { token: reader })).data.count;
      assert.equal(after, before);
    });

    it("guarda los medios también en su tabla relacional", async () => {
      const { rows } = await db.query("SELECT position, profile, catalog_media_id FROM expediente_media_entries WHERE expediente_id = $1", [expedienteId]);
      assert.equal(rows.length, 1);
      assert.equal(rows[0].position, 0);
      assert.ok(rows[0].catalog_media_id, "el medio de catálogo queda enlazado por su id");
    });
  });

  describe("documentos", () => {
    it("no permite descargar documentos que aún no existen", async () => {
      assert.equal((await server.request("GET", `/expedientes/${expedienteId}/documentos/plan-medios`, { token: analyst, raw: true })).status, 404);
    });

    it("exige el permiso export", async () => {
      assert.equal((await server.request("POST", `/expedientes/${expedienteId}/plan-medios`, { token: reader })).status, 403);
    });

    it("genera y descarga el Plan de Medios (Word)", async () => {
      const gen = await server.request("POST", `/expedientes/${expedienteId}/plan-medios`, { token: analyst });
      assert.equal(gen.status, 200, JSON.stringify(gen.data));
      assert.equal(gen.data.status, "plan_medios_generado");

      const opened = await server.request("GET", `/expedientes/${expedienteId}`, { token: reader });
      assert.equal(opened.data.status, "plan_medios_generado");
      assert.equal(opened.data.word_generated, true);

      const file = await server.request("GET", `/expedientes/${expedienteId}/documentos/plan-medios`, { token: analyst, raw: true });
      assert.equal(file.status, 200);
      assert.match(file.headers.get("content-type"), /wordprocessingml/);
      const zip = await JSZip.loadAsync(file.buffer);
      const xml = await zip.file("word/document.xml").async("string");
      assert.match(xml, /Justificación de selección:/);
      assert.match(xml, /Campaña editada/);
    });

    it("prepara la vista previa de una solicitud de compra sin exponer metadata interna", async () => {
      const res = await server.request("POST", `/expedientes/${expedienteId}/solicitudes-compra/0/preparar`, {
        token: analyst,
        json: { request_number: "UM-001/2026" },
      });
      assert.equal(res.status, 200, JSON.stringify(res.data));
      assert.equal(res.data.request.request_number, "UM-001/2026");
      assert.equal(res.data.request.metadata, undefined);
      assert.match(res.data.request.description, /^CONTRATACIÓN DE SERVICIO/);
      assert.ok(res.data.request.justification.length > 40);
    });

    it("valida el índice del medio", async () => {
      assert.equal((await server.request("POST", `/expedientes/${expedienteId}/solicitudes-compra/9/preparar`, { token: analyst, json: {} })).status, 400);
      assert.equal((await server.request("POST", `/expedientes/${expedienteId}/solicitudes-compra/x/preparar`, { token: analyst, json: {} })).status, 400);
    });

    it("bloquea la solicitud si menciona al medio o proveedor (neutralidad)", async () => {
      const opened = await server.request("GET", `/expedientes/${expedienteId}`, { token: reader });
      const medium = opened.data.media_entries[0].medium;
      const res = await server.request("POST", `/expedientes/${expedienteId}/solicitudes-compra/0/preparar`, {
        token: analyst,
        json: { justification: `Se contratará a ${medium} por su alcance.` },
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /neutralidad/);
    });

    it("genera la solicitud de compra (Excel), la registra y permite re-descargarla", async () => {
      const gen = await server.request("POST", `/expedientes/${expedienteId}/solicitudes-compra/0/generar`, {
        token: analyst,
        json: { request_number: "UM-001/2026", budget_line: "121", quantity: "2" },
        raw: true,
      });
      assert.equal(gen.status, 200);
      assert.match(gen.headers.get("content-type"), /spreadsheetml/);
      const zip = await JSZip.loadAsync(gen.buffer);
      const sheet = await zip.file("xl/worksheets/sheet1.xml").async("string");
      assert.match(sheet, /UM-001\/2026/);

      // Segunda generación del mismo medio: actualiza, no duplica
      await server.request("POST", `/expedientes/${expedienteId}/solicitudes-compra/0/generar`, {
        token: analyst, json: { request_number: "UM-002/2026" }, raw: true,
      });
      const { rows } = await db.query("SELECT request_number, status, quantity FROM purchase_requests WHERE expediente_id = $1", [expedienteId]);
      assert.equal(rows.length, 1);
      assert.equal(rows[0].request_number, "UM-002/2026");
      assert.equal(rows[0].status, "generated");

      const again = await server.request("GET", `/expedientes/${expedienteId}/documentos/solicitud-compra/0`, { token: analyst, raw: true });
      assert.equal(again.status, 200);
    });

    it("no duplica ni pierde la solicitud tras volver a guardar el formulario (los medios se reescriben)", async () => {
      const opened = await server.request("GET", `/expedientes/${expedienteId}`, { token: reader });
      const res = await server.request("PUT", `/expedientes/${expedienteId}/resumen`, {
        token: analyst, json: { version: opened.data.version, planning_action: "draft" },
      });
      assert.equal(res.status, 200);
      await server.request("POST", `/expedientes/${expedienteId}/solicitudes-compra/0/generar`, {
        token: analyst, json: { request_number: "UM-003/2026" }, raw: true,
      });
      const { rows } = await db.query("SELECT request_number, media_position, created_by_user_id FROM purchase_requests WHERE expediente_id = $1", [expedienteId]);
      assert.equal(rows.length, 1);
      assert.equal(rows[0].request_number, "UM-003/2026");
      assert.equal(rows[0].media_position, 0);
      assert.equal(rows[0].created_by_user_id, 1, "se guarda quién generó la solicitud (usuario central)");
    });
  });

  describe("corrector ortográfico y diccionario", () => {
    it("responde 'unavailable' (no error) si LanguageTool no está disponible", async () => {
      const res = await server.request("POST", "/revision-ortografica", { token: reader, json: { text: "Hola mundo", language: "es" } });
      assert.equal(res.status, 200);
      assert.equal(res.data.status, "unavailable");
      assert.match(res.data.message, /LanguageTool/);
    });

    it("agrega términos al diccionario sin duplicarlos", async () => {
      const add = await server.request("POST", "/diccionario-institucional", { token: analyst, json: { term: "  Alta   Verapaz " } });
      assert.equal(add.status, 200);
      assert.equal(add.data.term, "Alta Verapaz");
      await server.request("POST", "/diccionario-institucional", { token: analyst, json: { term: "alta verapaz" } });
      const { rows } = await db.query("SELECT term, created_by FROM institutional_terms");
      assert.equal(rows.length, 1);
      assert.equal(rows[0].created_by, "usuario1@scspr.test");
      assert.equal((await server.request("POST", "/diccionario-institucional", { token: analyst, json: { term: "   " } })).status, 400);
      assert.equal((await server.request("POST", "/diccionario-institucional", { token: reader, json: { term: "X" } })).status, 403);
    });
  });

  describe("borrador con IA local", () => {
    it("informa un error controlado si Ollama no responde", async () => {
      const res = await server.request("POST", `/expedientes/${expedienteId}/solicitudes-compra/0/justificacion-ia`, { token: analyst });
      assert.equal(res.status, 502);
      assert.match(res.data.message, /Ollama/);
    });
  });
});
