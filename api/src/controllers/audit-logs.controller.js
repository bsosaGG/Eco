const db = require("../config/db-core-humanis");
const { buildAuditCollectionLinks } = require("../utils/hateoas.helper");

exports.getLogs = async (req, res) => {
  try {
    const { usuario, accion, tabla } = req.query;

    let sql = `
      SELECT 
        al.id,
        COALESCE(u.username, 'sistema') AS usuario,
        al.accion,
        al.tabla_afectada,
        al.registro_id,
        al.valores_anteriores,
        al.valores_nuevos,
        al.ip_address,
        al.user_agent,
        al.detalles,
        al.created_at
      FROM auditoria_logs al
      LEFT JOIN usuarios u ON al.usuario_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (usuario) {
      sql += ` AND (u.username ILIKE $${idx} OR al.detalles ILIKE $${idx})`;
      params.push(`%${usuario}%`);
      idx++;
    }
    if (accion) {
      sql += ` AND al.accion = $${idx}`;
      params.push(accion);
      idx++;
    }
    if (tabla) {
      sql += ` AND al.tabla_afectada = $${idx}`;
      params.push(tabla);
      idx++;
    }

    sql += ` ORDER BY al.created_at DESC LIMIT 50`;

    const result = await db.query(sql, params);
    const items = result.rows || [];

    const itemsWithLinks = items.map((l) => ({
      ...l,
      _links: {
        self: {
          href: `/api/v1/core-humanis/audit-logs?tabla=${encodeURIComponent(l.tabla_afectada || "")}`,
          method: "GET",
        },
      },
    }));

    res.json({
      success: true,
      total: itemsWithLinks.length,
      data: itemsWithLinks,
      _links: buildAuditCollectionLinks(),
    });
  } catch (error) {
    console.error("Error al consultar bitácora de auditoría en PostgreSQL:", error);
    res.status(500).json({ success: false, message: "Error al consultar bitácora de auditoría" });
  }
};
