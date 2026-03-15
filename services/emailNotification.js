// services/emailNotification.js
// Sends email alerts when a user exceeds a budget limit.
// Uses Nodemailer with Gmail SMTP (configure via .env).
//
// Required .env variables:
//   EMAIL_HOST=smtp.gmail.com
//   EMAIL_PORT=587
//   EMAIL_USER=your@gmail.com
//   EMAIL_PASS=your_app_password   (use Gmail App Password, not main password)
//   EMAIL_FROM=Finance Manager <your@gmail.com>

const nodemailer = require('nodemailer');
const Budget = require('../models/Budget');
const db = require('../config/database');

// ── Transporter ───────────────────────────────────────────────────────────────
function createTransporter() {
    return nodemailer.createTransport({
        host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
        port:   parseInt(process.env.EMAIL_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
}

/**
 * Check if any budgets are exceeded for a user in the current month,
 * and send an alert email if so.
 *
 * @param {number} userId
 */
async function checkAndNotify(userId) {
    const month = new Date().toISOString().slice(0, 7);
    const overBudget = Budget.getOverBudget(userId, month);

    if (overBudget.length === 0) return;

    // Get user email from DB
    const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(userId);
    if (!user || !user.email) return;

    const itemLines = overBudget
        .map(b => `• ${b.category_name}: spent ${b.spent.toFixed(2)} UAH / limit ${b.limit_amount.toFixed(2)} UAH`)
        .join('\n');

    const subject = `⚠️ Budget exceeded — ${month}`;
    const text = [
        `Hello ${user.name},`,
        '',
        `The following categories have exceeded their budget for ${month}:`,
        '',
        itemLines,
        '',
        'Log in to Finance Manager to review your spending.',
        '',
        '— Finance Manager',
    ].join('\n');

    const html = `
    <h2>Budget Alert — ${month}</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>The following categories have exceeded their budget:</p>
    <ul>
      ${overBudget.map(b => `
        <li>
          <strong>${b.category_name}</strong>:
          spent <strong>${b.spent.toFixed(2)} UAH</strong>
          of limit <strong>${b.limit_amount.toFixed(2)} UAH</strong>
          (${Math.round((b.spent / b.limit_amount) * 100)}%)
        </li>`).join('')}
    </ul>
    <p>Log in to <a href="http://localhost:3000">Finance Manager</a> to review your spending.</p>
  `;

    try {
        const transporter = createTransporter();
        await transporter.sendMail({
            from:    process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to:      user.email,
            subject,
            text,
            html,
        });
        console.log(`[Email] Budget alert sent to ${user.email}`);
    } catch (err) {
        console.error(`[Email] Failed to send budget alert: ${err.message}`);
    }
}

/**
 * Call this after every new expense transaction to check budgets.
 * Non-blocking — errors are logged, not thrown.
 */
function notifyIfOverBudget(userId) {
    checkAndNotify(userId).catch(err =>
        console.error('[Email] Unexpected error:', err.message)
    );
}

module.exports = { notifyIfOverBudget, checkAndNotify };
