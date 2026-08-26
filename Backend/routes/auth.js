const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../db');

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Demasiados intentos. Inténtalo de nuevo más tarde." },
});

router.post('/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email y contraseña son obligatorios" });
    }

    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Credenciales inválidas" });
        }

        const [user] = result.rows;

        if (!user.password) {
            return res.status(500).json({ error: "Error de lectura en la base de datos" });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(400).json({ error: "Credenciales inválidas" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, rol: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.json({
            message: "¡Bienvenido!",
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                rol: user.rol
            }
        });

    } catch (err) {
        console.error("ERROR CRÍTICO:", err);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

router.post('/register', authLimiter, async (req, res) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios" });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3)', [nombre, email, hashedPassword]);
        res.status(201).json({ message: "Usuario creado" });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: "Ese email ya está registrado" });
        }
        console.error("Error al registrar:", err);
        res.status(500).json({ error: "Error al registrar" });
    }
});

module.exports = router;
