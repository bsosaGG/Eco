const path = require('path');
const fs = require('fs');

const getFile = (req, res) => {
    // req.params[0] captura todo lo que venga después de /api/uploads
    let relativePath = req.params[0];

    // Validación básica
    if (!relativePath || relativePath === '/') {
        return res.status(400).json({ message: 'No se especificó ningún archivo.' });
    }

    // Definir el directorio raíz de uploads
    // Ajustado a: api/src/controllers -> api/uploads (dos niveles arriba)
    const uploadsRoot = path.join(__dirname, '../../uploads');

    // IMPORTANTE: Decodificar la URL para soportar espacios y tildes en nombres de archivo
    relativePath = decodeURIComponent(relativePath);

    // Resolver la ruta completa del archivo
    const filePath = path.join(uploadsRoot, relativePath);

    // Seguridad: Prevenir Directory Traversal
    // Esta parte de tu código estaba muy bien, la mantenemos
    const relative = path.relative(uploadsRoot, filePath);

    // Verificamos '..' y también que no sea una ruta absoluta en otro disco (windows) o root
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        return res.status(403).json({ message: 'Acceso denegado. Ruta inválida.' });
    }

    // Verificar si el archivo existe
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).json({ message: 'Archivo no encontrado.' });
        }

        // Servir el archivo con 'inline' para que el navegador intente mostrarlo
        res.sendFile(filePath, {
            root: '/', // Al usar filePath absoluto con path.join, root debe ser '/' o no usarse options.root
            dotfiles: 'deny',
            headers: {
                'Content-Disposition': 'inline'
            }
        }, (err) => {
            if (err) {
                if (!res.headersSent) {
                    console.error('Error al enviar archivo:', err);
                    // No enviamos JSON si el error es de stream interrumpido para no corromper la descarga
                    res.status(500).end();
                }
            }
        });
    });
};

module.exports = {
    getFile
};