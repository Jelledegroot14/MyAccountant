const express = require('express');
const helmet = require('helmet');
const authRoutes = require('../../routes/auth');
const transaccionesRoutes = require('../../routes/transacciones');
const usuariosRoutes = require('../../routes/usuarios');

// Mirrors index.js, minus cors/app.listen/the global rate limiter (which
// would throttle rapid test requests), so tests hit the same routing/
// middleware stack the real server uses.
function buildApp() {
    const app = express();
    app.use(helmet());
    app.use(express.json());
    app.use('/', authRoutes);
    app.use('/transacciones', transaccionesRoutes);
    app.use('/usuarios', usuariosRoutes);
    return app;
}

module.exports = { buildApp };
