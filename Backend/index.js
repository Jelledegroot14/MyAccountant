const express = require('express');
const cors = require('cors');
const pool = require('./db'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
      return res.status(403).json({ error: "No se proporcionó cabecera" });
  }
  const token = authHeader.replace('Bearer ', '');

  if (!token || token === authHeader) {
      return res.status(403).json({ error: "Formato de token inválido. Debe ser 'Bearer [token]'" });
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


// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
      const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
      
      if (result.rows.length === 0) {
          return res.status(400).json({ error: "El usuario no existe" });
      }

      const [user] = result.rows; 
      console.log("¿Es un array?:", Array.isArray(user));
      console.log("Password extraída:", user.password ? "SÍ existe" : "NO existe");

      if (!user || !user.password) {
          return res.status(500).json({ error: "Error de lectura en la base de datos" });
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
          return res.status(400).json({ error: "Contraseña incorrecta" });
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

// Registro
app.post('/register', async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3)', [nombre, email, hashedPassword]);
        res.status(201).json({ message: "Usuario creado" });
    } catch (err) {
        res.status(500).json({ error: "Error al registrar" });
    }
});

app.post('/transacciones', verificarToken, async (req, res) => {
    const { usuario_id, concepto, monto, tipo, categoria } = req.body;
    try {
        const query = `
            INSERT INTO transacciones (usuario_id, concepto, monto, tipo, categoria) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *`;
        const result = await pool.query(query, [usuario_id, concepto, monto, tipo, categoria || 'General']);
        res.status(201).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "No se pudo guardar el movimiento" });
    }
});

app.get('/transacciones/:usuario_id', verificarToken, async (req, res) => {
    const { usuario_id } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM transacciones WHERE usuario_id = $1 ORDER BY fecha DESC', 
            [usuario_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener los datos" });
    }
});

app.delete('/transacciones/:id', verificarToken, async (req, res) => {
    const { id } = req.params; 
    try {
        const result = await pool.query('DELETE FROM transacciones WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "No se encontró el registro" });
        }
        res.json({ message: "Registro eliminado con éxito" });
    } catch (err) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
});
app.put('/transacciones/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    const { concepto, monto, tipo, categoria } = req.body;

    try {
        const query = `
            UPDATE transacciones 
            SET concepto = $1, monto = $2, tipo = $3, categoria = $4 
            WHERE id = $5
        `;
        
        const result = await pool.query(query, [concepto, monto, tipo, categoria, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "No se encontró la transacción para actualizar" });
        }

        res.json({ message: "Transacción actualizada con éxito" });
    } catch (err) {
        console.error("Error al actualizar en BD:", err);
        res.status(500).json({ error: "Error interno del servidor al actualizar" });
    }
});
const esAdmin = (req, res, next) => {
    if (req.usuario && req.usuario.rol === 'admin') {
        next();
    } else {
        res.status(403).json({ error: "Acceso denegado: Se requiere rol de administrador" });
    }
};

app.get('/usuarios', verificarToken, esAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre, email, rol FROM usuarios');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: "Error al obtener usuarios" }); }
});

app.put('/usuarios/:id', verificarToken, esAdmin, async (req, res) => {
    const { rol } = req.body;
    try {
        await pool.query('UPDATE usuarios SET rol = $1 WHERE id = $2', [rol, req.params.id]);
        res.json({ message: "Rol actualizado" });
    } catch (err) {
        res.status(500).json({ error: "Error al actualizar" });
    }
});
app.delete('/usuarios/:id', verificarToken, async (req, res) => {
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
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));