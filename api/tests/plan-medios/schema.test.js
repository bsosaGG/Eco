// Pruebas del esquema (database/init_plan_medios.sql): se ejecuta el DDL real en PostgreSQL
// en memoria y se comprueban las reglas que quedan garantizadas por la propia base de datos.
const env = require("./helpers/test-env");
const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { PGlite } = require("@electric-sql/pglite");

describe("esquema de Plan de Medios", () => {
  let pg;
  const q = (text, params) => pg.query(text, params);
  const insertExpediente = (id, status = "borrador", summary = null) =>
    q("INSERT INTO expedientes (id, status, summary_payload) VALUES ($1, $2, $3::jsonb)", [id, status, summary && JSON.stringify(summary)]);
  const rejects = (promise, pattern) => assert.rejects(promise, (error) => pattern.test(error.message));

  before(async () => {
    pg = new PGlite();
    await pg.exec(fs.readFileSync(env.INIT_SQL, "utf8"));
  });

  it("es idempotente: se puede ejecutar de nuevo sin perder datos", async () => {
    await insertExpediente("20260101-aaaaaaaa");
    await pg.exec(fs.readFileSync(env.INIT_SQL, "utf8"));
    const { rows } = await q("SELECT count(*)::int AS n FROM expedientes");
    assert.equal(rows[0].n, 1);
  });

  it("crea las 8 tablas esperadas y ninguna de usuarios (están centralizados en db_global_users)", async () => {
    const { rows } = await q("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY 1");
    assert.deepEqual(
      rows.map((row) => row.table_name),
      ["catalog_import_runs", "expediente_media_entries", "expedientes", "institutional_terms", "media_catalog",
       "media_products", "purchase_requests", "selection_audit_events"]
    );
  });

  describe("auditoría inmutable", () => {
    before(async () => {
      await insertExpediente("20260102-bbbbbbbb");
      await q(
        `INSERT INTO selection_audit_events (event_type, expediente_id, medium_name) VALUES ('selected', '20260102-bbbbbbbb', 'Radio X')`
      );
    });

    it("rechaza UPDATE, DELETE y TRUNCATE", async () => {
      await rejects(q("UPDATE selection_audit_events SET medium_name = 'otro'"), /inmutable/);
      await rejects(q("DELETE FROM selection_audit_events"), /inmutable/);
      await rejects(q("TRUNCATE selection_audit_events"), /inmutable/);
      const { rows } = await q("SELECT medium_name FROM selection_audit_events");
      assert.deepEqual(rows, [{ medium_name: "Radio X" }]);
    });

    it("no permite borrar un expediente que tiene historial de auditoría", async () => {
      await rejects(q("DELETE FROM expedientes WHERE id = '20260102-bbbbbbbb'"), /foreign key|violates/i);
    });

    it("solo admite tipos de evento válidos", async () => {
      await rejects(
        q(`INSERT INTO selection_audit_events (event_type, expediente_id) VALUES ('borrado', '20260102-bbbbbbbb')`),
        /ck_selection_audit_events_type|check/i
      );
    });

    it("el id asignado por la base es estrictamente creciente (orden oficial)", async () => {
      await q(`INSERT INTO selection_audit_events (event_type, expediente_id) VALUES ('removed', '20260102-bbbbbbbb'), ('selected', '20260102-bbbbbbbb')`);
      const { rows } = await q("SELECT id::int AS id FROM selection_audit_events ORDER BY id");
      assert.deepEqual(rows.map((r) => r.id), [...rows.map((r) => r.id)].sort((a, b) => a - b));
      assert.equal(new Set(rows.map((r) => r.id)).size, rows.length);
    });
  });

  describe("regla de justificación a nivel de base de datos", () => {
    const entry = (extra) => ({ medium: "Radio Y", selection_source: "manual", ...extra });
    const withEntries = (...entries) => ({ media_entries: entries });

    it("no deja marcar 'plan_medios_generado' si falta una justificación obligatoria", async () => {
      await rejects(
        insertExpediente("20260103-cccccccc", "plan_medios_generado", withEntries(entry({ selection_justification: "  " }))),
        /Debes justificar la seleccion.*Medio 1: Radio Y/
      );
    });

    it("exime a la opción #1 del ranking de catálogo", async () => {
      await insertExpediente(
        "20260103-dddddddd",
        "plan_medios_generado",
        withEntries(entry({ selection_source: "catalog_scoring", scoring_position: 1 }))
      );
      const { rows } = await q("SELECT status FROM expedientes WHERE id = '20260103-dddddddd'");
      assert.equal(rows[0].status, "plan_medios_generado");
    });

    it("también protege los UPDATE y solo aplica al estado 'plan_medios_generado'", async () => {
      await insertExpediente("20260103-eeeeeeee", "borrador", withEntries(entry({})));
      await rejects(q("UPDATE expedientes SET status = 'plan_medios_generado' WHERE id = '20260103-eeeeeeee'"), /Debes justificar/);
      await q(
        `UPDATE expedientes SET status = 'plan_medios_generado',
           summary_payload = $1::jsonb WHERE id = '20260103-eeeeeeee'`,
        [JSON.stringify(withEntries(entry({ selection_justification: "Porque sí" })))]
      );
    });
  });

  describe("integridad", () => {
    it("los medios y solicitudes se borran junto con su expediente", async () => {
      await insertExpediente("20260104-ffffffff");
      await q(`INSERT INTO expediente_media_entries (expediente_id, position) VALUES ('20260104-ffffffff', 0)`);
      await q(`INSERT INTO purchase_requests (expediente_id, media_position) VALUES ('20260104-ffffffff', 0)`);
      await q("DELETE FROM expedientes WHERE id = '20260104-ffffffff'");
      assert.equal((await q("SELECT count(*)::int AS n FROM expediente_media_entries WHERE expediente_id = '20260104-ffffffff'")).rows[0].n, 0);
      assert.equal((await q("SELECT count(*)::int AS n FROM purchase_requests WHERE expediente_id = '20260104-ffffffff'")).rows[0].n, 0);
    });

    it("una posición de medio / de solicitud no se puede repetir", async () => {
      await insertExpediente("20260105-11111111");
      await q(`INSERT INTO expediente_media_entries (expediente_id, position) VALUES ('20260105-11111111', 0)`);
      await rejects(q(`INSERT INTO expediente_media_entries (expediente_id, position) VALUES ('20260105-11111111', 0)`), /uq_media_entry_position|unique/i);
      await q(`INSERT INTO purchase_requests (expediente_id, media_position) VALUES ('20260105-11111111', 0)`);
      await rejects(q(`INSERT INTO purchase_requests (expediente_id, media_position) VALUES ('20260105-11111111', 0)`), /uq_purchase_request_media|unique/i);
    });

    it("el catálogo no admite el mismo medio dos veces por tipo y borra sus productos en cascada", async () => {
      const { rows } = await q(`INSERT INTO media_catalog (name, media_type) VALUES ('Radio Z', 'radio') RETURNING id`);
      await q(`INSERT INTO media_products (media_id, category) VALUES ($1, 'Radio')`, [rows[0].id]);
      await rejects(q(`INSERT INTO media_catalog (name, media_type) VALUES ('Radio Z', 'radio')`), /uq_media_catalog_name_type|unique/i);
      await q(`INSERT INTO media_catalog (name, media_type) VALUES ('Radio Z', 'cable')`); // otro tipo: permitido
      await q("DELETE FROM media_catalog WHERE id = $1", [rows[0].id]);
      assert.equal((await q("SELECT count(*)::int AS n FROM media_products")).rows[0].n, 0);
    });

    it("el diccionario no admite términos repetidos y las cantidades no pueden ser negativas", async () => {
      await q(`INSERT INTO institutional_terms (term, normalized_term) VALUES ('Alta Verapaz', 'alta verapaz')`);
      await rejects(q(`INSERT INTO institutional_terms (term, normalized_term) VALUES ('ALTA VERAPAZ', 'alta verapaz')`), /unique/i);
      await insertExpediente("20260106-22222222");
      await rejects(q(`INSERT INTO purchase_requests (expediente_id, media_position, quantity) VALUES ('20260106-22222222', 0, -1)`), /ck_purchase_quantity_nonnegative|check/i);
    });
  });
});
