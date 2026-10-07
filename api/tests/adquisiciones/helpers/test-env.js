// Arnés de pruebas del módulo Adquisiciones (SICOMPRAS).
//
// - BD del módulo: PostgreSQL en memoria (PGlite) creada con el init_adquisiciones.sql REAL del
//   proyecto (database/init_adquisiciones.sql); se prueba el mismo DDL que corre en producción.
// - BD de usuarios: PGlite con el mínimo de tablas de db_global_users que usan el middleware de
//   autenticación y el módulo (usuarios, perfiles, permisos).
// - Autenticación: middleware REAL del core (verifyToken/checkPermission).
// - Archivos: carpeta temporal (también es el directorio de trabajo, por si algún módulo escribe
//   con rutas relativas).
//
// IMPORTANTE: este archivo debe cargarse antes que cualquier módulo de src/.
const fs = require("fs");
const os = require("os");
const path = require("path");

const SRC = path.resolve(__dirname, "../../../src");
const INIT_SQL = path.resolve(__dirname, "../../../../database/init_adquisiciones.sql");

process.env.JWT_SECRET_KEY_SCSCR = "secreto-de-pruebas";
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "adquisiciones-test-"));
process.env.ADQUISICIONES_STORAGE_PATH = path.join(TMP, "uploads");
process.chdir(TMP);
// Correo: el del core (nodemailer/Gmail) se sustituye por uno que solo registra lo que se enviaría.
// Está "configurado" (MAIL_HOST) para que los avisos lleguen a la cola.
process.env.MAIL_HOST = "smtp.prueba.test";
process.env.ADQUISICIONES_APP_URL = "https://sicompras.test/adquisiciones";
const sentEmails = [];
const emailPath = require.resolve(path.join(SRC, "services", "email.service"));
require.cache[emailPath] = {
  id: emailPath,
  filename: emailPath,
  loaded: true,
  exports: {
    sendEmail: async (to, subject, htmlBody, textBody) => {
      if (global.__fallarCorreo) throw new Error("SMTP caído");
      sentEmails.push({ to, subject, htmlBody, textBody });
    },
  },
};

const jwt = require("jsonwebtoken");
const { PGlite } = require("@electric-sql/pglite");
const express = require("express");

const wrap = (runner) => ({
  query: async (text, params) => {
    const result = await runner.query(text, params);
    return { rows: result.rows, rowCount: result.affectedRows ?? result.rows.length };
  },
});

let usersPg = null;

/** Crea la BD de usuarios en memoria y la conecta al core (db-users). */
async function createUsersDatabase() {
  usersPg = new PGlite();
  await usersPg.exec(`
    CREATE TABLE usuarios (id_usuario SERIAL PRIMARY KEY, email TEXT, nombre_completo TEXT, rol TEXT DEFAULT 'usuario', activo BOOLEAN DEFAULT TRUE);
    CREATE TABLE perfiles (id_perfil SERIAL PRIMARY KEY, nombre_perfil TEXT UNIQUE);
    CREATE TABLE usuario_perfiles (id_usuario INT, id_perfil INT);
    CREATE TABLE permisos (id_permiso SERIAL PRIMARY KEY, clave_permiso TEXT UNIQUE);
    CREATE TABLE usuario_permisos (id_usuario INT, id_permiso INT);
    CREATE TABLE perfil_permisos (id_perfil INT, id_permiso INT);
  `);
  const usersDbPath = require.resolve(path.join(SRC, "config", "db-users"));
  require.cache[usersDbPath] = {
    id: usersDbPath,
    filename: usersDbPath,
    loaded: true,
    exports: wrap(usersPg),
  };
  return usersPg;
}

/**
 * Registra un usuario de prueba en la BD de usuarios y devuelve { id, token }.
 * `perfiles`: nombres de perfil; `permisos`: claves de permiso asignadas directamente.
 */
async function createUser({ nombre, email, rol = "usuario", perfiles = [], permisos = [], activo = true }) {
  const { rows } = await usersPg.query(
    "INSERT INTO usuarios (email, nombre_completo, rol, activo) VALUES ($1, $2, $3, $4) RETURNING id_usuario",
    [email || `${nombre.toLowerCase().replace(/\s+/g, ".")}@scspr.test`, nombre, rol, activo]
  );
  const id = rows[0].id_usuario;
  for (const perfil of perfiles) {
    const p = await usersPg.query(
      "INSERT INTO perfiles (nombre_perfil) VALUES ($1) ON CONFLICT (nombre_perfil) DO UPDATE SET nombre_perfil = EXCLUDED.nombre_perfil RETURNING id_perfil",
      [perfil]
    );
    await usersPg.query("INSERT INTO usuario_perfiles (id_usuario, id_perfil) VALUES ($1, $2)", [id, p.rows[0].id_perfil]);
  }
  for (const clave of permisos) {
    const p = await usersPg.query(
      "INSERT INTO permisos (clave_permiso) VALUES ($1) ON CONFLICT (clave_permiso) DO UPDATE SET clave_permiso = EXCLUDED.clave_permiso RETURNING id_permiso",
      [clave]
    );
    await usersPg.query("INSERT INTO usuario_permisos (id_usuario, id_permiso) VALUES ($1, $2)", [id, p.rows[0].id_permiso]);
  }
  // Igual que el login real, el token lleva los permisos del usuario.
  const token = jwt.sign(
    { userId: id, email: `u${id}@scspr.test`, role: rol, name: nombre, permissions: permisos },
    process.env.JWT_SECRET_KEY_SCSCR,
    { expiresIn: "1h" }
  );
  return { id, token };
}

/** Crea la BD del módulo en memoria con el esquema oficial y la conecta al API. */
async function createDatabase() {
  const pg = new PGlite();
  await pg.exec(fs.readFileSync(INIT_SQL, "utf8"));

  const adapter = { ...wrap(pg), transaction: (work) => pg.transaction((tx) => work(wrap(tx))) };

  const { adquisicionesDb } = require(path.join(SRC, "config", "db-adquisiciones"));
  adquisicionesDb.useAdapter(adapter);
  return { pg, db: adapter };
}

/** Levanta el router del módulo en un puerto efímero, con el errorHandler real del core. */
async function startServer() {
  const router = require(path.join(SRC, "routes", "adquisiciones.routes"));
  const errorHandler = require(path.join(SRC, "middleware", "errorHandler"));
  const app = express();
  app.use("/api/adquisiciones", express.json({ limit: "5mb" }));
  app.use("/api/adquisiciones", router);
  app.use(errorHandler);

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });
  const base = `http://127.0.0.1:${server.address().port}/api/adquisiciones`;

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

module.exports = { createUsersDatabase, createUser, createDatabase, startServer, sentEmails, SRC, TMP };
