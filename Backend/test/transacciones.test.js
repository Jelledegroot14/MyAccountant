const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const request = require('supertest');
const pool = require('../db');
const { buildApp } = require('./helpers/app');
const { tokenFor } = require('./helpers/jwt');

const OWNER = { id: 1, email: 'owner@example.com', rol: 'usuario' };
const OTHER = { id: 2, email: 'other@example.com', rol: 'usuario' };
const ADMIN = { id: 99, email: 'admin@example.com', rol: 'admin' };

test('GET /transacciones/:usuario_id', async (t) => {
    const app = buildApp();

    await t.test('requires authentication', async () => {
        const res = await request(app).get('/transacciones/1');
        assert.equal(res.status, 401);
    });

    await t.test("blocks a user from listing another user's transactions (IDOR)", async () => {
        const res = await request(app)
            .get('/transacciones/1')
            .set('Authorization', `Bearer ${tokenFor(OTHER)}`);
        assert.equal(res.status, 403);
    });

    await t.test('allows a user to list their own transactions', async (t) => {
        t.mock.method(pool, 'query', async () => ({ rows: [{ id: 5, usuario_id: 1 }] }));
        const res = await request(app)
            .get('/transacciones/1')
            .set('Authorization', `Bearer ${tokenFor(OWNER)}`);
        assert.equal(res.status, 200);
        assert.equal(res.body.length, 1);
    });

    await t.test("allows an admin to list any user's transactions", async (t) => {
        t.mock.method(pool, 'query', async () => ({ rows: [] }));
        const res = await request(app)
            .get('/transacciones/1')
            .set('Authorization', `Bearer ${tokenFor(ADMIN)}`);
        assert.equal(res.status, 200);
    });
});

test('POST /transacciones', async (t) => {
    const app = buildApp();
    const body = { concepto: 'Café', monto: 3.5, tipo: 'gasto', categoria: 'Ocio' };

    await t.test('requires authentication', async () => {
        const res = await request(app).post('/transacciones').send(body);
        assert.equal(res.status, 401);
    });

    await t.test('rejects an empty concepto', async () => {
        const res = await request(app)
            .post('/transacciones')
            .set('Authorization', `Bearer ${tokenFor(OWNER)}`)
            .send({ ...body, concepto: '  ' });
        assert.equal(res.status, 400);
    });

    await t.test('rejects a non-positive monto', async () => {
        const res = await request(app)
            .post('/transacciones')
            .set('Authorization', `Bearer ${tokenFor(OWNER)}`)
            .send({ ...body, monto: 0 });
        assert.equal(res.status, 400);
    });

    await t.test('rejects a non-numeric monto', async () => {
        const res = await request(app)
            .post('/transacciones')
            .set('Authorization', `Bearer ${tokenFor(OWNER)}`)
            .send({ ...body, monto: 'abc' });
        assert.equal(res.status, 400);
    });

    await t.test('rejects an invalid tipo', async () => {
        const res = await request(app)
            .post('/transacciones')
            .set('Authorization', `Bearer ${tokenFor(OWNER)}`)
            .send({ ...body, tipo: 'no-es-un-tipo' });
        assert.equal(res.status, 400);
    });

    await t.test('rejects an invalid categoria', async () => {
        const res = await request(app)
            .post('/transacciones')
            .set('Authorization', `Bearer ${tokenFor(OWNER)}`)
            .send({ ...body, categoria: 'no-es-una-categoria' });
        assert.equal(res.status, 400);
    });

    await t.test('accepts a valid body', async (t) => {
        t.mock.method(pool, 'query', async () => ({ rows: [{ id: 1, ...body }] }));
        const res = await request(app)
            .post('/transacciones')
            .set('Authorization', `Bearer ${tokenFor(OWNER)}`)
            .send(body);
        assert.equal(res.status, 201);
    });
});

test('PUT /transacciones/:id', async (t) => {
    const app = buildApp();
    const body = { concepto: 'Café', monto: 3.5, tipo: 'gasto', categoria: 'Ocio' };

    await t.test('requires authentication', async () => {
        const res = await request(app).put('/transacciones/42').send(body);
        assert.equal(res.status, 401);
    });

    await t.test('rejects an invalid body before checking ownership', async () => {
        const res = await request(app)
            .put('/transacciones/42')
            .set('Authorization', `Bearer ${tokenFor(OWNER)}`)
            .send({ ...body, categoria: 'no-es-una-categoria' });
        assert.equal(res.status, 400);
    });

    await t.test('returns 404 for a non-existent transaction', async (t) => {
        t.mock.method(pool, 'query', async () => ({ rows: [] }));
        const res = await request(app)
            .put('/transacciones/999')
            .set('Authorization', `Bearer ${tokenFor(OWNER)}`)
            .send(body);
        assert.equal(res.status, 404);
    });

    await t.test('blocks a non-owner, non-admin from editing it (IDOR)', async (t) => {
        t.mock.method(pool, 'query', async () => ({ rows: [{ usuario_id: OWNER.id }] }));
        const res = await request(app)
            .put('/transacciones/42')
            .set('Authorization', `Bearer ${tokenFor(OTHER)}`)
            .send(body);
        assert.equal(res.status, 403);
    });

    await t.test('allows the owner to edit their own transaction', async (t) => {
        t.mock.method(pool, 'query', async (sql) =>
            sql.includes('SELECT usuario_id') ? { rows: [{ usuario_id: OWNER.id }] } : { rows: [] },
        );
        const res = await request(app)
            .put('/transacciones/42')
            .set('Authorization', `Bearer ${tokenFor(OWNER)}`)
            .send(body);
        assert.equal(res.status, 200);
    });

    await t.test("allows an admin to edit another user's transaction", async (t) => {
        t.mock.method(pool, 'query', async (sql) =>
            sql.includes('SELECT usuario_id') ? { rows: [{ usuario_id: OWNER.id }] } : { rows: [] },
        );
        const res = await request(app)
            .put('/transacciones/42')
            .set('Authorization', `Bearer ${tokenFor(ADMIN)}`)
            .send(body);
        assert.equal(res.status, 200);
    });
});

test('DELETE /transacciones/:id', async (t) => {
    const app = buildApp();

    await t.test('requires authentication', async () => {
        const res = await request(app).delete('/transacciones/42');
        assert.equal(res.status, 401);
    });

    await t.test('returns 404 for a non-existent transaction', async (t) => {
        t.mock.method(pool, 'query', async () => ({ rows: [] }));
        const res = await request(app)
            .delete('/transacciones/999')
            .set('Authorization', `Bearer ${tokenFor(OWNER)}`);
        assert.equal(res.status, 404);
    });

    await t.test('blocks a non-owner, non-admin from deleting it (IDOR)', async (t) => {
        t.mock.method(pool, 'query', async () => ({ rows: [{ usuario_id: OWNER.id }] }));
        const res = await request(app)
            .delete('/transacciones/42')
            .set('Authorization', `Bearer ${tokenFor(OTHER)}`);
        assert.equal(res.status, 403);
    });

    await t.test('allows the owner to delete their own transaction', async (t) => {
        t.mock.method(pool, 'query', async (sql) =>
            sql.includes('SELECT usuario_id')
                ? { rows: [{ usuario_id: OWNER.id }] }
                : { rowCount: 1 },
        );
        const res = await request(app)
            .delete('/transacciones/42')
            .set('Authorization', `Bearer ${tokenFor(OWNER)}`);
        assert.equal(res.status, 200);
    });

    await t.test("allows an admin to delete another user's transaction", async (t) => {
        t.mock.method(pool, 'query', async (sql) =>
            sql.includes('SELECT usuario_id')
                ? { rows: [{ usuario_id: OWNER.id }] }
                : { rowCount: 1 },
        );
        const res = await request(app)
            .delete('/transacciones/42')
            .set('Authorization', `Bearer ${tokenFor(ADMIN)}`);
        assert.equal(res.status, 200);
    });
});

test('GET /transacciones/:id/recibo', async (t) => {
    const app = buildApp();

    await t.test('requires authentication', async () => {
        const res = await request(app).get('/transacciones/42/recibo');
        assert.equal(res.status, 401);
    });

    await t.test('returns 404 for a non-existent transaction', async (t) => {
        t.mock.method(pool, 'query', async () => ({ rows: [] }));
        const res = await request(app)
            .get('/transacciones/999/recibo')
            .set('Authorization', `Bearer ${tokenFor(OWNER)}`);
        assert.equal(res.status, 404);
    });

    await t.test('blocks a non-owner, non-admin from fetching the receipt (IDOR)', async (t) => {
        t.mock.method(pool, 'query', async () => ({
            rows: [{ usuario_id: OWNER.id, imagen_path: '/uploads/receipt.png' }],
        }));
        const res = await request(app)
            .get('/transacciones/42/recibo')
            .set('Authorization', `Bearer ${tokenFor(OTHER)}`);
        assert.equal(res.status, 403);
    });

    await t.test('lets the owner past the ownership check to the file lookup', async (t) => {
        t.mock.method(pool, 'query', async () => ({
            rows: [{ usuario_id: OWNER.id, imagen_path: '/uploads/receipt.png' }],
        }));
        t.mock.method(fs, 'existsSync', () => false);
        const res = await request(app)
            .get('/transacciones/42/recibo')
            .set('Authorization', `Bearer ${tokenFor(OWNER)}`);
        assert.equal(res.status, 404);
        assert.equal(res.body.error, 'El archivo del recibo no existe');
    });

    await t.test("lets an admin past the ownership check for another user's receipt", async (t) => {
        t.mock.method(pool, 'query', async () => ({
            rows: [{ usuario_id: OWNER.id, imagen_path: null }],
        }));
        const res = await request(app)
            .get('/transacciones/42/recibo')
            .set('Authorization', `Bearer ${tokenFor(ADMIN)}`);
        assert.equal(res.status, 404);
        assert.equal(res.body.error, 'Esta transacción no tiene recibo');
    });
});
