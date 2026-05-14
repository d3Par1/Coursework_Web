// server.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Render terminates HTTPS at its proxy; trusting 1 hop lets req.ip see the
// real client (for rate limiting) and lets cookie `secure` flag work over TLS.
app.set('trust proxy', 1);

// Initialize database (runs schema on first start)
require('./config/database');

// Security headers. CSP allows our CDN deps (Bootstrap, Chart.js, Telegram
// Login Widget, Google Fonts) and inline scripts because templates use legacy
// onclick handlers; nonce-based CSP is a future hardening pass.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        'https://cdn.jsdelivr.net',
        'https://telegram.org',
        'https://oauth.telegram.org',
        "'unsafe-inline'",
      ],
      styleSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com', "'unsafe-inline'"],
      fontSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https://t.me', 'https://*.googleusercontent.com'],
      connectSrc: ["'self'"],
      frameSrc: ["'self'", 'https://oauth.telegram.org'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Money/date helpers available in all EJS templates
const { money, signed, date, dateTime } = require('./helpers/format');
app.locals.money = money;
app.locals.signed = signed;
app.locals.dateLabel = date;
app.locals.dateTime = dateTime;

// OAuth provider availability — exposed to views so buttons hide when env
// vars are missing. The actual strategy registration happens in services/oauth.js.
const { passport, googleEnabled } = require('./services/oauth');
const { telegramEnabled, TELEGRAM_BOT_USERNAME } = require('./services/telegram');
app.locals.googleEnabled = googleEnabled;
app.locals.telegramEnabled = telegramEnabled;
app.locals.telegramBotUsername = TELEGRAM_BOT_USERNAME;

// Middleware
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session + Flash. Cookie hardened for production:
// - httpOnly: blocks JS access (XSS-token-theft mitigation)
// - sameSite=lax: blocks cross-site POSTs (CSRF mitigation, partial)
// - secure: HTTPS-only when on Render/production
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));
app.use(flash());

// Passport (initialize only — no session integration; auth routes manage
// req.session themselves to keep the session-regeneration defense in one place).
app.use(passport.initialize());

// Make flash messages available in all views
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Health check for Render uptime monitoring + external probes.
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Auth middleware
const { setCurrentUser, requireAuth } = require('./middleware/auth');
app.use(setCurrentUser);

// Expose current path to views (for active-nav highlighting)
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

// Masthead strip — date + live FX rates above the navbar (silent on failure).
app.use(require('./middleware/fxStrip'));

// Routes (auth first, then protected routes)
app.use('/auth', require('./routes/auth'));
app.use('/', requireAuth, require('./routes/dashboard'));
app.use('/accounts', requireAuth, require('./routes/accounts'));
app.use('/transactions', requireAuth, require('./routes/transactions'));
app.use('/categories', requireAuth, require('./routes/categories'));
app.use('/budgets', requireAuth, require('./routes/budgets'));
app.use('/api/currency', requireAuth, require('./routes/currency'));
app.use('/api/charts', requireAuth, require('./routes/charts'));
app.use('/api', requireAuth, require('./routes/api'));

// 404 handler
app.use((req, res) => {
  res.status(404).render('errors/404');
});

// Start server only when run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
