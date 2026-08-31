const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { verificarToken, esAdmin } = require('../middleware/auth');

function mockRes() {
    const res = { statusCode: null, body: null };
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (body) => {
        res.body = body;
        return res;
    };
    return res;
}

test('verificarToken', async (t) => {
    await t.test('rejects a request with no Authorization header', () => {
        const req = { headers: {} };
        const res = mockRes();
        let nextCalled = false;
        verificarToken(req, res, () => {
            nextCalled = true;
        });
        assert.equal(res.statusCode, 401);
        assert.equal(nextCalled, false);
    });

    await t.test('rejects a header without the Bearer prefix', () => {
        const req = { headers: { authorization: 'not-a-bearer-token' } };
        const res = mockRes();
        let nextCalled = false;
        verificarToken(req, res, () => {
            nextCalled = true;
        });
        assert.equal(res.statusCode, 401);
        assert.equal(nextCalled, false);
    });

    await t.test('rejects a tampered/invalid token', () => {
        const req = { headers: { authorization: 'Bearer not-a-real-jwt' } };
        const res = mockRes();
        let nextCalled = false;
        verificarToken(req, res, () => {
            nextCalled = true;
        });
        assert.equal(res.statusCode, 401);
        assert.equal(nextCalled, false);
    });

    await t.test('rejects an expired token', () => {
        const expired = jwt.sign({ id: 1, rol: 'usuario' }, process.env.JWT_SECRET, {
            expiresIn: -10,
        });
        const req = { headers: { authorization: `Bearer ${expired}` } };
        const res = mockRes();
        let nextCalled = false;
        verificarToken(req, res, () => {
            nextCalled = true;
        });
        assert.equal(res.statusCode, 401);
        assert.equal(nextCalled, false);
    });

    await t.test('rejects a token signed with the wrong secret', () => {
        const forged = jwt.sign({ id: 1, rol: 'admin' }, 'wrong-secret', { expiresIn: '1h' });
        const req = { headers: { authorization: `Bearer ${forged}` } };
        const res = mockRes();
        let nextCalled = false;
        verificarToken(req, res, () => {
            nextCalled = true;
        });
        assert.equal(res.statusCode, 401);
        assert.equal(nextCalled, false);
    });

    await t.test('accepts a valid token and attaches req.usuario', () => {
        const token = jwt.sign(
            { id: 7, email: 'a@b.com', rol: 'usuario' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
        );
        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = mockRes();
        let nextCalled = false;
        verificarToken(req, res, () => {
            nextCalled = true;
        });
        assert.equal(nextCalled, true);
        assert.equal(req.usuario.id, 7);
        assert.equal(req.usuario.rol, 'usuario');
    });
});

test('esAdmin', async (t) => {
    await t.test('lets an admin through', () => {
        const req = { usuario: { rol: 'admin' } };
        const res = mockRes();
        let nextCalled = false;
        esAdmin(req, res, () => {
            nextCalled = true;
        });
        assert.equal(nextCalled, true);
    });

    await t.test('rejects a non-admin with 403', () => {
        const req = { usuario: { rol: 'usuario' } };
        const res = mockRes();
        let nextCalled = false;
        esAdmin(req, res, () => {
            nextCalled = true;
        });
        assert.equal(res.statusCode, 403);
        assert.equal(nextCalled, false);
    });
});
