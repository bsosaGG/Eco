// Arnés de pruebas del módulo Plan de Medios.
//
// - BD: PostgreSQL en memoria (PGlite) con el esquema ORIGINAL del proyecto Python
//   (fixtures/schema.sql, generado desde sus modelos SQLAlchemy). No se toca ninguna BD real.
// - Autenticación: se usa el middleware REAL del core (verifyToken/checkPermission); solo se
//   sustituye la BD de usuarios (config/db-users) por una simulada.
// - Archivos: carpeta temporal.
//
// IMPORTANTE: este archivo debe cargarse antes que cualquier módulo de src/.
const fs = require("fs");
const os = require("os");
const path = require("path");

const SRC = path.resolve(__dirname, "../../../src");

process.env.JWT_SECRET_KEY_SCSCR = "secreto-de-pruebas";
// Servicios externos opcionales: apuntan a un puerto cerrado para probar el comportamiento sin ellos.
process.env.PLAN_MEDIOS_LANGUAGE_TOOL_URL = "http://127.0.0.1:1";
process.env.OLLAMA_API_URL = "http://127.0.0.1:1/api/generate";
process.env.PLAN_MEDIOS_STORAGE_PATH = fs.mkdtempSync(path.join(os.tmpdir(), "plan-medios-test-"));

// --- BD de usuarios simulada (usada por auth.middleware) ---
const usersById = new Map();
const fakeUsersDb = {
  query: async (sql, params) => {
    if (/FROM usuarios/i.test(sql)) {
      const user = usersById.get(params[0]);
      return { rows: user ? [{ activo: user.activo !== false }] : [] };
    }
    if (/FROM permisos/i.test(sql)) {
      const user = usersById.get(params[1]);
      return { rows: user && user.permissions.includes(params[0]) ? [{ "?column?": 1 }] : [] };
    }
    throw new Error(`Consulta inesperada a la BD de usuarios simulada: ${sql}`);
  },
};
const usersDbPath = require.resolve(path.join(SRC, "config", "db-users"));
require.cache[usersDbPath] = { id: usersDbPath, filename: usersDbPath, loaded: true, exports: fakeUsersDb };

const jwt = require("jsonwebtoken");
const { PGlite } = require("@electric-sql/pglite");
const express = require("express");

/** Registra un usuario de prueba y devuelve su token JWT. */
function createUser({ userId, role = "usuario", permissions = [], name = "Analista de Prueba", activo = true }) {
  usersById.set(userId, { permissions, activo });
  return jwt.sign(
    { userId, email: `usuario${userId}@scspr.test`, role, name, permissions },
    process.env.JWT_SECRET_KEY_SCSCR,
    { expiresIn: "1h" }
  );
}

/** Crea la BD en memoria con el esquema original y la conecta al módulo. */
async function createDatabase() {
  const pg = new PGlite();
  await pg.exec(fs.readFileSync(path.join(__dirname, "../fixtures/schema.sql"), "utf8"));

  const wrap = (runner) => ({
    query: async (text, params) => {
      const result = await runner.query(text, params);
      return { rows: result.rows, rowCount: result.affectedRows ?? result.rows.length };
    },
  });
  const adapter = {
    ...wrap(pg),
    transaction: (work) => pg.transaction((tx) => work(wrap(tx))),
  };
  const { planMediosDb } = require(path.join(SRC, "config", "db-plan-medios"));
  planMediosDb.useAdapter(adapter);
  return { pg, db: adapter };
}

/** Levanta el router del módulo en un puerto efímero, con el errorHandler real del core. */
async function startServer() {
  const router = require(path.join(SRC, "routes", "planMedios.routes"));
  const errorHandler = require(path.join(SRC, "middleware", "errorHandler"));
  const app = express();
  app.use("/api/plan-medios", express.json({ limit: "5mb" }));
  app.use("/api/plan-medios", router);
  app.use(errorHandler);

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });
  const base = `http://127.0.0.1:${server.address().port}/api/plan-medios`;

  const request = async (method, url, { token, json, form, raw } = {}) => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    let body;
    if (json !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(json);
    } else if (form) {
      body = form;
    }
    const response = await fetch(base + url, { method, headers, body });
    if (raw) return { status: response.status, buffer: Buffer.from(await response.arrayBuffer()), headers: response.headers };
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (error) {
      data = text;
    }
    return { status: response.status, data, headers: response.headers };
  };

  return { request, close: () => new Promise((resolve) => server.close(resolve)) };
}

/** Inserta el catálogo de prueba (fixture exportado del sistema original) en la BD en memoria. */
async function loadCatalogFixture(db, catalog) {
  const { v4: uuidv4 } = require("uuid");
  const importedAt = new Date().toISOString();
  const columns = [
    "name", "group_name", "media_type", "coverage", "regions", "languages", "reach", "ages", "predominant_sex",
    "nse", "interests", "peak_hours", "contact_person", "contact_email", "contact_phone", "legal_name", "nit",
    "tax_status", "required_documents", "minimum_investment", "contracting_forms", "discounts", "rate_card_validity",
  ];
  for (const media of catalog) {
    const id = uuidv4();
    await db.query(
      `INSERT INTO media_catalog (id, ${columns.join(", ")}, imported_at)
       VALUES ($1, ${columns.map((_, index) => `$${index + 2}`).join(", ")}, $${columns.length + 2})`,
      [id, ...columns.map((column) => media[column] ?? ""), importedAt]
    );
    for (const product of media.products) {
      await db.query(
        `INSERT INTO media_products (id, media_id, category, product_name, format, schedule, prime_time, rating,
                                     estimated_audience, unit_cost, details, imported_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12)`,
        [
          uuidv4(), id, product.category, product.product_name, product.format, product.schedule, product.prime_time,
          product.rating, product.estimated_audience === null ? null : Math.round(product.estimated_audience),
          product.unit_cost, JSON.stringify(product.details || {}), importedAt,
        ]
      );
    }
  }
  await db.query(
    "INSERT INTO catalog_import_runs (id, imported_at, source_path, media_count, product_count, orphan_product_count) VALUES ($1,$2,$3,$4,$5,0)",
    [uuidv4(), importedAt, "fixture", catalog.length, catalog.reduce((n, m) => n + m.products.length, 0)]
  );
}

const FIXTURES = path.join(__dirname, "../fixtures");
const readFixture = (relative) => fs.readFileSync(path.join(FIXTURES, relative));
const readJsonFixture = (relative) => JSON.parse(readFixture(relative).toString("utf8"));

module.exports = { createUser, createDatabase, startServer, loadCatalogFixture, readFixture, readJsonFixture, SRC };
