// Loaded via `node --require ./test/setup.js` before any test file, so the
// JWT secret is deterministic and never depends on a developer's local .env.
process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';
