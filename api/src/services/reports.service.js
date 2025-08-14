// api/src/services/reports.service.js
const { pacPool } = require("../config/db-pac");

class ReportsService {
  async getDashboardReports() {
    // Usamos Common Table Expressions (CTE) para claridad
    const query = `
            WITH EstadoIDs AS (
                SELECT 
                    (SELECT id_estado FROM pac_estados WHERE nombre = 'Vigente') AS vigente_id,
                    (SELECT id_estado FROM pac_estados WHERE nombre = 'En proceso') AS en_proceso_id,
                    (SELECT id_estado FROM pac_estados WHERE nombre = 'Recibido') AS recibido_id,
                    (SELECT id_estado FROM pac_estados WHERE nombre = 'Pagado') AS pagado_id
            ),
            Kpis AS (
                SELECT
                    -- Monto Total Planificado
                    SUM(CASE WHEN s.id_estado IN (e.vigente_id, e.en_proceso_id, e.recibido_id) THEN s.monto_total ELSE 0 END) AS monto_planificado,
                    -- Monto Total Pagado
                    SUM(CASE WHEN s.id_estado = e.pagado_id THEN s.monto_total ELSE 0 END) AS monto_pagado,
                    -- Solicitudes Vigentes
                    COUNT(CASE WHEN s.id_estado = e.vigente_id THEN 1 END) AS solicitudes_vigentes
                FROM pac_solicitudes s, EstadoIDs e
            ),
            MontoPorRenglon AS (
                SELECT 
                    r.nombre AS renglon_nombre,
                    SUM(CASE WHEN s.id_estado IN (e.vigente_id, e.en_proceso_id, e.recibido_id, e.pagado_id) THEN s.monto_total ELSE 0 END) AS planificado,
                    SUM(CASE WHEN s.id_estado = e.pagado_id THEN s.monto_total ELSE 0 END) AS pagado
                FROM pac_solicitudes s
                JOIN pac_renglones r ON s.id_renglon = r.id_renglon
                JOIN EstadoIDs e ON 1=1
                GROUP BY r.nombre
            ),
            DistribucionPorEstado AS (
                SELECT
                    e.nombre,
                    e.color,
                    COUNT(s.id_solicitud) AS cantidad
                FROM pac_solicitudes s
                JOIN pac_estados e ON s.id_estado = e.id_estado
                GROUP BY e.nombre, e.color
            )
            SELECT 
                (SELECT row_to_json(Kpis) FROM Kpis) AS kpis,
                (SELECT json_agg(MontoPorRenglon) FROM MontoPorRenglon) AS monto_por_renglon,
                (SELECT json_agg(DistribucionPorEstado) FROM DistribucionPorEstado) AS distribucion_por_estado;
        `;

    const result = await pacPool.query(query);
    const data = result.rows[0];

    // Calcular Ejecución en la aplicación
    const planificadoTotal =
      parseFloat(data.kpis.monto_planificado || 0) +
      parseFloat(data.kpis.monto_pagado || 0);
    const pagadoTotal = parseFloat(data.kpis.monto_pagado || 0);

    data.kpis.ejecucion =
      planificadoTotal > 0
        ? ((pagadoTotal / planificadoTotal) * 100).toFixed(2)
        : "0.00";
    // Renombrar monto_planificado para que solo incluya los estados no-pagados
    data.kpis.monto_planificado = parseFloat(data.kpis.monto_planificado || 0);

    return data;
  }
}
module.exports = new ReportsService();
