const express = require('express');
const router = express.Router();
const db = require('../config/db-transportes');
const { verifyToken, checkPermission } = require('../middleware/auth.middleware');
const emailService = require("../services/email.service");
const { getTransporteAdminsEmails, getUserEmailById } = require('../services/transportes-helper');

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
        telefono,
        correos_notificacion,
    } = req.body;

    if (!solicitante || !dependencia || !destino || !motivo || !fecha_salida || !pasajeros) {
        return res.status(400).json({ message: 'Faltan campos obligatorios para procesar la solicitud.' });
    }

    try {
        const query = `
            INSERT INTO solicitudes (usuario_id, solicitante, dependencia, direccion, destino, motivo, fecha_salida, pasajeros, tipo_vehiculo, telefono, estado, correos_notificacion)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pendiente', $11)
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
            tipo_vehiculo == 'null' ? null : tipo_vehiculo, 
            telefono || '',
            correos_notificacion || ''
        ];
        const result = await db.query(query, values);

        getTransporteAdminsEmails()
            .then(emails => {
                const nuevaSolicitud = result.rows[0];
                const subject = `Nueva Solicitud de Transporte Pendiente - ID: ${nuevaSolicitud.id}`;
                const textBody = `Se ha recibido una nueva solicitud.\n\nSolicitante: ${nuevaSolicitud.solicitante}\nDestino: ${nuevaSolicitud.destino}`;
                const htmlBody = `
                    <h3>Nueva Solicitud de Transporte Pendiente</h3>
                    <p><strong>Solicitante:</strong> ${nuevaSolicitud.solicitante}</p>
                    <p><strong>Dependencia:</strong> ${nuevaSolicitud.dependencia}</p>
                    <p><strong>Dirección:</strong> ${nuevaSolicitud.direccion}</p>
                    <p><strong>Destino:</strong> ${nuevaSolicitud.destino}</p>
                    <p><strong>Motivo:</strong> ${nuevaSolicitud.motivo}</p>
                    <p><strong>Fecha de Salida:</strong> ${nuevaSolicitud.fecha_salida}</p>
                    <p><strong>Pasajeros:</strong> ${nuevaSolicitud.pasajeros}</p>
                    <p><strong>Tipo de Vehículo:</strong> ${nuevaSolicitud.tipo_vehiculo || 'No especificado'}</p>
                    <p><strong>Teléfono:</strong> ${nuevaSolicitud.telefono}</p>
                    <br>
                    <p>Por favor, ingresa al panel de administración para gestionar esta solicitud.</p>
                `;

                emails.forEach(email => {
                    emailService.sendEmail(email, subject, htmlBody, textBody);
                });
            })
            .catch(err => console.error('Error al enviar notificaciones a administradores de transporte:', err));

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

        const solicitudActualizada = result.rows[0];
        if (solicitudActualizada.usuario_id) {
            getUserEmailById(solicitudActualizada.usuario_id)
                .then(email => {
                    const emails = solicitudActualizada.correos_notificacion ? solicitudActualizada.correos_notificacion.split(',') : [];
                    if (email) {
                        emails.push(email);
                    }
                    if (emails.length > 0) {
                        const subject = `Actualización de Estado - Solicitud de Transporte ID: ${solicitudActualizada.id}`;
                        const textBody = `Tu solicitud de transporte ha cambiado de estado.\n\nNuevo Estado: ${solicitudActualizada.estado}\nJustificación/Notas: ${solicitudActualizada.justificacion || 'Ninguna'}`;
                        const htmlBody = `
                            <h3>Actualización de tu Solicitud de Transporte</h3>
                            <p><strong>ID Solicitud:</strong> ${solicitudActualizada.id}</p>
                            <p><strong>Nuevo Estado:</strong> <span style="font-weight:bold;">${solicitudActualizada.estado}</span></p>
                            <p><strong>Justificación:</strong> ${solicitudActualizada.justificacion || 'Ninguna'}</p>
                            <br>
                            <p>Puedes verificar los detalles ingresando a tu panel de solicitudes.</p>
                        `;
                        emailService.sendEmail(emails, subject, htmlBody, textBody);
                    }
                })
                .catch(err => console.error('Error al notificar cambio de estado al usuario:', err));
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

        const solicitudAsignada = result.rows[0];
        if (solicitudAsignada.usuario_id) {
            getUserEmailById(solicitudAsignada.usuario_id)
                .then(email => {
                    const emails = solicitudAsignada.correos_notificacion ? solicitudAsignada.correos_notificacion.split(',') : [];
                    if (email) {
                        emails.push(email);
                    }
                    if (emails.length > 0) {
                        const subject = `Vehículo y Piloto Asignados - Solicitud ID: ${solicitudAsignada.id}`;
                        const textBody = `Se han asignado recursos a tu solicitud de transporte.\n\nConductor: ${solicitudAsignada.conductor}\nVehículo: ${solicitudAsignada.vehiculo}\nPlaca: ${solicitudAsignada.placa || 'N/A'}\nColor: ${solicitudAsignada.color || 'N/A'}`;
                        const htmlBody = `
                            <h3>Asignación de Transporte Confirmada</h3>
                            <p><strong>ID Solicitud:</strong> ${solicitudAsignada.id}</p>
                            <p><strong>Piloto Asignado:</strong> ${solicitudAsignada.conductor}</p>
                            <p><strong>Vehículo:</strong> ${solicitudAsignada.vehiculo}</p>
                            <p><strong>Placa:</strong> ${solicitudAsignada.placa || 'No especificada'}</p>
                            <p><strong>Color:</strong> ${solicitudAsignada.color || 'No especificado'}</p>
                            <br>
                            <p>Tu transporte se encuentra listo para la fecha programada.</p>
                        `;
                        emailService.sendEmail(emails, subject, htmlBody, textBody);
                    }
                })
                .catch(err => console.error('Error al notificar asignación al usuario:', err));
        }

        res.status(200).json({ message: 'Piloto y vehículo asignados correctamente.', solicitud: result.rows[0] });
    } catch (error) {
        console.error('Error al asignar unidad:', error);
        res.status(500).json({ message: 'Error al guardar la asignación.' });
    }
});

module.exports = router;