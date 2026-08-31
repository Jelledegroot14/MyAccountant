const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const transaccionesRoutes = require('./routes/transacciones');
const usuariosRoutes = require('./routes/usuarios');

const app = express();

const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : 'http://localhost:5173';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use(limiter);

const PORT = process.env.PORT || 3000;

app.use('/', authRoutes);
app.use('/transacciones', transaccionesRoutes);
app.use('/usuarios', usuariosRoutes);

app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
