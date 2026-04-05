import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import * as SQLite from 'expo-sqlite';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const hardReset = async () => {
    Alert.alert(
      'HARD RESET',
      'This will delete EVERYTHING and rebuild the database. You will lose all tasks.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'HARD RESET',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = SQLite.openDatabaseSync('flowday.db');
              
              // Drop ALL tables
              await db.execAsync('DROP TABLE IF EXISTS tasks');
              await db.execAsync('DROP TABLE IF EXISTS daily_stats');
              await db.execAsync('DROP TABLE IF EXISTS categories');
              await db.execAsync('DROP TABLE IF EXISTS settings');
              await db.execAsync('DROP TABLE IF EXISTS sqlite_sequence');
              
              console.log('✅ All tables dropped');
              
              // Recreate everything from scratch
              await db.execAsync(`
                CREATE TABLE tasks (
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
                
                CREATE TABLE categories (
                  id TEXT PRIMARY KEY,
                  name TEXT NOT NULL,
                  color TEXT NOT NULL,
                  icon TEXT,
                  created_at TEXT NOT NULL DEFAULT (date('now'))
                );
                
                CREATE TABLE daily_stats (
                  id TEXT PRIMARY KEY,
                  date TEXT NOT NULL UNIQUE,
                  total_tasks INTEGER NOT NULL DEFAULT 0,
                  completed_tasks INTEGER NOT NULL DEFAULT 0,
                  completion_rate REAL NOT NULL DEFAULT 0,
                  streak_eligible INTEGER NOT NULL DEFAULT 0,
                  updated_at TEXT NOT NULL DEFAULT (date('now'))
                );
                
                CREATE TABLE settings (
                  id TEXT PRIMARY KEY,
                  theme TEXT NOT NULL DEFAULT 'light',
                  streak_rule INTEGER NOT NULL DEFAULT 80,
                  onboarding_completed INTEGER NOT NULL DEFAULT 0
                );
                
                INSERT INTO categories (id, name, color, icon) VALUES
                  ('cat_personal', 'Personal', '#4f46e5', 'person'),
                  ('cat_school', 'School', '#06b6d4', 'school'),
                  ('cat_work', 'Work', '#f59e0b', 'work'),
                  ('cat_health', 'Health', '#10b981', 'fitness'),
                  ('cat_errands', 'Errands', '#ef4444', 'shopping');
                  
                INSERT INTO settings (id, theme, streak_rule, onboarding_completed)
                  VALUES ('settings_default', 'light', 80, 0);
              `);
              
              console.log('✅ Tables recreated');
              Alert.alert('Success', 'Database has been reset. Please restart the app completely.');
              
              // Force restart the app
              router.replace('/');
              
            } catch (error: any) {
              console.error('Reset error:', error);
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Switch
            value={isDarkMode}
            onValueChange={setIsDarkMode}
            trackColor={{ false: '#cbd5e1', true: '#4f46e5' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <TouchableOpacity style={styles.dangerButton} onPress={hardReset}>
          <Text style={styles.dangerButtonText}>HARD RESET (Fix Database)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.versionText}>FlowDay Version 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#475569',
  },
  dangerButton: {
    backgroundColor: '#fee2e2',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});