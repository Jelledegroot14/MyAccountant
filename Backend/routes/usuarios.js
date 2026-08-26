const express = require('express');
const pool = require('../db');
const { verificarToken, esAdmin } = require('../middleware/auth');

const router = express.Router();

const ROLES_VALIDOS = new Set(['usuario', 'admin']);

router.get('/', verificarToken, esAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre, email, rol FROM usuarios');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
});

router.put('/:id', verificarToken, esAdmin, async (req, res) => {
    const { rol } = req.body;
    if (!ROLES_VALIDOS.has(rol)) {
        return res.status(400).json({ error: "Rol inválido. Debe ser 'usuario' o 'admin'" });
    }
    try {
        await pool.query('UPDATE usuarios SET rol = $1 WHERE id = $2', [rol, req.params.id]);
        res.json({ message: "Rol actualizado" });
    } catch (err) {
        res.status(500).json({ error: "Error al actualizar" });
    }
});

router.delete('/:id', verificarToken, esAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json({ message: "Usuario eliminado con éxito" });
    } catch (err) {
        console.error("Error al eliminar usuario:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;
