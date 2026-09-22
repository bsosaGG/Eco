const { mockData } = require("../config/mock-store");
const { calcularEstadoVigencia } = require("../services/traffic-light.service");
const { buildAlertLinks, buildAlertCollectionLinks } = require("../utils/hateoas.helper");

exports.getAlertasVencimientos = async (req, res) => {
  try {
    const alertas = [];

    mockData.personas.forEach((p) => {
      const nombreColaborador = `${p.primer_nombre} ${p.primer_apellido}`;

      // 1. Revisar documentos (Finiquito CGC, etc.)
      (p.documentos || []).forEach((doc) => {
        if (doc.fecha_vencimiento) {
          const calc = calcularEstadoVigencia(doc.fecha_vencimiento);
          if (calc.estado === "VENCIDO" || calc.estado === "POR_VENCER") {
            const alertaItem = {
              id: `alert-doc-${doc.id}`,
              tipo: doc.tipo_codigo === "DOC_FINIQ_CGC" ? "FINIQUITO_CGC" : "DOCUMENTO",
              titulo: `${doc.tipo_nombre}: ${calc.label}`,
              colaborador_id: p.id,
              colaborador_nombre: nombreColaborador,
              cui_dpi: p.cui_dpi,
              renglon: p.contrato_actual?.renglon_codigo || "011",
              numero_documento: doc.numero_documento,
              fecha_vencimiento: doc.fecha_vencimiento,
              dias_restantes: calc.diasRestantes,
              estado: calc.estado,
              color: calc.color,
              urgente: calc.estado === "VENCIDO" || (calc.diasRestantes !== null && calc.diasRestantes <= 15),
            };
            alertaItem._links = buildAlertLinks(alertaItem);
            alertas.push(alertaItem);
          }
        }
      });

      // 2. Revisar vencimiento de contratos temporales (022, 029, 189)
      const contrato = p.contrato_actual;
      if (contrato && contrato.fecha_fin) {
        const calc = calcularEstadoVigencia(contrato.fecha_fin, 45); // alerta a 45 días
        if (calc.estado === "VENCIDO" || calc.estado === "POR_VENCER") {
          const alertaContrato = {
            id: `alert-cont-${contrato.id}`,
            tipo: "CONTRATO",
            titulo: `Vigencia de Contrato ${contrato.renglon_codigo}: ${calc.label}`,
            colaborador_id: p.id,
            colaborador_nombre: nombreColaborador,
            cui_dpi: p.cui_dpi,
            renglon: contrato.renglon_codigo,
            numero_documento: contrato.numero_acuerdo_contrato,
            fecha_vencimiento: contrato.fecha_fin,
            dias_restantes: calc.diasRestantes,
            estado: calc.estado,
            color: calc.color,
            urgente: calc.estado === "VENCIDO" || (calc.diasRestantes !== null && calc.diasRestantes <= 15),
          };
          alertaContrato._links = buildAlertLinks(alertaContrato);
          alertas.push(alertaContrato);
        }
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
    console.error("Error al obtener alertas:", error);
    res.status(500).json({ success: false, message: "Error al consultar alertas" });
  }
};
