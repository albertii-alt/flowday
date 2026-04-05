import * as SQLite from 'expo-sqlite';
import { generateUUID } from '../utils/uuid';

const db = SQLite.openDatabaseSync('flowday.db');

export const createTables = async () => {
  await db.execAsync(`
    -- Tasks table
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category_id TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      due_time TEXT,
      task_date TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (date('now')),
      updated_at TEXT NOT NULL DEFAULT (date('now'))
    );

    -- Categories table
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT,
      created_at TEXT NOT NULL DEFAULT (date('now'))
    );

    -- Daily stats table - FIXED with all columns
    CREATE TABLE IF NOT EXISTS daily_stats (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      total_tasks INTEGER NOT NULL DEFAULT 0,
      completed_tasks INTEGER NOT NULL DEFAULT 0,
      completion_rate REAL NOT NULL DEFAULT 0,
      streak_eligible INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (date('now'))
    );

    -- Settings table
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      theme TEXT NOT NULL DEFAULT 'light',
      streak_rule INTEGER NOT NULL DEFAULT 80,
      onboarding_completed INTEGER NOT NULL DEFAULT 0
    );

    -- Insert default categories
    INSERT OR IGNORE INTO categories (id, name, color, icon) VALUES
      ('cat_personal', 'Personal', '#4f46e5', 'person'),
      ('cat_school', 'School', '#06b6d4', 'school'),
      ('cat_work', 'Work', '#f59e0b', 'work'),
      ('cat_health', 'Health', '#10b981', 'fitness'),
      ('cat_errands', 'Errands', '#ef4444', 'shopping');

    -- Insert default settings
    INSERT OR IGNORE INTO settings (id, theme, streak_rule, onboarding_completed)
      VALUES ('settings_default', 'light', 80, 0);
  `);
  
  console.log('✅ Database tables created successfully');
};

export { generateUUID };
export default db;