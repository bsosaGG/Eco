/**
 * Hiring Service (Core Humanis SCSPR)
 * Implements the official 4-stage hiring pipeline:
 * persona -> candidato -> empleado -> contrato.
 * 
 * Enforces business rules:
 * 1. Unique CUI/DPI across the entire system.
 * 2. Strictly ONE active contract per employee at any time.
 */

const db = require("../config/db-core-humanis");

class HiringService {
  /**
   * Validates whether a CUI/DPI is already registered in the system.
   * @param {string} cui
   * @returns {Promise<Object>} Verification status.
   */
  async validateCui(cui) {
    const cleanCui = String(cui || "").replace(/\s+/g, "").trim();
    if (!cleanCui || cleanCui.length < 10) {
      return { validFormat: false, exists: false, message: "CUI / DPI inválido" };
    }

    const checkRes = await db.query(
      `SELECT p.id, p.cui_dpi, p.primer_nombre, p.primer_apellido,
              rl.id as contrato_activo_id, rl.estado as contrato_estado, r.codigo as renglon_codigo
       FROM personas p
       LEFT JOIN relaciones_laborales rl ON rl.persona_id = p.id AND rl.estado = 'ACTIVO'
       LEFT JOIN renglones_presupuestarios r ON r.id = rl.renglon_id
       WHERE REPLACE(p.cui_dpi, ' ', '') = $1`,
      [cleanCui]
    );

    if (checkRes.rows.length > 0) {
      const persona = checkRes.rows[0];
      return {
        validFormat: true,
        exists: true,
        message: `El CUI ${cleanCui} ya se encuentra registrado a nombre de ${persona.primer_nombre} ${persona.primer_apellido}`,
        persona,
      };
    }

    return {
      validFormat: true,
      exists: false,
      message: "CUI disponible para registro de nueva persona",
      persona: null,
    };
  }

  /**
   * Retrieves candidates shortlisted for hiring across active or finalized convocatorias.
   */
  async getHiringPipeline() {
    const query = `
      SELECT pc.*,
             cp.correlativo as convocatoria_correlativo,
             cp.titulo_plaza,
             cp.renglon_presupuestario,
             cp.unidad_administrativa,
             cp.salario_honorarios as salario_convocatoria,
             p.id as persona_existente_id,
             p.activo as empleado_activo,
             rl.id as contrato_activo_id,
             rl.estado as contrato_activo_estado
      FROM postulaciones_candidatos pc
      JOIN convocatorias_plazas cp ON cp.id = pc.convocatoria_id
      LEFT JOIN personas p ON REPLACE(p.cui_dpi, ' ', '') = REPLACE(pc.cui, ' ', '')
      LEFT JOIN relaciones_laborales rl ON rl.persona_id = p.id AND rl.estado = 'ACTIVO'
      WHERE pc.estado IN ('SELECCIONADO', 'EN_CONTRATACION', 'PRESELECCIONADO')
      ORDER BY pc.punteo_total DESC, pc.created_at ASC
    `;
    const res = await db.query(query);
    return res.rows;
  }

  /**
   * Executes the full atomic 4-stage hiring transition:
   * persona -> candidato -> empleado -> contrato
   * @param {Object} payload
   */
  async formalizeHiring(payload) {
    const p = payload.persona || {};
    const e = payload.empleado || {};
    const c = payload.contrato || {};

    const cui = payload.cui || p.cui_dpi || p.cui;
    const primer_nombre = payload.primer_nombre || p.primer_nombre;
    const segundo_nombre = payload.segundo_nombre !== undefined ? payload.segundo_nombre : p.segundo_nombre;
    const primer_apellido = payload.primer_apellido || p.primer_apellido;
    const segundo_apellido = payload.segundo_apellido !== undefined ? payload.segundo_apellido : p.segundo_apellido;
    const nit = payload.nit || p.nit;
    const igss_afiliacion = payload.igss_afiliacion || p.igss_afiliacion;
    const email = payload.email || p.correo_institucional || p.correo_personal;
    const telefono = payload.telefono || p.telefono || p.telefono_personal;
    const direccion_residencia = payload.direccion_residencia || p.direccion || p.direccion_residencia;
    const postulacion_id = payload.postulacion_id || payload.candidato_id;
    const puesto_nominal_id = payload.puesto_nominal_id || e.puesto_nominal_id;
    const puesto_funcional_id = payload.puesto_funcional_id || e.puesto_funcional_id;
    const unidad_admin_id = payload.unidad_admin_id || e.unidad_admin_id;
    const rawRenglon = payload.renglon_id || c.renglon_id;
    const rawSalario = payload.salario_honorarios !== undefined 
      ? payload.salario_honorarios 
      : (c.salario_mensual !== undefined ? c.salario_mensual : c.salario_honorarios);
    const fecha_inicio = payload.fecha_inicio || c.fecha_inicio;
    const fecha_fin = payload.fecha_fin || c.fecha_fin;
    const partida_presupuestaria = payload.partida_presupuestaria || c.partida_presupuestaria || c.objeto_contrato;
    const observaciones = payload.observaciones || c.objeto_contrato || c.observaciones;
    const cerrar_contrato_anterior = Boolean(payload.cerrar_contrato_anterior ?? c.cerrar_contrato_anterior ?? false);

    const cleanCui = String(cui || "").replace(/\s+/g, "").trim();
    const cleanSalario = typeof rawSalario === "number" 
      ? rawSalario 
      : parseFloat(String(rawSalario || "").replace(/[^0-9.]/g, ""));

    // Resolver UUID y código de renglón presupuestario si viene como código (ej. "011") o UUID
    let finalRenglonId = rawRenglon;
    let renglonCodigo = "011";

    if (rawRenglon && !rawRenglon.includes("-")) {
      const rCheck = await db.query(
        `SELECT id, codigo FROM renglones_presupuestarios WHERE codigo = $1`,
        [rawRenglon]
      );
      if (rCheck.rows.length > 0) {
        finalRenglonId = rCheck.rows[0].id;
        renglonCodigo = rCheck.rows[0].codigo;
      }
    } else if (rawRenglon) {
      const rCheck = await db.query(
        `SELECT id, codigo FROM renglones_presupuestarios WHERE id = $1`,
        [rawRenglon]
      );
      if (rCheck.rows.length > 0) {
        renglonCodigo = rCheck.rows[0].codigo;
      }
    }

    if (!cleanCui || !primer_nombre || !primer_apellido || !finalRenglonId || isNaN(cleanSalario) || cleanSalario <= 0 || !fecha_inicio) {
      throw new Error("CUI, nombres, renglón, salario y fecha de inicio son campos obligatorios");
    }

    // =========================================================================
    // PASO 1: PERSONA (Garantía de CUI/DPI Único)
    // =========================================================================
    let personaId;
    const personaCheck = await db.query(
      `SELECT id FROM personas WHERE REPLACE(cui_dpi, ' ', '') = $1`,
      [cleanCui]
    );

    if (personaCheck.rows.length > 0) {
      personaId = personaCheck.rows[0].id;
      // Actualizar datos civiles de contacto
      await db.query(
        `UPDATE personas SET
           nit = COALESCE($1, nit),
           igss_afiliacion = COALESCE($2, igss_afiliacion),
           correo_personal = COALESCE($3, correo_personal),
           telefono_personal = COALESCE($4, telefono_personal),
           direccion_residencia = COALESCE($5, direccion_residencia),
           activo = true,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $6`,
        [nit || null, igss_afiliacion || null, email || null, telefono || null, direccion_residencia || null, personaId]
      );
    } else {
      // Inserción de nueva persona con CUI único
      const insertPersona = await db.query(
        `INSERT INTO personas (
           cui_dpi, nit, igss_afiliacion, primer_nombre, segundo_nombre,
           primer_apellido, segundo_apellido, correo_personal, telefono_personal,
           direccion_residencia, activo
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
         RETURNING id`,
        [
          cleanCui,
          nit || null,
          igss_afiliacion || null,
          primer_nombre,
          segundo_nombre || null,
          primer_apellido,
          segundo_apellido || null,
          email || null,
          telefono || null,
          direccion_residencia || null,
        ]
      );
      personaId = insertPersona.rows[0].id;
    }

    // =========================================================================
    // PASO 2: CANDIDATO (Vinculación con Postulación)
    // =========================================================================
    if (postulacion_id) {
      await db.query(
        `UPDATE postulaciones_candidatos
         SET persona_id = $1, estado = 'CONTRATADO', updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [personaId, postulacion_id]
      );
    }

    // =========================================================================
    // PASO 3: EMPLEADO (Activación institucional)
    // =========================================================================
    await db.query(`UPDATE personas SET activo = true WHERE id = $1`, [personaId]);

    // =========================================================================
    // PASO 4: CONTRATO (Regla: Único contrato activo por empleado)
    // =========================================================================
    const activeContractRes = await db.query(
      `SELECT id, numero_acuerdo_contrato FROM relaciones_laborales WHERE persona_id = $1 AND estado = 'ACTIVO'`,
      [personaId]
    );

    if (activeContractRes.rows.length > 0) {
      if (!cerrar_contrato_anterior) {
        throw new Error(
          "El empleado ya cuenta con un contrato activo en el sistema. Debe confirmar el cierre formal del contrato previo para activar el nuevo contrato."
        );
      }
      // Concluir formalmente el contrato previo
      await db.query(
        `UPDATE relaciones_laborales
         SET estado = 'CONCLUIDO', es_contrato_actual = false,
             fecha_fin = COALESCE(fecha_fin, CURRENT_DATE), updated_at = CURRENT_TIMESTAMP
         WHERE persona_id = $1 AND estado = 'ACTIVO'`,
        [personaId]
      );
    }

    // Generar correlativo o número de acuerdo
    const anio = new Date().getFullYear();
    const countRes = await db.query(
      `SELECT COUNT(*) as total FROM relaciones_laborales WHERE EXTRACT(YEAR FROM created_at) = $1`,
      [anio]
    );
    const num = String(parseInt(countRes.rows[0]?.total || "0", 10) + 1).padStart(3, "0");
    const numContrato = `SCSPR-CONT-${anio}-${num}`;

    // Crear el nuevo contrato activo
    const insertContract = await db.query(
      `INSERT INTO relaciones_laborales (
         persona_id, renglon_id, puesto_nominal_id, puesto_funcional_id,
         unidad_admin_id, numero_acuerdo_contrato, partida_presupuestaria,
         fecha_inicio, fecha_fin, salario_honorarios, observaciones, estado, es_contrato_actual
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ACTIVO', true)
       RETURNING *`,
      [
        personaId,
        finalRenglonId,
        puesto_nominal_id || null,
        puesto_funcional_id || null,
        unidad_admin_id || null,
        numContrato,
        partida_presupuestaria || "11130016-101-00-0101-0001",
        fecha_inicio,
        fecha_fin || null,
        cleanSalario,
        observaciones || null,
      ]
    );

    // Registro inmutable de auditoría (AGENTS.md)
    try {
      await db.query(
        `INSERT INTO auditoria_logs (accion, entidad, entidad_id, detalles_json)
         VALUES ($1, $2, $3, $4)`,
        [
          "FORMALIZACION_CONTRATO",
          "relaciones_laborales",
          insertContract.rows[0].id,
          JSON.stringify({
            cui: cleanCui,
            persona_id: personaId,
            contrato_id: insertContract.rows[0].id,
            numero_contrato: numContrato,
            renglon_codigo: renglonCodigo,
            salario: cleanSalario,
          }),
        ]
      );
    } catch (auditErr) {
      console.warn("No se pudo registrar log de auditoría:", auditErr.message);
    }

    return {
      success: true,
      message: `Contrato ${numContrato} activado exitosamente para ${primer_nombre} ${primer_apellido}`,
      persona_id: personaId,
      persona: {
        id: personaId,
        cui_dpi: cleanCui,
        primer_nombre,
        primer_apellido,
      },
      empleado: {
        codigo_empleado: payload.empleado?.codigo_empleado || `EMP-${anio}-${personaId.slice(0, 4)}`,
        puesto_funcional_id: puesto_funcional_id || null,
        unidad_admin_id: unidad_admin_id || null,
      },
      contrato: {
        ...insertContract.rows[0],
        numero_contrato: numContrato,
        renglon_codigo: renglonCodigo,
      },
    };
  }
}

module.exports = new HiringService();
