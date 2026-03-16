// models/User.js — User model with bcrypt password hashing
const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  /**
   * Create a new user with hashed password.
   * @param {string} name
   * @param {string} email
   * @param {string} password - plaintext, will be hashed
   * @returns {{ id: number, name: string, email: string }}
   */
  static create(name, email, password) {
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
    ).run(name, email, hash);
    return { id: result.lastInsertRowid, name, email };
  }

  /**
   * Find user by email (includes password_hash for verification).
   * @param {string} email
   * @returns {object|undefined}
   */
  static findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  }

  /**
   * Find user by ID (excludes password_hash).
   * @param {number} id
   * @returns {object|undefined}
   */
  static findById(id) {
    return db.prepare(
      'SELECT id, name, email, created_at FROM users WHERE id = ?'
    ).get(id);
  }

  /**
   * Verify plaintext password against bcrypt hash.
   * @param {string} plaintext
   * @param {string} hash
   * @returns {boolean}
   */
  static verifyPassword(plaintext, hash) {
    return bcrypt.compareSync(plaintext, hash);
  }
}

module.exports = User;
