// routes/currency.js — Currency rates API (Nazar's 3rd-party integration)
const express = require('express');
const { fetchRates, convert, getPopularRates } = require('../services/currencyService');
const router = express.Router();

// GET /api/currency/rates?base=UAH
router.get('/rates', async (req, res) => {
  const base = (req.query.base || 'UAH').toUpperCase();
  try {
    const data = await fetchRates(base);
    res.json({
      base: data.base,
      lastUpdated: data.lastUpdated,
      popular: await getPopularRates(base),
    });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// GET /api/currency/convert?amount=100&from=USD&to=UAH
router.get('/convert', async (req, res) => {
  const amount = parseFloat(req.query.amount);
  const from = (req.query.from || '').toUpperCase();
  const to = (req.query.to || '').toUpperCase();

  if (!Number.isFinite(amount) || !from || !to) {
    return res.status(400).json({ error: 'amount, from, and to are required' });
  }

  try {
    const converted = await convert(amount, from, to);
    res.json({ amount, from, to, result: converted });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

module.exports = router;
