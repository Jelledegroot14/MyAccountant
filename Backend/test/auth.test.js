const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const request = require('supertest');
const pool = require('../db');
const { buildApp } = require('./helpers/app');

test('POST /login', async (t) => {
    const app = buildApp();

    await t.test('rejects a request missing email/password', async () => {
        const res = await request(app).post('/login').send({});
        assert.equal(res.status, 400);
    });

    await t.test(
        'rejects an unknown email with a generic error (no user enumeration)',
        async (t) => {
            t.mock.method(pool, 'query', async () => ({ rows: [] }));
            const res = await request(app)
                .post('/login')
                .send({ email: 'nope@example.com', password: 'whatever' });
            assert.equal(res.status, 400);
            assert.equal(res.body.error, 'Credenciales inválidas');
        },
    );

    await t.test('rejects a wrong password with the same generic error', async (t) => {
        const hash = await bcrypt.hash('correct-password', 10);
        t.mock.method(pool, 'query', async () => ({
            rows: [{ id: 1, email: 'a@b.com', password: hash, rol: 'usuario' }],
        }));
        const res = await request(app)
            .post('/login')
            .send({ email: 'a@b.com', password: 'wrong-password' });
        assert.equal(res.status, 400);
        assert.equal(res.body.error, 'Credenciales inválidas');
    });

    await t.test('issues a JWT on correct credentials', async (t) => {
        const hash = await bcrypt.hash('correct-password', 10);
        t.mock.method(pool, 'query', async () => ({
            rows: [{ id: 1, email: 'a@b.com', password: hash, rol: 'usuario' }],
        }));
        const res = await request(app)
            .post('/login')
            .send({ email: 'a@b.com', password: 'correct-password' });
        assert.equal(res.status, 200);
        assert.ok(res.body.token);
        assert.equal(res.body.user.id, 1);
        assert.equal(res.body.user.rol, 'usuario');
    });
});

test('POST /register', async (t) => {
    const app = buildApp();

    await t.test('rejects a request missing required fields', async () => {
        const res = await request(app).post('/register').send({ email: 'a@b.com' });
        assert.equal(res.status, 400);
    });

    await t.test('rejects a password under 8 characters', async () => {
        const res = await request(app)
            .post('/register')
            .send({ nombre: 'A', email: 'a@b.com', password: 'short' });
        assert.equal(res.status, 400);
    });

    await t.test('returns 409 on a duplicate email instead of a 500', async (t) => {
        t.mock.method(pool, 'query', async () => {
            const err = new Error('duplicate key value violates unique constraint');
            err.code = '23505';
            throw err;
        });
        const res = await request(app)
            .post('/register')
            .send({ nombre: 'A', email: 'dup@b.com', password: 'longenough' });
        assert.equal(res.status, 409);
    });

    await t.test('creates a user on valid input', async (t) => {
        t.mock.method(pool, 'query', async () => ({ rows: [] }));
        const res = await request(app)
            .post('/register')
            .send({ nombre: 'A', email: 'new@b.com', password: 'longenough' });
        assert.equal(res.status, 201);
    });
});
