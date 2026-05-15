const express = require('express');
const router  = express.Router();
const Transaction = require('../models/Transaction');
const { notifyIfOverBudget } = require('../services/emailNotification');

// ── Auth guard ───────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    next();
}

// ── Helper: build filters from query params ───────────────────────────────────
function buildFilters(query) {
    const { dateFrom, dateTo, category_id, account_id, type } = query;
    const filters = {};
    if (dateFrom)    filters.dateFrom    = dateFrom;
    if (dateTo)      filters.dateTo      = dateTo;
    if (category_id) filters.category_id = category_id;
    if (account_id)  filters.account_id  = account_id;
    if (type)        filters.type        = type;
    return filters;
}

// ── GET /api/export/csv ───────────────────────────────────────────────────────
router.get('/export/csv', requireAuth, (req, res) => {
    const userId = req.session.userId;
    const rows = Transaction.findFiltered(userId, buildFilters(req.query));

    const escape = (val) => {
        if (val == null) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const header = ['Date', 'Type', 'Amount', 'Currency', 'Category', 'Account', 'Description'];
    const lines  = [header.join(',')];

    for (const r of rows) {
        lines.push([
            escape(r.date),
            escape(r.type),
            escape(r.amount),
            escape(r.currency),
            escape(r.category_name),
            escape(r.account_name),
            escape(r.description),
        ].join(','));
    }

    const csv = lines.join('\r\n');
    const filename = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv);
});

// ── GET /api/export/json ──────────────────────────────────────────────────────
router.get('/export/json', requireAuth, (req, res) => {
    const userId = req.session.userId;
    const rows = Transaction.findFiltered(userId, buildFilters(req.query));

    const payload = rows.map(r => ({
        id:          r.id,
        date:        r.date,
        type:        r.type,
        amount:      r.amount,
        currency:    r.currency,
        category:    r.category_name,
        account:     r.account_name,
        description: r.description || null,
        created_at:  r.created_at,
    }));

    const filename = `transactions_${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json({
        exported_at: new Date().toISOString(),
        count: payload.length,
        transactions: payload,
    });
});

// ── GET /api/transactions/calendar ───────────────────────────────────────────
// Returns { "YYYY-MM-DD": count } for the given month
router.get('/transactions/calendar', requireAuth, (req, res) => {
    const userId = req.session.userId;
    const month  = req.query.month || new Date().toISOString().slice(0, 7);

    const rows = Transaction.findFiltered(userId, {
        dateFrom: `${month}-01`,
        dateTo:   `${month}-31`,
    });

    const counts = {};
    for (const r of rows) {
        counts[r.date] = (counts[r.date] || 0) + 1;
    }
    res.json(counts);
});

// ── POST /api/transactions/notify ─────────────────────────────────────────────
// Manually trigger budget check + email notification
router.post('/transactions/notify', requireAuth, async (req, res) => {
    try {
        notifyIfOverBudget(req.session.userId);
        res.json({ ok: true, message: 'Budget check triggered.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;