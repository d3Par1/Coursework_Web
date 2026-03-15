// routes/budgets.js
const express = require('express');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const Budget   = require('../models/Budget');
const Category = require('../models/Category');
const router   = express.Router();

// ── Auth guard ───────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect('/auth/login');
  next();
}
router.use(requireAuth);

// ── Validation rules ─────────────────────────────────────────────────────────
const budgetRules = [
  body('category_id')
      .notEmpty().withMessage('Category is required')
      .isInt().withMessage('Invalid category'),
  body('month')
      .matches(/^\d{4}-\d{2}$/).withMessage('Month must be in YYYY-MM format'),
  body('limit_amount')
      .isFloat({ gt: 0 }).withMessage('Limit must be a positive number'),
];

// ── GET /budgets ──────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const userId = req.session.userId;
  const currentMonth = req.query.month || new Date().toISOString().slice(0, 7);

  const budgets    = Budget.findByMonth(userId, currentMonth);
  const categories = Category.findByType(userId, 'expense');

  res.render('budgets/index', {
    title: 'Budgets',
    budgets,
    categories,
    currentMonth,
    errors: null,
    oldInput: {},
  });
});

// ── POST /budgets ─────────────────────────────────────────────────────────────
router.post('/', budgetRules, (req, res) => {
  const userId = req.session.userId;
  const currentMonth = req.body.month || new Date().toISOString().slice(0, 7);

  const hasErrors = handleValidationErrors(req, res, 'budgets/index', {
    title: 'Budgets',
    budgets:    Budget.findByMonth(userId, currentMonth),
    categories: Category.findByType(userId, 'expense'),
    currentMonth,
  });
  if (hasErrors) return;

  const { category_id, month, limit_amount } = req.body;
  Budget.create({
    user_id: userId,
    category_id: parseInt(category_id),
    month,
    limit_amount: parseFloat(limit_amount),
  });

  req.flash('success', 'Budget saved successfully!');
  res.redirect(`/budgets?month=${month}`);
});

// ── POST /budgets/:id/delete ──────────────────────────────────────────────────
router.post('/:id/delete', (req, res) => {
  const ok = Budget.delete(req.params.id, req.session.userId);
  if (!ok) req.flash('error', 'Budget not found.');
  else     req.flash('success', 'Budget removed.');
  res.redirect('/budgets');
});

module.exports = router;
