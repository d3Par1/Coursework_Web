// models/Budget.js
const db = require('../config/database');

class Budget {
  /**
   * Create or replace a budget for a user/category/month combination.
   * Uses INSERT OR REPLACE to handle the UNIQUE constraint.
   */
  static create({ user_id, category_id, month, limit_amount }) {
    const stmt = db.prepare(`
      INSERT INTO budgets (user_id, category_id, month, limit_amount)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, category_id, month)
      DO UPDATE SET limit_amount = excluded.limit_amount
    `);
    stmt.run(user_id, category_id, month, limit_amount);
    return db.prepare(`
      SELECT b.*, c.name AS category_name, c.icon, c.color
      FROM budgets b JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ? AND b.category_id = ? AND b.month = ?
    `).get(user_id, category_id, month);
  }

  /**
   * Find all budgets for a user with their spent amounts
   */
  static findByUserId(user_id) {
    return db.prepare(`
      SELECT b.*, c.name AS category_name, c.icon, c.color,
             COALESCE(SUM(t.amount), 0) AS spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      LEFT JOIN transactions t
        ON t.category_id = b.category_id
        AND t.user_id = b.user_id
        AND t.type = 'expense'
        AND strftime('%Y-%m', t.date) = b.month
      WHERE b.user_id = ?
      GROUP BY b.id
      ORDER BY b.month DESC, c.name
    `).all(user_id);
  }

  /**
   * Find budgets for a specific month with spent amounts and percentage
   */
  static findByMonth(user_id, month) {
    const budgets = db.prepare(`
      SELECT b.*, c.name AS category_name, c.icon, c.color,
             COALESCE(SUM(t.amount), 0) AS spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      LEFT JOIN transactions t
        ON t.category_id = b.category_id
        AND t.user_id = b.user_id
        AND t.type = 'expense'
        AND strftime('%Y-%m', t.date) = b.month
      WHERE b.user_id = ? AND b.month = ?
      GROUP BY b.id
      ORDER BY c.name
    `).all(user_id, month);

    // Compute percentage and status
    return budgets.map(b => ({
      ...b,
      percent: Math.min(Math.round((b.spent / b.limit_amount) * 100), 100),
      over_limit: b.spent > b.limit_amount,
    }));
  }

  /**
   * Get amount spent for a specific category/month
   */
  static getSpent(user_id, category_id, month) {
    const row = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS spent
      FROM transactions
      WHERE user_id = ? AND category_id = ? AND type = 'expense'
        AND strftime('%Y-%m', date) = ?
    `).get(user_id, category_id, month);
    return row ? row.spent : 0;
  }

  /**
   * Update an existing budget's limit
   */
  static update(id, user_id, { limit_amount }) {
    const result = db.prepare(`
      UPDATE budgets SET limit_amount = ? WHERE id = ? AND user_id = ?
    `).run(limit_amount, id, user_id);
    return result.changes > 0;
  }

  /**
   * Delete a budget
   */
  static delete(id, user_id) {
    const result = db.prepare(`
      DELETE FROM budgets WHERE id = ? AND user_id = ?
    `).run(id, user_id);
    return result.changes > 0;
  }

  /**
   * Get list of over-budget categories for a user in a given month.
   * Used by email notification service.
   */
  static getOverBudget(user_id, month) {
    return db.prepare(`
      SELECT b.*, c.name AS category_name,
             COALESCE(SUM(t.amount), 0) AS spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      LEFT JOIN transactions t
        ON t.category_id = b.category_id
        AND t.user_id = b.user_id
        AND t.type = 'expense'
        AND strftime('%Y-%m', t.date) = b.month
      WHERE b.user_id = ? AND b.month = ?
      GROUP BY b.id
      HAVING spent > b.limit_amount
    `).all(user_id, month);
  }
}

module.exports = Budget;
