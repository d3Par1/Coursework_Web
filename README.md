# Finance Manager

> Personal finance manager with multi-currency accounts, transaction tracking, budgets, and analytics.
> KPI course work — *Основи Веб-програмування*, group ТВ-43, 2025/26 academic year.

[![CI](https://github.com/d3Par1/Coursework_Web/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/d3Par1/Coursework_Web/actions/workflows/ci.yml)
[![Live demo](https://img.shields.io/badge/demo-live-22aa66)](https://finance-app-p6gg.onrender.com)
[![Node](https://img.shields.io/badge/node-20%20LTS-339933)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-ISC-blue)](#license)

**Live demo:** https://finance-app-p6gg.onrender.com
*(Free Render tier — first request after idle may take ~30 s to cold-start.)*

---

## Overview

A full-stack web application for managing personal finances. Users register an account, add cash / card / savings balances, log income and expenses across user-defined categories, set monthly budgets, and visualise spending patterns with Chart.js. The app supports multi-currency accounts (UAH/USD/EUR) with live FX rates fetched from an external API.

Unlike a typical "first web project" that fakes auth via `localStorage` and pretends to have a database, this is a **real server-rendered Express application** with:

- bcrypt-hashed passwords stored in SQLite
- Server-side session cookies (`httpOnly` + `secure` + `sameSite=lax`)
- Real authorisation checks on every data-access query (no IDOR)
- OAuth integration with Google and Telegram (optional, gracefully degrades)
- Rate-limited login and registration endpoints
- A defended CSP, frame-ancestors block, and other helmet-managed headers

---

## Key features

### Authentication
- **Email + password** with bcrypt hashing (`bcryptjs`, cost factor 10)
- **Sign in with Google** via OAuth 2.0 (passport-google-oauth20)
- **Login with Telegram** via the official Login Widget (HMAC-SHA256 verification per Telegram's spec)
- **Account linking** — sign in via Google or Telegram against an existing email automatically links the provider
- **Password change** and **password set** flow (OAuth users can add a password fallback)
- **Auth event log** — every login / register / failed attempt / password change is recorded
- **Session ID regeneration** on every auth state change (CWE-384 mitigation)
- **Rate limiting** — 5 login attempts/min, 3 registrations/hr, 5 password changes/15 min
- **Timing-safe duplicate-email check** on registration (CWE-208 mitigation against enumeration)

### Finance
- **Accounts** — cash, card, savings; multi-currency (UAH/USD/EUR); per-user balances
- **Transactions** — income / expense with categories, account, description, date
- **Categories** — pre-seeded defaults + user-defined custom categories
- **Budgets** — monthly limits per category with visual progress bars
- **Dashboard** — KPI cards (total balance, income, expenses, savings), recent activity, charts
- **Charts** — Chart.js donut for spending-by-category + bar for monthly trends
- **Live FX rates** — caches the latest UAH↔USD↔EUR rates from an external API
- **CSV / DOCX export** of transactions for accounting purposes

### UX
- **Responsive Bootstrap 5 layout** — works on phones, tablets, and desktops
- **Dark theme** with system-preference detection and localStorage persistence
- **Custom design system** — OKLCH semantic colors, Manrope + JetBrains Mono + Instrument Serif

### DevOps
- **Render Blueprint deployment** (`render.yaml`) — push to develop, autodeploy
- **GitHub Actions CI** — runs four smoke-test suites on every push and PR
- **Health endpoint** (`/healthz`) for uptime monitors
- **Idempotent schema migrations** — additive `ALTER TABLE` on every boot

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node.js 20 LTS | Modern LTS with stable better-sqlite3 prebuilds |
| Framework | Express 4 | Minimal, server-rendered, no SPA complexity |
| Templates | EJS + express-ejs-layouts | Server-side rendering with shared layout |
| Database | SQLite via `better-sqlite3` | Zero-config; sync API is simpler than callbacks |
| Auth | express-session + bcryptjs + passport-google-oauth20 | Industry-standard primitives |
| Security | helmet, express-rate-limit | OWASP-aligned defaults |
| Styling | Bootstrap 5 + custom CSS (OKLCH tokens) | Familiar grid + bespoke brand layer |
| Charts | Chart.js 4 | Lightweight, no React/Vue dependency |
| Testing | Plain Node `http` + `assert` | No test framework — keeps the bundle slim |
| Hosting | Render (web service, free tier) | Auto-deploy from Git, free HTTPS |

---

## Security highlights

Implemented controls and the CWE / OWASP category they address:

| Control | Identifier | Where |
|---|---|---|
| HTTP security headers (CSP, X-Frame-Options, X-Content-Type-Options, etc.) | OWASP A05 | `server.js` (helmet) |
| Clickjacking defense (`frame-ancestors 'none'` + `X-Frame-Options: DENY`) | CWE-1021 | `server.js` (helmet) |
| Session cookie hardening (`httpOnly`, `sameSite=lax`, `secure` in prod) | CWE-614, CWE-1004 | `server.js` |
| Brute-force login protection (rate limit per IP) | CWE-307 | `routes/auth.js` |
| Mass-creation defense (registration rate limit) | CWE-799 | `routes/auth.js` |
| Session fixation defense (`req.session.regenerate()` on auth) | CWE-384 | `routes/auth.js#completeLogin` |
| Email enumeration via response timing (constant-time bcrypt on duplicate) | CWE-208 | `routes/auth.js` POST `/register` |
| Telegram payload tampering (HMAC-SHA256 + 5-min replay window) | CWE-345, CWE-294 | `services/telegram.js` |
| IDOR on accounts CRUD (every query takes `(id, userId)`) | CWE-639 | `routes/accounts.js`, `models/Account.js` |
| Password storage (bcrypt, cost 10, no plain-text anywhere) | CWE-256 | `models/User.js` |
| Input validation (express-validator on every form) | CWE-20 | `routes/auth.js`, `routes/accounts.js` |
| Auth event audit log | OWASP A09 (logging) | `auth_events` table + `logAuthEvent()` |

**Deferred (documented gaps, not silent ones):**

- **CSRF tokens** on POST forms — `sameSite=lax` provides partial defense; full token-based CSRF is pending coordination with the team-mate working on transactions/categories/budgets templates.
- **Nonce-based CSP** for `script-src` — currently allows `'unsafe-inline'` because some legacy templates use `onclick` handlers. Migrating to nonces requires touching those templates.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                    │
│  ─ EJS-rendered HTML + Bootstrap 5 + Chart.js + theme.js   │
└───────────────────────────────┬─────────────────────────────┘
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────┐
│  Render's reverse proxy (TLS termination, X-Forwarded-*)    │
└───────────────────────────────┬─────────────────────────────┘
                                │ HTTP
                                ▼
┌─────────────────────────────────────────────────────────────┐
│  Express app (server.js)                                    │
│   ├─ helmet  (headers)                                      │
│   ├─ session (express-session)                              │
│   ├─ passport (Google OAuth init only)                      │
│   ├─ routes/                                                │
│   │   ├─ auth.js        (login, register, OAuth, profile)   │
│   │   ├─ accounts.js    (IDOR-safe CRUD)                    │
│   │   ├─ dashboard.js                                       │
│   │   ├─ charts.js      (JSON API for Chart.js)             │
│   │   ├─ currency.js    (FX rate proxy)                     │
│   │   └─ transactions / categories / budgets (team-mate)    │
│   ├─ models/  (User, Account, Transaction…)                 │
│   ├─ services/                                              │
│   │   ├─ oauth.js       (passport strategy registration)    │
│   │   ├─ telegram.js    (HMAC verification)                 │
│   │   └─ currency.js    (FX cache)                          │
│   └─ middleware/  (requireAuth, setCurrentUser, validation) │
└───────────────────────────────┬─────────────────────────────┘
                                │ better-sqlite3 (sync)
                                ▼
┌─────────────────────────────────────────────────────────────┐
│  SQLite file (./finance.db)                                 │
│   tables: users, accounts, categories, transactions,        │
│           budgets, auth_events                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Getting started

### Prerequisites

- **Node.js 20 LTS** (`node -v` should print `v20.x`)
- npm 10+
- A C/C++ toolchain for the `better-sqlite3` native build:
  - macOS — Xcode Command Line Tools (`xcode-select --install`)
  - Linux — `build-essential` + `python3`
  - Windows — `npm install --global windows-build-tools` *(or just install Visual Studio Build Tools)*

### Local development

```bash
git clone https://github.com/d3Par1/Coursework_Web.git
cd Coursework_Web
npm install
cp .env.example .env
# edit .env — at minimum set SESSION_SECRET to anything random
npm start
```

The app is now at <http://localhost:3000>. The SQLite file (`finance.db`) is created automatically on first boot, with the schema and seed categories applied.

### Hot-reload during dev

```bash
npm run dev   # uses nodemon
```

### Running tests

```bash
npm test   # runs all four smoke-test suites
```

The CI workflow runs the same command on every push and PR. Tests use `NODE_ENV=test` to bypass rate-limit middleware so they can fire many auth requests back-to-back.

---

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | no (defaults `3000`) | HTTP port to listen on |
| `DB_PATH` | no (defaults `./finance.db`) | SQLite database file path |
| `SESSION_SECRET` | **yes in prod** | Signs the session cookie. Use a long random string. |
| `NODE_ENV` | recommended (`production` / `test`) | Enables `secure: true` on the session cookie; disables rate-limit middleware under `test` |
| `GOOGLE_CLIENT_ID` | only for Google sign-in | OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | only for Google sign-in | OAuth 2.0 client secret |
| `OAUTH_CALLBACK_BASE` | optional | Absolute base URL for OAuth callbacks (e.g. `https://finance-app-p6gg.onrender.com`). Leave empty for relative URLs. |
| `TELEGRAM_BOT_TOKEN` | only for Telegram sign-in | Bot token from `@BotFather` |
| `TELEGRAM_BOT_USERNAME` | only for Telegram sign-in | Bot's `@handle`, without the `@` |

Missing any optional var simply hides the corresponding sign-in button at runtime — the app still serves the email + password flow.

---

## Deployment (Render)

The repo includes a `render.yaml` Blueprint, so deployment is one click:

1. Sign up at <https://render.com> with your GitHub account.
2. Authorise Render for **only** the `Coursework_Web` repo.
3. **New +** → **Blueprint** → select `Coursework_Web`.
4. Render reads `render.yaml`, shows the service to create. Click **Apply**.
5. Wait ~5 min for the first build (native `better-sqlite3` compile).

Render auto-redeploys on every push to `develop`. The build/start commands and required env vars are all declared in the YAML — no dashboard configuration needed for the basic deployment.

**Optional env vars** (`GOOGLE_*`, `TELEGRAM_*`, `OAUTH_CALLBACK_BASE`) are declared with `sync: false`, meaning they appear in the Render dashboard for you to fill in once you've set up the OAuth credentials. Leaving them empty just keeps those sign-in buttons hidden.

### Free-tier caveats

- **Cold start ~30 s** after 15 min of idle traffic.
- **Ephemeral filesystem** — SQLite resets on every redeploy and after long idle periods. Pre-seeded categories survive (re-seeded on boot), user data does not. For persistent data, upgrade to a paid plan or switch to Postgres / Fly.io with a volume.

---

## OAuth setup

### Google sign-in

1. Open <https://console.cloud.google.com/>.
2. Create a new project (or reuse one). It can be empty — you only need the OAuth client.
3. **APIs & Services** → **OAuth consent screen** → configure (external user type is fine for course work). Add your email as a test user.
4. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID** → **Web application**.
5. **Authorized redirect URIs** — add:
   - `http://localhost:3000/auth/google/callback` (for local dev)
   - `https://YOUR-APP.onrender.com/auth/google/callback` (your Render URL)
6. Copy the **Client ID** and **Client secret**.
7. In Render dashboard → your service → **Environment** → set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `OAUTH_CALLBACK_BASE=https://YOUR-APP.onrender.com`.
8. Trigger a redeploy. The **Continue with Google** button now appears on the sign-in page.

### Telegram login

1. Open Telegram, start a chat with [`@BotFather`](https://t.me/BotFather).
2. Send `/newbot`, give it a name and a `@username` (must end in `bot`, e.g. `FinanceManagerKpiBot`).
3. Copy the bot token that BotFather returns.
4. Send `/setdomain` to BotFather → choose your bot → enter your Render domain (`finance-app-p6gg.onrender.com`). Telegram refuses to render the widget on any other host.
5. In Render dashboard → set `TELEGRAM_BOT_TOKEN=...` and `TELEGRAM_BOT_USERNAME=YourBotUsername` (no `@`).
6. Redeploy. The Telegram Login Widget appears below the password form.

The HMAC verification (`services/telegram.js`) checks:
- Hash matches HMAC-SHA256 of payload (signed by SHA-256(bot_token))
- `auth_date` is within ±5 minutes of server time (replay protection)
- Constant-time comparison via `crypto.timingSafeEqual`

---

## Testing

Four smoke-test suites, each is a plain Node script that boots the Express app on a random port and exercises it over HTTP:

| Suite | What it checks |
|---|---|
| `tests/smoke-navigation.js` | Protected routes redirect to `/auth/login` when unauthenticated |
| `tests/smoke-validation.js` | Forms render with `needs-validation` class and ARIA error markup |
| `tests/smoke-auth.js` | Register → session cookie → access dashboard → logout → access blocked; password is bcrypt-hashed in DB; wrong password rejected; duplicate email rejected |
| `tests/smoke-charts.js` | Charts API returns valid pie/bar shapes; honors month/months query params; falls back gracefully on bad input |

CI runs them all on every push and PR via `.github/workflows/ci.yml`. No mocking — every test hits the real SQLite database and real Express middleware stack.

---

## Project structure

```
finance-app/
├── server.js                 # Express entry point
├── render.yaml               # Render Blueprint
├── .github/workflows/ci.yml  # GitHub Actions CI
├── config/
│   └── database.js           # SQLite setup + migrations
├── db/
│   ├── schema.sql            # DDL (idempotent CREATE TABLE IF NOT EXISTS)
│   └── seed.sql              # Default categories
├── models/                   # Data access (parametrized SQL via better-sqlite3)
│   ├── User.js
│   ├── Account.js
│   ├── Transaction.js
│   ├── Category.js
│   └── Budget.js
├── routes/                   # Express routers
│   ├── auth.js               # Login, register, OAuth, profile, password change
│   ├── accounts.js
│   ├── dashboard.js
│   ├── transactions.js
│   ├── categories.js
│   ├── budgets.js
│   ├── currency.js
│   ├── charts.js
│   └── api.js
├── middleware/
│   ├── auth.js               # requireAuth, setCurrentUser
│   └── validation.js         # express-validator error renderer
├── services/
│   ├── oauth.js              # Passport strategy registration
│   ├── telegram.js           # HMAC verification
│   └── currency.js           # FX rate cache
├── views/                    # EJS templates
│   ├── layout.ejs            # Shared layout with theme init
│   ├── auth/                 # login, register, profile
│   ├── accounts/
│   ├── dashboard.ejs
│   ├── partials/             # navbar, footer, flash, provider-buttons
│   └── errors/               # 404, 500
├── public/
│   ├── css/style.css         # Design tokens, dark theme, components
│   └── js/
│       ├── theme.js          # Light/dark toggle
│       ├── dashboard-charts.js
│       └── validation.js
├── helpers/
│   └── format.js             # Intl money/signed/date formatters
├── tests/                    # Smoke tests (plain node http)
├── diagrams/                 # Class/component/interaction (Mermaid)
└── docs/                     # CW report drafts (gitignored except images)
```

---

## Team

| Developer | GitHub | Scope |
|---|---|---|
| Степаненко Назар (ТВ-43) | [@d3Par1](https://github.com/d3Par1) | Auth, accounts, dashboard, charts, OAuth, API, security hardening, deployment |
| Аніщенко Артем (ТВ-43) | [@anishchenko64](https://github.com/anishchenko64) | Categories, transactions, filtering, budgets, export |

**Branching:** `develop` is the integration branch; feature branches off `develop`; `master` reserved for stable releases. Conventional Commits format (`feat:`, `fix:`, `docs:`, `chore:`, `ci:`).

---

## Course context

- **Course:** Основи Веб-програмування. Курсова робота
- **Year / Group:** 2nd year, 2nd semester · ТВ-43
- **Topic 31:** Додаток для фінансового менеджменту (Financial management application)
- **Institution:** Igor Sikorsky Kyiv Polytechnic Institute
- **Academic year:** 2025/26
- **Defense:** May 2026

---

## License

ISC.

This is an educational project. The codebase is provided as-is for reference. Reuse is permitted; please don't submit it verbatim as your own course work.
