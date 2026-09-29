const db = require("../config/db-core-humanis");
const { calcularEstadoVigencia } = require("../services/traffic-light.service");
const { buildAlertLinks, buildAlertCollectionLinks } = require("../utils/hateoas.helper");

exports.getAlertasVencimientos = async (req, res) => {
  try {
    const alertas = [];

    // 1. Alertas de documentos (Finiquito CGC, etc.) consultadas desde PostgreSQL
    const docQuery = `
      SELECT 
        d.id,
        d.persona_id,
        d.numero_documento,
        d.fecha_vencimiento,
        td.codigo AS tipo_codigo,
        td.nombre AS tipo_nombre,
        p.primer_nombre,
        p.primer_apellido,
        p.cui_dpi,
        rp.codigo AS renglon_codigo
      FROM expediente_documentos d
      JOIN tipos_documento td ON d.tipo_documento_id = td.id
      JOIN personas p ON d.persona_id = p.id
      LEFT JOIN relaciones_laborales rl ON rl.persona_id = p.id AND rl.es_contrato_actual = true
      LEFT JOIN renglones_presupuestarios rp ON rl.renglon_id = rp.id
      WHERE d.fecha_vencimiento IS NOT NULL AND p.activo = true
    `;
    const docRes = await db.query(docQuery);

    (docRes.rows || []).forEach((row) => {
      const calc = calcularEstadoVigencia(row.fecha_vencimiento);
      if (calc.estado === "VENCIDO" || calc.estado === "POR_VENCER") {
        const nombreColaborador = `${row.primer_nombre} ${row.primer_apellido}`;
        const alertaItem = {
          id: `alert-doc-${row.id}`,
          tipo: row.tipo_codigo === "DOC_FINIQ_CGC" ? "FINIQUITO_CGC" : "DOCUMENTO",
          titulo: `${row.tipo_nombre}: ${calc.label}`,
          colaborador_id: row.persona_id,
          colaborador_nombre: nombreColaborador,
          cui_dpi: row.cui_dpi,
          renglon: row.renglon_codigo || "011",
          numero_documento: row.numero_documento,
          fecha_vencimiento: row.fecha_vencimiento,
          dias_restantes: calc.diasRestantes,
          estado: calc.estado,
          color: calc.color,
          urgente: calc.estado === "VENCIDO" || (calc.diasRestantes !== null && calc.diasRestantes <= 15),
        };
        alertaItem._links = buildAlertLinks(alertaItem);
        alertas.push(alertaItem);
      }
    });

    // 2. Alertas de vencimiento de contratos temporales consultadas desde PostgreSQL
    const contractQuery = `
      SELECT 
        rl.id,
        rl.persona_id,
        rl.numero_acuerdo_contrato,
        rl.fecha_fin,
        rp.codigo AS renglon_codigo,
        p.primer_nombre,
        p.primer_apellido,
        p.cui_dpi
      FROM relaciones_laborales rl
      JOIN personas p ON rl.persona_id = p.id
      LEFT JOIN renglones_presupuestarios rp ON rl.renglon_id = rp.id
      WHERE rl.fecha_fin IS NOT NULL AND rl.estado = 'ACTIVO' AND p.activo = true
    `;
    const contractRes = await db.query(contractQuery);

    (contractRes.rows || []).forEach((row) => {
      const calc = calcularEstadoVigencia(row.fecha_fin, 45); // alerta a 45 días
      if (calc.estado === "VENCIDO" || calc.estado === "POR_VENCER") {
        const nombreColaborador = `${row.primer_nombre} ${row.primer_apellido}`;
        const alertaContrato = {
          id: `alert-cont-${row.id}`,
          tipo: "CONTRATO",
          titulo: `Vigencia de Contrato ${row.renglon_codigo}: ${calc.label}`,
          colaborador_id: row.persona_id,
          colaborador_nombre: nombreColaborador,
          cui_dpi: row.cui_dpi,
          renglon: row.renglon_codigo,
          numero_documento: row.numero_acuerdo_contrato,
          fecha_vencimiento: row.fecha_fin,
          dias_restantes: calc.diasRestantes,
          estado: calc.estado,
          color: calc.color,
          urgente: calc.estado === "VENCIDO" || (calc.diasRestantes !== null && calc.diasRestantes <= 15),
        };
        alertaContrato._links = buildAlertLinks(alertaContrato);
        alertas.push(alertaContrato);
      }
    });

    // Ordenar: urgentes y vencidos primero
    alertas.sort((a, b) => (a.dias_restantes ?? 999) - (b.dias_restantes ?? 999));

    res.json({
      success: true,
      total: alertas.length,
      vencidos_count: alertas.filter((a) => a.estado === "VENCIDO").length,
      por_vencer_count: alertas.filter((a) => a.estado === "POR_VENCER").length,
      data: alertas,
      _links: buildAlertCollectionLinks(),
    });
  } catch (error) {
    console.error("Error al obtener alertas desde PostgreSQL:", error);
    res.status(500).json({ success: false, message: "Error al consultar alertas en la base de datos" });
  }
};
