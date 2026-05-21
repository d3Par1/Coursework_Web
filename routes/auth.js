const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const { UAParser } = require('ua-parser-js');
const db = require('../config/database');
const { handleValidationErrors } = require('../middleware/validation');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const { passport, googleEnabled } = require('../services/oauth');
const { verifyTelegramAuth, telegramEnabled } = require('../services/telegram');

const router = express.Router();

// Visual metadata for each auth_events.event value. Drives icon/color/copy
// in the profile timeline (views/auth/profile.ejs).
const EVENT_DISPLAY = {
  login:                       { icon: 'bi-check-circle-fill',      tone: 'ok',    headline: 'Signed in' },
  login_failed:                { icon: 'bi-exclamation-octagon-fill', tone: 'fail',  headline: 'Failed login attempt', tag: 'blocked' },
  login_failed_telegram:       { icon: 'bi-exclamation-octagon-fill', tone: 'fail',  headline: 'Telegram sign-in rejected', tag: 'blocked' },
  register:                    { icon: 'bi-person-plus-fill',        tone: 'ok',    headline: 'Account created' },
  register_failed_duplicate:   { icon: 'bi-shield-exclamation',      tone: 'fail',  headline: 'Duplicate email blocked' },
  logout:                      { icon: 'bi-box-arrow-right',         tone: 'muted', headline: 'Signed out' },
  password_changed:            { icon: 'bi-pencil-fill',             tone: 'brand', headline: 'Password changed' },
  password_set:                { icon: 'bi-key-fill',                tone: 'brand', headline: 'Password set' },
};
const DEFAULT_EVENT_DISPLAY = { icon: 'bi-circle-fill', tone: 'muted', headline: null };

function enrichEvent(row) {
  const meta = EVENT_DISPLAY[row.event] || { ...DEFAULT_EVENT_DISPLAY, headline: row.event };
  let device = '';
  if (row.user_agent) {
    try {
      const ua = UAParser(row.user_agent);
      const browser = ua.browser.name || 'Unknown browser';
      const os = ua.os.name || 'Unknown OS';
      device = `${browser} on ${os}`;
    } catch { device = ''; }
  }
  return {
    ...row,
    icon: meta.icon,
    tone: meta.tone,
    headline: meta.headline || row.event,
    tag: meta.tag || (row.provider !== 'local' ? row.provider : 'email'),
    device,
  };
}

// Smoke tests fire many auth requests back-to-back; skip the limiter under test.
const isTest = () => process.env.NODE_ENV === 'test';

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  skip: isTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts. Wait a minute and try again.',
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  skip: isTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many registration attempts. Try again in an hour.',
});

const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: isTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many password changes. Try again later.',
});

const insertAuthEvent = db.prepare(
  `INSERT INTO auth_events (user_id, email, event, provider, ip, user_agent)
   VALUES (?, ?, ?, ?, ?, ?)`
);
function logAuthEvent(req, { event, userId = null, email = null, provider = 'local' }) {
  try {
    insertAuthEvent.run(
      userId,
      email,
      event,
      provider,
      req.ip || null,
      (req.headers['user-agent'] || '').slice(0, 255)
    );
  } catch (err) {
    console.error('auth_events insert failed:', err.message);
  }
}

// Centralized post-auth handler. Regenerates session ID (CWE-384) then sets
// the new identity on the fresh session.
function completeLogin(req, res, user, { redirectTo = '/', flashMsg, event = 'login', provider = 'local' } = {}) {
  req.session.regenerate((err) => {
    if (err) {
      console.error('Session regenerate error:', err);
      return res.status(500).render('errors/500', { title: 'Error' });
    }
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    req.session.isAdmin = Boolean(user.is_admin);
    logAuthEvent(req, { event, userId: user.id, email: user.email, provider });
    if (flashMsg) req.flash('success', flashMsg);
    res.redirect(redirectTo);
  });
}

// ───── GET pages ─────────────────────────────────────────────────────────

router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Login', errors: null, oldInput: {} });
});

router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Register', errors: null, oldInput: {} });
});

// ───── Email + password registration ─────────────────────────────────────

router.post('/register', registerLimiter, [
  body('name').notEmpty().withMessage('Name is required').trim().escape(),
  body('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword')
    .custom((val, { req }) => val === req.body.password)
    .withMessage('Passwords do not match'),
], (req, res) => {
  const result = handleValidationErrors(req, res, 'auth/register', { title: 'Register' });
  if (result) return;

  const { name, email, password } = req.body;

  // Equalize response timing for duplicate-email path (CWE-208 mitigation).
  if (User.findByEmail(email)) {
    bcrypt.hashSync(password, 10);
    logAuthEvent(req, { event: 'register_failed_duplicate', email });
    return res.status(422).render('auth/register', {
      title: 'Register',
      errors: [{ path: 'email', msg: 'An account with this email already exists' }],
      oldInput: req.body,
    });
  }

  let user;
  try {
    user = User.create(name, email, password);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed: users.email')) {
      return res.status(422).render('auth/register', {
        title: 'Register',
        errors: [{ path: 'email', msg: 'An account with this email already exists' }],
        oldInput: req.body,
      });
    }
    throw err;
  }

  completeLogin(req, res, user, {
    flashMsg: `Welcome, ${user.name}!`,
    event: 'register',
  });
});

// ───── Email + password login ────────────────────────────────────────────

router.post('/login', loginLimiter, [
  body('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], (req, res) => {
  const result = handleValidationErrors(req, res, 'auth/login', { title: 'Login' });
  if (result) return;

  const { email, password } = req.body;
  const user = User.findByEmail(email);

  if (!user || !User.verifyPassword(password, user.password_hash)) {
    logAuthEvent(req, { event: 'login_failed', email });
    return res.status(401).render('auth/login', {
      title: 'Login',
      errors: [{ path: 'email', msg: 'Invalid email or password' }],
      oldInput: { email },
    });
  }

  completeLogin(req, res, user, { flashMsg: 'Logged in successfully' });
});

// ───── Logout ────────────────────────────────────────────────────────────

router.post('/logout', (req, res) => {
  const userId = req.session.userId;
  const email = req.session.userEmail;
  req.session.destroy((err) => {
    if (err) console.error('Session destroy error:', err);
    res.clearCookie('connect.sid');
    if (userId) logAuthEvent(req, { event: 'logout', userId, email });
    res.redirect('/auth/login');
  });
});

// ───── Google OAuth ──────────────────────────────────────────────────────

if (googleEnabled) {
  router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  }));

  router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/auth/login' }),
    (req, res) => {
      if (!req.user) {
        req.flash('error', 'Google authentication failed.');
        return res.redirect('/auth/login');
      }
      completeLogin(req, res, req.user, {
        flashMsg: `Signed in as ${req.user.name}`,
        event: 'login',
        provider: 'google',
      });
    }
  );
} else {
  // Helpful 503 if the user hits the URL with OAuth not configured.
  router.get('/google', (req, res) => {
    res.status(503).render('errors/404', { title: 'Google sign-in not configured' });
  });
}

// ───── Telegram Login Widget ─────────────────────────────────────────────

if (telegramEnabled) {
  // The widget can deliver the payload via GET (redirect) or POST (data-auth-url).
  const handleTelegram = (req, res) => {
    const payload = req.method === 'POST' ? req.body : req.query;
    const result = verifyTelegramAuth(payload);
    if (!result.valid) {
      logAuthEvent(req, {
        event: 'login_failed_telegram',
        email: null,
        provider: 'telegram',
      });
      req.flash('error', `Telegram sign-in rejected (${result.reason}).`);
      return res.redirect('/auth/login');
    }
    const tg = result.user;
    const displayName = [tg.first_name, tg.last_name].filter(Boolean).join(' ').trim()
      || tg.username || `Telegram user ${tg.id}`;
    const syntheticEmail = `tg-${tg.id}@telegram.local`;

    let user = User.findByTelegramId(tg.id);
    if (!user) {
      user = User.createFromOAuth({
        name: displayName,
        email: syntheticEmail,
        provider: 'telegram',
        providerId: tg.id,
        avatarUrl: tg.photo_url,
      });
    }

    completeLogin(req, res, user, {
      flashMsg: `Signed in as ${user.name}`,
      event: 'login',
      provider: 'telegram',
    });
  };

  router.get('/telegram/callback', handleTelegram);
  router.post('/telegram/callback', handleTelegram);
} else {
  router.get('/telegram/callback', (req, res) => {
    res.status(503).render('errors/404', { title: 'Telegram sign-in not configured' });
  });
}

// ───── Profile + password change (logged in) ─────────────────────────────

router.get('/profile', requireAuth, (req, res) => {
  const user = User.findById(req.session.userId);
  const rows = db.prepare(
    `SELECT event, provider, ip, user_agent, created_at
     FROM auth_events
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 20`
  ).all(req.session.userId);
  const events = rows.map(enrichEvent);
  res.render('auth/profile', {
    title: 'Profile',
    user,
    events,
    errors: null,
  });
});

router.post('/password', requireAuth, passwordChangeLimiter, [
  body('currentPassword').optional({ checkFalsy: true }),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  body('confirmPassword')
    .custom((val, { req }) => val === req.body.newPassword)
    .withMessage('Passwords do not match'),
], (req, res) => {
  const user = User.findByEmail(req.session.userEmail);
  if (!user) {
    req.flash('error', 'User not found.');
    return res.redirect('/auth/profile');
  }

  // OAuth users with empty password_hash skip the currentPassword check
  // (they're setting their first password). Otherwise, currentPassword must verify.
  const hasExistingPassword = Boolean(user.password_hash && user.password_hash.length > 0);
  if (hasExistingPassword) {
    const { currentPassword } = req.body;
    if (!currentPassword || !User.verifyPassword(currentPassword, user.password_hash)) {
      const events = db.prepare(
        `SELECT event, provider, ip, user_agent, created_at FROM auth_events
         WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`
      ).all(req.session.userId).map(enrichEvent);
      return res.status(401).render('auth/profile', {
        title: 'Profile',
        user: User.findById(req.session.userId),
        events,
        errors: [{ path: 'currentPassword', msg: 'Current password is incorrect' }],
      });
    }
  }

  const result = handleValidationErrors(req, res, 'auth/profile', {
    title: 'Profile',
    user: User.findById(req.session.userId),
    events: db.prepare(
      `SELECT event, provider, ip, user_agent, created_at FROM auth_events
       WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`
    ).all(req.session.userId).map(enrichEvent),
  });
  if (result) return;

  User.updatePassword(user.id, req.body.newPassword);
  logAuthEvent(req, {
    event: hasExistingPassword ? 'password_changed' : 'password_set',
    userId: user.id,
    email: user.email,
  });
  req.flash('success', hasExistingPassword ? 'Password updated.' : 'Password set. You can now sign in with email + password.');
  res.redirect('/auth/profile');
});

module.exports = router;
