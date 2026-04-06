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

//Ruta Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
      const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
      
      if (!result.rows || result.rows.length === 0) {
        return res.status(400).json({ error: "Usuario no existe" });
      }
      const stringData = JSON.stringify(result.rows);
      const matches = stringData.match(/{[^[\]]+}/g); 
  
      if (!matches) {
        return res.status(500).json({ error: "No se encontró un objeto válido" });
      }
  
      const user = JSON.parse(matches);
  
      const match = await bcrypt.compare(password, user.password);
  
      if (!match) {
        return res.status(400).json({ error: "Contraseña incorrecta" });
      }
  
      const token = jwt.sign(
        { id: user.id, email: user.email }, 
        process.env.JWT_SECRET, 
        { expiresIn: '2h' } 
      );
  
      return res.json({ 
        message: "¡Bienvenido!", 
        token: token, 
        user: { 
          id: user.id, 
          nombre: user.nombre,
          email: user.email
        } 
      });
  
    } catch (err) {
      console.error("ERROR EN LOGIN:", err);
      if (!res.headersSent) {
        return res.status(500).json({ error: "Error en el servidor" });
      }
    }
  });

//Ruta Registro
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

app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));