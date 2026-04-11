import { createTables } from './schema';

// Initialize database on app start
export const initDatabase = async () => {
  try {
    await createTables();
  } catch (error) {
    console.error('Database initialization failed:', error instanceof Error ? error.message : 'Unknown error');
  }
};