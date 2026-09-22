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
    if (db.isHealthy && db.pool) {
      const res = await db.pool.query(
        `SELECT vs.*, p.primer_nombre, p.primer_apellido, p.cui_dpi
         FROM vacaciones_saldos vs
         JOIN personas p ON vs.persona_id = p.id
         WHERE vs.persona_id = $1 AND vs.periodo_anio = $2`,
        [personaId, year]
      );
      if (res.rows.length > 0) {
        return res.rows[0];
      }
      // Si no existe kardex para el año, registrar saldo inicial por defecto (15 días)
      const newBalance = await db.pool.query(
        `INSERT INTO vacaciones_saldos (persona_id, periodo_anio, dias_derecho, dias_utilizados, dias_pendientes, fecha_acreditacion, estado)
         VALUES ($1, $2, 15.00, 0.00, 15.00, $3, 'VIGENTE')
         RETURNING *`,
        [personaId, year, `${year}-01-01`]
      );
      return newBalance.rows[0];
    } else {
      // Fallback a Mock Store
      return {
        id: `mock-balance-${personaId}`,
        persona_id: personaId,
        periodo_anio: parseInt(year),
        dias_derecho: 15.00,
        dias_utilizados: 3.00,
        dias_pendientes: 12.00,
        estado: 'VIGENTE'
      };
    }
  }

  /**
   * Listar solicitudes de vacaciones con filtros
   */
  async getVacationRequests(filters = {}) {
    const { persona_id, estado, unidad_id, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    if (db.isHealthy && db.pool) {
      let query = `
        SELECT vs.*, 
               p.primer_nombre || ' ' || p.primer_apellido AS colaborador_nombre,
               p.cui_dpi,
               u.nombre AS unidad_nombre
        FROM vacaciones_solicitudes vs
        JOIN personas p ON vs.persona_id = p.id
        LEFT JOIN relaciones_laborales rl ON p.id = rl.persona_id AND rl.es_contrato_actual = TRUE
        LEFT JOIN unidades_administrativas u ON rl.unidad_admin_id = u.id
        WHERE 1=1
      `;
      const values = [];
      let paramIdx = 1;

      if (persona_id) {
        query += ` AND vs.persona_id = $${paramIdx++}`;
        values.push(persona_id);
      }
      if (estado) {
        query += ` AND vs.estado = $${paramIdx++}`;
        values.push(estado);
      }
      if (unidad_id) {
        query += ` AND rl.unidad_admin_id = $${paramIdx++}`;
        values.push(unidad_id);
      }

      query += ` ORDER BY vs.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      values.push(limit, offset);

      const res = await db.pool.query(query, values);
      const countRes = await db.pool.query(`SELECT COUNT(*) FROM vacaciones_solicitudes`);
      const total = parseInt(countRes.rows[0].count);

      return {
        data: res.rows,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      };
    } else {
      return {
        data: mockStore.vacaciones_solicitudes || [],
        total: (mockStore.vacaciones_solicitudes || []).length,
        page: parseInt(page),
        limit: parseInt(limit)
      };
    }
  }

  /**
   * Crear nueva solicitud de vacaciones
   */
  async createVacationRequest(data, currentUser) {
    const { persona_id, fecha_inicio, fecha_fin, observaciones } = data;
    
    // 1. Calcular días hábiles
    const diasSolicitados = calculateWorkingDays(fecha_inicio, fecha_fin);
    if (diasSolicitados <= 0) {
      throw new Error('La fecha de fin debe ser igual o posterior a la fecha de inicio');
    }

    // Calcular fecha de retorno (siguiente día hábil después de fecha_fin)
    const retorno = new Date(fecha_fin);
    retorno.setDate(retorno.getDate() + 1);
    while (retorno.getDay() === 0 || retorno.getDay() === 6) {
      retorno.setDate(retorno.getDate() + 1);
    }
    const fechaRetornoStr = retorno.toISOString().split('T')[0];

    // 2. Obtener saldo
    const balance = await this.getCollaboratorBalance(persona_id);
    if (parseFloat(balance.dias_pendientes) < diasSolicitados) {
      throw new Error(`Saldo insuficiente: Dispone de ${balance.dias_pendientes} días y solicitó ${diasSolicitados}`);
    }

    // 3. Generar correlativo
    const year = new Date().getFullYear();
    const countRes = db.isHealthy && db.pool ? await db.pool.query(`SELECT COUNT(*) FROM vacaciones_solicitudes`) : { rows: [{ count: 1 }] };
    const num = parseInt(countRes.rows[0].count) + 1;
    const correlativo = `SCSPR-VAC-${year}-${String(num).padStart(4, '0')}`;

    if (db.isHealthy && db.pool) {
      const res = await db.pool.query(
        `INSERT INTO vacaciones_solicitudes (
          correlativo, persona_id, saldo_id, fecha_inicio, fecha_fin, fecha_retorno, dias_solicitados, estado, observaciones
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDIENTE_JEFE', $8)
        RETURNING *`,
        [correlativo, persona_id, balance.id, fecha_inicio, fecha_fin, fechaRetornoStr, diasSolicitados, observaciones || '']
      );
      
      const newRequest = res.rows[0];

      await auditService.logAction({
        usuario_id: currentUser.id,
        accion: 'CREATE',
        tabla_afectada: 'vacaciones_solicitudes',
        registro_id: newRequest.id,
        valores_nuevos: newRequest
      });

      return newRequest;
    } else {
      const mockReq = {
        id: `mock-req-${Date.now()}`,
        correlativo,
        persona_id,
        fecha_inicio,
        fecha_fin,
        fecha_retorno: fechaRetornoStr,
        dias_solicitados: diasSolicitados,
        estado: 'PENDIENTE_JEFE',
        created_at: new Date().toISOString()
      };
      if (!mockStore.vacaciones_solicitudes) mockStore.vacaciones_solicitudes = [];
      mockStore.vacaciones_solicitudes.push(mockReq);
      return mockReq;
    }
  }

  /**
   * Cambiar estado de aprobación (Jefe Inmediato o RRHH)
   */
  async updateRequestStatus(requestId, newStatus, currentUser, comments = '') {
    if (!['APROBADO_JEFE', 'APROBADO_RRHH', 'RECHAZADO', 'CANCELADO'].includes(newStatus)) {
      throw new Error(`Estado no válido: ${newStatus}`);
    }

    if (db.isHealthy && db.pool) {
      const currentReq = await db.pool.query(`SELECT * FROM vacaciones_solicitudes WHERE id = $1`, [requestId]);
      if (currentReq.rows.length === 0) throw new Error('Solicitud de vacaciones no encontrada');

      const req = currentReq.rows[0];

      let updateQuery = `UPDATE vacaciones_solicitudes SET estado = $1, observaciones = COALESCE($2, observaciones), updated_at = CURRENT_TIMESTAMP`;
      const params = [newStatus, comments];
      let pIdx = 3;

      if (newStatus === 'APROBADO_JEFE') {
        updateQuery += `, jefe_visto_bueno_usuario_id = $${pIdx++}, jefe_visto_bueno_fecha = CURRENT_TIMESTAMP`;
        params.push(currentUser.id);
      } else if (newStatus === 'APROBADO_RRHH') {
        updateQuery += `, rrhh_aprobador_usuario_id = $${pIdx++}, rrhh_aprobador_fecha = CURRENT_TIMESTAMP`;
        params.push(currentUser.id);

        // Descontar días del saldo kardex
        await db.pool.query(
          `UPDATE vacaciones_saldos 
           SET dias_utilizados = dias_utilizados + $1,
               dias_pendientes = dias_derecho - (dias_utilizados + $1),
               updated_at = CURRENT_TIMESTAMP
           WHERE persona_id = $2 AND periodo_anio = $3`,
          [req.dias_solicitados, req.persona_id, new Date(req.fecha_inicio).getFullYear()]
        );
      }

      updateQuery += ` WHERE id = $${pIdx} RETURNING *`;
      params.push(requestId);

      const updated = await db.pool.query(updateQuery, params);

      await auditService.logAction({
        usuario_id: currentUser.id,
        accion: 'UPDATE_VACATION_STATUS',
        tabla_afectada: 'vacaciones_solicitudes',
        registro_id: requestId,
        valores_anteriores: req,
        valores_nuevos: updated.rows[0]
      });

      return updated.rows[0];
    } else {
      return { id: requestId, estado: newStatus, updated_at: new Date().toISOString() };
    }
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
}

module.exports = new VacationsService();

