const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const PROFILE_PICS_DIR = path.join(process.cwd(), "uploads", "profile_pics");

// Asegurarse de que el directorio de uploads/profile_pics existe
if (!fs.existsSync(PROFILE_PICS_DIR)) {
  fs.mkdirSync(PROFILE_PICS_DIR, { recursive: true });
}

const profilePicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PROFILE_PICS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `user_${req.user.userId}_${uniqueSuffix}${extension}`); // Incluir userId para fácil identificación
  },
});

const profilePicFileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Tipo de archivo no permitido. Solo se aceptan imágenes (jpeg, png, gif, webp)."
      ),
      false
    );
  }
};

const uploadProfilePic = multer({
  storage: profilePicStorage,
  limits: {
    fileSize: 1024 * 1024 * 5, // Límite de 5MB
  },
  fileFilter: profilePicFileFilter,
});

// Middleware para un solo archivo bajo el campo 'profile_pic'
module.exports = (req, res, next) => {
  const uploader = uploadProfilePic.single("profile_pic");
  uploader(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res
        .status(400)
        .json({ message: "Error de Multer: " + err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};
