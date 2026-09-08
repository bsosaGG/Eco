const express = require("express");
const router = express.Router();
const axios = require("axios");
const { verifyToken, checkPermission } = require("../middleware/auth.middleware");

// Dirección base limpia del contenedor de Python
const PYTHON_SERVICE_URL = "http://plan_medios_app_container:80";

const forwardToPython = async (req, res) => {
    // Proxy 100% plano: Mantiene el path original completo intacto (ej: /api/plan-medios/health)
    const targetUrl = `${PYTHON_SERVICE_URL}${req.originalUrl}`;
    
    console.log(`[PUENTE PLAN-MEDIOS] >>> Solicitud recibida en Core: ${req.method} ${req.originalUrl}`);
    console.log(`[PUENTE PLAN-MEDIOS] >>> Redirigiendo de forma plana hacia Python a: ${targetUrl}`);

    try {
        const response = await axios({
            method: req.method,
            url: targetUrl,
            data: req.body,
            headers: {
                ...req.headers,
                "X-User-Id": req.user?.userId,
                "X-User-Email": req.user?.email,
                "X-User-Role": req.user?.role,
                "X-User-Name": req.user?.name,
                "authorization": undefined
            },
            params: req.query,
            responseType: "arraybuffer",
            validateStatus: () => true
        });
        
        console.log(`[PUENTE PLAN-MEDIOS] <<< Respuesta recibida de Python: Status ${response.status}`);
        if (response.headers["content-type"]) {
            res.set("content-type", response.headers["content-type"]);
        }
        res.status(response.status).send(response.data);
    } catch (error) {
        console.error("[PUENTE PLAN-MEDIOS] !!! Error fatal en comunicación:", error.message);
        res.status(500).json({ message: "Error de comunicación con el submódulo de Plan de Medios." });
    }
};

// ==========================================
// CAPA DE PROTECCIÓN DE RUTAS (MIDDLEWARES CENTRALES)
// ==========================================

// Interceptador universal nativo descendente para proteger toda la API plana
router.use(verifyToken, (req, res, next) => {
    const requiereCrear = ["POST", "PUT", "DELETE"].includes(req.method);
    const permiso = requiereCrear ? "plan-medios:create" : "plan-medios:read";
    return checkPermission(permiso)(req, res, next);
}, forwardToPython);

module.exports = router;
