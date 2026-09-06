import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let defaultDb = null;

export function initDatabase(dbPath = null) {
  if (defaultDb) {
    return defaultDb;
  }

  const defaultPath = path.resolve(__dirname, '../../streakkeeper.db');
  const targetPath = dbPath || process.env.DB_PATH || defaultPath;

  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new DatabaseSync(targetPath);

  // Enable WAL mode, normal synchronous, busy timeout, and foreign key enforcement
  try {
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA synchronous = NORMAL;');
    db.exec('PRAGMA busy_timeout = 5000;');
  } catch (e) {}
  db.exec('PRAGMA foreign_keys = ON;');

  // Create Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Habits table
  db.exec(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create Checkins table
  db.exec(`
    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      checkin_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(habit_id, checkin_date),
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
    );
  `);

  // Performance Indexes for Fast Lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);
    CREATE INDEX IF NOT EXISTS idx_checkins_habit ON checkins(habit_id);
    CREATE INDEX IF NOT EXISTS idx_checkins_habit_date ON checkins(habit_id, checkin_date);
  `);

  defaultDb = db;
  return db;
}

export function getDb() {
  if (!defaultDb) {
    defaultDb = initDatabase();
  }
  return defaultDb;
}

export function clearDatabase(db = null) {
  const targetDb = db || getDb();
  targetDb.exec(`
    DELETE FROM checkins;
    DELETE FROM habits;
    DELETE FROM users;
  `);
}

export function closeDb() {
  if (defaultDb) {
    try {
      // Checkpoint WAL to flush all transactions to main database file
      defaultDb.exec('PRAGMA wal_checkpoint(TRUNCATE);');
      defaultDb.close();
    } catch (e) {
      console.error('Error during database close:', e);
    }
    defaultDb = null;
  }
}
