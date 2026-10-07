// Datos de la Solicitud de Compra (FOR-DG-UA-00-01) a partir del expediente. Es la entrada de la
// plantilla HTML (templates/adquisiciones/solicitud-compra-html.template.js); aquí no hay I/O.
const config = require("../../../config/adquisiciones.config");

const dividirLineas = (texto) =>
  (texto || "")
    .split("\n")
    .map((linea) => linea.trim())
    .filter((linea) => linea.length > 0);

/** Arma los datos que consume la plantilla. `expediente` es el detalle de getExpedienteDetalle(). */
function construirDatosSolicitudCompra(expediente) {
  const items = Array.isArray(expediente.items) ? expediente.items : [];

  return {
    codigo_formulario: expediente.codigo_formulario || config.templates.codigoFormulario,
    unidad_solicitante: expediente.unidad_solicitante || "",
    codigo_expediente: expediente.codigo_expediente || "",
    fecha_solicitud: expediente.fecha_creacion ? new Date(expediente.fecha_creacion).toLocaleDateString("es-GT") : "",
    tipo_compra: expediente.tipo_compra || "",
    tiene_anexo: !!expediente.tiene_anexo,
    justificacion: expediente.justificacion || "",
    firma1_nombre: expediente.usuario_solicitante_nombre || "",
    firma1_cargo: expediente.funcionario_responsable || "",
    firma2_nombre: expediente.firma2_usuario_nombre || "",
    firma2_cargo: expediente.firma2_cargo || "",
    items: items.map((item) => ({
      item_descripcion: item.descripcion || "",
      item_cantidad: item.cantidad || "",
      item_unidad: item.unidad_medida || "",
      item_codigo_insumo: item.codigo_insumo || "-",
      item_renglon: item.renglon_numero ? `${item.renglon_numero}` : "-",
    })),
    caracteristicasLineas: dividirLineas(expediente.anexo_caracteristicas_tecnicas),
    especificacionesLineas: dividirLineas(expediente.anexo_especificaciones_especiales),
  };
}

module.exports = { construirDatosSolicitudCompra };
