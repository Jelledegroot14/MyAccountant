const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

const TIPOS_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(
            null,
            Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname),
        );
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!TIPOS_PERMITIDOS.has(file.mimetype)) {
            return cb(new Error('Formato de imagen no permitido'));
        }
        cb(null, true);
    },
});

const manejarErrorSubida = (err, req, res, next) => {
    if (err instanceof multer.MulterError || err) {
        return res.status(400).json({ error: err.message || 'Error al subir el archivo' });
    }
    next();
};

const esPropietarioOAdmin = (fila, req) => {
    return req.usuario.rol === 'admin' || String(fila.usuario_id) === String(req.usuario.id);
};

router.get('/:usuario_id', verificarToken, async (req, res) => {
    const { usuario_id } = req.params;

    if (req.usuario.rol !== 'admin' && String(req.usuario.id) !== String(usuario_id)) {
        return res.status(403).json({ error: 'No tienes permiso para ver estas transacciones' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM transacciones WHERE usuario_id = $1 ORDER BY fecha DESC',
            [usuario_id],
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener los datos:', err);
        res.status(500).json({ error: 'Error al obtener los datos' });
    }
});

router.post('/', verificarToken, upload.single('imagen'), manejarErrorSubida, async (req, res) => {
    try {
        const { concepto, monto, tipo, categoria } = req.body;
        const usuario_id = req.usuario.id;

        const imagenPath = req.file ? `/uploads/${req.file.filename}` : null;

        const query = `
            INSERT INTO transacciones (usuario_id, concepto, monto, tipo, categoria, imagen_path)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;

        const result = await pool.query(query, [
            usuario_id,
            concepto,
            monto,
            tipo,
            categoria,
            imagenPath,
        ]);

        res.status(201).json(result.rows);
    } catch (err) {
        console.error('Error al guardar:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

router.put(
    '/:id',
    verificarToken,
    upload.single('imagen'),
    manejarErrorSubida,
    async (req, res) => {
        const { id } = req.params;
        const { concepto, monto, tipo, categoria } = req.body;

        try {
            const existente = await pool.query(
                'SELECT usuario_id FROM transacciones WHERE id = $1',
                [id],
            );
            if (existente.rows.length === 0) {
                return res.status(404).json({ error: 'No se encontró la transacción' });
            }
            if (!esPropietarioOAdmin(existente.rows[0], req)) {
                return res
                    .status(403)
                    .json({ error: 'No tienes permiso para editar esta transacción' });
            }

            let query;
            let params;

            if (req.file) {
                const imagenPath = `/uploads/${req.file.filename}`;
                query = `UPDATE transacciones SET concepto = $1, monto = $2, tipo = $3, categoria = $4, imagen_path = $5 WHERE id = $6`;
                params = [concepto, monto, tipo, categoria, imagenPath, id];
            } else {
                query = `UPDATE transacciones SET concepto = $1, monto = $2, tipo = $3, categoria = $4 WHERE id = $5`;
                params = [concepto, monto, tipo, categoria, id];
            }

            await pool.query(query, params);
            res.json({ message: 'Transacción actualizada con éxito' });
        } catch (err) {
            console.error('Error al actualizar en BD:', err);
            res.status(500).json({ error: 'Error interno del servidor al actualizar' });
        }
    },
);

router.delete('/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    try {
        const existente = await pool.query('SELECT usuario_id FROM transacciones WHERE id = $1', [
            id,
        ]);
        if (existente.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontró el registro' });
        }
        if (!esPropietarioOAdmin(existente.rows[0], req)) {
            return res
                .status(403)
                .json({ error: 'No tienes permiso para eliminar esta transacción' });
        }

        await pool.query('DELETE FROM transacciones WHERE id = $1', [id]);
        res.json({ message: 'Registro eliminado con éxito' });
    } catch (err) {
        console.error('Error al eliminar la transacción:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/:id/recibo', verificarToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'SELECT usuario_id, imagen_path FROM transacciones WHERE id = $1',
            [id],
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontró la transacción' });
        }

        const fila = result.rows[0];
        if (!esPropietarioOAdmin(fila, req)) {
            return res.status(403).json({ error: 'No tienes permiso para ver este recibo' });
        }
        if (!fila.imagen_path) {
            return res.status(404).json({ error: 'Esta transacción no tiene recibo' });
        }

        const filePath = path.join(__dirname, '..', fila.imagen_path);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'El archivo del recibo no existe' });
        }
        res.sendFile(filePath);
    } catch (err) {
        console.error('Error al obtener el recibo:', err);
        res.status(500).json({ error: 'Error al obtener el recibo' });
    }
});

module.exports = router;
