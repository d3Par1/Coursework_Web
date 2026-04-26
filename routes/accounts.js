// routes/accounts.js
const express = require('express');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const Account = require('../models/Account');
const router = express.Router();

const accountRules = [
  body('name')
    .notEmpty().withMessage('Account name is required')
    .trim()
    .isLength({ max: 50 }).withMessage('Name must be 50 characters or less'),
  body('type')
    .isIn(['cash', 'card', 'savings']).withMessage('Type must be cash, card, or savings'),
  body('currency')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter ISO code')
    .matches(/^[A-Z]{3}$/).withMessage('Currency must be uppercase ISO code (UAH, USD, EUR)'),
  body('balance')
    .optional({ checkFalsy: true })
    .isFloat().withMessage('Balance must be a number'),
];

// GET /accounts
router.get('/', (req, res) => {
  const accounts = Account.findByUserId(req.session.userId);
  const total = Account.getTotalBalance(req.session.userId);
  res.render('accounts/index', {
    title: 'Accounts',
    accounts,
    total,
  });
});

// GET /accounts/new
router.get('/new', (req, res) => {
  res.render('accounts/form', {
    title: 'New Account',
    account: null,
    action: '/accounts',
    errors: null,
    oldInput: {},
  });
});

// POST /accounts
router.post('/', accountRules, (req, res) => {
  const hasErrors = handleValidationErrors(req, res, 'accounts/form', {
    title: 'New Account',
    account: null,
    action: '/accounts',
  });
  if (hasErrors) return;

  const { name, type, currency, balance } = req.body;
  Account.create({
    user_id: req.session.userId,
    name,
    type,
    currency: (currency || 'UAH').toUpperCase(),
    balance: parseFloat(balance) || 0,
  });

  req.flash('success', `Account "${name}" created.`);
  res.redirect('/accounts');
});

// GET /accounts/:id/edit
router.get('/:id/edit', (req, res) => {
  const account = Account.findById(req.params.id, req.session.userId);
  if (!account) {
    req.flash('error', 'Account not found.');
    return res.redirect('/accounts');
  }
  res.render('accounts/form', {
    title: 'Edit Account',
    account,
    action: `/accounts/${account.id}/edit`,
    errors: null,
    oldInput: account,
  });
});

// POST /accounts/:id/edit
router.post('/:id/edit', accountRules, (req, res) => {
  const account = Account.findById(req.params.id, req.session.userId);
  if (!account) {
    req.flash('error', 'Account not found.');
    return res.redirect('/accounts');
  }

  const hasErrors = handleValidationErrors(req, res, 'accounts/form', {
    title: 'Edit Account',
    account,
    action: `/accounts/${account.id}/edit`,
  });
  if (hasErrors) return;

  const { name, type, currency } = req.body;
  Account.update(req.params.id, req.session.userId, {
    name,
    type,
    currency: (currency || 'UAH').toUpperCase(),
  });

  req.flash('success', `Account "${name}" updated.`);
  res.redirect('/accounts');
});

// POST /accounts/:id/delete
router.post('/:id/delete', (req, res) => {
  const result = Account.delete(req.params.id, req.session.userId);
  if (result.deleted) {
    req.flash('success', 'Account deleted.');
  } else if (result.reason === 'has_transactions') {
    req.flash('error', `Cannot delete — account has ${result.count} transaction(s). Remove them first.`);
  } else {
    req.flash('error', 'Account not found.');
  }
  res.redirect('/accounts');
});

module.exports = router;
