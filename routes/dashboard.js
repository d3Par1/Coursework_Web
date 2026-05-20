// routes/dashboard.js
const express = require('express');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const { getPopularRates } = require('../services/currencyService');
const router = express.Router();

router.get('/', async (req, res) => {
  const userId = req.session.userId;

  const accounts = Account.findByUserId(userId);
  const total = await Account.getTotalBalance(userId);

  const allTx = Transaction.findByUserId(userId);
  const recent = allTx.slice(0, 10);

  const month = new Date().toISOString().slice(0, 7);
  const summary = Transaction.getMonthlySummary(userId, month);
  const monthTotals = { income: 0, expense: 0 };
  summary.forEach(r => { monthTotals[r.type] = r.total; });

  let rates = null;
  let ratesError = null;
  try {
    rates = await getPopularRates('UAH');
  } catch (err) {
    ratesError = err.message;
  }

  res.render('dashboard', {
    title: 'Dashboard',
    accounts,
    total,
    recent,
    month,
    monthTotals,
    rates,
    ratesError,
  });
});

module.exports = router;
