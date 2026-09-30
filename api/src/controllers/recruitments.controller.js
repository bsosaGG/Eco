/**
 * Recruitments Controller (Ola 4 - Core Humanis SCSPR)
 * RESTful Level 3 HATEOAS controller for job openings, applicant shortlisting and terna selection.
 */

const db = require("../config/db-core-humanis");
const evaluationsService = require("../services/evaluations.service");
const { buildRecruitmentLinks, buildRecruitmentCollectionLinks } = require("../utils/hateoas.helper");
const { registrarAuditoria } = require("../services/audit.service");

class RecruitmentsController {
  async getRecruitments(req, res) {
    try {
      const { renglon, estado, search, page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let whereClauses = [];
      let params = [];

      if (renglon) {
        params.push(renglon);
        whereClauses.push(`c.renglon_presupuestario = $${params.length}`);
      }
      if (estado) {
        params.push(estado);
        whereClauses.push(`c.estado = $${params.length}`);
      }
      if (search) {
        params.push(`%${search}%`);
        whereClauses.push(`(c.titulo_plaza ILIKE $${params.length} OR c.correlativo ILIKE $${params.length} OR c.unidad_administrativa ILIKE $${params.length})`);
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

      const countResult = await db.query(
        `SELECT COUNT(*) as total FROM convocatorias_plazas c ${whereSql}`,
        params
      );
      const total = parseInt(countResult.rows[0]?.total || "0", 10);

      params.push(Number(limit));
      const limitIdx = params.length;
      params.push(offset);
      const offsetIdx = params.length;

      const query = `
        SELECT c.*,
               COUNT(p.id) as total_postulaciones,
               COUNT(CASE WHEN p.en_terna = true THEN 1 END) as total_en_terna
        FROM convocatorias_plazas c
        LEFT JOIN postulaciones_candidatos p ON p.convocatoria_id = c.id
        ${whereSql}
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `;

      const result = await db.query(query, params);

      const items = result.rows.map((row) => ({
        ...row,
        _links: buildRecruitmentLinks(row.id),
      }));

      return res.json({
        success: true,
        data: items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
        _links: buildRecruitmentCollectionLinks(Number(page), Math.ceil(total / Number(limit)), Number(limit)),
      });
    } catch (error) {
      req.log ? req.log.error(error) : console.error(error);
      return res.status(500).json({ success: false, message: "Error al listar convocatorias: " + error.message });
    }
  }

  async getRecruitmentById(req, res) {
    try {
      const { id } = req.params;
      const convRes = await db.query(`SELECT * FROM convocatorias_plazas WHERE id = $1`, [id]);

      if (convRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Convocatoria no encontrada" });
      }

      const convocatoria = convRes.rows[0];

      const postRes = await db.query(
        `SELECT * FROM postulaciones_candidatos WHERE convocatoria_id = $1 ORDER BY en_terna DESC, punteo_total DESC, created_at ASC`,
        [id]
      );

      convocatoria.postulaciones = postRes.rows;
      convocatoria._links = buildRecruitmentLinks(id);

      return res.json({ success: true, data: convocatoria });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error al obtener convocatoria: " + error.message });
    }
  }

  async createRecruitment(req, res) {
    try {
      const {
        titulo_plaza,
        renglon_presupuestario,
        puesto_nominal_id,
        puesto_funcional_id,
        unidad_administrativa,
        salario_honorarios,
        descripcion_puesto,
        requisitos_academicos,
        experiencia_laboral,
        fecha_publicacion,
        fecha_cierre,
        plazas_disponibles = 1,
      } = req.body;

      if (!titulo_plaza || !renglon_presupuestario || !unidad_administrativa || !salario_honorarios) {
        return res.status(400).json({ success: false, message: "Título, renglón, unidad y salario son obligatorios" });
      }

      const anio = new Date().getFullYear();
      const countRes = await db.query(
        `SELECT COUNT(*) as total FROM convocatorias_plazas WHERE EXTRACT(YEAR FROM created_at) = $1`,
        [anio]
      );
      const nextNum = String(parseInt(countRes.rows[0]?.total || "0", 10) + 1).padStart(3, "0");
      const correlativo = `SCSPR-CONV-${anio}-${nextNum}`;

      const insertRes = await db.query(
        `INSERT INTO convocatorias_plazas (
          correlativo, titulo_plaza, renglon_presupuestario, puesto_nominal_id, puesto_funcional_id,
          unidad_administrativa, salario_honorarios, descripcion_puesto, requisitos_academicos,
          experiencia_laboral, fecha_publicacion, fecha_cierre, plazas_disponibles, estado, creado_por_usuario_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'PUBLICADA', $14)
        RETURNING *`,
        [
          correlativo,
          titulo_plaza,
          renglon_presupuestario,
          puesto_nominal_id || null,
          puesto_funcional_id || null,
          unidad_administrativa,
          salario_honorarios,
          descripcion_puesto || "",
          requisitos_academicos || "",
          experiencia_laboral || "",
          fecha_publicacion || new Date().toISOString().split("T")[0],
          fecha_cierre || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          plazas_disponibles,
          req.user?.id || null,
        ]
      );

      const nuevaConv = insertRes.rows[0];
      nuevaConv._links = buildRecruitmentLinks(nuevaConv.id);

      await registrarAuditoria({
        usuarioId: req.user?.id,
        usuarioUsername: req.user?.username || "sistema",
        accion: "CREAR_CONVOCATORIA",
        tablaAfectada: "convocatorias_plazas",
        registroId: nuevaConv.id,
        valoresNuevos: nuevaConv,
        ipAddress: req.ip || "127.0.0.1",
        userAgent: req.get("user-agent") || "",
        detalles: `Creación de convocatoria pública ${correlativo} (${titulo_plaza})`,
      });

      return res.status(201).json({
        success: true,
        message: `Convocatoria ${correlativo} publicada exitosamente`,
        data: nuevaConv,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error al crear convocatoria: " + error.message });
    }
  }

  async updateRecruitmentStatus(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      const validStates = ["BORRADOR", "PUBLICADA", "EN_EVALUACION", "FINALIZADA", "CANCELADA"];
      if (!validStates.includes(estado)) {
        return res.status(400).json({ success: false, message: "Estado inválido: " + estado });
      }

      const prevRes = await db.query(`SELECT * FROM convocatorias_plazas WHERE id = $1`, [id]);
      if (prevRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Convocatoria no encontrada" });
      }
      const prevData = prevRes.rows[0];

      const updateRes = await db.query(
        `UPDATE convocatorias_plazas SET estado = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
        [estado, id]
      );

      const newData = updateRes.rows[0];

      await registrarAuditoria({
        usuarioId: req.user?.id,
        usuarioUsername: req.user?.username || "sistema",
        accion: "CAMBIAR_ESTADO_CONVOCATORIA",
        tablaAfectada: "convocatorias_plazas",
        registroId: id,
        valoresAnteriores: { estado: prevData.estado },
        valoresNuevos: { estado: newData.estado },
        ipAddress: req.ip || "127.0.0.1",
        userAgent: req.get("user-agent") || "",
        detalles: `Cambio de estado de convocatoria ${prevData.correlativo} de ${prevData.estado} a ${estado}`,
      });

      return res.json({ success: true, message: `Estado actualizado a ${estado}`, data: newData });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error al actualizar estado: " + error.message });
    }
  }

  async updateRecruitment(req, res) {
    try {
      const { id } = req.params;
      const {
        titulo_plaza,
        renglon_presupuestario,
        unidad_administrativa,
        salario_honorarios,
        plazas_disponibles,
        fecha_cierre,
        estado
      } = req.body;

      const prevRes = await db.query(`SELECT * FROM convocatorias_plazas WHERE id = $1`, [id]);
      if (prevRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Convocatoria no encontrada" });
      }
      const prevData = prevRes.rows[0];

      // Verificar si existen postulaciones de candidatos
      const appCheck = await db.query(
        `SELECT COUNT(*) as total FROM postulaciones_candidatos WHERE convocatoria_id = $1`,
        [id]
      );
      const totalApps = parseInt(appCheck.rows[0]?.total || "0", 10);

      if (totalApps > 0) {
        // Si hay postulantes, solo permitir actualización de 'estado'
        if (estado) {
          const validStates = ["BORRADOR", "PUBLICADA", "EN_EVALUACION", "FINALIZADA", "CANCELADA"];
          if (!validStates.includes(estado)) {
            return res.status(400).json({ success: false, message: "Estado inválido: " + estado });
          }
          const updateRes = await db.query(
            `UPDATE convocatorias_plazas SET estado = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
            [estado, id]
          );

          await registrarAuditoria({
            usuarioId: req.user?.id,
            usuarioUsername: req.user?.username || "sistema",
            accion: "CAMBIAR_ESTADO_CONVOCATORIA",
            tablaAfectada: "convocatorias_plazas",
            registroId: id,
            valoresAnteriores: { estado: prevData.estado },
            valoresNuevos: { estado: updateRes.rows[0].estado },
            ipAddress: req.ip || "127.0.0.1",
            userAgent: req.get("user-agent") || "",
            detalles: `Actualización de estado de convocatoria ${prevData.correlativo} a ${estado}`,
          });

          return res.json({ success: true, message: `Estado actualizado a ${estado}`, data: updateRes.rows[0] });
        } else {
          return res.status(400).json({
            success: false,
            message: "No se pueden modificar los términos de la convocatoria porque ya cuenta con postulantes registrados."
          });
        }
      }

      // Si no hay postulantes, permitir actualización completa de todos los campos
      const updateRes = await db.query(
        `UPDATE convocatorias_plazas SET
           titulo_plaza = COALESCE($1, titulo_plaza),
           renglon_presupuestario = COALESCE($2, renglon_presupuestario),
           unidad_administrativa = COALESCE($3, unidad_administrativa),
           salario_honorarios = COALESCE($4, salario_honorarios),
           plazas_disponibles = COALESCE($5, plazas_disponibles),
           fecha_cierre = COALESCE($6, fecha_cierre),
           estado = COALESCE($7, estado),
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $8 RETURNING *`,
        [
          titulo_plaza || null,
          renglon_presupuestario || null,
          unidad_administrativa || null,
          salario_honorarios ? parseFloat(salario_honorarios) : null,
          plazas_disponibles ? parseInt(plazas_disponibles, 10) : null,
          fecha_cierre || null,
          estado || null,
          id
        ]
      );

      const newData = updateRes.rows[0];

      await registrarAuditoria({
        usuarioId: req.user?.id,
        usuarioUsername: req.user?.username || "sistema",
        accion: "ACTUALIZAR_CONVOCATORIA",
        tablaAfectada: "convocatorias_plazas",
        registroId: id,
        valoresAnteriores: prevData,
        valoresNuevos: newData,
        ipAddress: req.ip || "127.0.0.1",
        userAgent: req.get("user-agent") || "",
        detalles: `Modificación de convocatoria ${prevData.correlativo} (${newData.titulo_plaza})`,
      });

      return res.json({ success: true, message: "Convocatoria actualizada exitosamente", data: newData });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error al actualizar convocatoria: " + error.message });
    }
  }

  async applyToRecruitment(req, res) {
    try {
      const { id } = req.params;
      const {
        cui,
        nombres,
        apellidos,
        email,
        telefono,
        grado_academico,
        profesion_oficio,
        resumen_perfil,
        cv_url,
      } = req.body;

      if (!cui || !nombres || !apellidos || !email || !grado_academico) {
        return res.status(400).json({ success: false, message: "CUI, nombres, apellidos, email y grado académico son obligatorios" });
      }

      const dupRes = await db.query(
        `SELECT id FROM postulaciones_candidatos WHERE convocatoria_id = $1 AND cui = $2`,
        [id, cui]
      );
      if (dupRes.rows.length > 0) {
        return res.status(409).json({ success: false, message: "Este candidato ya cuenta con una postulación registrada para esta plaza" });
      }

      const insertRes = await db.query(
        `INSERT INTO postulaciones_candidatos (
          convocatoria_id, cui, nombres, apellidos, email, telefono, grado_academico,
          profesion_oficio, resumen_perfil, cv_url, estado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'POSTULADO')
        RETURNING *`,
        [id, cui, nombres, apellidos, email, telefono || null, grado_academico, profesion_oficio || null, resumen_perfil || null, cv_url || null]
      );

      const nuevaPost = insertRes.rows[0];

      await registrarAuditoria({
        usuarioId: req.user?.id,
        usuarioUsername: req.user?.username || "sistema",
        accion: "POSTULAR_CANDIDATO",
        tablaAfectada: "postulaciones_candidatos",
        registroId: nuevaPost.id,
        valoresNuevos: nuevaPost,
        ipAddress: req.ip || "127.0.0.1",
        userAgent: req.get("user-agent") || "",
        detalles: `Registro de postulación de candidato ${nombres} ${apellidos} (CUI: ${cui})`,
      });

      return res.status(201).json({ success: true, message: "Postulación registrada exitosamente", data: nuevaPost });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error al postular candidato: " + error.message });
    }
  }

  async scoreCandidate(req, res) {
    try {
      const { id, appId } = req.params;
      const { punteo_curricular = 0, punteo_tecnico = 0, punteo_entrevista = 0, observaciones } = req.body;

      const prevRes = await db.query(`SELECT * FROM postulaciones_candidatos WHERE id = $1 AND convocatoria_id = $2`, [appId, id]);
      if (prevRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Postulación no encontrada" });
      }
      const prevData = prevRes.rows[0];

      const scoring = evaluationsService.calculateCandidateScore(punteo_curricular, punteo_tecnico, punteo_entrevista);

      const updateRes = await db.query(
        `UPDATE postulaciones_candidatos SET
          punteo_curricular = $1,
          punteo_tecnico = $2,
          punteo_entrevista = $3,
          punteo_total = $4,
          en_terna = $5,
          estado = 'EVALUADO',
          observaciones = COALESCE($6, observaciones),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7 AND convocatoria_id = $8
        RETURNING *`,
        [
          scoring.punteo_curricular,
          scoring.punteo_tecnico,
          scoring.punteo_entrevista,
          scoring.punteo_total,
          scoring.en_terna,
          observaciones,
          appId,
          id,
        ]
      );

      const newData = updateRes.rows[0];

      await registrarAuditoria({
        usuarioId: req.user?.id,
        usuarioUsername: req.user?.username || "sistema",
        accion: "CALIFICAR_CANDIDATO",
        tablaAfectada: "postulaciones_candidatos",
        registroId: appId,
        valoresAnteriores: prevData,
        valoresNuevos: newData,
        ipAddress: req.ip || "127.0.0.1",
        userAgent: req.get("user-agent") || "",
        detalles: `Calificación de candidato ${prevData.nombres} ${prevData.apellidos}: Punteo Total ${scoring.punteo_total}/100 (${scoring.en_terna ? "En Terna" : "No clasifica"})`,
      });

      return res.json({
        success: true,
        message: `Candidato calificado (${scoring.punteo_total}/100). ${scoring.en_terna ? "Preseleccionado para terna" : "No alcanza puntaje de terna"}`,
        data: newData,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error al calificar candidato: " + error.message });
    }
  }

  async selectWinnerCandidate(req, res) {
    try {
      const { id, appId } = req.params;

      const candRes = await db.query(
        `SELECT * FROM postulaciones_candidatos WHERE id = $1 AND convocatoria_id = $2`,
        [appId, id]
      );
      if (candRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Postulación no encontrada" });
      }
      const prevData = candRes.rows[0];

      const updateRes = await db.query(
        `UPDATE postulaciones_candidatos SET estado = 'SELECCIONADO', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [appId]
      );

      const newData = updateRes.rows[0];

      await registrarAuditoria({
        usuarioId: req.user?.id,
        usuarioUsername: req.user?.username || "sistema",
        accion: "SELECCIONAR_GANADOR_TERNA",
        tablaAfectada: "postulaciones_candidatos",
        registroId: appId,
        valoresAnteriores: { estado: prevData.estado },
        valoresNuevos: { estado: newData.estado },
        ipAddress: req.ip || "127.0.0.1",
        userAgent: req.get("user-agent") || "",
        detalles: `Selección de candidato ganador de terna: ${newData.nombres} ${newData.apellidos} (CUI: ${newData.cui})`,
      });

      return res.json({
        success: true,
        message: `Candidato ${newData.nombres} ${newData.apellidos} seleccionado como ganador de la plaza. Expediente listo para formalización.`,
        data: newData,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error al seleccionar ganador: " + error.message });
    }
  }
}

module.exports = new RecruitmentsController();
