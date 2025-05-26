const express = require("express");
const router = express.Router();
const denunciaController = require("../controllers/denuncia.controller");
const upload = require("../middleware/upload"); // Middleware de Multer
const validateRecaptcha = require("../middleware/validateRecaptcha");
const { body, param } = require("express-validator");

// Lista de estados válidos para la denuncia (debe coincidir con el ENUM de la DB)
const ESTADOS_VALIDOS = [
  "Recibida",
  "En Análisis",
  "En Investigación",
  "Desestimada",
  "Resuelta",
  "Requiere Más Información",
];

// POST /api/denuncias - Crear una nueva denuncia
router.post(
  "/",
  upload, // Primero Multer para procesar form-data y archivos
  validateRecaptcha, // Luego reCAPTCHA
  [
    // Validaciones para los campos
    // Datos del denunciante
    body("denunciante_primer_apellido")
      .notEmpty()
      .withMessage("El primer apellido del denunciante es obligatorio.")
      .trim()
      .escape(),
    body("denunciante_segundo_apellido").optional().trim().escape(),
    body("denunciante_primer_nombre")
      .notEmpty()
      .withMessage("El primer nombre del denunciante es obligatorio.")
      .trim()
      .escape(),
    body("denunciante_segundo_nombre").optional().trim().escape(),
    body("denunciante_telefono")
      .notEmpty()
      .withMessage("El teléfono del denunciante es obligatorio.")
      .isMobilePhone("any", { strictMode: false })
      .withMessage("Teléfono inválido.")
      .trim()
      .escape(),
    body("denunciante_correo_electronico")
      .optional({ checkFalsy: true })
      .isEmail()
      .withMessage("Correo electrónico inválido.")
      //.normalizeEmail()
      ,
    body("denunciante_confirmacion_correo")
      .optional()
      .custom((value, { req }) => {
        if (
          req.body.denunciante_correo_electronico &&
          value != req.body.denunciante_correo_electronico
        ) {
          throw new Error("La confirmación de correo electrónico no coincide.");
        }
        return true;
      }),

    // Datos de la persona a quien denuncia
    body("conoce_nombre_denunciado")
      .isBoolean()
      .withMessage("Debe indicar si conoce el nombre del denunciado."),
    body("nombre_denunciado")
      .if(body("conoce_nombre_denunciado").equals("true"))
      .notEmpty()
      .withMessage("El nombre del denunciado es obligatorio si lo conoce.")
      .trim()
      .escape(),
    body("puesto_cargo_denunciado")
      .optional({ checkFalsy: true })
      .trim()
      .escape(),
    body("municipio_denunciado")
      .notEmpty()
      .withMessage("El municipio del denunciado es obligatorio.")
      .trim()
      .escape(),
    body("ubicacion_denunciado").optional({ checkFalsy: true }).trim().escape(),

    // Detalles de la denuncia
    body("tiene_pruebas_adjuntas")
      .isBoolean()
      .withMessage("Debe indicar si tiene pruebas adjuntas."),
    body("descripcion_hechos")
      .notEmpty()
      .withMessage("La descripción de los hechos es obligatoria.")
      .trim()
      .escape(), // Usar .escape() con cuidado si se va a mostrar como HTML. Mejor sanitizar en el frontend o al mostrar.
    body("denunciado_antes_otra_institucion")
      .isBoolean()
      .withMessage("Debe indicar si ha denunciado antes esta situación."),

    // recaptchaToken (el token de reCAPTCHA enviado por el cliente)
    body("recaptchaToken")
      .notEmpty()
      .withMessage("El token de reCAPTCHA es obligatorio."),
  ],
  denunciaController.crearNuevaDenuncia
);

// GET /api/denuncias - Obtener todas las denuncias (requiere autenticación/autorización de admin)
router.get("/", denunciaController.obtenerTodasLasDenuncias); // Proteger esta ruta

// GET /api/denuncias/:id - Obtener una denuncia específica (requiere autenticación/autorización de admin)
router.get(
  "/:id",
  [param("id").isInt().withMessage("ID de denuncia debe ser un entero.")],
  denunciaController.obtenerDenunciaPorId // Proteger esta ruta
);

// PUT /api/denuncias/:id/estado - Actualizar el estado de una denuncia (requiere autenticación/autorización de admin)
router.put(
  "/:id/estado",
  [
    param("id").isInt().withMessage("ID de denuncia debe ser un entero."),
    body("estado")
      .notEmpty()
      .withMessage("El nuevo estado es obligatorio.")
      .isIn(ESTADOS_VALIDOS)
      .withMessage(
        `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(", ")}`
      ),
  ],
  denunciaController.actualizarEstadoDenuncia // Proteger esta ruta
);

module.exports = router;
