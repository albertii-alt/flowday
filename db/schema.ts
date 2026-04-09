import * as SQLite from 'expo-sqlite';
import { generateUUID } from '../utils/uuid';

export const db = SQLite.openDatabaseSync('flowday.db');

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
      recurring_task_id TEXT,
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

    -- Recurring tasks table
    CREATE TABLE IF NOT EXISTS recurring_tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category_id TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      due_time TEXT,
      frequency TEXT NOT NULL DEFAULT 'daily',
      days_of_week TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (date('now'))
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

  // Run migrations for existing databases
  await runMigrations();

  console.log('✅ Database tables created successfully');
};

const runMigrations = async () => {
  // Migration: add recurring_task_id to tasks if it doesn't exist
  const taskColumns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(tasks)`);
  const hasRecurringCol = taskColumns.some(col => col.name === 'recurring_task_id');
  if (!hasRecurringCol) {
    await db.execAsync(`ALTER TABLE tasks ADD COLUMN recurring_task_id TEXT`);
    console.log('✅ Migration: added recurring_task_id to tasks');
  }
};

export { generateUUID };
export default db;