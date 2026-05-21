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

// Additive migrations for existing databases.
// SQLite ignores duplicate-column errors only via try/catch; ALTER TABLE has no
// IF NOT EXISTS for columns. We detect-then-add to stay idempotent.
function columnExists(table, column) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  return cols.some((c) => c.name === column);
}

const userMigrations = [
  ['google_id', 'TEXT'],
  ['telegram_id', 'TEXT'],
  ['avatar_url', 'TEXT'],
  ['provider', "TEXT NOT NULL DEFAULT 'local'"],
  ['is_admin', 'INTEGER NOT NULL DEFAULT 0'],
];

for (const [column, definition] of userMigrations) {
  if (!columnExists('users', column)) {
    db.exec(`ALTER TABLE users ADD COLUMN ${column} ${definition}`);
  }
}

// password_hash on legacy DBs was NOT NULL with no default. SQLite can't relax
// that constraint via ALTER. We keep NOT NULL and let OAuth users carry an
// empty-string placeholder hash — bcrypt.compareSync(anything, '') returns
// false, so password login for OAuth users is impossible by design.

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
