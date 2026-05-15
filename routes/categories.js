// routes/categories.js
const express = require('express');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const Category = require('../models/Category');
const router = express.Router();

// ── Auth guard ───────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect('/auth/login');
  next();
}
router.use(requireAuth);

// ── Validation rules ─────────────────────────────────────────────────────────
const categoryRules = [
  body('name')
      .notEmpty().withMessage('Category name is required')
      .trim()
      .isLength({ max: 50 }).withMessage('Name must be 50 characters or less'),
  body('type')
      .isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('icon').optional().trim(),
  body('color')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex code'),
];

// ── GET /categories ───────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const categories = Category.findByUserIdWithMonthly(req.session.userId);
  const expense = categories.filter(c => c.type === 'expense');
  const income  = categories.filter(c => c.type === 'income');

  res.render('categories/index', {
    title: 'Categories',
    expense,
    income,
    errors: null,
    oldInput: {},
  });
});

// ── POST /categories ──────────────────────────────────────────────────────────
router.post('/', categoryRules, (req, res) => {
  const categories = Category.findByUserId(req.session.userId);
  const expense = categories.filter(c => c.type === 'expense');
  const income  = categories.filter(c => c.type === 'income');

  const hasErrors = handleValidationErrors(req, res, 'categories/index', {
    title: 'Categories', expense, income,
  });
  if (hasErrors) return;

  const { name, type, icon, color } = req.body;
  Category.create({ user_id: req.session.userId, name, type, icon, color });

  req.flash('success', `Category "${name}" created successfully!`);
  res.redirect('/categories');
});

// ── POST /categories/:id/edit ─────────────────────────────────────────────────
router.post('/:id/edit', categoryRules, (req, res) => {
  const hasErrors = handleValidationErrors(req, res, 'categories/index', {
    title: 'Categories',
    expense: Category.findByType(req.session.userId, 'expense'),
    income:  Category.findByType(req.session.userId, 'income'),
  });
  if (hasErrors) return;

  const { name, type, icon, color } = req.body;
  const updated = Category.update(req.params.id, req.session.userId, { name, type, icon, color });

  if (!updated) {
    req.flash('error', 'Category not found or you do not have permission to edit it.');
  } else {
    req.flash('success', `Category "${name}" updated!`);
  }
  res.redirect('/categories');
});

// ── POST /categories/:id/delete ───────────────────────────────────────────────
router.post('/:id/delete', (req, res) => {
  const result = Category.delete(req.params.id, req.session.userId);

  if (result === 'has_transactions') {
    req.flash('error', 'Cannot delete this category — it has associated transactions. Remove them first.');
  } else if (!result) {
    req.flash('error', 'Category not found or you cannot delete system categories.');
  } else {
    req.flash('success', 'Category deleted.');
  }
  res.redirect('/categories');
});

module.exports = router;
