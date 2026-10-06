/**
 * SERVICIO DE NEGOCIO: GESTIÓN DE VACACIONES Y SALDOS KARDEX (OLA 2)
 * Secretaría de Comunicación Social de la Presidencia (SCSPR)
 */

const db = require('../config/db-core-humanis');
const mockStore = require('../config/mock-store');
const auditService = require('./audit.service');

// Helper: Calcular días hábiles entre dos fechas (excluyendo sábados y domingos)
function calculateWorkingDays(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Domingo, 6 = Sábado
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

class VacationsService {
  /**
   * Obtener saldo kardex de vacaciones por colaborador y período
   */
  async getCollaboratorBalance(personaId, year = new Date().getFullYear()) {
    const res = await db.query(
      `SELECT vs.*, p.primer_nombre, p.primer_apellido, p.cui_dpi
       FROM vacaciones_saldos vs
       JOIN personas p ON vs.persona_id = p.id
       WHERE vs.persona_id = $1 AND vs.periodo_anio = $2`,
      [personaId, year]
    );
    if (res.rows.length > 0) {
      return res.rows[0];
    }
    // Si no existe kardex para el año, registrar saldo inicial por defecto (15 días de ley)
    const newBalance = await db.query(
      `INSERT INTO vacaciones_saldos (persona_id, periodo_anio, dias_derecho, dias_utilizados, dias_pendientes, fecha_acreditacion, estado)
       VALUES ($1, $2, 15.00, 0.00, 15.00, $3, 'VIGENTE')
       RETURNING *`,
      [personaId, year, `${year}-01-01`]
    );
    return newBalance.rows[0];
  }

  /**
   * Obtener todos los saldos kardex de los colaboradores para el año especificado
   */
  async getAllBalances(year = new Date().getFullYear()) {
    const query = `
      SELECT p.id as persona_id,
             p.primer_nombre, p.primer_apellido, p.cui_dpi,
             r.codigo as renglon_codigo,
             pf.nombre as puesto_funcional,
             u.nombre as unidad_nombre,
             COALESCE(vs.dias_derecho, 15.00) as dias_derecho,
             COALESCE(vs.dias_utilizados, 0.00) as dias_utilizados,
             COALESCE(vs.dias_pendientes, 15.00) as dias_pendientes,
             COALESCE(vs.estado, 'VIGENTE') as estado,
             vs.id as saldo_id
      FROM personas p
      LEFT JOIN relaciones_laborales rl ON rl.persona_id = p.id AND rl.es_contrato_actual = TRUE
      LEFT JOIN renglones_presupuestarios r ON r.id = rl.renglon_id
      LEFT JOIN puestos_funcionales pf ON pf.id = rl.puesto_funcional_id
      LEFT JOIN unidades_administrativas u ON u.id = rl.unidad_admin_id
      LEFT JOIN vacaciones_saldos vs ON vs.persona_id = p.id AND vs.periodo_anio = $1
      WHERE p.activo = TRUE
      ORDER BY p.primer_nombre, p.primer_apellido
    `;
    const res = await db.query(query, [year]);
    return res.rows;
  }

  /**
   * Listar solicitudes de vacaciones con filtros
   */
  async getVacationRequests(filters = {}) {
    const { persona_id, estado, unidad_id, page = 1, limit = 10 } = filters;
    const offset = (Number(page) - 1) * Number(limit);

    let baseWhere = `WHERE 1=1`;
    const values = [];
    let paramIdx = 1;

    if (persona_id) {
      baseWhere += ` AND vs.persona_id = $${paramIdx++}`;
      values.push(persona_id);
    }
    if (estado) {
      baseWhere += ` AND vs.estado = $${paramIdx++}`;
      values.push(estado);
    }
    if (unidad_id) {
      baseWhere += ` AND rl.unidad_admin_id = $${paramIdx++}`;
      values.push(unidad_id);
    }

    const countQuery = `
      SELECT COUNT(*) 
      FROM vacaciones_solicitudes vs 
      LEFT JOIN relaciones_laborales rl ON vs.persona_id = rl.persona_id AND rl.es_contrato_actual = TRUE 
      ${baseWhere}
    `;
    const countRes = await db.query(countQuery, values);
    const total = parseInt(countRes.rows[0]?.count || "0", 10);

    let query = `
      SELECT vs.*, 
             p.primer_nombre || ' ' || p.primer_apellido AS colaborador_nombre,
             p.cui_dpi,
             u.nombre AS unidad_nombre
      FROM vacaciones_solicitudes vs
      JOIN personas p ON vs.persona_id = p.id
      LEFT JOIN relaciones_laborales rl ON p.id = rl.persona_id AND rl.es_contrato_actual = TRUE
      LEFT JOIN unidades_administrativas u ON rl.unidad_admin_id = u.id
      ${baseWhere}
      ORDER BY vs.created_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;
    const queryValues = [...values, Number(limit), offset];
    const res = await db.query(query, queryValues);

    return {
      data: res.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    };
  }

  /**
   * Crear nueva solicitud de vacaciones
   */
  async createVacationRequest(data, currentUser) {
    const { persona_id, fecha_inicio, fecha_fin, observaciones } = data;
    
    // 1. Calcular días hábiles
    const diasSolicitados = this.calculateWorkingDays(fecha_inicio, fecha_fin);
    if (diasSolicitados <= 0) {
      throw new Error('La fecha de fin debe ser igual o posterior a la fecha de inicio');
    }

    // Calcular fecha de retorno (siguiente día hábil después de fecha_fin)
    const fechaRetornoStr = this.calculateReturnDate(fecha_fin);

    // 2. Obtener o crear saldo Kardex para el año de la solicitud
    const year = new Date(fecha_inicio).getFullYear();
    const balance = await this.getCollaboratorBalance(persona_id, year);
    if (parseFloat(balance.dias_pendientes) < diasSolicitados) {
      throw new Error(`Saldo insuficiente en Kardex: Dispone de ${balance.dias_pendientes} días y solicitó ${diasSolicitados} días hábiles.`);
    }

    // 3. Generar correlativo oficial
    const countRes = await db.query(`SELECT COUNT(*) FROM vacaciones_solicitudes`);
    const num = parseInt(countRes.rows[0]?.count || 0) + 1;
    const correlativo = `SCSPR-VAC-${year}-${String(num).padStart(4, '0')}`;

    // 4. Insertar la solicitud
    const res = await db.query(
      `INSERT INTO vacaciones_solicitudes (
        correlativo, persona_id, saldo_id, fecha_inicio, fecha_fin, fecha_retorno, dias_solicitados, estado, observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDIENTE_JEFE', $8)
      RETURNING *`,
      [correlativo, persona_id, balance.id, fecha_inicio, fecha_fin, fechaRetornoStr, diasSolicitados, observaciones || '']
    );
    
    const newRequest = res.rows[0];

    // 5. Descontar inmediatamente los días solicitados del Kardex (dias_utilizados + N, dias_pendientes - N)
    await db.query(
      `UPDATE vacaciones_saldos 
       SET dias_utilizados = dias_utilizados + $1,
           dias_pendientes = dias_derecho - (dias_utilizados + $1),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [diasSolicitados, balance.id]
    );

    // 6. Auditoría institucional
    const auditUserId = currentUser?.id || currentUser?.userId;
    if (auditUserId) {
      await auditService.logAction({
        usuario_id: auditUserId,
        accion: 'CREATE',
        tabla_afectada: 'vacaciones_solicitudes',
        registro_id: newRequest.id,
        valores_nuevos: newRequest
      });
    }

    return newRequest;
  }

  /**
   * Cambiar estado de aprobación (Jefe Inmediato o RRHH)
   */
  async updateRequestStatus(requestId, newStatus, currentUser, comments = '') {
    if (!['APROBADO_JEFE', 'APROBADO_RRHH', 'RECHAZADO', 'CANCELADO'].includes(newStatus)) {
      throw new Error(`Estado no válido: ${newStatus}`);
    }

    const currentReq = await db.query(`SELECT * FROM vacaciones_solicitudes WHERE id = $1`, [requestId]);
    if (currentReq.rows.length === 0) throw new Error('Solicitud de vacaciones no encontrada');

    const req = currentReq.rows[0];

    let updateQuery = `UPDATE vacaciones_solicitudes SET estado = $1, observaciones = COALESCE($2, observaciones), updated_at = CURRENT_TIMESTAMP`;
    const params = [newStatus, comments];
    let pIdx = 3;

    if (newStatus === 'APROBADO_JEFE') {
      updateQuery += `, jefe_visto_bueno_usuario_id = $${pIdx++}, jefe_visto_bueno_fecha = CURRENT_TIMESTAMP`;
      params.push(currentUser?.id || null);
    } else if (newStatus === 'APROBADO_RRHH') {
      updateQuery += `, rrhh_aprobador_usuario_id = $${pIdx++}, rrhh_aprobador_fecha = CURRENT_TIMESTAMP`;
      params.push(currentUser?.id || null);
    }

    // Si se rechaza o cancela y estaba activa, devolver los días al saldo Kardex
    if (['RECHAZADO', 'CANCELADO'].includes(newStatus) && !['RECHAZADO', 'CANCELADO'].includes(req.estado)) {
      await db.query(
        `UPDATE vacaciones_saldos 
         SET dias_utilizados = GREATEST(0, dias_utilizados - $1),
             dias_pendientes = LEAST(dias_derecho, dias_pendientes + $1),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [req.dias_solicitados, req.saldo_id]
      );
    }

    updateQuery += ` WHERE id = $${pIdx} RETURNING *`;
    params.push(requestId);

    const updated = await db.query(updateQuery, params);

    const auditUserId = currentUser?.id || currentUser?.userId;
    if (auditUserId) {
      await auditService.logAction({
        usuario_id: auditUserId,
        accion: 'UPDATE_VACATION_STATUS',
        tabla_afectada: 'vacaciones_solicitudes',
        registro_id: requestId,
        valores_anteriores: req,
        valores_nuevos: updated.rows[0]
      });
    }

    return updated.rows[0];
  }

  /**
   * Helper: Calcular días hábiles entre dos fechas (excluyendo sábados, domingos y asuetos)
   */
  calculateWorkingDays(startDateStr, endDateStr) {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    let count = 0;
    const current = new Date(start);

    // Asuetos nacionales guatemaltecos fijos (MM-DD)
    const holidays = ['01-01', '05-01', '06-30', '09-15', '10-20', '11-01', '12-24', '12-25', '12-31'];

    while (current <= end) {
      const dayOfWeek = current.getDay();
      const monthDay = current.toISOString().slice(5, 10);
      
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(monthDay)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  }

  /**
   * Helper: Calcular día de retorno al trabajo (siguiente día hábil después de endDate)
   */
  calculateReturnDate(endDateStr) {
    const current = new Date(endDateStr);
    current.setDate(current.getDate() + 1);

    const holidays = ['01-01', '05-01', '06-30', '09-15', '10-20', '11-01', '12-24', '12-25', '12-31'];

    while (true) {
      const dayOfWeek = current.getDay();
      const monthDay = current.toISOString().slice(5, 10);

      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(monthDay)) {
        return current.toISOString().slice(0, 10);
      }
      current.setDate(current.getDate() + 1);
    }
  }

  /**
   * Obtiene el detalle enriquecido de una solicitud de vacaciones con Kardex y colaborador
   */
  async getRequestById(requestId) {
    const query = `
      SELECT vs.*,
             p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido,
             p.primer_nombre || ' ' || p.primer_apellido AS colaborador_nombre,
             p.cui_dpi, p.correo_institucional,
             r.codigo as renglon_codigo,
             pf.nombre as puesto_funcional,
             u.nombre as unidad_administrativa,
             vk.dias_derecho, vk.dias_utilizados, vk.dias_pendientes,
             ujefe.nombres as jefe_aprobador_nombre,
             urrhh.nombres as rrhh_aprobador_nombre
      FROM vacaciones_solicitudes vs
      JOIN personas p ON p.id = vs.persona_id
      LEFT JOIN relaciones_laborales rl ON rl.persona_id = p.id AND rl.es_contrato_actual = TRUE
      LEFT JOIN renglones_presupuestarios r ON r.id = rl.renglon_id
      LEFT JOIN puestos_funcionales pf ON pf.id = rl.puesto_funcional_id
      LEFT JOIN unidades_administrativas u ON u.id = rl.unidad_admin_id
      LEFT JOIN vacaciones_saldos vk ON vk.persona_id = p.id AND vk.periodo_anio = EXTRACT(YEAR FROM vs.fecha_inicio)
      LEFT JOIN usuarios ujefe ON ujefe.id = vs.jefe_visto_bueno_usuario_id
      LEFT JOIN usuarios urrhh ON urrhh.id = vs.rrhh_aprobador_usuario_id
      WHERE vs.id::text = $1 OR vs.correlativo = $1
    `;
    const res = await db.query(query, [requestId]);
    if (res.rows.length === 0) return null;
    return res.rows[0];
  }
}

module.exports = new VacationsService();

