// Tabla `proveedores` (catálogo propio de Adquisiciones, mismo patrón que proveedores.service.js
// del módulo Inventario, pero sobre su propia BD).
async function list(db, { limit = 100, offset = 0, searchQuery = "" } = {}) {
  let query = "SELECT * FROM proveedores";
  const params = [];
  let paramIndex = 1;

  if (searchQuery) {
    query += ` WHERE razon_social ILIKE $${paramIndex++} OR nit ILIKE $${paramIndex++}`;
    params.push(`%${searchQuery}%`, `%${searchQuery}%`);
  }

  query += ` ORDER BY razon_social ASC LIMIT $${paramIndex++}`;
  params.push(limit);
  query += ` OFFSET $${paramIndex++}`;
  params.push(offset);

  const { rows } = await db.query(query, params);
  return rows;
}

async function findById(db, id) {
  const { rows } = await db.query("SELECT * FROM proveedores WHERE id_proveedor = $1", [id]);
  return rows[0];
}

/** Razón social del proveedor, o undefined si no existe. */
async function findRazonSocial(db, id) {
  const { rows } = await db.query("SELECT razon_social FROM proveedores WHERE id_proveedor = $1", [id]);
  return rows[0]?.razon_social;
}

async function insert(db, { razon_social, nit, constancia_rtu_vigente, email_contacto, telefono }) {
  const { rows } = await db.query(
    `INSERT INTO proveedores (razon_social, nit, constancia_rtu_vigente, email_contacto, telefono)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [razon_social, nit, constancia_rtu_vigente || false, email_contacto || null, telefono || null]
  );
  return rows[0];
}

/** Actualiza solo los campos recibidos (los demás conservan su valor). */
async function update(db, id, { razon_social, nit, constancia_rtu_vigente, email_contacto, telefono, activo }) {
  const { rows } = await db.query(
    `UPDATE proveedores SET
       razon_social = COALESCE($1, razon_social),
       nit = COALESCE($2, nit),
       constancia_rtu_vigente = COALESCE($3, constancia_rtu_vigente),
       email_contacto = COALESCE($4, email_contacto),
       telefono = COALESCE($5, telefono),
       activo = COALESCE($6, activo)
     WHERE id_proveedor = $7 RETURNING *`,
    [razon_social, nit, constancia_rtu_vigente, email_contacto, telefono, activo, id]
  );
  return rows[0];
}

module.exports = { list, findById, findRazonSocial, insert, update };
