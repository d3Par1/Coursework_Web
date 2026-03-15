// routes/transactions.js
const express = require('express');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const Transaction = require('../models/Transaction');
const Category    = require('../models/Category');
const Account     = require('../models/Account');
const router = express.Router();

// ── Auth guard ───────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect('/auth/login');
  next();
}
router.use(requireAuth);

// ── Validation rules ─────────────────────────────────────────────────────────
const transactionRules = [
  body('account_id')
      .notEmpty().withMessage('Account is required')
      .isInt().withMessage('Invalid account'),
  body('category_id')
      .notEmpty().withMessage('Category is required')
      .isInt().withMessage('Invalid category'),
  body('type')
      .isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('amount')
      .isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('date')
      .isISO8601().withMessage('Date is required'),
  body('description')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Description must be 200 characters or less'),
];

// ── Helper: load form data for create/edit views ──────────────────────────────
function getFormData(userId) {
  return {
    accounts:   Account.findByUserId(userId),
    categories: Category.findByUserId(userId),
  };
}

// ── GET /transactions ─────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const userId = req.session.userId;
  const { dateFrom, dateTo, category_id, account_id, type } = req.query;

  // Build filters object (only include non-empty values)
  const filters = {};
  if (dateFrom)    filters.dateFrom    = dateFrom;
  if (dateTo)      filters.dateTo      = dateTo;
  if (category_id) filters.category_id = category_id;
  if (account_id)  filters.account_id  = account_id;
  if (type)        filters.type        = type;

  const transactions = Transaction.findFiltered(userId, filters);
  const { accounts, categories } = getFormData(userId);

  // Compute totals for filtered result
  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  res.render('transactions/index', {
    title: 'Transactions',
    transactions,
    accounts,
    categories,
    filters: req.query,
    totalIncome,
    totalExpense,
    errors: null,
    oldInput: {},
  });
});

// ── GET /transactions/new ─────────────────────────────────────────────────────
router.get('/new', (req, res) => {
  const { accounts, categories } = getFormData(req.session.userId);
  res.render('transactions/form', {
    title: 'Add Transaction',
    transaction: null,
    accounts,
    categories,
    errors: null,
    oldInput: {},
  });
});

// ── POST /transactions ────────────────────────────────────────────────────────
router.post('/', transactionRules, (req, res) => {
  const userId = req.session.userId;
  const { accounts, categories } = getFormData(userId);

  const hasErrors = handleValidationErrors(req, res, 'transactions/form', {
    title: 'Add Transaction',
    transaction: null,
    accounts,
    categories,
  });
  if (hasErrors) return;

  const { account_id, category_id, type, amount, description, date } = req.body;
  Transaction.create({
    user_id: userId,
    account_id: parseInt(account_id),
    category_id: parseInt(category_id),
    type,
    amount: parseFloat(amount),
    description,
    date,
  });

  req.flash('success', 'Transaction added successfully!');
  res.redirect('/transactions');
});

// ── GET /transactions/:id/edit ────────────────────────────────────────────────
router.get('/:id/edit', (req, res) => {
  const transaction = Transaction.findById(req.params.id);
  if (!transaction || transaction.user_id !== req.session.userId) {
    req.flash('error', 'Transaction not found.');
    return res.redirect('/transactions');
  }
  const { accounts, categories } = getFormData(req.session.userId);
  res.render('transactions/form', {
    title: 'Edit Transaction',
    transaction,
    accounts,
    categories,
    errors: null,
    oldInput: transaction,
  });
});

// ── POST /transactions/:id/edit ───────────────────────────────────────────────
router.post('/:id/edit', transactionRules, (req, res) => {
  const userId = req.session.userId;
  const { accounts, categories } = getFormData(userId);

  const hasErrors = handleValidationErrors(req, res, 'transactions/form', {
    title: 'Edit Transaction',
    transaction: { id: req.params.id },
    accounts,
    categories,
  });
  if (hasErrors) return;

  const { account_id, category_id, type, amount, description, date } = req.body;
  const ok = Transaction.update(req.params.id, userId, {
    account_id: parseInt(account_id),
    category_id: parseInt(category_id),
    type,
    amount: parseFloat(amount),
    description,
    date,
  });

  if (!ok) req.flash('error', 'Transaction not found.');
  else     req.flash('success', 'Transaction updated!');
  res.redirect('/transactions');
});

// ── POST /transactions/:id/delete ─────────────────────────────────────────────
router.post('/:id/delete', (req, res) => {
  const ok = Transaction.delete(req.params.id, req.session.userId);
  if (!ok) req.flash('error', 'Transaction not found.');
  else     req.flash('success', 'Transaction deleted.');
  res.redirect('/transactions');
});

module.exports = router;
