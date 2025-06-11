// api/src/routes/inventario.routes.js
const express = require("express");
const router = express.Router();
const inventarioController = require("../controllers/inventario.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { body, param } = require("express-validator");
const multer = require("multer");
const path = require("path");

// Configuración de Multer para la carga de archivos
const upload = multer({
  dest: path.join(__dirname, "../../uploads/inventario"), // Directorio temporal para las cargas
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos Excel (.xlsx o .xls)"), false);
    }
  },
});

// Directorio para las cargas de inventario
// Asegúrate de que este directorio exista en tu API: `api/uploads/inventario`
// El Dockerfile ya hace COPY . . y el volumen - ./uploads_scspr:/usr/src/app/uploads
// Lo ideal es que multer guarde los archivos dentro del volumen mapeado.
// Podríamos necesitar un volumen específico si solo los de inventario van en otra parte.
// Por ahora, asumiremos que api/uploads/inventario está dentro de api/uploads.

// Rutas de Inventario
// Proteger rutas: Solo usuarios autenticados pueden ver.
// Admins pueden crear, actualizar, eliminar y subir.

// Obtener todos los ítems de inventario (accesible para usuarios autenticados)
router.get("/", authMiddleware.verifyToken, inventarioController.getAllItems);

// Obtener un ítem de inventario por código (accesible para usuarios autenticados)
router.get(
  "/:codigo",
  authMiddleware.verifyToken,
  [
    param("codigo")
      .isString()
      .notEmpty()
      .withMessage("El código es requerido y debe ser una cadena de texto."),
  ],
  inventarioController.getItemByCodigo
);

// Obtener ítems por libro y folio (accesible para usuarios autenticados)
router.get(
  "/libro/:libro/folio/:folio",
  authMiddleware.verifyToken,
  [
    param("libro")
      .isInt({ min: 1 })
      .withMessage("El libro debe ser un número entero positivo."),
    param("folio")
      .isInt({ min: 1 })
      .withMessage("El folio debe ser un número entero positivo."),
  ],
  inventarioController.getItemsByLibroFolio
);

// Crear un nuevo ítem de inventario (solo para admins)
router.post(
  "/",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  [
    // Validaciones básicas, pueden ser más detalladas
    body("fecha_factura_str")
      .isISO8601()
      .withMessage("Fecha de factura inválida (YYYY-MM-DD)."),
    body("proveedor_nombre")
      .isString()
      .notEmpty()
      .withMessage("Nombre de proveedor es requerido."),
    body("factura_numero")
      .isString()
      .notEmpty()
      .withMessage("Número de factura es requerido."),
    body("factura_serie")
      .isString()
      .notEmpty()
      .withMessage("Serie de factura es requerida."),
    body("renglon_nombre")
      .isString()
      .notEmpty()
      .withMessage("Nombre de renglón es requerido."),
    body("fecha_registro")
      .isISO8601()
      .withMessage("Fecha de registro inválida (YYYY-MM-DD)."),
    body("codigo")
      .isString()
      .notEmpty()
      .withMessage("Código es requerido.")
      .isLength({ max: 20 })
      .withMessage("El código no debe exceder los 20 caracteres."),
    body("descripcion_fisica")
      .isString()
      .notEmpty()
      .withMessage("Descripción física es requerida."),
    body("valor")
      .isFloat({ gt: 0 })
      .withMessage("Valor debe ser un número positivo."),
    body("libro")
      .isInt({ min: 1 })
      .withMessage("Libro debe ser un número entero positivo."),
    body("folio")
      .isInt({ min: 1 })
      .withMessage("Folio debe ser un número entero positivo."),
    body("responsable")
      .isString()
      .notEmpty()
      .withMessage("Responsable es requerido."),
    body("unidad_direccion_nombre")
      .isString()
      .notEmpty()
      .withMessage("Nombre de unidad/dirección es requerido."),
    body("no_tarjeta_responsabilidad")
      .isString()
      .notEmpty()
      .withMessage("No. de tarjeta de responsabilidad es requerido."),
  ],
  inventarioController.createItem
);

// Actualizar un ítem de inventario (solo para admins)
router.put(
  "/:codigo",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  [
    param("codigo")
      .isString()
      .notEmpty()
      .withMessage("El código es requerido y debe ser una cadena de texto."),
    // Validaciones para el cuerpo de la solicitud, similares a createItem
    body("fecha_factura_str")
      .isISO8601()
      .optional({ nullable: true })
      .withMessage("Fecha de factura inválida (YYYY-MM-DD)."),
    body("proveedor_nombre")
      .isString()
      .notEmpty()
      .withMessage("Nombre de proveedor es requerido."),
    body("factura_numero")
      .isString()
      .notEmpty()
      .withMessage("Número de factura es requerido."),
    body("factura_serie")
      .isString()
      .notEmpty()
      .withMessage("Serie de factura es requerida."),
    body("renglon_nombre")
      .isString()
      .notEmpty()
      .withMessage("Nombre de renglón es requerido."),
    body("fecha_registro")
      .isISO8601()
      .optional({ nullable: true })
      .withMessage("Fecha de registro inválida (YYYY-MM-DD)."),
    body("descripcion_fisica")
      .isString()
      .notEmpty()
      .withMessage("Descripción física es requerida."),
    body("valor")
      .isFloat({ gt: 0 })
      .withMessage("Valor debe ser un número positivo."),
    body("libro")
      .isInt({ min: 1 })
      .withMessage("Libro debe ser un número entero positivo."),
    body("folio")
      .isInt({ min: 1 })
      .withMessage("Folio debe ser un número entero positivo."),
    body("responsable")
      .isString()
      .notEmpty()
      .withMessage("Responsable es requerido."),
    body("unidad_direccion_nombre")
      .isString()
      .notEmpty()
      .withMessage("Nombre de unidad/dirección es requerido."),
    body("no_tarjeta_responsabilidad")
      .isString()
      .notEmpty()
      .withMessage("No. de tarjeta de responsabilidad es requerido."),
  ],
  inventarioController.updateItem
);

// Eliminar un ítem de inventario (solo para admins)
router.delete(
  "/:codigo",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  [
    param("codigo")
      .isString()
      .notEmpty()
      .withMessage("El código es requerido y debe ser una cadena de texto."),
  ],
  inventarioController.deleteItem
);

// Cargar archivo Excel para migración masiva (solo para admins)
router.post(
  "/upload",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  upload.single("excelFile"), // 'excelFile' es el nombre del campo en el formulario que contendrá el archivo
  inventarioController.uploadExcel
);

module.exports = router;
