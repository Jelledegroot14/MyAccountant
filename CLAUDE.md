# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

MyAccountant is a personal finance tracker with two independent apps that are not in a monorepo/workspace setup — each has its own `package.json`, `node_modules`, and must be installed/run separately:

- `Backend/` — Express 5 REST API + PostgreSQL (via `pg`), JWT auth.
- `Frontend/` — Vite-served static site. **The real app is plain vanilla JS/DOM manipulation, not Vue**, see "Frontend architecture" below.

`.github/workflows/ci.yml` runs lint + format:check + test/build for both apps independently on push/PR to `main`/`Dev`.

## Commands

Run each from its respective directory (`Backend/` or `Frontend/`).

Backend:
- `node index.js` — start the API server (no dev/watch script defined in package.json; use `npx nodemon index.js` for auto-reload since `nodemon` is already a devDependency).
- `npm test` — runs the `Backend/test/*.test.js` suite via Node's built-in test runner (`node --test`) plus `supertest`.
- `npm run lint` / `npm run lint:fix` — ESLint (flat config, `eslint.config.js`). `npm run format` / `npm run format:check` — Prettier.
- Requires a `.env` file with: `PORT`, `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT`, `JWT_SECRET` (see `Backend/.env.example`). Tests don't need a real database or `.env` — `pool.query` is mocked per-test (see `Backend/test/helpers/`) and `Backend/test/setup.js` sets a fixed `JWT_SECRET`.

Frontend:
- `npm run dev` — Vite dev server.
- `npm run build` — production build (`vite build`) to `Frontend/dist`.
- `npm run preview` — serve the production build locally.
- `npm run lint` / `npm run lint:fix` — ESLint (flat config, `eslint.config.js`; treats the Chart.js CDN global as a known global). `npm run format` / `npm run format:check` — Prettier. No test script is configured.
- Optional `.env` with `VITE_API_URL` to point at a non-default backend (see `Frontend/.env.example`); defaults to `http://localhost:3000`.

## Architecture

### Backend (`Backend/index.js`)
Everything — routes, middleware, and the multer upload config — lives in the single `index.js` file; `Backend/routes/` exists but is empty. `Backend/db.js` exports a shared `pg` `Pool` built from the `DB_*` env vars.

- Auth: `POST /login` and `POST /register` hash/compare passwords with `bcrypt` and issue a JWT (1h expiry) signed with `JWT_SECRET`, containing `{ id, email, rol }`.
- `verificarToken` middleware reads `Authorization: Bearer <token>`, verifies the JWT, and attaches the payload to `req.usuario`. Applied to all `/transacciones` and `/usuarios` routes.
- `esAdmin` middleware (checks `req.usuario.rol === 'admin'`) gates `GET /usuarios` and `PUT /usuarios/:id`; note `DELETE /usuarios/:id` only requires `verificarToken`, not admin.
- Transaction endpoints (`/transacciones*`) support an optional receipt image upload via `multer`, saved to `Backend/uploads/` and served statically at `/uploads/<filename>`. `POST`/`PUT` accept `multipart/form-data`.
- Database tables (inferred from queries, no migration files in repo): `usuarios (id, nombre, email, password, rol)` and `transacciones (id, usuario_id, concepto, monto, tipo, categoria, imagen_path, fecha)`.
- Response messages and errors are in Spanish; keep new endpoints consistent with that convention.

### Frontend (`Frontend/`)
This was scaffolded with `npm create vue` (Vue 3 + Pinia + vue-router are in `package.json`), but **the actual application does not use Vue components for its functionality**. `index.html` mounts `#app` with static markup (auth screen, dashboard, modals, admin panel) and loads `src/main.js` as a plain module plus Chart.js from a CDN `<script>` tag. `main.js` does direct `document.getElementById`/DOM manipulation and wires up all UI events (login/register forms, transaction CRUD modals, admin user management).

The Vue scaffolding (`App.vue`, `src/router/`, `src/components/`, `src/stores/counter.js`) is unused boilerplate left over from project init — don't assume changes to it affect the running app.

Key real files:
- `src/main.js` — all UI event wiring and DOM rendering logic (login, register, transaction list/CRUD, admin panel, logout).
- `src/api.js` — fetch wrappers for every backend endpoint. Base URL comes from `VITE_API_URL` (see `Frontend/.env.example`), falling back to `http://localhost:3000` if unset. Note there are duplicate method definitions for `guardarTransaccion`/`actualizarTransaccion` (a JSON version and a later `FormData` version); the second definition in the object literal wins at runtime (the `FormData` ones, used for the receipt-upload flow).
- `src/auth.js` — thin wrapper around `localStorage` for `token`/`usuarioId`/`rol` (session state, not Vuex/Pinia).
- `src/chart-logic.js` — builds the category-spending doughnut chart with Chart.js and a hand-rolled legend; expects a global `Chart` (from the CDN script, not an npm import).

When making frontend changes, edit `main.js`/`api.js`/`auth.js`/`chart-logic.js` and `index.html` directly rather than trying to route work through Vue components/router.
