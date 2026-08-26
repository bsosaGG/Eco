const express = require('express');
const router = express.Router();
const db = require('../config/db-transportes');
const { verifyToken, checkPermission } = require('../middleware/auth.middleware');

// ==========================================
// 1. MÓDULO PÚBLICO: FORMULARIO DE SOLICITUD
// ==========================================
router.post('/solicitudes/publica', verifyToken, checkPermission('transportes:read'), async (req, res) => {
    const { 
        usuario_id,
        solicitante, 
        dependencia, 
        direccion, 
        destino, 
        motivo, 
        fecha_salida, 
        pasajeros, 
        tipo_vehiculo, 
        telefono 
    } = req.body;

    if (!solicitante || !dependencia || !destino || !motivo || !fecha_salida || !pasajeros) {
        return res.status(400).json({ message: 'Faltan campos obligatorios para procesar la solicitud.' });
    }

    try {
        const query = `
            INSERT INTO solicitudes (usuario_id, solicitante, dependencia, direccion, destino, motivo, fecha_salida, pasajeros, tipo_vehiculo, telefono, estado)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pendiente')
            RETURNING *;
        `;
        const values = [
            usuario_id || null, 
            solicitante, 
            dependencia, 
            direccion || '', 
            destino, 
            motivo, 
            fecha_salida, 
            pasajeros, 
            tipo_vehiculo || null, 
            telefono || ''
        ];
        const result = await db.query(query, values);

        res.status(201).json({ 
            message: 'Solicitud enviada exitosamente.', 
            solicitud: result.rows[0] 
        });
    } catch (error) {
        console.error('Error al registrar solicitud pública:', error);
        res.status(500).json({ message: 'Error interno al procesar la solicitud.' });
    }
});

// ==========================================
// 2. MÓDULO INTERNO: MIS SOLICITUDES
// ==========================================
router.get('/solicitudes/area', verifyToken, checkPermission('transportes:read'), async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM solicitudes WHERE usuario_id = $1 ORDER BY id DESC;',
            [req.user.userId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al consultar solicitudes del usuario:', error);
        res.status(500).json({ message: 'Error al obtener las solicitudes del usuario.' });
    }
});

router.patch('/solicitudes/:id/estado', verifyToken, checkPermission('transportes:write'), async (req, res) => {
    const { id } = req.params;
    const { estado, justificacion } = req.body;

    if (!['APROBADO', 'RECHAZADO'].includes(estado)) {
        return res.status(400).json({ message: 'El estado debe ser APROBADO o RECHAZADO.' });
    }

    if (estado === 'RECHAZADO' && (!justificacion || justificacion.trim() === '')) {
        return res.status(400).json({ message: 'La justificación es obligatoria para rechazar la solicitud.' });
    }

    try {
        const result = await db.query(
            `UPDATE solicitudes SET estado = $1, justificacion = $2 WHERE id = $3 RETURNING *;`,
            [estado, justificacion || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Solicitud no encontrada.' });
        }

        res.status(200).json({ message: `Solicitud ${estado.toLowerCase()} correctamente.`, solicitud: result.rows[0] });
    } catch (error) {
        console.error('Error al actualizar estado de solicitud:', error);
        res.status(500).json({ message: 'Error interno al actualizar la solicitud.' });
    }
});

// ==========================================
// 3. MÓDULO INTERNO: ADMINISTRADOR (SERVICIOS GENERALES)
// ==========================================
router.get('/admin/solicitudes', verifyToken, checkPermission('transportes:admin'), async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM solicitudes ORDER BY id DESC;');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al consultar panel global:', error);
        res.status(500).json({ message: 'Error al obtener el historial completo.' });
    }
});

router.put('/admin/solicitudes/:id/asignar', verifyToken, checkPermission('transportes:admin'), async (req, res) => {
    const { id } = req.params;
    const { conductor, vehiculo, placa, color } = req.body;

    if (!conductor || !vehiculo) {
        return res.status(400).json({ message: 'Debe especificar el conductor y el vehículo a asignar.' });
    }

    try {
        const result = await db.query(
            `UPDATE solicitudes 
             SET conductor = $1, vehiculo = $2, placa = $3, color = $4, estado = 'Asignado' 
             WHERE id = $5 RETURNING *;`,
            [conductor, vehiculo, placa || null, color || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Solicitud no encontrada.' });
        }

        res.status(200).json({ message: 'Piloto y vehículo asignados correctamente.', solicitud: result.rows[0] });
    } catch (error) {
        console.error('Error al asignar unidad:', error);
        res.status(500).json({ message: 'Error al guardar la asignación.' });
    }
});

module.exports = router;