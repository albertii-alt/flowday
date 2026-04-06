import { create } from 'zustand';
import { db } from '../db/schema';

interface UIStore {
  isDarkMode: boolean;
  loadTheme: () => Promise<void>;
  setDarkMode: (value: boolean) => Promise<void>;
}

export const useUIStore = create<UIStore>((set) => ({
  isDarkMode: false,

  loadTheme: async () => {
    try {
      const row = await db.getFirstAsync<{ theme: string }>(
        `SELECT theme FROM settings WHERE id = 'settings_default'`
      );
      set({ isDarkMode: row?.theme === 'dark' });
    } catch (error) {
      console.error('Load theme error:', error);
    }
  },

  setDarkMode: async (value: boolean) => {
    set({ isDarkMode: value });
    try {
      await db.runAsync(
        `UPDATE settings SET theme = ? WHERE id = 'settings_default'`,
        value ? 'dark' : 'light'
      );
    } catch (error) {
      console.error('Save theme error:', error);
    }
  },
}));
