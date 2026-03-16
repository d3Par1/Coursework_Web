const express = require('express');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const User = require('../models/User');

const router = express.Router();

// GET /auth/login
router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Login', errors: null, oldInput: {} });
});

// GET /auth/register
router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Register', errors: null, oldInput: {} });
});

// POST /auth/register
router.post('/register', [
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
  if (result) return; // Errors were rendered

  const { name, email, password } = req.body;

  try {
    const user = User.create(name, email, password);
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    req.flash('success', `Welcome, ${user.name}!`);
    res.redirect('/');
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed: users.email')) {
      return res.status(422).render('auth/register', {
        title: 'Register',
        errors: [{ path: 'email', msg: 'An account with this email already exists' }],
        oldInput: req.body
      });
    }
    throw err;
  }
});

// POST /auth/login
router.post('/login', [
  body('email')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
], (req, res) => {
  const result = handleValidationErrors(req, res, 'auth/login', { title: 'Login' });
  if (result) return; // Errors were rendered

  const { email, password } = req.body;
  const user = User.findByEmail(email);

  if (!user || !User.verifyPassword(password, user.password_hash)) {
    return res.status(401).render('auth/login', {
      title: 'Login',
      errors: [{ path: 'email', msg: 'Invalid email or password' }],
      oldInput: { email }
    });
  }

  req.session.userId = user.id;
  req.session.userName = user.name;
  req.session.userEmail = user.email;
  req.flash('success', 'Logged in successfully');
  res.redirect('/');
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
