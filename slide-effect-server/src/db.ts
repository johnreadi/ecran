import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'data', 'signage.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  const d = getDb();

  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'operator',
      status TEXT NOT NULL DEFAULT 'active',
      workspace TEXT DEFAULT 'default',
      permissions TEXT DEFAULT '{}',
      last_login TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,
      last_seen TEXT,
      status TEXT NOT NULL DEFAULT 'offline',
      current_playlist_id TEXT,
      current_slide_index INTEGER DEFAULT 0,
      pairing_code TEXT,
      pairing_expires TEXT,
      metadata TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      slides TEXT NOT NULL DEFAULT '[]',
      settings TEXT NOT NULL DEFAULT '{}',
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
      group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
      playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
      schedule TEXT DEFAULT '{}',
      priority INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Add columns if upgrading existing DB
  try { d.exec(`ALTER TABLE users ADD COLUMN name TEXT DEFAULT ''`) } catch {}
  try { d.exec(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'`) } catch {}
  try { d.exec(`ALTER TABLE users ADD COLUMN workspace TEXT DEFAULT 'default'`) } catch {}
  try { d.exec(`ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT '{}'`) } catch {}
  try { d.exec(`ALTER TABLE users ADD COLUMN last_login TEXT`) } catch {}

  // Create default admin if none exists
  const adminExists = d.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    d.prepare('INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
      uuidv4(),
      'admin@signage.local',
      hash,
      'admin'
    );
    console.log('✅ Default admin created: admin@signage.local / admin123');
  }
}
