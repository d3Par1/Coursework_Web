const express = require('express');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// GET /auth/login
router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Login', errors: null, oldInput: {} });
});

// GET /auth/register
router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Register', errors: null, oldInput: {} });
});

// POST /auth/register -- validation only (auth logic in Phase 2)
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

  // Validation passed -- Phase 2 will add real registration logic here
  req.flash('success', 'Registration form is valid! (Auth will be implemented in Phase 2)');
  res.redirect('/auth/login');
});

// POST /auth/login -- validation only (auth logic in Phase 2)
router.post('/login', [
  body('email')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
], (req, res) => {
  const result = handleValidationErrors(req, res, 'auth/login', { title: 'Login' });
  if (result) return; // Errors were rendered

  // Validation passed -- Phase 2 will add real login logic here
  req.flash('success', 'Login form is valid! (Auth will be implemented in Phase 2)');
  res.redirect('/');
});

module.exports = router;
