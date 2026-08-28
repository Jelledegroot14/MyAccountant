const express = require('express');
const authRoutes = require('../../routes/auth');
const transaccionesRoutes = require('../../routes/transacciones');
const usuariosRoutes = require('../../routes/usuarios');

// Mirrors index.js, minus cors/app.listen, so tests hit the exact same
// routing/middleware stack the real server uses.
function buildApp() {
    const app = express();
    app.use(express.json());
    app.use('/', authRoutes);
    app.use('/transacciones', transaccionesRoutes);
    app.use('/usuarios', usuariosRoutes);
    return app;
}

module.exports = { buildApp };
