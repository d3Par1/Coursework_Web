// routes/admin.js
// Token-protected operational endpoints for the deployed app.
// Token is read from process.env.ADMIN_TOKEN. If unset, all routes return 403.
//
//   GET /admin/status?token=xxx     — current DB counts (sanity check)
//   GET /admin/reseed?token=xxx     — wipe + reseed the demo user

const express = require('express');
const { seedDemo, DEMO_EMAIL, DEMO_PASSWORD } = require('../scripts/seed-demo');
const db = require('../config/database');
const User = require('../models/User');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

function requireToken(req, res, next) {
  const expected = process.env.ADMIN_TOKEN;
  const supplied = req.query.token || (req.body && req.body.token);
  if (!expected) {
    return res.status(503).send('ADMIN_TOKEN not configured on this deploy.');
  }
  if (!supplied || supplied !== expected) {
    return res.status(403).send('Forbidden: invalid or missing token.');
  }
  next();
}

router.get('/status', requireToken, (req, res) => {
  const counts = {
    users:        db.prepare('SELECT COUNT(*) AS n FROM users').get().n,
    accounts:     db.prepare('SELECT COUNT(*) AS n FROM accounts').get().n,
    transactions: db.prepare('SELECT COUNT(*) AS n FROM transactions').get().n,
    categories:   db.prepare('SELECT COUNT(*) AS n FROM categories').get().n,
  };
  const demoUser = db.prepare('SELECT id FROM users WHERE email = ?').get(DEMO_EMAIL);
  res.json({
    ok: true,
    counts,
    demoUserExists: Boolean(demoUser),
    serverTime: new Date().toISOString(),
  });
});

router.get('/reseed', requireToken, (req, res) => {
  try {
    const result = seedDemo();
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html><head><title>Reseeded</title>
<style>body{font-family:system-ui,sans-serif;background:#0d1117;color:#c9d1d9;padding:40px;max-width:600px;margin:0 auto}h1{color:#7ee787}code{background:#161b22;padding:2px 6px;border-radius:4px}.box{background:#161b22;padding:20px;border-radius:8px;border:1px solid #30363d;margin:20px 0}a{color:#58a6ff}</style>
</head><body>
<h1>Demo seeded</h1>
<div class="box">
<p><b>User ID:</b> ${result.userId}<br>
<b>Email:</b> <code>${DEMO_EMAIL}</code><br>
<b>Password:</b> <code>${DEMO_PASSWORD}</code><br>
<b>Accounts:</b> 3 (UAH card, USD savings, EUR cash)<br>
<b>Transactions:</b> ${result.txCount}</p>
</div>
<p><a href="/auth/login">→ Login as demo</a></p>
<p style="color:#8b949e;font-size:13px">Other users in the database were not touched.</p>
</body></html>`);
  } catch (err) {
    res.status(500).send(`Seed failed: ${err.message}`);
  }
});

// ────────────────────────────────────────────────────────────────────
// Session-based admin UI (separate from token-protected ops above).
// Visible only to users with users.is_admin = 1.
// ────────────────────────────────────────────────────────────────────

router.get('/users', requireAdmin, (req, res) => {
  const users = User.findAll();
  res.render('admin/users', { title: 'Users — Admin', users });
});

router.post('/users/:id/toggle-admin', requireAdmin, (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  if (!Number.isFinite(targetId) || targetId === req.session.userId) {
    req.flash('error', 'Cannot toggle your own admin role.');
    return res.redirect('/admin/users');
  }
  const target = User.findById(targetId);
  if (!target) {
    req.flash('error', 'User not found.');
    return res.redirect('/admin/users');
  }
  User.setAdmin(targetId, !target.is_admin);
  req.flash('success', `${target.email} is ${target.is_admin ? 'no longer' : 'now'} an admin.`);
  res.redirect('/admin/users');
});

router.get('/auth-events', requireAdmin, (req, res) => {
  const events = db.prepare(
    `SELECT id, user_id, email, event, provider, ip, user_agent, created_at
     FROM auth_events
     ORDER BY created_at DESC
     LIMIT 100`
  ).all();
  res.render('admin/auth-events', { title: 'Auth events — Admin', events });
});

module.exports = router;
