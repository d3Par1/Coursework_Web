// scripts/seed-demo.js
// Idempotently creates a demo user with realistic data.
//
// Usage:
//   - CLI:   npm run seed:demo
//   - HTTP:  GET /admin/reseed?token=<ADMIN_TOKEN>
//   - Boot:  AUTO_SEED_DEMO=true env var (only if users table is empty)
//
// Demo credentials: demo@kpi.ua / demo123
// Wipes ONLY the demo user's data. Other users untouched.

const bcrypt = require('bcryptjs');
const db = require('../config/database');

const DEMO_EMAIL = 'demo@kpi.ua';
const DEMO_PASSWORD = 'demo123';

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function seedDemo() {
  const tx = db.transaction(() => {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(DEMO_EMAIL);
    if (existing) {
      db.prepare('DELETE FROM users WHERE id = ?').run(existing.id);
    }

    const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
    const userResult = db.prepare(
      `INSERT INTO users (name, email, password_hash, provider, is_admin)
       VALUES (?, ?, ?, 'local', 1)`
    ).run('Demo User', DEMO_EMAIL, hash);
    const userId = userResult.lastInsertRowid;

    const insertAccount = db.prepare(
      `INSERT INTO accounts (user_id, name, type, currency, balance) VALUES (?, ?, ?, ?, ?)`
    );
    const accUAH = insertAccount.run(userId, 'Картка ПУМБ',  'card',    'UAH', 18500.00).lastInsertRowid;
    const accUSD = insertAccount.run(userId, 'Заощадження', 'savings', 'USD',   850.00).lastInsertRowid;
    const accEUR = insertAccount.run(userId, 'Готівка EUR',  'cash',    'EUR',   220.00).lastInsertRowid;

    const cats = db.prepare(
      `SELECT id, name FROM categories WHERE user_id IS NULL`
    ).all().reduce((m, c) => (m[c.name] = c.id, m), {});

    const insertTx = db.prepare(
      `INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    const transactions = [
      [accUAH, cats['Salary'],         'income',  35000.00, 'ЗП за квітень',         daysAgo(35)],
      [accUAH, cats['Food & Dining'],  'expense',  1850.00, 'Сільпо тиждневі',       daysAgo(33)],
      [accUAH, cats['Transportation'], 'expense',   420.00, 'Заправка',              daysAgo(30)],
      [accUAH, cats['Housing'],        'expense',  6500.00, 'Оренда квартири',       daysAgo(28)],
      [accUAH, cats['Entertainment'],  'expense',  1200.00, 'Кіно + ресторан',       daysAgo(25)],
      [accUAH, cats['Food & Dining'],  'expense',  2100.00, 'Сільпо',                daysAgo(22)],
      [accUAH, cats['Salary'],         'income',  35000.00, 'ЗП за травень',         daysAgo(5)],
      [accUAH, cats['Food & Dining'],  'expense',  1750.00, 'АТБ тиждневі',          daysAgo(3)],
      [accUAH, cats['Transportation'], 'expense',   380.00, 'Bolt',                  daysAgo(2)],
      [accUSD, cats['Freelance'],      'income',    400.00, 'Upwork project',        daysAgo(20)],
      [accUSD, cats['Investments'],    'income',    150.00, 'Дивіденди',             daysAgo(10)],
      [accUSD, cats['Entertainment'],  'expense',     45.00, 'Netflix + Spotify',    daysAgo(7)],
      [accEUR, cats['Gifts'],          'income',    100.00, 'Подарунок на ДН',       daysAgo(15)],
      [accEUR, cats['Healthcare'],     'expense',     35.00, 'Аптека',                daysAgo(8)],
      [accEUR, cats['Food & Dining'],  'expense',     22.00, 'Кафе',                  daysAgo(1)],
    ];

    let inserted = 0;
    for (const [accId, catId, type, amount, desc, date] of transactions) {
      if (!catId) continue;
      insertTx.run(userId, accId, catId, type, amount, desc, date);
      const delta = type === 'income' ? amount : -amount;
      db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(delta, accId);
      inserted++;
    }

    return { userId, txCount: inserted };
  });

  return tx();
}

function isDatabaseEmpty() {
  const row = db.prepare('SELECT COUNT(*) AS n FROM users').get();
  return row.n === 0;
}

module.exports = { seedDemo, isDatabaseEmpty, DEMO_EMAIL, DEMO_PASSWORD };

if (require.main === module) {
  require('dotenv').config();
  const result = seedDemo();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Demo seed complete');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  User ID:    ${result.userId}`);
  console.log(`  Email:      ${DEMO_EMAIL}`);
  console.log(`  Password:   ${DEMO_PASSWORD}`);
  console.log(`  Accounts:   3 (UAH card, USD savings, EUR cash)`);
  console.log(`  Transactions: ${result.txCount}`);
  console.log('');
  console.log('  Start server:  npm start');
  console.log('  Open browser:  http://localhost:3000/auth/login');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(0);
}
