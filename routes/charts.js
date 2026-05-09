// routes/charts.js — JSON data endpoints for Chart.js dashboard charts (Nazar)
const express = require('express');
const Statistic = require('../models/Statistic');
const router = express.Router();

// GET /api/charts/categories?month=YYYY-MM
// Pie chart: expenses by category for the given month (defaults to current).
router.get('/categories', (req, res) => {
  const userId = req.session.userId;
  const month = /^\d{4}-\d{2}$/.test(req.query.month || '')
    ? req.query.month
    : new Date().toISOString().slice(0, 7);

  const dateFrom = `${month}-01`;
  const [year, mm] = month.split('-').map(Number);
  const lastDay = new Date(year, mm, 0).getDate();
  const dateTo = `${month}-${String(lastDay).padStart(2, '0')}`;

  const rows = Statistic.getByCategory(userId, { dateFrom, dateTo })
    .filter(r => r.type === 'expense' && r.total > 0);

  res.json({
    month,
    labels: rows.map(r => r.category_name),
    data: rows.map(r => Number(r.total.toFixed(2))),
    colors: rows.map(r => r.color || '#6c757d'),
  });
});

// GET /api/charts/monthly?months=6
// Bar chart: monthly income vs expense over the last N months (default 6, max 12).
router.get('/monthly', (req, res) => {
  const userId = req.session.userId;
  const requested = parseInt(req.query.months, 10);
  const months = Number.isFinite(requested) && requested >= 1 && requested <= 12
    ? requested
    : 6;

  const rows = Statistic.getMonthlyTotals(userId, months);

  res.json({
    months,
    labels: rows.map(r => r.month),
    income: rows.map(r => Number((r.income || 0).toFixed(2))),
    expense: rows.map(r => Number((r.expense || 0).toFixed(2))),
  });
});

module.exports = router;
