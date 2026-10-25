const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const db = new DatabaseSync('notarium.db');
db.exec('PRAGMA journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Staff'
);

CREATE TABLE IF NOT EXISTS doc_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doc_number TEXT NOT NULL UNIQUE,
  doc_type TEXT NOT NULL,
  client_name TEXT NOT NULL,
  date_notarized TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'In Office',
  remarks TEXT,
  file_name TEXT,
  file_path TEXT,
  file_size INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

/* One-time email verification codes (e.g. when a new staff account
   is created the code is sent to the staff member's email). */
CREATE TABLE IF NOT EXISTS email_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL
);
`);

/* Additive migration: documents also track a physical location
   separately from their workflow status. Existing records keep
   their meaning (location starts as the status value). */
(function migrate() {
  const cols = db.prepare('PRAGMA table_info(records)').all().map(c => c.name);
  if (!cols.includes('location')) {
    db.exec('ALTER TABLE records ADD COLUMN location TEXT');
    db.exec("UPDATE records SET location = status WHERE location IS NULL");
  }
})();

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  if (userCount === 0) {
    db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)')
      .run('Administrator', 'admin@notarium.com', bcrypt.hashSync('admin123', 10), 'Admin');
  }

  // Staff (secretary) demo account so the secretary panel can be tried.
  if (!db.prepare('SELECT id FROM users WHERE email = ?').get('secretary@notarium.com')) {
    db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)')
      .run('Maria Santos', 'secretary@notarium.com', bcrypt.hashSync('staff123', 10), 'Staff');
  }

  const typeCount = db.prepare('SELECT COUNT(*) c FROM doc_types').get().c;
  if (typeCount === 0) {
    const types = [
      'Affidavit of Support', 'Special Power of Attorney', 'Authorization Letter',
      'Deed of Sale', 'Affidavit of Loss', 'Contract Agreement', 'Waiver', 'Others'
    ];
    const ins = db.prepare('INSERT INTO doc_types (name) VALUES (?)');
    types.forEach(t => ins.run(t));
  }

  const settingsCount = db.prepare('SELECT COUNT(*) c FROM settings').get().c;
  if (settingsCount === 0) {
    const ins = db.prepare('INSERT INTO settings (key, value) VALUES (?,?)');
    ins.run('office_name', 'Notarix Notarial Office');
    ins.run('office_address', '123 Justice Avenue, Manila');
    ins.run('office_contact', '(02) 8123-4567');
  }
}

seed();

module.exports = db;
