/**
 * Payroll Controller (Ola 3 - Core Humanis SCSPR)
 * RESTful Level 3 HATEOAS controller for payroll calculation, approval, and exports.
 */

const db = require("../config/db-core-humanis");
const payrollsService = require("../services/payrolls.service");
const { buildPayrollLinks, buildPayrollCollectionLinks } = require("../utils/hateoas.helper");

class PayrollsController {
  async getPayrolls(req, res) {
    try {
      const { periodo_anio, periodo_mes, renglon, estado, page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let whereClauses = [];
      let params = [];

      if (periodo_anio) {
        params.push(Number(periodo_anio));
        whereClauses.push(`periodo_anio = $${params.length}`);
      }
      if (periodo_mes) {
        params.push(Number(periodo_mes));
        whereClauses.push(`periodo_mes = $${params.length}`);
      }
      if (renglon) {
        params.push(renglon);
        whereClauses.push(`renglon_presupuestario = $${params.length}`);
      }
      if (estado) {
        params.push(estado);
        whereClauses.push(`estado = $${params.length}`);
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

      const countResult = await db.query(`SELECT COUNT(*) as total FROM nominas_cabecera ${whereSql}`, params);
      const total = parseInt(countResult.rows[0]?.total || "0", 10);

      params.push(Number(limit));
      const limitIdx = params.length;
      params.push(offset);
      const offsetIdx = params.length;

      const query = `
        SELECT * FROM nominas_cabecera
        ${whereSql}
        ORDER BY periodo_anio DESC, periodo_mes DESC, created_at DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `;

      const result = await db.query(query, params);
      const totalPages = Math.ceil(total / Number(limit)) || 1;

      const itemsWithLinks = result.rows.map((row) => ({
        id: row.id,
        correlativo: row.correlativo,
        periodoMes: row.periodo_mes,
        periodoAnio: row.periodo_anio,
        tipoPlanilla: row.tipo_planilla,
        renglonPresupuestario: row.renglon_presupuestario,
        totalDevengado: parseFloat(row.total_devengado || 0),
        totalDescuentos: parseFloat(row.total_descuentos || 0),
        totalLiquido: parseFloat(row.total_liquido || 0),
        estado: row.estado,
        createdAt: row.created_at,
        _links: buildPayrollLinks(row),
      }));

      return res.status(200).json({
        data: itemsWithLinks,
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
        _links: buildPayrollCollectionLinks(req.query, { page: Number(page), limit: Number(limit), total, totalPages }),
      });
    } catch (error) {
      console.error("Error in getPayrolls:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPayrollById(req, res) {
    try {
      const { id } = req.params;
      const cabeceraResult = await db.query("SELECT * FROM nominas_cabecera WHERE id = $1", [id]);
      if (cabeceraResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Nómina no encontrada" });
      }

      const cabecera = cabeceraResult.rows[0];

      const detallesResult = await db.query(
        `SELECT d.*, p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido,
                p.cui_dpi, p.nit, p.igss_afiliacion, pf.nombre as puesto_funcional
         FROM nominas_detalles d
         JOIN personas p ON d.persona_id = p.id
         LEFT JOIN relaciones_laborales rl ON d.contrato_id = rl.id
         LEFT JOIN puestos_funcionales pf ON rl.puesto_funcional_id = pf.id
         WHERE d.nomina_id = $1
         ORDER BY p.primer_apellido ASC, p.primer_nombre ASC`,
        [id]
      );

      return res.status(200).json({
        data: {
          id: cabecera.id,
          correlativo: cabecera.correlativo,
          periodoMes: cabecera.periodo_mes,
          periodoAnio: cabecera.periodo_anio,
          tipoPlanilla: cabecera.tipo_planilla,
          renglonPresupuestario: cabecera.renglon_presupuestario,
          totalDevengado: parseFloat(cabecera.total_devengado || 0),
          totalDescuentos: parseFloat(cabecera.total_descuentos || 0),
          totalLiquido: parseFloat(cabecera.total_liquido || 0),
          estado: cabecera.estado,
          detalles: detallesResult.rows,
          _links: buildPayrollLinks(cabecera),
        },
      });
    } catch (error) {
      console.error("Error in getPayrollById:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async createPayroll(req, res) {
    try {
      const { periodo_mes, periodo_anio, renglon_presupuestario, tipo_planilla = "ORDINARIA" } = req.body;
      const mes = Number(periodo_mes);
      const anio = Number(periodo_anio);
      const renglon = String(renglon_presupuestario || "011");

      const correlativo = `NOM-${anio}-${String(mes).padStart(2, "0")}-${renglon}`;

      // Check if already exists
      const existing = await db.query("SELECT id FROM nominas_cabecera WHERE correlativo = $1", [correlativo]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ success: false, message: `La nómina ${correlativo} ya ha sido creada previamente.` });
      }

      const insertResult = await db.query(
        `INSERT INTO nominas_cabecera (correlativo, periodo_mes, periodo_anio, tipo_planilla, renglon_presupuestario, estado, creado_por_usuario_id)
         VALUES ($1, $2, $3, $4, $5, 'BORRADOR', $6)
         RETURNING *`,
        [correlativo, mes, anio, tipo_planilla, renglon, req.user?.id || null]
      );

      const nueva = insertResult.rows[0];
      return res.status(201).json({
        data: {
          ...nueva,
          _links: buildPayrollLinks(nueva),
        },
      });
    } catch (error) {
      console.error("Error in createPayroll:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async calculatePayroll(req, res) {
    try {
      const { id } = req.params;
      const cabeceraResult = await db.query("SELECT * FROM nominas_cabecera WHERE id = $1", [id]);
      if (cabeceraResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Nómina no encontrada" });
      }

      const cabecera = cabeceraResult.rows[0];
      if (cabecera.estado === "APROBADO" || cabecera.estado === "PAGADO") {
        return res.status(400).json({ success: false, message: "No se puede recalcular una nómina aprobada o pagada." });
      }

      // Fetch active collaborators matching the regime
      const colabQuery = `
        SELECT p.id, p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido,
               p.cui_dpi, p.nit, p.igss_afiliacion,
               rl.id as contrato_id, rl.salario_honorarios, rp.codigo as renglon_codigo
        FROM personas p
        JOIN relaciones_laborales rl ON rl.persona_id = p.id AND rl.estado = 'ACTIVO'
        JOIN renglones_presupuestarios rp ON rl.renglon_id = rp.id
        WHERE rp.codigo = $1
      `;
      const colabs = await db.query(colabQuery, [cabecera.renglon_presupuestario]);

      // Clear existing details for this payroll draft
      await db.query("DELETE FROM nominas_detalles WHERE nomina_id = $1", [id]);

      let detallesCalculados = [];

      for (const colab of colabs.rows) {
        const nombreCompleto = `${colab.primer_nombre || ""} ${colab.primer_apellido || ""}`.trim();
        const liq = payrollsService.calcularLiquidacionColaborador({
          id: colab.id,
          nombre: nombreCompleto,
          renglon: colab.renglon_codigo,
          sueldoBase: parseFloat(colab.salario_honorarios || 0),
          honorarios: parseFloat(colab.salario_honorarios || 0),
          diasLaborados: 30,
        });

        const slipHash = payrollsService.generarHashBoleta(
          colab.id,
          id,
          cabecera.periodo_mes,
          cabecera.periodo_anio,
          liq.liquidoRecibir
        );

        await db.query(
          `INSERT INTO nominas_detalles (
            nomina_id, persona_id, contrato_id, dias_laborados, sueldo_base_honorarios,
            total_bonificaciones, total_ingresos, total_descuentos_ley, total_descuentos_otros,
            liquido_a_recibir, boleta_hash_sha256
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            id,
            colab.id,
            colab.contrato_id,
            liq.diasLaborados,
            liq.sueldoBase || liq.honorarios,
            (liq.bonoIncentivo || 0) + (liq.bonoProfesional || 0),
            liq.totalIngresos,
            (liq.cuotaIgss || 0) + (liq.montepio || 0),
            liq.retencionIsr || 0,
            liq.liquidoRecibir,
            slipHash,
          ]
        );

        detallesCalculados.push(liq);
      }

      const resumen = payrollsService.calcularResumenPlanilla(detallesCalculados);

      await db.query(
        `UPDATE nominas_cabecera
         SET total_devengado = $1, total_descuentos = $2, total_liquido = $3, updated_at = NOW()
         WHERE id = $4`,
        [resumen.totalDevengado, resumen.totalDescuentos, resumen.totalLiquido, id]
      );

      return res.status(200).json({
        success: true,
        message: `Cálculo de nómina completado para ${detallesCalculados.length} colaboradores`,
        resumen,
      });
    } catch (error) {
      console.error("Error in calculatePayroll:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async updatePayrollStatus(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      const estadosValidos = ["BORRADOR", "REVISADO", "APROBADO", "PAGADO"];

      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ success: false, message: `Estado inválido: ${estado}` });
      }

      let extraUpdate = "";
      let params = [estado, id];

      if (estado === "APROBADO") {
        extraUpdate = ", fecha_aprobacion = NOW(), aprobado_por_usuario_id = $3";
        params.push(req.user?.id || null);
      }

      const updateResult = await db.query(
        `UPDATE nominas_cabecera SET estado = $1, updated_at = NOW() ${extraUpdate} WHERE id = $2 RETURNING *`,
        params
      );

      if (updateResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Nómina no encontrada" });
      }

      const actualizada = updateResult.rows[0];
      return res.status(200).json({
        data: {
          ...actualizada,
          _links: buildPayrollLinks(actualizada),
        },
      });
    } catch (error) {
      console.error("Error in updatePayrollStatus:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getBankDispersion(req, res) {
    try {
      const { id } = req.params;
      const cabeceraResult = await db.query("SELECT * FROM nominas_cabecera WHERE id = $1", [id]);
      if (cabeceraResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Nómina no encontrada" });
      }
      const cabecera = cabeceraResult.rows[0];

      const detallesResult = await db.query(
        `SELECT d.*, p.primer_nombre, p.primer_apellido, p.cui_dpi, p.nit
         FROM nominas_detalles d
         JOIN personas p ON d.persona_id = p.id
         WHERE d.nomina_id = $1`,
        [id]
      );

      let lines = [
        `H|SCSPR|${cabecera.correlativo}|${cabecera.periodo_anio}|${cabecera.periodo_mes}|${cabecera.total_liquido}`,
      ];

      detallesResult.rows.forEach((row, idx) => {
        lines.push(
          `D|${idx + 1}|${row.cui_dpi || ""}|${row.banco_numero_cuenta || "CUENTA_SCSPR"}|${row.liquido_a_recibir}|${row.primer_nombre} ${row.primer_apellido}|CREDITO`
        );
      });

      const fileContent = lines.join("\n");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=dispersion_${cabecera.correlativo}.txt`);
      return res.send(fileContent);
    } catch (error) {
      console.error("Error in getBankDispersion:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getIgssFile(req, res) {
    try {
      const { id } = req.params;
      const cabeceraResult = await db.query("SELECT * FROM nominas_cabecera WHERE id = $1", [id]);
      if (cabeceraResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Nómina no encontrada" });
      }
      const cabecera = cabeceraResult.rows[0];

      const detallesResult = await db.query(
        `SELECT d.*, p.primer_nombre, p.primer_apellido, p.cui_dpi, p.igss_afiliacion
         FROM nominas_detalles d
         JOIN personas p ON d.persona_id = p.id
         WHERE d.nomina_id = $1`,
        [id]
      );

      let lines = [
        "NUMERO_PATRONAL;PERIODO_MES;PERIODO_ANIO;CUI;NUMERO_AFILIACION;NOMBRE_EMPLEADO;DIAS_LABORADOS;SALARIO_BASE;CUOTA_LABORAL_4_83;CUOTA_PATRONAL_10_67",
      ];

      detallesResult.rows.forEach((row) => {
        const cuotaPatronal = (parseFloat(row.sueldo_base_honorarios || 0) * 0.1067).toFixed(2);
        lines.push(
          `SCSPR-PATRONAL-01;${cabecera.periodo_mes};${cabecera.periodo_anio};${row.cui_dpi || ""};${row.igss_afiliacion || "PENDIENTE"};${row.primer_nombre} ${row.primer_apellido};${row.dias_laborados};${row.sueldo_base_honorarios};${row.total_descuentos_ley};${cuotaPatronal}`
        );
      });

      const fileContent = lines.join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=planilla_igss_${cabecera.correlativo}.csv`);
      return res.send(fileContent);
    } catch (error) {
      console.error("Error in getIgssFile:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async verifyPayrollSlip(req, res) {
    try {
      const { hash } = req.params;
      const slipResult = await db.query(
        `SELECT d.*, c.correlativo as nomina_correlativo, c.periodo_mes, c.periodo_anio,
                p.primer_nombre, p.primer_apellido, p.cui_dpi, p.nit, pf.nombre as puesto_funcional
         FROM nominas_detalles d
         JOIN nominas_cabecera c ON d.nomina_id = c.id
         JOIN personas p ON d.persona_id = p.id
         LEFT JOIN relaciones_laborales rl ON d.contrato_id = rl.id
         LEFT JOIN puestos_funcionales pf ON rl.puesto_funcional_id = pf.id
         WHERE d.boleta_hash_sha256 = $1`,
        [hash]
      );

      if (slipResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Comprobante de pago no válido o no encontrado" });
      }

      const s = slipResult.rows[0];
      return res.status(200).json({
        success: true,
        data: {
          valido: true,
          correlativoNomina: s.nomina_correlativo,
          periodo: `${s.periodo_mes}/${s.periodo_anio}`,
          colaborador: `${s.primer_nombre} ${s.primer_apellido}`,
          cui: s.cui_dpi,
          puesto: s.puesto_funcional,
          totalIngresos: parseFloat(s.total_ingresos || 0),
          totalDescuentos: parseFloat(s.total_descuentos_ley || 0) + parseFloat(s.total_descuentos_otros || 0),
          liquidoRecibir: parseFloat(s.liquido_a_recibir || 0),
          hashSha256: s.boleta_hash_sha256,
        },
      });
    } catch (error) {
      console.error("Error in verifyPayrollSlip:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPortalSlips(req, res) {
    try {
      const personaId = req.user?.persona_id || req.user?.id;
      const slipsResult = await db.query(
        `SELECT d.id, d.liquido_a_recibir, d.total_ingresos, d.total_descuentos_ley,
                d.boleta_hash_sha256, c.correlativo, c.periodo_mes, c.periodo_anio, c.tipo_planilla
         FROM nominas_detalles d
         JOIN nominas_cabecera c ON d.nomina_id = c.id
         WHERE d.persona_id = $1 AND c.estado IN ('APROBADO', 'PAGADO')
         ORDER BY c.periodo_anio DESC, c.periodo_mes DESC`,
        [personaId]
      );

      return res.status(200).json({
        success: true,
        data: slipsResult.rows,
      });
    } catch (error) {
      console.error("Error in getPortalSlips:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new PayrollsController();
