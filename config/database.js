// config/database.js
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'finance.db');
const db = new Database(DB_PATH);

// CRITICAL: Enable foreign keys (off by default in SQLite)
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema if tables don't exist
const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schema);

// Seed predefined categories (only if none exist)
const seedPath = path.join(__dirname, '..', 'db', 'seed.sql');
try {
  const count = db.prepare('SELECT COUNT(*) AS cnt FROM categories WHERE user_id IS NULL').get();
  if (count.cnt === 0) {
    const seed = fs.readFileSync(seedPath, 'utf-8');
    db.exec(seed);
  }
} catch (err) {
  console.error('Seed error (non-fatal):', err.message);
}

module.exports = db;
