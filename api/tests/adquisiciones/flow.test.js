// Prueba de flujo completo del módulo Adquisiciones: HTTP -> Express -> servicios -> PostgreSQL en
// memoria (esquema oficial). Recorre CU-01 a CU-09 con el rol admin y compara cada respuesta
// (normalizada: fechas, años) contra la transcripción de referencia en fixtures/golden/flow.json.
//
// La transcripción se generó con la implementación monolítica anterior (un solo
// services/adquisiciones.service.js); mantenerla igual demuestra que la reorganización del código no cambió
// el contrato HTTP. Para regenerarla a propósito: UPDATE_GOLDEN=1 npm run test:adquisiciones
const env = require("./helpers/test-env"); // debe ir primero: prepara variables de entorno y BDs
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const GOLDEN = path.join(__dirname, "fixtures", "golden", "flow.json");
const YEAR = new Date().getFullYear();

/** Quita lo que cambia entre corridas (fechas y el año en los códigos) para poder comparar. */
function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, normalize(inner)]));
  }
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return "<fecha-hora>";
    // El nombre con que se guarda un archivo subido es aleatorio.
    return value.replace(/(documentos-soporte\/)[^/]+(\.\w+)$/, "$1<archivo>$2").split(String(YEAR)).join("<año>");
  }
  return value;
}

describe("Adquisiciones: flujo completo CU-01 a CU-09", () => {
  const transcript = {};
  let server;
  let pg;
  let admin;
  let analista;
  let jefe;
  let outsider;
  let lector;
  let sinPermisos;

  /** Guarda la respuesta normalizada. Los errores se reducen al mensaje (el código HTTP de los errores de negocio no es parte del contrato fijado). */
  const record = (name, res) => {
    let entry;
    if (res.status < 400) entry = { status: res.status, body: res.data };
    else if (res.data && Array.isArray(res.data.errors)) entry = { status: 400, validation: res.data.errors.map((e) => e.msg) };
    else if (res.status === 401 || res.status === 403) entry = { status: res.status, message: res.data && res.data.message };
    else entry = { status: "error", message: res.data && res.data.message };
    transcript[name] = normalize(entry);
    return res;
  };
  const call = async (name, method, url, options) => record(name, await server.request(method, url, options));

  before(async () => {
    await env.createUsersDatabase();
    ({ pg } = await env.createDatabase());
    server = await env.startServer();
    admin = await env.createUser({ nombre: "Admin Prueba", rol: "admin" });
    analista = await env.createUser({ nombre: "Ana Analista", perfiles: ["Analista de Adquisiciones"] });
    jefe = await env.createUser({ nombre: "Jorge Jefe", perfiles: ["Jefe de Adquisiciones"] });
    outsider = await env.createUser({ nombre: "Olga Externa" });
    lector = await env.createUser({ nombre: "Luis Lector", permisos: ["adquisiciones:read"] });
    sinPermisos = await env.createUser({ nombre: "Sin Permisos" });
  });

  after(async () => {
    await server.close();
  });

  it("seguridad: sin token, token inválido y permisos por acción", async () => {
    assert.equal((await server.request("GET", "/expedientes")).status, 403);
    assert.equal((await server.request("GET", "/expedientes", { token: "no-es-un-jwt" })).status, 401);
    await call("seguridad/sin-permiso-lectura", "GET", "/expedientes", { token: sinPermisos.token });
    await call("seguridad/lector-lee", "GET", "/expedientes", { token: lector.token });
    await call("seguridad/lector-no-crea", "POST", "/expedientes", { token: lector.token, json: {} });
    await call("seguridad/lector-no-ve-bitacora", "GET", "/expedientes/1/bitacora", { token: lector.token });
  });

  it("catálogos", async () => {
    const t = admin.token;
    const unidades = await call("catalogos/unidades", "GET", "/catalogos/unidades", { token: t });
    assert.ok(unidades.data.length > 0);
    const renglones = await call("catalogos/renglones", "GET", "/catalogos/renglones", { token: t });
    assert.ok(renglones.data.length > 0);
    await call("catalogos/partidas", "GET", "/catalogos/partidas", { token: t });
    await call("catalogos/estados", "GET", "/catalogos/estados", { token: t });
  });

  it("unidades solicitantes: listar, buscar, crear, actualizar", async () => {
    const t = admin.token;
    await call("unidades/listar", "GET", "/unidades", { token: t });
    await call("unidades/buscar", "GET", "/unidades?searchQuery=log%C3%ADstica", { token: t });
    await call("unidades/crear-invalido", "POST", "/unidades", { token: t, json: { nombre: "" } });
    const creada = await call("unidades/crear", "POST", "/unidades", { token: t, json: { nombre: "Unidad de Prueba", codigo_unidad: "ZZ9" } });
    assert.equal(creada.status, 201);
    await call("unidades/crear-duplicada", "POST", "/unidades", { token: t, json: { nombre: "Otra", codigo_unidad: "ZZ9" } });
    await call("unidades/actualizar", "PUT", `/unidades/${creada.data.id_unidad}`, { token: t, json: { nombre: "Unidad de Prueba 2", activo: false } });
    await call("unidades/actualizar-inexistente", "PUT", "/unidades/9999", { token: t, json: { nombre: "x" } });
    await call("unidades/actualizar-id-invalido", "PUT", "/unidades/abc", { token: t, json: { nombre: "x" } });
  });

  it("proveedores: CRUD y búsqueda", async () => {
    const t = admin.token;
    await call("proveedores/crear-invalido", "POST", "/proveedores", { token: t, json: { razon_social: "x" } });
    await call("proveedores/crear-1", "POST", "/proveedores", {
      token: t,
      json: { razon_social: "Papelera Central, S.A.", nit: "1234567-8", constancia_rtu_vigente: true, email_contacto: "ventas@papelera.test", telefono: "22223333" },
    });
    await call("proveedores/crear-2", "POST", "/proveedores", { token: t, json: { razon_social: "Oficina Total", nit: "7654321-0" } });
    await call("proveedores/crear-duplicado", "POST", "/proveedores", { token: t, json: { razon_social: "Otro", nit: "1234567-8" } });
    await call("proveedores/listar", "GET", "/proveedores", { token: t });
    await call("proveedores/buscar", "GET", "/proveedores?searchQuery=oficina&limit=10&offset=0", { token: t });
    await call("proveedores/por-id", "GET", "/proveedores/1", { token: t });
    await call("proveedores/por-id-inexistente", "GET", "/proveedores/999", { token: t });
    await call("proveedores/actualizar", "PUT", "/proveedores/2", { token: t, json: { telefono: "55556666", activo: false } });
    await call("proveedores/actualizar-inexistente", "PUT", "/proveedores/999", { token: t, json: { telefono: "1" } });
  });

  it("usuarios del módulo y firmantes por unidad", async () => {
    const t = admin.token;
    const usuarios = await call("usuarios/modulo", "GET", "/usuarios", { token: t });
    assert.ok(usuarios.data.some((u) => u.nombre_completo === "Ana Analista"));
    assert.ok(!usuarios.data.some((u) => u.nombre_completo === "Olga Externa"));

    await call("firmantes/vacio", "GET", "/catalogos/unidades/1/usuarios", { token: t });
    await call("firmantes/asignaciones-vacias", "GET", "/catalogos/unidades/1/asignaciones", { token: t });
    await call("firmantes/asignar-sin-usuario", "POST", "/catalogos/unidades/1/asignaciones", { token: t, json: {} });
    await call("firmantes/asignar-ajeno-al-modulo", "POST", "/catalogos/unidades/1/asignaciones", {
      token: t,
      json: { id_usuario: outsider.id, cargo: "Jefe" },
    });
    await call("firmantes/asignar", "POST", "/catalogos/unidades/1/asignaciones", {
      token: t,
      json: { id_usuario: jefe.id, cargo: "Jefe de Logística" },
    });
    await call("firmantes/reasignar-cambia-cargo", "POST", "/catalogos/unidades/1/asignaciones", {
      token: t,
      json: { id_usuario: jefe.id, cargo: "Director de Logística" },
    });
    await call("firmantes/por-unidad", "GET", "/catalogos/unidades/1/usuarios", { token: t });
    await call("firmantes/asignaciones", "GET", "/catalogos/unidades/1/asignaciones", { token: t });
    await call("firmantes/quitar", "DELETE", `/catalogos/unidades/1/asignaciones/${jefe.id}`, { token: t });
    await call("firmantes/quitar-inexistente", "DELETE", `/catalogos/unidades/1/asignaciones/${jefe.id + 100}`, { token: t });
    await call("firmantes/por-unidad-tras-quitar", "GET", "/catalogos/unidades/1/usuarios", { token: t });
    await call("firmantes/asignaciones-tras-quitar", "GET", "/catalogos/unidades/1/asignaciones", { token: t });
  });

  it("insumos MAGA: parseo del HTML público y tolerancia a fallos", async () => {
    const axios = require("axios");
    const original = axios.get;
    const html = `<html><table><tbody>
      <tr><td>121</td><td>12345</td><td><b>Papel bond</b></td><td>Carta &amp; blanco</td><td>Resma</td><td>1,500 Unidad</td><td>P-1</td></tr>
      <tr><td>122</td><td>1</td><td>Lapicero</td><td>Azul</td><td>Caja</td><td>12 Unidades</td><td>P-2</td></tr>
      <tr><td>1</td><td>2</td><td></td><td>x</td><td>y</td><td>1 z</td><td>c</td></tr>
      <tr><td>1</td><td>2</td></tr>
    </tbody></table></html>`;
    try {
      axios.get = async () => ({ status: 200, data: html });
      await call("maga/busqueda", "GET", "/insumos-maga?q=papel", { token: admin.token });
      await call("maga/consulta-muy-corta", "GET", "/insumos-maga?q=p", { token: admin.token });
      await call("maga/sin-consulta", "GET", "/insumos-maga", { token: admin.token });
      axios.get = async () => ({ status: 500, data: "error" });
      await call("maga/sitio-con-error", "GET", "/insumos-maga?q=papel", { token: admin.token });
      axios.get = async () => ({ status: 200, data: "<html>sin tabla</html>" });
      await call("maga/sin-tabla", "GET", "/insumos-maga?q=papel", { token: admin.token });
      axios.get = async () => {
        throw new Error("red caída");
      };
      await call("maga/red-caida", "GET", "/insumos-maga?q=papel", { token: admin.token });
    } finally {
      axios.get = original;
    }
  });

  it("CU-01: crear expediente (validaciones, firma 2, anexo, correlativo) y asignarlo", async () => {
    const t = admin.token;
    await call("cu01/crear-invalido", "POST", "/expedientes", { token: t, json: {} });
    await call("cu01/crear-unidad-inexistente", "POST", "/expedientes", {
      token: t,
      json: { id_unidad_solicitante: 999, objeto_compra: "x", justificacion: "y" },
    });
    await call("cu01/crear-firma2-ajena", "POST", "/expedientes", {
      token: t,
      json: { id_unidad_solicitante: 1, objeto_compra: "x", justificacion: "y", firma2_usuario_id: outsider.id },
    });
    await call("cu01/crear", "POST", "/expedientes", {
      token: t,
      json: {
        id_unidad_solicitante: 1,
        objeto_compra: "Compra de papelería",
        justificacion: "Abastecimiento trimestral",
        monto_estimado: 12000,
        funcionario_responsable: "Directora de Logística",
        tipo_compra: "Suministros",
        tiene_anexo: true,
        anexo_caracteristicas_tecnicas: "Papel carta\nGramaje 75",
        anexo_especificaciones_especiales: "Entrega en caja",
        firma2_usuario_id: jefe.id,
        items: [
          { descripcion: "Resma de papel bond carta", cantidad: 50, unidad_medida: "Resma", costo_unitario_estimado: 38.5, codigo_insumo: "12345", id_renglon: 1 },
          { descripcion: "Lapicero azul", cantidad: 100, unidad_medida: "Unidad" },
        ],
      },
    });
    await call("cu01/crear-segundo-misma-unidad", "POST", "/expedientes", {
      token: t,
      json: { id_unidad_solicitante: 1, objeto_compra: "Segundo expediente", justificacion: "Otro", modalidad: "Compra Directa" },
    });
    await call("cu01/crear-otra-unidad", "POST", "/expedientes", {
      token: t,
      json: { id_unidad_solicitante: 2, objeto_compra: "Expediente de otra unidad", justificacion: "Prueba", items: [] },
    });

    await call("cu01/listar", "GET", "/expedientes", { token: t });
    await call("cu01/listar-filtrado", "GET", "/expedientes?unidad=1&search=papel&limit=5&offset=0", { token: t });
    await call("cu01/listar-por-estado", "GET", "/expedientes?estado=1", { token: t });
    await call("cu01/detalle", "GET", "/expedientes/1", { token: t });
    await call("cu01/detalle-inexistente", "GET", "/expedientes/999", { token: t });

    await call("cu01/asignar-sin-usuario", "POST", "/expedientes/1/asignar", { token: t, json: {} });
    await call("cu01/asignar-ajeno", "POST", "/expedientes/1/asignar", { token: t, json: { id_usuario_asignado: outsider.id } });
    await call("cu01/asignar-expediente-inexistente", "POST", "/expedientes/999/asignar", { token: t, json: { id_usuario_asignado: analista.id } });
    await call("cu01/asignar", "POST", "/expedientes/1/asignar", { token: t, json: { id_usuario_asignado: analista.id } });
  });

  it("CU-02: cotizaciones y adjudicación", async () => {
    const t = admin.token;
    await call("cu02/cotizar-invalida", "POST", "/expedientes/1/cotizaciones", { token: t, json: {} });
    await call("cu02/cotizar-proveedor-inexistente", "POST", "/expedientes/1/cotizaciones", {
      token: t,
      json: { id_proveedor: 999, monto_ofertado: 100 },
    });
    await call("cu02/cotizar-1", "POST", "/expedientes/1/cotizaciones", {
      token: t,
      json: { id_proveedor: 1, monto_ofertado: 9500.5, plazo_entrega_dias: 5, garantia_meses: 12, cumple_especificaciones: true },
    });
    await call("cu02/cotizar-2", "POST", "/expedientes/1/cotizaciones", { token: t, json: { id_proveedor: 2, monto_ofertado: 8800 } });
    await call("cu02/adjudicar-ajena", "POST", "/expedientes/2/cotizaciones/1/adjudicar", { token: t });
    await call("cu02/adjudicar", "POST", "/expedientes/1/cotizaciones/2/adjudicar", { token: t });
    await call("cu02/readjudicar", "POST", "/expedientes/1/cotizaciones/1/adjudicar", { token: t });
    await call("cu02/readjudicar-final", "POST", "/expedientes/1/cotizaciones/2/adjudicar", { token: t });
  });

  it("CU-03: CDP (elaborar, aprobar, Vo.Bo.) con validación de saldo", async () => {
    const t = admin.token;
    await call("cu03/elaborar-invalido", "POST", "/expedientes/1/cdp", { token: t, json: {} });
    await call("cu03/elaborar-expediente-inexistente", "POST", "/expedientes/999/cdp", { token: t, json: { id_partida: 1, monto_reservado: 10 } });
    await call("cu03/elaborar-partida-inexistente", "POST", "/expedientes/1/cdp", { token: t, json: { id_partida: 999, monto_reservado: 10 } });
    await call("cu03/elaborar-excede-saldo", "POST", "/expedientes/1/cdp", { token: t, json: { id_partida: 1, monto_reservado: 999999 } });
    await call("cu03/vobo-sin-cdp", "POST", "/cdp/1/vobo", { token: t });
    await call("cu03/elaborar", "POST", "/expedientes/1/cdp", { token: t, json: { id_partida: 1, monto_reservado: 9000 } });
    await call("cu03/elaborar-repetido", "POST", "/expedientes/1/cdp", { token: t, json: { id_partida: 1, monto_reservado: 9000 } });
    await call("cu03/vobo-antes-de-aprobar", "POST", "/cdp/1/vobo", { token: t });
    await call("cu03/aprobar-inexistente", "POST", "/cdp/999/aprobar", { token: t });
    await call("cu03/aprobar", "POST", "/cdp/1/aprobar", { token: t });
    await call("cu03/aprobar-repetido", "POST", "/cdp/1/aprobar", { token: t });
    await call("cu03/vobo", "POST", "/cdp/1/vobo", { token: t });
    await call("cu03/partidas-tras-vobo", "GET", "/catalogos/partidas", { token: t });
  });

  it("CU-04: Orden de Compra (elaborar, aprobar, autorizar)", async () => {
    const t = admin.token;
    await call("cu04/elaborar-sin-cdp", "POST", "/expedientes/2/orden-compra", { token: t, json: { monto_total: 100 } });
    await call("cu04/elaborar-invalida", "POST", "/expedientes/1/orden-compra", { token: t, json: {} });
    await call("cu04/elaborar-excede-cdp", "POST", "/expedientes/1/orden-compra", { token: t, json: { monto_total: 9000.01 } });
    await call("cu04/elaborar", "POST", "/expedientes/1/orden-compra", {
      token: t,
      json: { monto_total: 8800, plazo_entrega: "5 días", lugar_entrega: "Bodega central" },
    });
    await call("cu04/elaborar-repetida", "POST", "/expedientes/1/orden-compra", { token: t, json: { monto_total: 8800 } });
    await call("cu04/autorizar-antes-de-aprobar", "POST", "/orden-compra/1/autorizar", { token: t });
    await call("cu04/aprobar", "POST", "/orden-compra/1/aprobar", { token: t });
    await call("cu04/aprobar-repetida", "POST", "/orden-compra/1/aprobar", { token: t });
    await call("cu04/aprobar-inexistente", "POST", "/orden-compra/999/aprobar", { token: t });
    await call("cu04/autorizar", "POST", "/orden-compra/1/autorizar", { token: t });
  });

  it("CU-05 / CU-06: recepción, documentos de soporte y traslado a Contabilidad", async () => {
    const t = admin.token;
    await call("cu05/trasladar-sin-recepcion", "POST", "/expedientes/1/trasladar-contabilidad", { token: t });
    await call("cu05/recepcion-invalida", "POST", "/orden-compra/1/recepcion", { token: t, json: {} });
    await call("cu05/recepcion-oc-inexistente", "POST", "/orden-compra/999/recepcion", { token: t, json: { recibido_conforme: true } });
    await call("cu05/recepcion-no-conforme", "POST", "/orden-compra/1/recepcion", {
      token: t,
      json: { recibido_conforme: "false", dictamen_fisico: "Faltan cajas", observaciones: "Entrega parcial" },
    });
    await call("cu05/recepcion-repetida", "POST", "/orden-compra/1/recepcion", { token: t, json: { recibido_conforme: true } });
    await call("cu05/trasladar-recepcion-no-conforme", "POST", "/expedientes/1/trasladar-contabilidad", { token: t });

    // Se corrige la recepción directamente en la BD para poder seguir el flujo (el módulo no ofrece corregirla).
    await pg.query("UPDATE recepciones SET recibido_conforme = TRUE WHERE id_orden_compra = 1");

    await call("cu06/trasladar-sin-documentos", "POST", "/expedientes/1/trasladar-contabilidad", { token: t });

    const form = (fields, withFile = true) => {
      const body = new FormData();
      for (const [key, value] of Object.entries(fields)) body.append(key, value);
      if (withFile) body.append("archivo", new Blob(["%PDF-1.4 prueba"]), "factura.pdf");
      return body;
    };
    await call("cu06/documento-sin-archivo", "POST", "/expedientes/1/documentos-soporte", { token: t, form: form({ tipo_documento: "FACTURA" }, false) });
    await call("cu06/documento-tipo-invalido", "POST", "/expedientes/1/documentos-soporte", { token: t, form: form({ tipo_documento: "OTRA_COSA" }) });
    const documento = await server.request("POST", "/expedientes/1/documentos-soporte", {
      token: t,
      form: form({ tipo_documento: "FACTURA", numero_documento: "A-123", fecha_documento: "2026-03-01" }),
    });
    assert.equal(documento.status, 201);
    const [guardado] = documento.data.documentos_soporte;
    assert.match(guardado.archivo_url, /^adquisiciones\/documentos-soporte\/.+\.pdf$/);
    record("cu06/documento", documento);

    await call("cu06/trasladar", "POST", "/expedientes/1/trasladar-contabilidad", { token: t });
    await call("cu06/trasladar-repetido", "POST", "/expedientes/1/trasladar-contabilidad", { token: t });
  });

  it("CU-07 / CU-08 / CU-09: compromiso, devengado, solicitud y autorización de pago", async () => {
    const t = admin.token;
    await call("cu07/compromiso-expediente-fuera-de-fase", "POST", "/expedientes/2/compromiso", { token: t, json: { monto_comprometido: 10 } });
    await call("cu07/compromiso-invalido", "POST", "/expedientes/1/compromiso", { token: t, json: {} });
    await call("cu07/compromiso-excede-cdp", "POST", "/expedientes/1/compromiso", { token: t, json: { monto_comprometido: 9000.01 } });
    await call("cu07/compromiso", "POST", "/expedientes/1/compromiso", { token: t, json: { monto_comprometido: 8800 } });
    await call("cu07/compromiso-repetido", "POST", "/expedientes/1/compromiso", { token: t, json: { monto_comprometido: 8800 } });

    await call("cu08/devengado-invalido", "POST", "/compromiso/1/devengado", { token: t, json: {} });
    await call("cu08/devengado-compromiso-inexistente", "POST", "/compromiso/999/devengado", { token: t, json: { monto_devengado: 10 } });
    await call("cu08/devengado-excede-compromiso", "POST", "/compromiso/1/devengado", { token: t, json: { monto_devengado: 8800.01 } });
    await call("cu08/devengado", "POST", "/compromiso/1/devengado", { token: t, json: { monto_devengado: 8800, retencion_isr: 264 } });
    await call("cu08/devengado-repetido", "POST", "/compromiso/1/devengado", { token: t, json: { monto_devengado: 8800 } });

    await call("cu09/solicitar-invalida", "POST", "/devengado/1/solicitar-pago", { token: t, json: {} });
    await call("cu09/solicitar-devengado-inexistente", "POST", "/devengado/999/solicitar-pago", {
      token: t,
      json: { entidad_bancaria: "Banrural", tipo_cuenta: "Monetaria", numero_cuenta: "123" },
    });
    await call("cu09/solicitar", "POST", "/devengado/1/solicitar-pago", {
      token: t,
      json: { entidad_bancaria: "Banrural", tipo_cuenta: "Monetaria", numero_cuenta: "123-456-7", numero_transferencia_cheque: "TR-001" },
    });
    await call("cu09/solicitar-repetida", "POST", "/devengado/1/solicitar-pago", {
      token: t,
      json: { entidad_bancaria: "Banrural", tipo_cuenta: "Monetaria", numero_cuenta: "123" },
    });
    await call("cu09/autorizar-inexistente", "POST", "/solicitud-pago/999/autorizar", { token: t });
    await call("cu09/autorizar", "POST", "/solicitud-pago/1/autorizar", { token: t });
    await call("cu09/autorizar-repetida", "POST", "/solicitud-pago/1/autorizar", { token: t });
    await call("cu09/detalle-final", "GET", "/expedientes/1", { token: t });
  });

  it("transversales: cambio de estado, devolución y bitácora", async () => {
    const t = admin.token;
    await call("transversal/estado-sin-dato", "PUT", "/expedientes/2/estado", { token: t, json: {} });
    await call("transversal/estado-inexistente", "PUT", "/expedientes/2/estado", { token: t, json: { nuevoEstadoId: 999 } });
    await call("transversal/estado-expediente-inexistente", "PUT", "/expedientes/999/estado", { token: t, json: { nuevoEstadoId: 2 } });
    await call("transversal/estado", "PUT", "/expedientes/2/estado", { token: t, json: { nuevoEstadoId: 2, comentario: "Ajuste administrativo" } });
    await call("transversal/devolver-invalido", "POST", "/expedientes/2/devolver", { token: t, json: { motivo: "Falta anexo" } });
    await call("transversal/devolver", "POST", "/expedientes/2/devolver", {
      token: t,
      json: { etapa_origen: "Cotización", motivo: "Falta anexo", descripcion: "Adjuntar especificaciones", plazo_subsanacion_dias: 5 },
    });
    await call("transversal/devolver-sin-plazo", "POST", "/expedientes/3/devolver", { token: t, json: { etapa_origen: "Recepción", motivo: "Datos incompletos" } });
    await call("transversal/bitacora-completa", "GET", "/expedientes/1/bitacora", { token: t });
    await call("transversal/bitacora-con-devolucion", "GET", "/expedientes/2/bitacora", { token: t });
    await call("transversal/bitacora-vacia", "GET", "/expedientes/999/bitacora", { token: t });
  });

  it("reportes administrativos", async () => {
    const t = admin.token;
    await call("reportes/cotizaciones", "GET", "/reportes/cotizaciones", { token: t });
    await call("reportes/cdp", "GET", "/reportes/cdp", { token: t });
    await call("reportes/ordenes-compra", "GET", "/reportes/ordenes-compra", { token: t });
    await call("reportes/financiera", "GET", "/reportes/financiera", { token: t });
    await call("reportes/resumen", "GET", "/reportes/resumen", { token: t });
  });

  it("la transcripción coincide con la referencia", () => {
    if (process.env.UPDATE_GOLDEN) {
      fs.mkdirSync(path.dirname(GOLDEN), { recursive: true });
      fs.writeFileSync(GOLDEN, JSON.stringify(transcript, null, 2) + "\n");
      return;
    }
    const expected = JSON.parse(fs.readFileSync(GOLDEN, "utf8"));
    assert.deepEqual(Object.keys(transcript), Object.keys(expected));
    for (const name of Object.keys(expected)) {
      assert.deepEqual(transcript[name], expected[name], `Difiere la respuesta de «${name}»`);
    }
  });
});
