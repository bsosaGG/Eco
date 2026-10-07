// Pruebas de las reglas puras del módulo Adquisiciones (sin BD ni HTTP).
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const DOMAIN = path.resolve(__dirname, "../../src/services/adquisiciones/domain");
const load = (name) => require(path.join(DOMAIN, name));

describe("numeración oficial", () => {
  const { DOCUMENTO, numeroAnual, prefijoAnual, codigoExpediente, patronExpedientesDelAnio } = load("numeracion");

  it("cada documento lleva su prefijo y el correlativo con cuatro dígitos", () => {
    assert.equal(numeroAnual(DOCUMENTO.CDP, 2026, 1), "CDP-2026-0001");
    assert.equal(numeroAnual(DOCUMENTO.ORDEN_COMPRA, 2026, 12), "OC-2026-0012");
    assert.equal(numeroAnual(DOCUMENTO.COMPROMISO, 2027, 345), "COMP-2027-0345");
    assert.equal(numeroAnual(DOCUMENTO.DEVENGADO, 2026, 12345), "DEV-2026-12345");
    assert.equal(prefijoAnual(DOCUMENTO.ORDEN_COMPRA, 2026), "OC-2026-");
  });

  it("el código del expediente es ABREVIATURA-CORRELATIVO-AÑO sin relleno de ceros", () => {
    assert.equal(codigoExpediente("UA", 1, 2026), "UA-1-2026");
    assert.equal(codigoExpediente("DPL", 27, 2026), "DPL-27-2026");
    assert.equal(patronExpedientesDelAnio("UA", 2026), "UA-%-2026");
  });
});

describe("montos", () => {
  const { quetzales } = load("montos");

  it("da formato de quetzales con dos decimales a números y a texto de la BD", () => {
    assert.equal(quetzales(9000), "Q9000.00");
    assert.equal(quetzales("8800.5"), "Q8800.50");
    assert.equal(quetzales("1234"), "Q1234.00");
  });
});

describe("perfiles y estados", () => {
  it("el módulo reconoce los 12 perfiles oficiales", () => {
    const { PERFILES_MODULO } = load("perfiles-modulo");
    assert.equal(PERFILES_MODULO.length, 12);
    assert.ok(PERFILES_MODULO.includes("Analista de Adquisiciones"));
    assert.equal(new Set(PERFILES_MODULO).size, 12);
  });
});

describe("firma electrónica provisional", () => {
  it("es un hash SHA-256 en hexadecimal", () => {
    const { generarFirmaHash } = load("firma");
    assert.match(generarFirmaHash("cdp:1:aprobar:7"), /^[0-9a-f]{64}$/);
  });
});

describe("nombres de personas en el expediente", () => {
  const { idsDeActores, anexarNombresDeActores } = load("expediente-actores");

  const expediente = () => ({
    usuario_solicitante_id: 1,
    firma2_usuario_id: null,
    cdp: { elaborado_por_usuario_id: 2, aprobado_presupuesto_usuario_id: null, vobo_udaf_usuario_id: 3 },
    orden_compra: null,
    recepcion: { tecnico_receptor_usuario_id: 2, custodio_almacen_usuario_id: null },
    documentos_soporte: [{ subido_por_usuario_id: 4 }, { subido_por_usuario_id: 1 }],
    compromiso: null,
    devengado: { registrado_por_usuario_id: 5 },
    solicitud_pago: null,
  });

  it("junta una sola vez los ids de todas las personas del trámite", () => {
    assert.deepEqual(idsDeActores(expediente()).sort(), [1, 2, 3, 4, 5]);
  });

  it("escribe el nombre junto a cada id; sin id deja null y sin usuario en la BD usa «Usuario #id»", () => {
    const resultado = anexarNombresDeActores(expediente(), { 1: "Ana", 2: "Beto", 3: "Carla", 4: "Dani" });
    assert.equal(resultado.usuario_solicitante_nombre, "Ana");
    assert.equal(resultado.firma2_usuario_nombre, null);
    assert.equal(resultado.cdp.elaborado_por_nombre, "Beto");
    assert.equal(resultado.cdp.aprobado_presupuesto_nombre, null);
    assert.equal(resultado.cdp.vobo_udaf_nombre, "Carla");
    assert.equal(resultado.recepcion.tecnico_receptor_nombre, "Beto");
    assert.equal(resultado.recepcion.custodio_almacen_nombre, null);
    assert.equal(resultado.documentos_soporte[0].subido_por_nombre, "Dani");
    assert.equal(resultado.devengado.registrado_por_nombre, "Usuario #5");
    assert.equal(resultado.orden_compra, null);
  });
});

describe("insumos MAGA/SIGES", () => {
  const { parsearInsumos, quitarEtiquetas } = load("insumos-maga");

  const fila = (...celdas) => `<tr>${celdas.map((c) => `<td>${c}</td>`).join("")}</tr>`;

  it("quita etiquetas y decodifica entidades HTML", () => {
    assert.equal(quitarEtiquetas("<b>Tinta&nbsp;&amp; papel</b> &#65;&middot;"), "Tinta & papel A·");
  });

  it("separa cantidad y unidad y descarta filas incompletas o sin insumo", () => {
    const html = `<table><tbody>
      ${fila("121", "12345", "<b>Papel bond</b>", "Carta", "Resma", "1,500 Unidad", "P-1")}
      ${fila("122", "2", "", "x", "y", "1 z", "c")}
      ${fila("1", "2")}
    </tbody></table>`;
    const insumos = parsearInsumos(html);
    assert.equal(insumos.length, 1);
    assert.deepEqual(insumos[0], {
      renglon: "121",
      codigo_insumo: "12345",
      insumo: "Papel bond",
      caracteristicas: "Carta",
      presentacion: "Resma",
      cantidad_y_unidad: "1,500 Unidad",
      cantidad: "1500",
      unidad_medida: "Unidad",
      codigo_presentacion: "P-1",
    });
  });

  it("una cantidad sin número se deja como unidad y devuelve [] si no hay tabla", () => {
    const [insumo] = parsearInsumos(`<tbody>${fila("1", "2", "Cable", "", "Rollo", "Metro", "c")}</tbody>`);
    assert.equal(insumo.cantidad, "");
    assert.equal(insumo.unidad_medida, "Metro");
    assert.deepEqual(parsearInsumos("<html>sin tabla</html>"), []);
  });
});

describe("datos de la Solicitud de Compra (PDF)", () => {
  const { construirDatosSolicitudCompra } = load("solicitud-compra");

  it("arma los datos de la plantilla con valores por defecto y las líneas del anexo", () => {
    const datos = construirDatosSolicitudCompra({
      codigo_expediente: "UA-1-2026",
      unidad_solicitante: "Unidad Administrativa",
      tipo_compra: "Suministros",
      tiene_anexo: 1,
      justificacion: "Abastecimiento",
      usuario_solicitante_nombre: "Ana",
      funcionario_responsable: "Directora",
      anexo_caracteristicas_tecnicas: " Papel carta \n\n Gramaje 75\n",
      anexo_especificaciones_especiales: null,
      items: [
        { descripcion: "Resma", cantidad: 5, unidad_medida: "Resma", codigo_insumo: null, renglon_numero: 121 },
        { descripcion: "Lapicero", cantidad: 10, unidad_medida: "Unidad", renglon_numero: null },
      ],
    });
    assert.equal(datos.codigo_formulario, "FOR-DG-UA-00-01");
    assert.equal(datos.tiene_anexo, true);
    assert.equal(datos.fecha_solicitud, "");
    assert.equal(datos.firma2_nombre, "");
    assert.deepEqual(datos.caracteristicasLineas, ["Papel carta", "Gramaje 75"]);
    assert.deepEqual(datos.especificacionesLineas, []);
    assert.deepEqual(datos.items[0], {
      item_descripcion: "Resma",
      item_cantidad: 5,
      item_unidad: "Resma",
      item_codigo_insumo: "-",
      item_renglon: "121",
    });
    assert.equal(datos.items[1].item_renglon, "-");
  });
});

describe("avisos del trámite", () => {
  const { planificarNotificaciones, redactarCorreo, EVENTO } = load("notificaciones");
  const expediente = { codigo_expediente: "UA-1-2026", objeto_compra: "Papelería", solicitanteId: 10, responsableId: 20 };

  it("un cambio de estado avisa al solicitante y al responsable, sin repetir y sin avisar a quien actúa", () => {
    const ids = (actorId, exp = expediente) =>
      planificarNotificaciones({ evento: EVENTO.CAMBIO_ESTADO, expediente: exp, actorId, estado: "En firma CDP" }).map((a) => a.idUsuario);
    assert.deepEqual(ids(99), [10, 20]);
    assert.deepEqual(ids(20), [10]);
    assert.deepEqual(ids(10), [20]);
    assert.deepEqual(ids(99, { ...expediente, responsableId: 10 }), [10], "misma persona: un solo aviso");
    assert.deepEqual(ids(99, { ...expediente, responsableId: null }), [10], "sin responsable asignado todavía");
  });

  it("al asignar, la persona asignada recibe el aviso de asignación y el solicitante el de etapa", () => {
    const avisos = planificarNotificaciones({
      evento: EVENTO.ASIGNACION, expediente: { ...expediente, responsableId: 20 }, actorId: 99,
      estado: "Pendiente Cotización", idAsignado: 20, nombreAsignado: "Beto",
    });
    assert.deepEqual(avisos.map((a) => [a.idUsuario, a.tipo]), [[20, "asignacion"], [10, "cambio_etapa"]]);
    assert.match(avisos[0].titulo, /Se te asignó el expediente UA-1-2026/);
    assert.match(avisos[1].titulo, /asignado a Beto/);
  });

  it("si el solicitante es quien queda asignado, recibe solo el aviso de asignación", () => {
    const avisos = planificarNotificaciones({
      evento: EVENTO.ASIGNACION, expediente, actorId: 99, estado: "x", idAsignado: 10, nombreAsignado: "Sol",
    });
    assert.deepEqual(avisos.map((a) => [a.idUsuario, a.tipo]), [[10, "asignacion"]]);
  });

  it("una devolución incluye el motivo y el título nunca pasa de 250 caracteres", () => {
    const [aviso] = planificarNotificaciones({ evento: EVENTO.DEVOLUCION, expediente, actorId: 99, motivo: "Falta anexo" });
    assert.equal(aviso.tipo, "devolucion");
    assert.match(aviso.mensaje, /Motivo: Falta anexo/);
    const largo = planificarNotificaciones({
      evento: EVENTO.CAMBIO_ESTADO, expediente, actorId: 99, estado: "E".repeat(400),
    })[0];
    assert.equal(largo.titulo.length, 250);
  });

  it("el correo escapa el HTML y solo lleva enlace si se conoce la dirección", () => {
    const sin = redactarCorreo({ titulo: "UA-1 <b>", mensaje: "a & b", codigoExpediente: "UA-1" });
    assert.equal(sin.asunto, "[SICOMPRAS] UA-1 <b>");
    assert.match(sin.html, /UA-1 &lt;b&gt;/);
    assert.match(sin.html, /a &amp; b/);
    assert.ok(!sin.html.includes("<a href"));
    const con = redactarCorreo({ titulo: "t", mensaje: "m", codigoExpediente: "UA-1", urlExpediente: "https://x.test/e/1?a=1&b=2" });
    assert.match(con.html, /<a href="https:\/\/x.test\/e\/1\?a=1&amp;b=2">Ver el expediente UA-1<\/a>/);
    assert.match(con.texto, /Ver el expediente: https:\/\/x.test\/e\/1/);
  });
});

describe("visibilidad de expedientes", () => {
  const { puedeVerTodos, PERMISOS_DE_GESTION } = load("visibilidad");

  it("quien solo lee y crea ve lo suyo; cualquier permiso de gestión o el admin ven todo", () => {
    assert.equal(puedeVerTodos({ role: "usuario", permissions: ["adquisiciones:read", "adquisiciones:create"] }), false);
    assert.equal(puedeVerTodos({ role: "usuario", permissions: [] }), false);
    assert.equal(puedeVerTodos({ role: "usuario" }), false);
    assert.equal(puedeVerTodos(null), false);
    assert.equal(puedeVerTodos({ role: "admin" }), true);
    for (const permiso of PERMISOS_DE_GESTION) {
      assert.equal(puedeVerTodos({ role: "usuario", permissions: ["adquisiciones:read", permiso] }), true, permiso);
    }
  });

  it("la lista de gestión cubre todos los permisos del módulo salvo read y create", () => {
    const rutas = require("fs").readFileSync(path.resolve(__dirname, "../../src/routes/adquisiciones.routes.js"), "utf8");
    const usados = [...new Set([...rutas.matchAll(/checkPermission\("(adquisiciones:[a-z-]+)"\)/g)].map((m) => m[1]))];
    const esperados = usados.filter((p) => !["adquisiciones:read", "adquisiciones:create"].includes(p)).sort();
    assert.deepEqual([...PERMISOS_DE_GESTION].sort(), esperados);
  });
});

describe("historial de estados", () => {
  const { conSalidas } = load("historial-estados");

  it("cada entrada termina cuando empieza la siguiente y solo la última queda vigente", () => {
    const resultado = conSalidas([
      { estado: "A", fecha_entrada: "2026-10-01T10:00:00Z" },
      { estado: "B", fecha_entrada: "2026-10-03T10:00:00Z" },
      { estado: "C", fecha_entrada: "2026-10-04T08:00:00Z" },
    ]);
    assert.deepEqual(resultado.map((e) => [e.estado, e.fecha_salida, e.actual]), [
      ["A", "2026-10-03T10:00:00Z", false],
      ["B", "2026-10-04T08:00:00Z", false],
      ["C", null, true],
    ]);
  });

  it("sin historial devuelve una lista vacía", () => {
    assert.deepEqual(conSalidas(null), []);
    assert.deepEqual(conSalidas([]), []);
  });
});
