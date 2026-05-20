// models/Account.js
const db = require('../config/database');
const { fetchRates } = require('../services/currencyService');

class Account {
  static create({ user_id, name, type, currency, balance = 0 }) {
    const result = db.prepare(`
      INSERT INTO accounts (user_id, name, type, currency, balance)
      VALUES (?, ?, ?, ?, ?)
    `).run(user_id, name, type, currency || 'UAH', balance);
    return this.findById(result.lastInsertRowid, user_id);
  }

  static findById(id, user_id) {
    return db.prepare(
      'SELECT * FROM accounts WHERE id = ? AND user_id = ?'
    ).get(id, user_id);
  }

  static findByUserId(user_id) {
    return db.prepare(
      'SELECT * FROM accounts WHERE user_id = ? ORDER BY created_at ASC'
    ).all(user_id);
  }

  static async getTotalBalance(user_id, targetCurrency = 'UAH') {
    const accounts = db.prepare(
      'SELECT balance, currency FROM accounts WHERE user_id = ?'
    ).all(user_id);

    if (accounts.length === 0) return 0;

    const target = targetCurrency.toUpperCase();
    const allSame = accounts.every(a => (a.currency || 'UAH').toUpperCase() === target);
    if (allSame) {
      return accounts.reduce((s, a) => s + a.balance, 0);
    }

    try {
      const { rates } = await fetchRates(target);
      return accounts.reduce((sum, a) => {
        const cur = (a.currency || 'UAH').toUpperCase();
        if (cur === target) return sum + a.balance;
        const rate = rates[cur];
        if (!rate) return sum;
        return sum + a.balance / rate;
      }, 0);
    } catch {
      return accounts
        .filter(a => (a.currency || 'UAH').toUpperCase() === target)
        .reduce((s, a) => s + a.balance, 0);
    }
  }

  static update(id, user_id, { name, type, currency }) {
    const result = db.prepare(`
      UPDATE accounts
      SET name = ?, type = ?, currency = ?
      WHERE id = ? AND user_id = ?
    `).run(name, type, currency, id, user_id);
    return result.changes > 0;
  }

  static updateBalance(id, delta) {
    db.prepare(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?'
    ).run(delta, id);
  }

  static delete(id, user_id) {
    const tx = db.transaction(() => {
      const acc = db.prepare(
        'SELECT id FROM accounts WHERE id = ? AND user_id = ?'
      ).get(id, user_id);
      if (!acc) return { deleted: false, reason: 'not_found' };

      const txCount = db.prepare(
        'SELECT COUNT(*) AS cnt FROM transactions WHERE account_id = ?'
      ).get(id).cnt;
      if (txCount > 0) return { deleted: false, reason: 'has_transactions', count: txCount };

      db.prepare('DELETE FROM accounts WHERE id = ? AND user_id = ?').run(id, user_id);
      return { deleted: true };
    });
    return tx();
  }
}

module.exports = Account;
