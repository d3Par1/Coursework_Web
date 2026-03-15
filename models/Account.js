// models/Account.js — заглушка, реализацию делает Назар
const db = require('../config/database');

class Account {
    static findByUserId(user_id) {
        return db.prepare('SELECT * FROM accounts WHERE user_id = ?').all(user_id);
    }
}

module.exports = Account;