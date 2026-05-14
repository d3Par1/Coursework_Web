// models/User.js — User model with bcrypt password hashing + OAuth provider linking
const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static create(name, email, password) {
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (name, email, password_hash, provider) VALUES (?, ?, ?, ?)'
    ).run(name, email, hash, 'local');
    return { id: result.lastInsertRowid, name, email, provider: 'local' };
  }

  /**
   * Create a user from an OAuth provider. Stores '' as password_hash so the
   * password-login path can never authenticate this user (bcrypt.compareSync
   * always returns false against ''). To set a real password later, the user
   * can use the password-change flow.
   */
  static createFromOAuth({ name, email, provider, providerId, avatarUrl = null }) {
    const column = provider === 'google' ? 'google_id' : 'telegram_id';
    const result = db.prepare(
      `INSERT INTO users (name, email, password_hash, provider, ${column}, avatar_url)
       VALUES (?, ?, '', ?, ?, ?)`
    ).run(name, email, provider, providerId, avatarUrl);
    return { id: result.lastInsertRowid, name, email, provider };
  }

  static findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  }

  static findById(id) {
    return db.prepare(
      `SELECT id, name, email, avatar_url, provider, google_id, telegram_id, created_at
       FROM users WHERE id = ?`
    ).get(id);
  }

  static findByGoogleId(googleId) {
    return db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);
  }

  static findByTelegramId(telegramId) {
    return db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(String(telegramId));
  }

  /** Link an OAuth provider to an existing user. */
  static linkProvider(userId, provider, providerId, avatarUrl = null) {
    const column = provider === 'google' ? 'google_id' : 'telegram_id';
    db.prepare(
      `UPDATE users SET ${column} = ?, avatar_url = COALESCE(?, avatar_url) WHERE id = ?`
    ).run(String(providerId), avatarUrl, userId);
  }

  static verifyPassword(plaintext, hash) {
    if (!hash) return false;
    return bcrypt.compareSync(plaintext, hash);
  }

  /** Update password for a user (rehashes). Used by /auth/password and for OAuth users adding a password. */
  static updatePassword(userId, newPlaintext) {
    const hash = bcrypt.hashSync(newPlaintext, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId);
  }
}

module.exports = User;
