/**
 * Analytics & Executive BI Controller (Ola 4 - Core Humanis SCSPR)
 * Real-time indicators, demographic pyramids, payroll masses, CGC compliance,
 * and mandatory public transparency reports (LAIP Art. 10 Numeral 4).
 */

const db = require("../config/db-core-humanis");

class AnalyticsController {
  async getExecutiveDashboard(req, res) {
    try {
      // 1. Resumen General de Colaboradores
      const totalColabsRes = await db.query(
        `SELECT COUNT(*) as total,
                COUNT(CASE WHEN activo = true THEN 1 END) as activos,
                COUNT(CASE WHEN genero = 'MASCULINO' THEN 1 END) as total_hombres,
                COUNT(CASE WHEN genero = 'FEMENINO' THEN 1 END) as total_mujeres
         FROM personas`
      );
      const totalColabs = totalColabsRes.rows[0] || { total: 0, activos: 0, total_hombres: 0, total_mujeres: 0 };

      // 2. Distribución por Renglón Presupuestario y Masa Salarial (desde relaciones_laborales)
      const renglonesRes = await db.query(
        `SELECT COALESCE(r.codigo, 'OTRO') as codigo,
                COALESCE(r.nombre, 'Sin Renglón Asignado') as nombre,
                r.tipo,
                COUNT(p.id) as cantidad,
                COALESCE(SUM(rl.salario_honorarios), 0) as masa_total,
                COALESCE(SUM(CASE WHEN r.codigo IN ('011', '022') THEN rl.salario_honorarios ELSE 0 END), 0) as masa_planilla,
                COALESCE(SUM(CASE WHEN r.codigo NOT IN ('011', '022') THEN rl.salario_honorarios ELSE 0 END), 0) as masa_honorarios
         FROM personas p
         JOIN relaciones_laborales rl ON rl.persona_id = p.id AND rl.es_contrato_actual = true
         JOIN renglones_presupuestarios r ON r.id = rl.renglon_id
         GROUP BY r.codigo, r.nombre, r.tipo
         ORDER BY cantidad DESC`
      );

      let totalMasaPlanilla = 0;
      let totalMasaHonorarios = 0;
      renglonesRes.rows.forEach((r) => {
        totalMasaPlanilla += parseFloat(r.masa_planilla || 0);
        totalMasaHonorarios += parseFloat(r.masa_honorarios || 0);
      });
      const totalMasaSalarialMensual = totalMasaPlanilla + totalMasaHonorarios;

      // 3. Pasivo Contingente de Vacaciones (Días pendientes monetizados)
      const vacacionesRes = await db.query(
        `SELECT COALESCE(SUM(vs.dias_pendientes), 0) as total_dias_acumulados,
                COALESCE(SUM(vs.dias_pendientes * (COALESCE(rl.salario_honorarios, 0) / 30.0)), 0) as pasivo_estimado_quetzales
         FROM vacaciones_saldos vs
         JOIN personas p ON p.id = vs.persona_id
         LEFT JOIN relaciones_laborales rl ON rl.persona_id = p.id AND rl.es_contrato_actual = true`
      );
      const pasivoVacaciones = vacacionesRes.rows[0] || { total_dias_acumulados: 0, pasivo_estimado_quetzales: 0 };

      // 4. Pirámide Etaria Institucional
      const piramideRes = await db.query(
        `SELECT
           CASE
             WHEN fecha_nacimiento IS NULL THEN 'No Registrado'
             WHEN EXTRACT(YEAR FROM age(CURRENT_DATE, fecha_nacimiento)) < 25 THEN 'Menor a 25 años'
             WHEN EXTRACT(YEAR FROM age(CURRENT_DATE, fecha_nacimiento)) BETWEEN 25 AND 35 THEN '25 a 35 años'
             WHEN EXTRACT(YEAR FROM age(CURRENT_DATE, fecha_nacimiento)) BETWEEN 36 AND 50 THEN '36 a 50 años'
             ELSE 'Mayor a 50 años'
           END as rango_edad,
           COUNT(CASE WHEN genero = 'FEMENINO' THEN 1 END) as mujeres,
           COUNT(CASE WHEN genero = 'MASCULINO' THEN 1 END) as hombres,
           COUNT(*) as total
         FROM personas
         GROUP BY rango_edad
         ORDER BY rango_edad`
      );

      // 5. Monitor de Finiquitos CGC (Semáforo Institucional)
      const cgcRes = await db.query(
        `SELECT
           COUNT(CASE WHEN ed.fecha_vencimiento > CURRENT_DATE + INTERVAL '60 days' THEN 1 END) as vigentes,
           COUNT(CASE WHEN ed.fecha_vencimiento BETWEEN CURRENT_DATE + INTERVAL '1 day' AND CURRENT_DATE + INTERVAL '60 days' THEN 1 END) as advertencia,
           COUNT(CASE WHEN ed.fecha_vencimiento <= CURRENT_DATE THEN 1 END) as vencidos
         FROM expediente_documentos ed
         JOIN tipos_documento td ON td.id = ed.tipo_documento_id
         WHERE td.codigo = 'DOC_FINIQ_CGC' AND ed.fecha_vencimiento IS NOT NULL`
      );
      const cgcStats = cgcRes.rows[0] || { vigentes: 0, advertencia: 0, vencidos: 0 };

      // 6. Resumen de Reclutamiento y Evaluaciones (Ola 4)
      const convStatsRes = await db.query(
        `SELECT COUNT(*) as total_convocatorias,
                COUNT(CASE WHEN estado = 'PUBLICADA' THEN 1 END) as activas
         FROM convocatorias_plazas`
      );
      const postStatsRes = await db.query(
        `SELECT COUNT(*) as total_postulaciones,
                COUNT(CASE WHEN en_terna = true THEN 1 END) as preseleccionados_terna
         FROM postulaciones_candidatos`
      );
      const evalStatsRes = await db.query(
        `SELECT COUNT(*) as total_evaluaciones,
                COALESCE(ROUND(AVG(calificacion_total), 2), 0) as promedio_institucional,
                COUNT(CASE WHEN requiere_plan_mejora = true THEN 1 END) as planes_mejora_activos
         FROM evaluaciones_desempeno`
      );

      return res.json({
        success: true,
        data: {
          generales: {
            total_colaboradores: parseInt(totalColabs.total || "0", 10),
            activos: parseInt(totalColabs.activos || "0", 10),
            hombres: parseInt(totalColabs.total_hombres || "0", 10),
            mujeres: parseInt(totalColabs.total_mujeres || "0", 10),
          },
          masa_salarial: {
            total_mensual_estimada: Math.round(totalMasaSalarialMensual * 100) / 100,
            planilla_permanente_011_022: Math.round(totalMasaPlanilla * 100) / 100,
            servicios_profesionales_029: Math.round(totalMasaHonorarios * 100) / 100,
            distribucion_renglones: renglonesRes.rows,
          },
          pasivo_vacaciones: {
            dias_acumulados: parseFloat(pasivoVacaciones.total_dias_acumulados || 0),
            monto_estimado_quetzales: Math.round(parseFloat(pasivoVacaciones.pasivo_estimado_quetzales || 0) * 100) / 100,
          },
          piramide_demografica: piramideRes.rows,
          semaforo_cgc: {
            vigentes: parseInt(cgcStats.vigentes || "0", 10),
            advertencia: parseInt(cgcStats.advertencia || "0", 10),
            vencidos: parseInt(cgcStats.vencidos || "0", 10),
          },
          talento_ola4: {
            convocatorias: convStatsRes.rows[0] || { total_convocatorias: 0, activas: 0 },
            postulaciones: postStatsRes.rows[0] || { total_postulaciones: 0, preseleccionados_terna: 0 },
            evaluaciones: evalStatsRes.rows[0] || { total_evaluaciones: 0, promedio_institucional: 0, planes_mejora_activos: 0 },
          },
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error al generar Dashboard BI: " + error.message });
    }
  }

  async getLaipArticle10Report(req, res) {
    try {
      const { format = "json" } = req.query;

      const query = `
        SELECT
          ROW_NUMBER() OVER (ORDER BY r.codigo ASC, p.primer_apellido ASC) as correlativo_linea,
          COALESCE(r.codigo, '029') as renglon_presupuestario,
          CONCAT(p.primer_nombre, ' ', COALESCE(p.segundo_nombre, ''), ' ', p.primer_apellido, ' ', COALESCE(p.segundo_apellido, '')) as nombre_servidor,
          COALESCE(pn.nombre, 'Sin Asignar') as cargo_nominal,
          COALESCE(pf.nombre, 'Servicios Técnicos y Profesionales') as puesto_funcional,
          COALESCE(ua.nombre, 'Despacho Superior') as unidad_administrativa,
          COALESCE(rl.salario_honorarios, 0) as sueldo_base_u_honorarios,
          CASE
            WHEN r.codigo IN ('011', '022') THEN 250.00
            ELSE 0.00
          END as bonificacion_incentivo,
          CASE
            WHEN r.codigo IN ('011', '022') AND EXISTS (
              SELECT 1 FROM estudios_academicos ea WHERE ea.persona_id = p.id AND (ea.nivel_academico IN ('LICENCIATURA', 'MAESTRIA', 'DOCTORADO') OR ea.numero_colegiado IS NOT NULL)
            ) THEN 375.00
            ELSE 0.00
          END as bonificacion_profesional,
          COALESCE(rl.salario_honorarios, 0) + (
            CASE WHEN r.codigo IN ('011', '022') THEN 250.00 ELSE 0.00 END
          ) + (
            CASE WHEN r.codigo IN ('011', '022') AND EXISTS (
              SELECT 1 FROM estudios_academicos ea WHERE ea.persona_id = p.id AND (ea.nivel_academico IN ('LICENCIATURA', 'MAESTRIA', 'DOCTORADO') OR ea.numero_colegiado IS NOT NULL)
            ) THEN 375.00 ELSE 0.00 END
          ) as total_ingreso_devengado
        FROM personas p
        JOIN relaciones_laborales rl ON rl.persona_id = p.id AND rl.es_contrato_actual = true
        JOIN renglones_presupuestarios r ON r.id = rl.renglon_id
        LEFT JOIN puestos_nominales pn ON pn.id = rl.puesto_nominal_id
        LEFT JOIN puestos_funcionales pf ON pf.id = rl.puesto_funcional_id
        LEFT JOIN unidades_administrativas ua ON ua.id = rl.unidad_admin_id
        ORDER BY r.codigo ASC, p.primer_apellido ASC
      `;

      const result = await db.query(query);

      if (format.toLowerCase() === "csv") {
        const headers = [
          "No.",
          "Renglón",
          "Nombre Completo",
          "Cargo Nominal",
          "Puesto Funcional",
          "Unidad Administrativa",
          "Sueldo Base / Honorarios",
          "Bono Incentivo (Dto. 37-2001)",
          "Bono Profesional (Dto. 72-2001)",
          "Total Devengado Mensual (Q)",
        ];

        let csvLines = [headers.join(",")];
        result.rows.forEach((row) => {
          csvLines.push([
            row.correlativo_linea,
            `"${row.renglon_presupuestario}"`,
            `"${row.nombre_servidor.replace(/"/g, '""')}"`,
            `"${row.cargo_nominal.replace(/"/g, '""')}"`,
            `"${row.puesto_funcional.replace(/"/g, '""')}"`,
            `"${row.unidad_administrativa.replace(/"/g, '""')}"`,
            Number(row.sueldo_base_u_honorarios).toFixed(2),
            Number(row.bonificacion_incentivo).toFixed(2),
            Number(row.bonificacion_profesional).toFixed(2),
            Number(row.total_ingreso_devengado).toFixed(2),
          ].join(","));
        });

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="SCSPR_LAIP_Art10_Numeral4_${new Date().toISOString().split("T")[0]}.csv"`
        );
        return res.send(csvLines.join("\r\n"));
      }

      return res.json({
        success: true,
        marco_legal: "Decreto 57-2008 - Ley de Acceso a la Información Pública (Artículo 10, Numeral 4)",
        institucion: "Secretaría de Comunicación Social de la Presidencia (SCSPR)",
        total_registros: result.rows.length,
        data: result.rows,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error al generar reporte LAIP: " + error.message });
    }
  }
}

module.exports = new AnalyticsController();
