const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const pool = require('../db');
const { buildApp } = require('./helpers/app');
const { tokenFor } = require('./helpers/jwt');

const USER = { id: 1, rol: 'usuario' };
const ADMIN = { id: 99, rol: 'admin' };

test('GET /usuarios', async (t) => {
    const app = buildApp();

    await t.test('requires authentication', async () => {
        const res = await request(app).get('/usuarios');
        assert.equal(res.status, 401);
    });

    await t.test('rejects a non-admin user', async () => {
        const res = await request(app).get('/usuarios').set('Authorization', `Bearer ${tokenFor(USER)}`);
        assert.equal(res.status, 403);
    });

    await t.test('allows an admin', async (t) => {
        t.mock.method(pool, 'query', async () => ({ rows: [] }));
        const res = await request(app).get('/usuarios').set('Authorization', `Bearer ${tokenFor(ADMIN)}`);
        assert.equal(res.status, 200);
    });
});

test('PUT /usuarios/:id', async (t) => {
    const app = buildApp();

    await t.test('rejects a non-admin user', async () => {
        const res = await request(app)
            .put('/usuarios/2')
            .set('Authorization', `Bearer ${tokenFor(USER)}`)
            .send({ rol: 'admin' });
        assert.equal(res.status, 403);
    });

    await t.test('rejects an invalid role even from an admin', async () => {
        const res = await request(app)
            .put('/usuarios/2')
            .set('Authorization', `Bearer ${tokenFor(ADMIN)}`)
            .send({ rol: 'superuser' });
        assert.equal(res.status, 400);
    });

    await t.test('allows an admin to set a valid role', async (t) => {
        t.mock.method(pool, 'query', async () => ({ rows: [] }));
        const res = await request(app)
            .put('/usuarios/2')
            .set('Authorization', `Bearer ${tokenFor(ADMIN)}`)
            .send({ rol: 'admin' });
        assert.equal(res.status, 200);
    });
});

// Regression test: DELETE /usuarios/:id previously only required
// verificarToken, so any authenticated user could delete any account.
test('DELETE /usuarios/:id', async (t) => {
    const app = buildApp();

    await t.test('requires authentication', async () => {
        const res = await request(app).delete('/usuarios/2');
        assert.equal(res.status, 401);
    });

    await t.test('rejects a non-admin user', async () => {
        const res = await request(app).delete('/usuarios/2').set('Authorization', `Bearer ${tokenFor(USER)}`);
        assert.equal(res.status, 403);
    });

    await t.test('allows an admin', async (t) => {
        t.mock.method(pool, 'query', async () => ({ rowCount: 1 }));
        const res = await request(app).delete('/usuarios/2').set('Authorization', `Bearer ${tokenFor(ADMIN)}`);
        assert.equal(res.status, 200);
    });
});
