const jwt = require('jsonwebtoken');

// Signs a token the same way routes/auth.js does, so tests can act as an
// arbitrary user without going through a real /login call.
function tokenFor(usuario, options = {}) {
    return jwt.sign(usuario, process.env.JWT_SECRET, { expiresIn: '1h', ...options });
}

module.exports = { tokenFor };
