const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const transaccionesRoutes = require('./routes/transacciones');
const usuariosRoutes = require('./routes/usuarios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use('/', authRoutes);
app.use('/transacciones', transaccionesRoutes);
app.use('/usuarios', usuariosRoutes);

app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
