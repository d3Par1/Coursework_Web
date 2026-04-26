const db = require('../config/database');

class Statistic {
    // Витрати/доходи по категоріях за період
    static getByCategory(user_id, { dateFrom, dateTo } = {}) {
        let sql = `
      SELECT c.name AS category_name, c.type, c.icon, c.color,
             COALESCE(SUM(t.amount), 0) AS total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;
        const params = [user_id];
        if (dateFrom) { sql += ' AND t.date >= ?'; params.push(dateFrom); }
        if (dateTo)   { sql += ' AND t.date <= ?'; params.push(dateTo); }
        sql += ' GROUP BY c.id ORDER BY total DESC';
        return db.prepare(sql).all(...params);
    }

    // Місячні підсумки за останні N місяців
    static getMonthlyTotals(user_id, months = 6) {
        return db.prepare(`
      SELECT strftime('%Y-%m', date) AS month,
             SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS income,
             SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
      FROM transactions
      WHERE user_id = ?
        AND date >= date('now', ? || ' months')
      GROUP BY month
      ORDER BY month ASC
    `).all(user_id, `-${months}`);
    }

    // Витрати по категоріях за місяць (для бюджетів)
    static getSpentByCategory(user_id, month) {
        return db.prepare(`
      SELECT t.category_id, c.name AS category_name,
             COALESCE(SUM(t.amount), 0) AS total_spent
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
        AND t.type = 'expense'
        AND strftime('%Y-%m', t.date) = ?
      GROUP BY t.category_id
      ORDER BY total_spent DESC
    `).all(user_id, month);
    }

    // Загальний підсумок по акаунту
    static getSummary(user_id) {
        const totals = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
        COUNT(*) AS transaction_count
      FROM transactions
      WHERE user_id = ?
    `).get(user_id);

        return {
            total_income:      totals.total_income,
            total_expense:     totals.total_expense,
            net:               totals.total_income - totals.total_expense,
            transaction_count: totals.transaction_count,
        };
    }
}

module.exports = Statistic;