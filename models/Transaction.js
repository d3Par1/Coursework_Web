// models/Transaction.js
const db = require('../config/database');

class Transaction {
  /**
   * Create a new transaction and update the account balance accordingly
   */
  static create({ user_id, account_id, category_id, type, amount, description, date }) {
    const insertTx = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(user_id, account_id, category_id, type, amount, description || null, date);

      // Update account balance: income adds, expense subtracts
      const delta = type === 'income' ? amount : -amount;
      db.prepare(`UPDATE accounts SET balance = balance + ? WHERE id = ?`).run(delta, account_id);

      return this.findById(result.lastInsertRowid);
    });
    return insertTx();
  }

  /**
   * Find a single transaction by ID (with joined data)
   */
  static findById(id) {
    return db.prepare(`
      SELECT t.*, c.name AS category_name, c.type AS category_type, c.icon AS category_icon,
             c.color AS category_color,
             a.name AS account_name, a.currency
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      JOIN accounts a ON t.account_id = a.id
      WHERE t.id = ?
    `).get(id);
  }

  /**
   * Get all transactions for a user (latest first)
   */
  static findByUserId(user_id) {
    return db.prepare(`
      SELECT t.*, c.name AS category_name, c.type AS category_type, c.icon AS category_icon,
             c.color AS category_color,
             a.name AS account_name, a.currency
      FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = ?
      ORDER BY t.date DESC, t.created_at DESC
    `).all(user_id);
  }

  /**
   * Get filtered transactions for a user.
   * All filter params are optional.
   */
  static findFiltered(user_id, { dateFrom, dateTo, category_id, account_id, type } = {}) {
    let sql = `
      SELECT t.*, c.name AS category_name, c.type AS category_type, c.icon AS category_icon,
             c.color AS category_color,
             a.name AS account_name, a.currency
      FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = ?
    `;
    const params = [user_id];

    if (dateFrom)     { sql += ' AND t.date >= ?';        params.push(dateFrom); }
    if (dateTo)       { sql += ' AND t.date <= ?';        params.push(dateTo); }
    if (category_id)  { sql += ' AND t.category_id = ?';  params.push(category_id); }
    if (account_id)   { sql += ' AND t.account_id = ?';   params.push(account_id); }
    if (type)         { sql += ' AND t.type = ?';          params.push(type); }

    sql += ' ORDER BY t.date DESC, t.created_at DESC';
    return db.prepare(sql).all(...params);
  }

  /**
   * Update a transaction. Also reverses the old balance change and applies the new one.
   */
  static update(id, user_id, { account_id, category_id, type, amount, description, date }) {
    const updateTx = db.transaction(() => {
      const old = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(id, user_id);
      if (!old) return false;

      // Reverse old balance effect
      const oldDelta = old.type === 'income' ? -old.amount : old.amount;
      db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(oldDelta, old.account_id);

      // Apply new values
      db.prepare(`
        UPDATE transactions
        SET account_id = ?, category_id = ?, type = ?, amount = ?, description = ?, date = ?
        WHERE id = ? AND user_id = ?
      `).run(account_id, category_id, type, amount, description || null, date, id, user_id);

      // Apply new balance effect
      const newDelta = type === 'income' ? amount : -amount;
      db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(newDelta, account_id);

      return true;
    });
    return updateTx();
  }

  /**
   * Delete a transaction and reverse its balance effect
   */
  static delete(id, user_id) {
    const deleteTx = db.transaction(() => {
      const tx = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(id, user_id);
      if (!tx) return false;

      // Reverse balance effect
      const delta = tx.type === 'income' ? -tx.amount : tx.amount;
      db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(delta, tx.account_id);

      db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(id, user_id);
      return true;
    });
    return deleteTx();
  }

  /**
   * Get total income and expense for a user in a given month (YYYY-MM)
   */
  static getMonthlySummary(user_id, month) {
    return db.prepare(`
      SELECT type, SUM(amount) AS total
      FROM transactions
      WHERE user_id = ? AND strftime('%Y-%m', date) = ?
      GROUP BY type
    `).all(user_id, month);
  }
}

module.exports = Transaction;
