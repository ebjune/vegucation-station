import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import { seedInitialData } from './migrations'

let db: Database.Database | null = null

function getDbPath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'vegucation.db')
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export async function initDatabase(): Promise<void> {
  const dbPath = getDbPath()
  console.log('Initializing database at:', dbPath)

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  // Create tables
  db.exec(`
    -- Categories for produce items
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT,
      sort_order INTEGER DEFAULT 0
    );

    -- Produce items catalog
    CREATE TABLE IF NOT EXISTS produce (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      image_path TEXT,
      is_available INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Cached educational content (for offline)
    CREATE TABLE IF NOT EXISTS education_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produce_id INTEGER REFERENCES produce(id) UNIQUE,
      fun_facts TEXT,
      nutrition_info TEXT,
      detailed_info TEXT,
      generated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Cached recipes (for offline)
    CREATE TABLE IF NOT EXISTS recipe_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ingredient_hash TEXT UNIQUE,
      recipes TEXT,
      generated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- App settings
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_produce_category ON produce(category_id);
    CREATE INDEX IF NOT EXISTS idx_produce_available ON produce(is_available);
    CREATE INDEX IF NOT EXISTS idx_education_produce ON education_cache(produce_id);
  `)

  // Check if we need to seed initial data
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }
  if (categoryCount.count === 0) {
    seedInitialData(db)
  }

  console.log('Database initialized successfully')
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
