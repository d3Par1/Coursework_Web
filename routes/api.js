// routes/api.js  (Artem's part — CSV export)
// This file is created by Artem. Nazar's currency API endpoint goes in a separate section.
const express = require('express');
const router  = express.Router();
const Transaction = require('../models/Transaction');

// ── Auth guard ───────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    next();
}

// ── GET /api/export/csv ───────────────────────────────────────────────────────
// Export transactions as CSV, supports same filters as /transactions
router.get('/export/csv', requireAuth, (req, res) => {
    const userId = req.session.userId;
    const { dateFrom, dateTo, category_id, account_id, type } = req.query;

    const filters = {};
    if (dateFrom)    filters.dateFrom    = dateFrom;
    if (dateTo)      filters.dateTo      = dateTo;
    if (category_id) filters.category_id = category_id;
    if (account_id)  filters.account_id  = account_id;
    if (type)        filters.type        = type;

    const rows = Transaction.findFiltered(userId, filters);

    // Build CSV
    const escape = (val) => {
        if (val == null) return '';
        const str = String(val);
        // Wrap in quotes if contains comma, newline or double-quote
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const header = ['Date', 'Type', 'Amount', 'Category', 'Account', 'Description'];
    const lines  = [header.join(',')];

    for (const r of rows) {
        lines.push([
            escape(r.date),
            escape(r.type),
            escape(r.amount),
            escape(r.category_name),
            escape(r.account_name),
            escape(r.description),
        ].join(','));
    }

    const csv = lines.join('\r\n');
    const filename = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compatibility
});

module.exports = router;
