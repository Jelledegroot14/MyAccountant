const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ error: "No se proporcionó cabecera" });
    }
    const token = authHeader.replace('Bearer ', '');

    if (!token || token === authHeader) {
        return res.status(401).json({ error: "Formato de token inválido. Debe ser 'Bearer [token]'" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (err) {
        console.log("Error en servidor:", err.message);
        return res.status(401).json({ error: "Token inválido: " + err.message });
    }
};

const esAdmin = (req, res, next) => {
    if (req.usuario && req.usuario.rol === 'admin') {
        next();
    } else {
        res.status(403).json({ error: "Acceso denegado: Se requiere rol de administrador" });
    }
};

module.exports = { verificarToken, esAdmin };
