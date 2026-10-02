// Importador del catálogo: debe cargar el Excel oficial igual que el sistema Python original
// y poder repetirse sin cambiar los ids de los medios ya cargados.
const env = require("./helpers/test-env");
const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const SRC = env.SRC;
const { importarCatalogo } = require(path.join(SRC, "services/plan-medios/catalog-import.service"));
const catalogRepo = require(path.join(SRC, "services/plan-medios/repositories/catalog.repository"));
const { rankRecommendation } = require(path.join(SRC, "services/plan-medios/domain/scoring/engine"));
const { quantity } = require(path.join(SRC, "services/plan-medios/documents/catalog-xlsx"));

const EXCEL = path.join(__dirname, "fixtures", "Medios.xlsx");
const keyOf = (media) => `${media.name}|${media.media_type}`;

describe("importación del catálogo de medios", () => {
  let db;
  let firstResult;

  before(async () => {
    ({ db } = await env.createDatabase());
    firstResult = await importarCatalogo({ filePath: EXCEL, db });
  });

  it("carga 144 medios y 269 productos sin huérfanos (igual que el original)", async () => {
    assert.equal(firstResult.media_count, 144);
    assert.equal(firstResult.product_count, 269);
    assert.equal(firstResult.orphan_product_count, 0);
    const status = await catalogRepo.status(db);
    assert.equal(status.status, "ready");
    assert.equal(status.media_count, 144);
    assert.equal(status.product_count, 269);
  });

  it("cada medio y producto coincide campo por campo con lo que cargó el sistema original", async () => {
    const expected = new Map(env.readJsonFixture("golden/catalog.json").map((media) => [keyOf(media), media]));
    const actual = await catalogRepo.listAllWithProducts(db);
    assert.equal(actual.length, expected.size);

    const textColumns = [
      "name", "group_name", "media_type", "coverage", "regions", "languages", "reach", "ages", "predominant_sex",
      "nse", "interests", "peak_hours", "contact_person", "contact_email", "contact_phone", "legal_name", "nit",
      "tax_status", "required_documents", "minimum_investment", "contracting_forms", "discounts", "rate_card_validity",
    ];
    for (const media of actual) {
      const reference = expected.get(keyOf(media));
      assert.ok(reference, `medio inesperado: ${keyOf(media)}`);
      for (const column of textColumns) assert.equal(media[column], reference[column], `${keyOf(media)}.${column}`);

      assert.equal(media.products.length, reference.products.length, `${keyOf(media)}: productos`);
      const sortKey = (p) => [p.category, p.product_name, p.format, JSON.stringify(p.details.__source_row)].join("|");
      const got = [...media.products].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
      const want = [...reference.products].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
      got.forEach((product, index) => {
        const ref = want[index];
        for (const column of ["category", "product_name", "format", "schedule", "prime_time"]) {
          assert.equal(product[column], ref[column], `${keyOf(media)} producto.${column}`);
        }
        assert.equal(product.estimated_audience, ref.estimated_audience === null ? null : Math.round(ref.estimated_audience));
        assert.equal(product.unit_cost, ref.unit_cost === null ? null : Math.round(ref.unit_cost * 100) / 100);
        assert.deepEqual(product.details, ref.details);
      });
    }
  });

  it("el catálogo cargado alimenta el scoring", async () => {
    const catalog = await catalogRepo.listAllWithProducts(db);
    const result = rankRecommendation({
      summary: { fields: {} },
      recommendation: { profile: "Radio informativa de cobertura nacional", category: "Radio", fields: {} },
      catalog,
      limit: 3,
    });
    assert.equal(result.status, "completed");
    assert.equal(result.candidate_count, 89);
    assert.equal(result.items.length, 3);
  });

  it("repetir la carga actualiza sin cambiar ids, sin duplicar y registra cada ejecución", async () => {
    const before = (await db.query("SELECT id, name, media_type FROM media_catalog ORDER BY id")).rows;
    await db.query("UPDATE media_catalog SET coverage = 'EDITADO A MANO' WHERE id = $1", [before[0].id]);

    const second = await importarCatalogo({ filePath: EXCEL, db });
    assert.equal(second.media_count, 144);

    const after = (await db.query("SELECT id, name, media_type, coverage FROM media_catalog ORDER BY id")).rows;
    assert.deepEqual(after.map(({ id, name, media_type }) => ({ id, name, media_type })), before);
    assert.notEqual(after[0].coverage, "EDITADO A MANO", "la carga restablece los datos del Excel");
    assert.equal((await db.query("SELECT count(*)::int AS n FROM media_products")).rows[0].n, 269);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM catalog_import_runs")).rows[0].n, 2);
  });

  it("no borra medios que no vienen en el archivo (los expedientes pueden referenciarlos)", async () => {
    await db.query("INSERT INTO media_catalog (name, media_type) VALUES ('Medio manual', 'radio')");
    await importarCatalogo({ filePath: EXCEL, db });
    assert.equal((await db.query("SELECT count(*)::int AS n FROM media_catalog WHERE name = 'Medio manual'")).rows[0].n, 1);
  });

  it("--dry-run valida sin escribir nada", async () => {
    const { db: empty } = await env.createDatabase();
    const result = await importarCatalogo({ filePath: EXCEL, dryRun: true, db: empty });
    assert.equal(result.media_count, 144);
    assert.equal(result.product_count, 269);
    assert.equal((await empty.query("SELECT count(*)::int AS n FROM media_catalog")).rows[0].n, 0);
  });

  it("rechaza archivos que no son el catálogo oficial", async () => {
    await assert.rejects(importarCatalogo({ filePath: path.join(__dirname, "fixtures", "briefs", "brief-A.docx"), db }), /No fue posible leer|no corresponde/);
  });

  it("interpreta cantidades escritas como texto", () => {
    assert.equal(quantity("2.5 millones"), 2_500_000);
    assert.equal(quantity("45 mil"), 45_000);
    assert.equal(quantity("1,200"), 1200);
    assert.equal(quantity("de 100 a 300"), 300);
    assert.equal(quantity("sin dato"), null);
  });
});
