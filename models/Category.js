// models/Category.js
const db = require('../config/database');

class Category {
  /**
   * Create a new user-defined category
   */
  static create({ user_id, name, type, icon = null, color = null }) {
    const stmt = db.prepare(`
      INSERT INTO categories (user_id, name, type, icon, color)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(user_id, name, type, icon, color);
    return this.findById(result.lastInsertRowid);
  }

  /**
   * Find category by ID
   */
  static findById(id) {
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  }

  /**
   * Get all categories for a user (including system categories where user_id IS NULL)
   */
  static findByUserId(user_id) {
    return db.prepare(`
      SELECT * FROM categories
      WHERE user_id = ? OR user_id IS NULL
      ORDER BY type, name
    `).all(user_id);
  }

  /**
   * Get only system (predefined) categories
   */
  static findSystem() {
    return db.prepare(`
      SELECT * FROM categories WHERE user_id IS NULL ORDER BY type, name
    `).all();
  }

  /**
   * Get categories by type (income/expense) for a user
   */
  static findByType(user_id, type) {
    return db.prepare(`
      SELECT * FROM categories
      WHERE (user_id = ? OR user_id IS NULL) AND type = ?
      ORDER BY name
    `).all(user_id, type);
  }

  /**
   * Update a user-defined category (cannot update system categories)
   */
  static update(id, user_id, { name, type, icon, color }) {
    const stmt = db.prepare(`
      UPDATE categories
      SET name = ?, type = ?, icon = ?, color = ?
      WHERE id = ? AND user_id = ?
    `);
    const result = stmt.run(name, type, icon || null, color || null, id, user_id);
    return result.changes > 0;
  }

  /**
   * Delete a user-defined category.
   * Returns false if category has transactions (RESTRICT FK) or is a system category.
   */
  static delete(id, user_id) {
    try {
      const result = db.prepare(`
        DELETE FROM categories WHERE id = ? AND user_id = ?
      `).run(id, user_id);
      return result.changes > 0;
    } catch (err) {
      // FK RESTRICT — category has transactions
      if (err.message.includes('FOREIGN KEY')) return 'has_transactions';
      throw err;
    }
  }
}

module.exports = Category;
