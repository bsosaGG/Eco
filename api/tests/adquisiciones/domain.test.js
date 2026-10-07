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
  const { planificarMovimiento, planificarDevolucion } = load("notificaciones");
  const expediente = { codigo_expediente: "UA-1-2026", objeto_compra: "Papelería", solicitanteId: 10, responsableId: 20 };
  const paso = { tipo: "pendiente", titulo: "Elaborar el CDP", perfil: "Asistente de Presupuesto" };

  it("a quien corresponde el paso se le avisa que está pendiente de su atención y al solicitante que cambió de etapa, indicando el responsable", () => {
    const avisos = planificarMovimiento({
      expediente, estado: "En firma CDP", estadoAnterior: "Pendiente Cotización", paso, nuevoResponsable: { id: 30, nombre: "Pía Presupuesto" },
    });
    assert.deepEqual(avisos.map((a) => [a.idUsuario, a.tipo, a.evento]), [[30, "asignacion", "asignacion"], [10, "cambio_etapa", "cambio_estado"]]);
    assert.equal(avisos[0].titulo, "Pendiente de su atención: Elaborar el CDP (UA-1-2026)");
    assert.equal(avisos[1].titulo, "UA-1-2026 avanzó a «En firma CDP»");
    assert.match(avisos[1].mensaje, /Pasó de «Pendiente Cotización» a «En firma CDP»\. Responsable del siguiente paso: Pía Presupuesto\./);
  });

  it("si el estado no cambió solo se avisa a quien recibe el expediente; si nadie lo recibe, solo al solicitante", () => {
    const soloResponsable = planificarMovimiento({ expediente, estado: "En firma CDP", paso, nuevoResponsable: { id: 30, nombre: "Pía" } });
    assert.deepEqual(soloResponsable.map((a) => a.idUsuario), [30]);
    const soloSolicitante = planificarMovimiento({ expediente, estado: "En firma CDP", estadoAnterior: "Pendiente Cotización", paso, nuevoResponsable: undefined });
    assert.deepEqual(soloSolicitante.map((a) => a.idUsuario), [10]);
    assert.ok(!soloSolicitante[0].mensaje.includes("Responsable del siguiente paso"));
    assert.deepEqual(planificarMovimiento({ expediente, estado: "x", paso }), []);
  });

  it("si quien recibe el expediente es el solicitante, recibe un solo aviso (el de «pendiente de su atención»)", () => {
    const avisos = planificarMovimiento({ expediente, estado: "Devuelto con Observaciones", estadoAnterior: "x", paso, nuevoResponsable: { id: 10, nombre: "Sol" } });
    assert.deepEqual(avisos.map((a) => [a.idUsuario, a.tipo]), [[10, "asignacion"]]);
  });

  it("una devolución avisa al solicitante y a quien tenía el expediente, con el motivo, y el título nunca pasa de 250 caracteres", () => {
    const avisos = planificarDevolucion({ expediente, motivo: "Falta anexo" });
    assert.deepEqual(avisos.map((a) => [a.idUsuario, a.tipo, a.evento]), [[10, "devolucion", "devolucion"], [20, "devolucion", "devolucion"]]);
    assert.match(avisos[0].mensaje, /Motivo: Falta anexo/);
    const largo = planificarMovimiento({ expediente, estado: "E".repeat(400), estadoAnterior: "x", paso, nuevoResponsable: undefined })[0];
    assert.equal(largo.titulo.length, 250);
  });
});

describe("siguiente paso y a qué perfil le toca", () => {
  const { siguientePaso, situacionDesdeDetalle, PERFIL } = load("siguiente-paso");
  const c = (estado, extra = {}) => siguientePaso({ estado, ...extra });

  it("cada estado, y lo que ya existe en el trámite, indican qué falta y a quién le toca", () => {
    assert.deepEqual(
      [
        c("Recibida por Adquisiciones"), c("Pendiente Cotización"), c("En firma CDP"), c("En firma CDP", { cdp_estado: "Borrador" }),
        c("En firma CDP", { cdp_estado: "Aprobado Técnicamente" }), c("Revisión Jurídica"), c("Aprobación Jefatura"),
        c("Pendiente Autorización Final"),
      ].map((p) => [p.titulo, p.perfil]),
      [
        ["Recibir la solicitud y turnarla a un analista", PERFIL.JEFE_ADQUISICIONES],
        ["Registrar las cotizaciones y adjudicar una", PERFIL.ANALISTA],
        ["Elaborar el CDP", PERFIL.ASISTENTE_PRESUPUESTO],
        ["Aprobar técnicamente el CDP", PERFIL.ENCARGADO_PRESUPUESTO],
        ["Dar el Vo.Bo. financiero del CDP", PERFIL.JEFE_UDAF],
        ["Elaborar la Orden de Compra", PERFIL.ANALISTA],
        ["Aprobar la Orden de Compra", PERFIL.JEFE_ADQUISICIONES],
        ["Autorizar la Orden de Compra", PERFIL.DIRECTORA_GENERAL],
      ]
    );
    assert.equal(c("Recibida por Adquisiciones").accion, "turnar");
  });

  it("conformación y fase financiera avanzan según lo que ya se hizo", () => {
    const f = (estado, extra) => c(estado, extra).titulo + " | " + c(estado, extra).perfil;
    assert.equal(f("Expediente en Conformación", {}), "Registrar la recepción del bien o servicio | " + PERFIL.ANALISTA);
    assert.match(f("Expediente en Conformación", { tiene_recepcion: true, recepcion_conforme: false }), /^Resolver las observaciones/);
    assert.match(f("Expediente en Conformación", { tiene_recepcion: true, recepcion_conforme: true, documentos: 0 }), /^Adjuntar los documentos/);
    assert.match(f("Expediente en Conformación", { tiene_recepcion: true, recepcion_conforme: true, documentos: 2 }), /^Trasladar el expediente a Contabilidad/);
    assert.equal(f("Fase Financiera / Liquidación", {}), "Registrar el compromiso presupuestario | " + PERFIL.ENCARGADO_PRESUPUESTO);
    assert.equal(f("Fase Financiera / Liquidación", { tiene_compromiso: true }), "Registrar el devengado | " + PERFIL.ENCARGADO_CONTABILIDAD);
    assert.equal(f("Fase Financiera / Liquidación", { tiene_compromiso: true, tiene_devengado: true }), "Trasladar la solicitud de pago | " + PERFIL.ENCARGADO_CONTABILIDAD);
    assert.equal(f("Fase Financiera / Liquidación", { tiene_compromiso: true, tiene_devengado: true, solicitud_pago_estado: "Pendiente" }), "Autorizar el pago | " + PERFIL.SUB_DESPACHO);
  });

  it("devuelto le toca al solicitante (sin perfil); cerrado y cancelado no tienen siguiente paso", () => {
    assert.deepEqual([c("Devuelto con Observaciones").tipo, c("Devuelto con Observaciones").perfil], ["devuelto", undefined]);
    assert.equal(c("Pagado y Archivado").tipo, "cerrado");
    assert.equal(c("Cancelado / Desierto").tipo, "cancelado");
    assert.equal(c("Estado raro"), null);
    assert.equal(siguientePaso(null), null);
  });

  it("la situación se arma a partir del detalle del expediente", () => {
    const situacion = situacionDesdeDetalle({
      estado: "Fase Financiera / Liquidación", cdp: { estado: "Aprobado" }, recepcion: { recibido_conforme: true },
      documentos_soporte: [{}, {}], compromiso: {}, devengado: null, solicitud_pago: null,
    });
    assert.deepEqual(situacion, {
      estado: "Fase Financiera / Liquidación", cdp_estado: "Aprobado", tiene_recepcion: true, recepcion_conforme: true, documentos: 2,
      tiene_compromiso: true, tiene_devengado: false, solicitud_pago_estado: null,
    });
    assert.equal(siguientePaso(situacion).titulo, "Registrar el devengado");
  });
});

describe("visibilidad de expedientes", () => {
  const { puedeVerReportes, veTodosLosExpedientes, puedeVerExpediente, PERMISOS_DE_GESTION, PERMISOS_DE_SUPERVISION } = load("visibilidad");

  it("reportes: quien solo lee y crea no los ve; cualquier permiso de gestión o el admin sí", () => {
    assert.equal(puedeVerReportes({ role: "usuario", permissions: ["adquisiciones:read", "adquisiciones:create"] }), false);
    assert.equal(puedeVerReportes({ role: "usuario", permissions: [] }), false);
    assert.equal(puedeVerReportes({ role: "usuario" }), false);
    assert.equal(puedeVerReportes(null), false);
    assert.equal(puedeVerReportes({ role: "admin" }), true);
    for (const permiso of PERMISOS_DE_GESTION) {
      assert.equal(puedeVerReportes({ role: "usuario", permissions: ["adquisiciones:read", permiso] }), true, permiso);
    }
  });

  it("expedientes: solo el admin y quien supervisa (auditoría, administración) ven todos", () => {
    assert.equal(veTodosLosExpedientes({ role: "admin" }), true);
    for (const permiso of PERMISOS_DE_SUPERVISION) {
      assert.equal(veTodosLosExpedientes({ role: "usuario", permissions: ["adquisiciones:read", permiso] }), true, permiso);
    }
    const operativos = PERMISOS_DE_GESTION.filter((p) => !PERMISOS_DE_SUPERVISION.includes(p));
    for (const permiso of operativos) {
      assert.equal(veTodosLosExpedientes({ role: "usuario", permissions: ["adquisiciones:read", permiso] }), false, permiso);
    }
    assert.equal(veTodosLosExpedientes(null), false);
  });

  it("ve el expediente quien lo emitió o a quien le toca; nadie más (salvo supervisión)", () => {
    const exp = { usuario_solicitante_id: 1, funcionario_responsable_id: 2 };
    assert.equal(puedeVerExpediente({ userId: 1, verTodo: false }, exp), true);
    assert.equal(puedeVerExpediente({ userId: 2, verTodo: false }, exp), true);
    assert.equal(puedeVerExpediente({ userId: 3, verTodo: false }, exp), false);
    assert.equal(puedeVerExpediente({ userId: 3, verTodo: true }, exp), true);
    assert.equal(puedeVerExpediente({ userId: 3, verTodo: false }, { usuario_solicitante_id: 1, funcionario_responsable_id: null }), false);
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

describe("plantilla del correo", () => {
  const { redactarCorreo, formatearDuracion, formatearFechaHora, formatearMonto } = load("plantilla-correo");

  const expediente = {
    codigo: "DPL-1-2026", objeto: "Compra de papelería & útiles", unidad: "Dirección de Producción y Logística",
    solicitante: "Sol Icitante", asignadoA: "Beto Asignado", estado: "En firma CDP", etapa: "CDP", color: "warning",
    tipoCompra: "Suministros", montoEstimado: "8800.00",
  };
  const detalle = {
    estadoAnterior: "Pendiente Cotización", colorAnterior: "primary", tiempoEnEstadoAnteriorMs: (3 * 24 + 4) * 3600 * 1000,
    realizadoPor: "Ana Analista", ocurrioEn: "2026-10-05T21:45:00Z",
  };
  const base = { tipo: "cambio_etapa", evento: "cambio_estado", rol: "solicitante", titulo: "DPL-1-2026 avanzó a «En firma CDP»", expediente, detalle, urlExpediente: "https://x.test/a/expedientes/7?x=1&y=2" };

  it("responde qué pasó, de qué estado a cuál, quién lo hizo, cuándo y sobre qué expediente", () => {
    const { asunto, html, texto } = redactarCorreo(base);
    assert.equal(asunto, "[SICOMPRAS] DPL-1-2026 avanzó a «En firma CDP»");
    for (const dato of [
      "Su solicitud avanzó de «Pendiente Cotización» a «En firma CDP».",
      "Pendiente Cotización", "En firma CDP", "Dirección de Producción y Logística", "Sol Icitante", "Beto Asignado",
      "Suministros", "Q 8,800.00", "Ana Analista", "5 de octubre de 2026", "3:45", "3 d 4 h", "CDP",
    ]) {
      assert.ok(html.includes(dato) || html.includes(dato.replace(/&/g, "&amp;")), `HTML sin «${dato}»`);
      assert.ok(texto.includes(dato), `texto sin «${dato}»`);
    }
    assert.match(texto, /Realizado por: Ana Analista/);
    assert.match(texto, /Fecha y hora: 5 de octubre de 2026, 3:45/);
  });

  it("escapa el HTML de los datos y pone el enlace en un botón", () => {
    const { html } = redactarCorreo({ ...base, expediente: { ...expediente, objeto: "<script>x</script> & más" } });
    assert.ok(!html.includes("<script>"));
    assert.match(html, /&lt;script&gt;x&lt;\/script&gt; &amp; más/);
    assert.match(html, /<a href="https:\/\/x.test\/a\/expedientes\/7\?x=1&amp;y=2"[^>]*>Ver el expediente DPL-1-2026<\/a>/);
  });

  it("sin dirección pública no hay botón, pero sí la indicación de entrar al sistema", () => {
    const { html, texto } = redactarCorreo({ ...base, urlExpediente: null });
    assert.ok(!html.includes("<a href"));
    assert.match(html, /Ingrese a SICOMPRAS/);
    assert.match(texto, /Ingrese a SICOMPRAS/);
  });

  it("al asignar, cada quien lee lo suyo", () => {
    const asignacion = { ...base, tipo: "asignacion", evento: "asignacion", titulo: "Se asignó el expediente DPL-1-2026", detalle: { ...detalle, estadoAnterior: undefined, asignadoA: "Beto Asignado" } };
    assert.match(redactarCorreo({ ...asignacion, rol: "asignado" }).texto, /Se le asignó este expediente para su gestión\./);
    const paraSolicitante = redactarCorreo({ ...asignacion, tipo: "cambio_etapa", rol: "solicitante" }).texto;
    assert.match(paraSolicitante, /Su solicitud fue asignada a Beto Asignado y se encuentra en «En firma CDP»\./);
    assert.ok(!paraSolicitante.includes("Tiempo en"));
  });

  it("quien recibe el paso lee «Pendiente de su atención: …» y el solicitante, quién es el responsable", () => {
    const paraAsignado = redactarCorreo({ ...base, tipo: "asignacion", evento: "asignacion", rol: "asignado", titulo: "Pendiente de su atención: Elaborar el CDP (DPL-1-2026)", detalle: { ...detalle, pasoTitulo: "Elaborar el CDP" } });
    assert.match(paraAsignado.texto, /^Pendiente de su atención: Elaborar el CDP \(DPL-1-2026\)\n\nPendiente de su atención: Elaborar el CDP\./);
    const paraSolicitante = redactarCorreo({ ...base, detalle: { ...detalle, responsableNombre: "Pía Presupuesto" } });
    assert.match(paraSolicitante.texto, /avanzó de «Pendiente Cotización» a «En firma CDP»\. Responsable del siguiente paso: Pía Presupuesto\./);
  });

  it("una devolución muestra el motivo destacado", () => {
    const { html, texto } = redactarCorreo({
      ...base, tipo: "devolucion", evento: "devolucion", rol: "asignado", titulo: "DPL-1-2026 fue devuelto con observaciones",
      detalle: { ...detalle, motivo: "Falta el anexo técnico" },
    });
    assert.match(html, /Motivo de la devolución/);
    assert.match(html, /Falta el anexo técnico/);
    assert.match(texto, /Motivo de la devolución: Falta el anexo técnico/);
    assert.match(texto, /El expediente a su cargo fue devuelto/);
  });

  it("las filas sin dato no aparecen", () => {
    const { texto } = redactarCorreo({ ...base, expediente: { ...expediente, montoEstimado: null, tipoCompra: null, asignadoA: "" }, detalle: { realizadoPor: "Ana", ocurrioEn: "2026-10-05T21:45:00Z" } });
    for (const etiqueta of ["Monto estimado", "Tipo de compra", "Responsable actual", "Tiempo en"]) assert.ok(!texto.includes(etiqueta), etiqueta);
    assert.match(texto, /Su solicitud avanzó a «En firma CDP»\./);
  });

  it("formatos de duración, fecha (hora de Guatemala) y monto", () => {
    assert.equal(formatearDuracion(20000), "menos de 1 min");
    assert.equal(formatearDuracion(35 * 60000), "35 min");
    assert.equal(formatearDuracion(5.5 * 3600000), "5 h 30 min");
    assert.equal(formatearDuracion(null), "");
    assert.match(formatearFechaHora("2026-10-05T21:45:00Z"), /^5 de octubre de 2026, 3:45/);
    assert.equal(formatearFechaHora("no es fecha"), "");
    assert.equal(formatearMonto("1234.5"), "Q 1,234.50");
    assert.equal(formatearMonto(null), "");
  });
});
