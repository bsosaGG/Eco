// Pruebas "golden": el módulo en Node debe producir los mismos resultados que el
// sistema Python original (fixtures/golden/* se generaron ejecutando ese sistema con
// los briefs reales de fixtures/briefs/*).
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const JSZip = require("jszip");
const { readFixture, readJsonFixture, SRC } = require("./helpers/golden-paths");

const plan = (p) => require(path.join(SRC, "services/plan-medios", p));
const { extractSummaryFields } = plan("documents/brief-extractor");
const { rankAll } = plan("domain/scoring/engine");
const { generatePlanMediosDocx } = plan("documents/plan-medios-docx");
const { generatePurchaseRequestXlsx } = plan("documents/purchase-xlsx");
const { buildPurchaseRequest, toPublicRequest } = plan("domain/purchase-request");
const ooxml = plan("documents/ooxml");

const sortKeys = (v) =>
  Array.isArray(v) ? v.map(sortKeys) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v;

describe("Paridad con el sistema Python original", () => {
  for (const [brief, summaryFile] of [["brief-A.docx", "summary-A.json"], ["brief-B.docx", "summary-B.json"]]) {
    it(`extrae del Brief ${brief} exactamente los mismos campos`, async () => {
      const actual = sortKeys(await extractSummaryFields(readFixture(`briefs/${brief}`), "brief.docx"));
      const expected = sortKeys({ ...readJsonFixture(`golden/${summaryFile}`), document: "brief.docx" });
      assert.deepEqual(actual, expected);
    });
  }

  it("el scoring de 459 candidatos coincide byte a byte (puntajes, criterios y explicaciones)", () => {
    const catalog = readJsonFixture("golden/catalog.json");
    const expected = readJsonFixture("golden/rankings.json");
    let compared = 0;
    for (const [key, summaryFile] of [["20260918-fd0bc856", "summary-A.json"], ["20260919-67ee782b", "summary-B.json"]]) {
      const rankings = rankAll({ summary: readJsonFixture(`golden/${summaryFile}`), catalog, limitPerProfile: 100 });
      assert.equal(rankings.length, expected[key].length);
      rankings.forEach((ranking, index) => {
        assert.equal(JSON.stringify(ranking), JSON.stringify(expected[key][index]), `${key} recomendación ${index}`);
        compared += ranking.items.length;
      });
    }
    assert.equal(compared, 459);
  });

  it("el Word generado tiene el mismo contenido que el generado por Python", async () => {
    const template = readFixtureTemplate("plantilla_plan_de_medios.docx");
    const summary = readJsonFixture("golden/summary-with-entries-B.json");
    const buffer = await generatePlanMediosDocx(template, summary);

    const zip = await ooxml.openPackage(buffer);
    const doc = await ooxml.readXml(zip, "word/document.xml");
    const lines = ooxml.bodyParagraphs(doc).map((p) => "P|" + ooxml.paragraphText(p));
    ooxml.bodyTables(doc).forEach((tbl, tableIndex) => {
      ooxml.tableTexts(tbl).forEach((row, rowIndex) => lines.push(`T${tableIndex}R${rowIndex}|` + row.join(" || ")));
    });
    assert.deepEqual(lines, readJsonFixture("golden/plan-medios-B.docx-text.json"));
  });

  it("las solicitudes de compra coinciden con las del sistema original", async () => {
    const summary = readJsonFixture("golden/summary-with-entries-B.json");
    const expected = readJsonFixture("golden/purchase-requests-B.json");
    const template = readFixtureTemplate("plantilla_solicitud_compra.xlsx");
    for (let index = 0; index < summary.media_entries.length; index += 1) {
      const request = buildPurchaseRequest({
        expedienteId: "X-1",
        summary,
        mediaEntryIndex: index,
        requestNumber: "UM-001/2026",
        requestDate: "1 de octubre de 2026",
        budgetLine: "121",
      });
      assert.deepEqual(sortKeys(toPublicRequest(request)), sortKeys(expected[index]));
      const xlsx = await generatePurchaseRequestXlsx(template, request);
      const sheet = await (await JSZip.loadAsync(xlsx)).file("xl/worksheets/sheet1.xml").async("string");
      assert.ok(sheet.includes("UM-001/2026"));
    }
  });
});

function readFixtureTemplate(name) {
  return require("fs").readFileSync(path.join(SRC, "templates/plan-medios", name));
}
