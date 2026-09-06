import { DatabaseSync } from 'node:sqlite';
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
  const targetPath = dbPath || defaultPath;
  const db = new DatabaseSync(targetPath);

  // Enable WAL mode and foreign key enforcement
  try {
    db.exec('PRAGMA journal_mode = WAL;');
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
      defaultDb.close();
    } catch (e) {}
    defaultDb = null;
  }
}
