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
      company TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'pending',
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
      workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
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
      workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
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

    -- SaaS Tables
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price_monthly INTEGER NOT NULL,
      price_yearly INTEGER NOT NULL,
      max_players INTEGER NOT NULL DEFAULT 1,
      max_screens INTEGER NOT NULL DEFAULT 1,
      max_storage_mb INTEGER NOT NULL DEFAULT 100,
      features TEXT NOT NULL DEFAULT '[]',
      is_active INTEGER DEFAULT 1,
      stripe_price_id_monthly TEXT,
      stripe_price_id_yearly TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      logo_url TEXT,
      primary_color TEXT DEFAULT '#6366f1',
      secondary_color TEXT DEFAULT '#8b5cf6',
      settings TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id TEXT NOT NULL REFERENCES plans(id),
      status TEXT NOT NULL DEFAULT 'pending',
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      stripe_payment_intent_id TEXT,
      current_period_start TEXT,
      current_period_end TEXT,
      cancel_at_period_end INTEGER DEFAULT 0,
      payment_status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      attachments TEXT DEFAULT '[]',
      is_read INTEGER DEFAULT 0,
      read_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS player_locations (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      accuracy REAL,
      address TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS licenses (
      id TEXT PRIMARY KEY,
      license_key TEXT UNIQUE NOT NULL,
      workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
      player_id TEXT REFERENCES players(id) ON DELETE SET NULL,
      status TEXT DEFAULT 'active',
      expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      id TEXT PRIMARY KEY DEFAULT 'global',
      smtp_host TEXT,
      smtp_port INTEGER DEFAULT 587,
      smtp_user TEXT,
      smtp_pass TEXT,
      smtp_from TEXT,
      smtp_secure INTEGER DEFAULT 0,
      branding_logo_url TEXT,
      branding_primary_color TEXT DEFAULT '#6366f1',
      platform_name TEXT DEFAULT 'Slide Effect',
      platform_tagline TEXT DEFAULT 'Digital Signage Platform',
      widgets_config TEXT DEFAULT '[]',
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Add columns if upgrading existing DB
  try { d.exec(`ALTER TABLE users ADD COLUMN name TEXT DEFAULT ''`) } catch {}
  try { d.exec(`ALTER TABLE users ADD COLUMN company TEXT DEFAULT ''`) } catch {}
  try { d.exec(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'pending'`) } catch {}
  try { d.exec(`ALTER TABLE users ADD COLUMN workspace TEXT DEFAULT 'default'`) } catch {}
  try { d.exec(`ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT '{}'`) } catch {}
  try { d.exec(`ALTER TABLE users ADD COLUMN last_login TEXT`) } catch {}
  try { d.exec(`ALTER TABLE players ADD COLUMN workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL`) } catch {}
  try { d.exec(`ALTER TABLE playlists ADD COLUMN workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE`) } catch {}
  try { d.exec(`ALTER TABLE app_settings ADD COLUMN platform_name TEXT DEFAULT 'Slide Effect'`) } catch {}
  try { d.exec(`ALTER TABLE app_settings ADD COLUMN platform_tagline TEXT DEFAULT 'Digital Signage Platform'`) } catch {}
  try { d.exec(`ALTER TABLE app_settings ADD COLUMN widgets_config TEXT DEFAULT '[]'`) } catch {}

  // Create default admin if none exists
  const adminExists = d.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    d.prepare('INSERT INTO users (id, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)').run(
      uuidv4(),
      'admin@signage.local',
      hash,
      'admin',
      'active'
    );
    console.log('✅ Default admin created: admin@signage.local / admin123');
  }

  // Create default user if none exists
  const userExists = d.prepare('SELECT id FROM users WHERE role = ? AND email = ?').get('user', 'user@signage.local');
  if (!userExists) {
    const userId = uuidv4();
    const hash = bcrypt.hashSync('user123', 10);
    d.prepare('INSERT INTO users (id, email, password_hash, role, status, name, company) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      userId,
      'user@signage.local',
      hash,
      'user',
      'active',
      'Utilisateur Test',
      'Entreprise Test'
    );
    
    // Create workspace for the user
    const workspaceId = uuidv4();
    d.prepare('INSERT INTO workspaces (id, user_id, name) VALUES (?, ?, ?)').run(
      workspaceId,
      userId,
      'Mon Espace Test'
    );
    
    // Create a default plan if none exists
    const planExists = d.prepare('SELECT id FROM plans LIMIT 1').get();
    if (!planExists) {
      const planId = uuidv4();
      d.prepare(`
        INSERT INTO plans (id, name, description, price_monthly, price_yearly, max_players, max_screens, max_storage_mb, features, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        planId,
        'Gratuit',
        'Forfait de démonstration avec limitations',
        0,
        0,
        2,
        3,
        500,
        JSON.stringify(['2 players', '3 écrans', '500 MB stockage', 'Support email']),
        1
      );
      
      // Create subscription for the user
      d.prepare(`
        INSERT INTO subscriptions (id, user_id, plan_id, status, payment_status, current_period_start, current_period_end)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now', '+1 year'))
      `).run(uuidv4(), userId, planId, 'active', 'paid');
    }
    
    console.log('✅ Default user created: user@signage.local / user123');
  }
}
