const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const { handleValidationErrors } = require('../middleware/validation');
const User = require('../models/User');

const router = express.Router();

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

// GET /auth/login
router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Login', errors: null, oldInput: {} });
});

// GET /auth/register
router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Register', errors: null, oldInput: {} });
});

// POST /auth/register
router.post('/register', registerLimiter, [
  body('name')
    .notEmpty().withMessage('Name is required')
    .trim()
    .escape(),
  body('email')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword')
    .custom((val, { req }) => val === req.body.password)
    .withMessage('Passwords do not match')
], (req, res) => {
  const result = handleValidationErrors(req, res, 'auth/register', { title: 'Register' });
  if (result) return;

  const { name, email, password } = req.body;

  // Equalize response timing for duplicate-email path: do a real bcrypt hash
  // so an attacker can't distinguish "email taken" from "email free" by
  // measuring response time (CWE-208, timing side-channel enumeration).
  if (User.findByEmail(email)) {
    bcrypt.hashSync(password, 10);
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
      // TOCTOU race: another request inserted this email between our check
      // and our insert. Fall through to the same error path.
      return res.status(422).render('auth/register', {
        title: 'Register',
        errors: [{ path: 'email', msg: 'An account with this email already exists' }],
        oldInput: req.body,
      });
    }
    throw err;
  }

  // Regenerate session ID after auth state change to defeat session fixation
  // (CWE-384): if attacker pre-set the victim's SID, it's invalidated here.
  req.session.regenerate((err) => {
    if (err) {
      console.error('Session regenerate error:', err);
      return res.status(500).render('errors/500', { title: 'Error' });
    }
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    req.flash('success', `Welcome, ${user.name}!`);
    res.redirect('/');
  });
});

// POST /auth/login
router.post('/login', loginLimiter, [
  body('email')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
], (req, res) => {
  const result = handleValidationErrors(req, res, 'auth/login', { title: 'Login' });
  if (result) return;

  const { email, password } = req.body;
  const user = User.findByEmail(email);

  if (!user || !User.verifyPassword(password, user.password_hash)) {
    return res.status(401).render('auth/login', {
      title: 'Login',
      errors: [{ path: 'email', msg: 'Invalid email or password' }],
      oldInput: { email }
    });
  }

  // Regenerate session ID on auth state change (CWE-384).
  req.session.regenerate((err) => {
    if (err) {
      console.error('Session regenerate error:', err);
      return res.status(500).render('errors/500', { title: 'Error' });
    }
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    req.flash('success', 'Logged in successfully');
    res.redirect('/');
  });
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
    }
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
});

module.exports = router;
