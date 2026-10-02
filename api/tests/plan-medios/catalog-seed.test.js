// Seed del catálogo: reproduce el caso real "la base nueva está vacía y el paso de medios no
// muestra sugerencias", y comprueba que el API lo resuelve solo al arrancar sin poner en riesgo al core.
const env = require("./helpers/test-env");
const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SRC = env.SRC;
const svc = (p) => require(path.join(SRC, "services/plan-medios", p));
const { seedCatalogIfEmpty } = svc("catalog-seed.service");
const { crearExpediente } = svc("expedientes.service");
const { rankearExpediente } = svc("ranking.service");
const catalogRepo = svc("repositories/catalog.repository");
const config = require(path.join(SRC, "config/plan-medios.config"));

const silent = { log() {}, warn() {} };
const logs = () => {
  const lines = [];
  return { lines, log: (m) => lines.push(["log", m]), warn: (m) => lines.push(["warn", m]) };
};

describe("seed del catálogo de medios", () => {
  let db;
  let expedienteId;

  before(async () => {
    ({ db } = await env.createDatabase());
    const buffer = env.readFixture("briefs/brief-B.docx");
    ({ expediente_id: expedienteId } = await crearExpediente({
      file: { originalname: "brief.docx", buffer, size: buffer.length },
      actor: { userId: 1, email: "a@scspr.test", name: "Ana" },
    }));
  });

  it("el catálogo oficial viaja con el código", () => {
    assert.ok(fs.existsSync(config.catalog.defaultFile), `falta ${config.catalog.defaultFile}`);
  });

  it("con la base vacía el estado lo dice y el ranking explica que no hay catálogo (el caso reportado)", async () => {
    assert.equal((await catalogRepo.status(db)).status, "empty");
    const result = await rankearExpediente({ id: expedienteId, limit: 3 });
    assert.equal(result.catalog_empty, true);
    assert.ok(result.rankings.length > 0);
    assert.ok(result.rankings.every((ranking) => ranking.status === "no_candidates"));
  });

  it("falla sin ruido si la base de Plan de Medios aún no existe (no debe tumbar al core)", async () => {
    const broken = { query: async () => { throw new Error('relation "media_catalog" does not exist'); } };
    const out = logs();
    const result = await seedCatalogIfEmpty({ db: broken, log: out });
    assert.equal(result.seeded, false);
    assert.match(result.reason, /does not exist/);
    assert.equal(out.lines[0][0], "warn");
  });

  it("avisa si el catálogo está vacío y falta el archivo", async () => {
    const out = logs();
    const result = await seedCatalogIfEmpty({ db, filePath: path.join(__dirname, "no-existe.xlsx"), log: out });
    assert.equal(result.seeded, false);
    assert.match(out.lines[0][1], /no se encontró el archivo/);
    assert.equal((await catalogRepo.status(db)).media_count, 0);
  });

  it("carga el catálogo cuando está vacío", async () => {
    const out = logs();
    const result = await seedCatalogIfEmpty({ db, log: out });
    assert.equal(result.seeded, true);
    assert.equal(result.media_count, 144);
    assert.equal(result.product_count, 269);
    assert.match(out.lines[0][1], /se cargaron 144 medios y 269 productos/);
  });

  it("con el catálogo cargado el paso de medios ya trae sugerencias", async () => {
    const result = await rankearExpediente({ id: expedienteId, limit: 3 });
    assert.equal(result.catalog_empty, false);
    const withCandidates = result.rankings.filter((ranking) => ranking.status === "completed");
    assert.ok(withCandidates.length > 0);
    assert.ok(withCandidates.every((ranking) => ranking.items.length === 3));
  });

  it("no vuelve a cargar ni sobrescribe si ya hay medios (aunque se reinicie el API)", async () => {
    await db.query("UPDATE media_catalog SET coverage = 'AJUSTE MANUAL' WHERE id = (SELECT min(id) FROM media_catalog)");
    const result = await seedCatalogIfEmpty({ db, log: silent });
    assert.equal(result.seeded, false);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM media_catalog WHERE coverage = 'AJUSTE MANUAL'")).rows[0].n, 1);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM catalog_import_runs")).rows[0].n, 1);
  });
});
