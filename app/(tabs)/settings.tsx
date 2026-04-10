import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUIStore } from '../../store/useUIStore';
import { useTheme } from '../../utils/useTheme';
import GradientHeader from '../../components/GradientHeader';
import { db, createTables } from '../../db/schema';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  requestNotificationPermission,
  scheduleDailyReminder,
  cancelDailyReminder,
  loadNotificationSettings,
  saveNotificationSettings,
} from '../../utils/notifications';
import { exportTasksToCSV } from '../../utils/export';

export default function SettingsScreen() {
  const { isDarkMode, setDarkMode } = useUIStore();
  const C = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [editingTime, setEditingTime] = useState(false);
  const [timeInput, setTimeInput] = useState('08:00');

  useEffect(() => {
    loadNotificationSettings().then(({ enabled, reminderTime: time }) => {
      setNotificationsEnabled(enabled);
      setReminderTime(time);
      setTimeInput(time);
    });
  }, []);

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your phone settings to use this feature.'
        );
        return;
      }
      await scheduleDailyReminder(reminderTime);
    } else {
      await cancelDailyReminder();
    }
    setNotificationsEnabled(value);
    await saveNotificationSettings(value, reminderTime);
  };

  const handleTimeSave = async () => {
    // Validate HH:MM format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(timeInput)) {
      Alert.alert('Invalid Time', 'Please enter time in HH:MM format (e.g. 08:00)');
      return;
    }
    setReminderTime(timeInput);
    setEditingTime(false);
    await saveNotificationSettings(notificationsEnabled, timeInput);
    if (notificationsEnabled) {
      await scheduleDailyReminder(timeInput);
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { savedToDownloads } = await exportTasksToCSV();
      if (savedToDownloads) {
        Alert.alert('Export Successful', 'Your tasks have been saved to the selected folder.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      Alert.alert('Export Failed', message);
    } finally {
      setIsExporting(false);
    }
  };

  const hardReset = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your tasks and stats. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelDailyReminder();
              await db.execAsync(`
                DROP TABLE IF EXISTS tasks;
                DROP TABLE IF EXISTS daily_stats;
                DROP TABLE IF EXISTS categories;
                DROP TABLE IF EXISTS settings;
                DROP TABLE IF EXISTS recurring_tasks;
              `);
              await createTables();
              Alert.alert('Done', 'All data has been reset.');
              router.replace('/');
            } catch (error) {
              console.error('Reset error:', error);
              Alert.alert('Error', 'Could not reset data.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={['top']}>
      <GradientHeader title="Settings" />

      <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>Tasks</Text>
        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/task/recurring')}>
          <Text style={[styles.navButtonText, { color: C.textPrimary }]}>🔁 Recurring Tasks</Text>
          <Text style={[styles.navArrow, { color: C.textMuted }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>Appearance</Text>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: C.textPrimary }]}>Dark Mode</Text>
          <Switch
            value={isDarkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: C.border, true: C.primary }}
            thumbColor='#fff'
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>Notifications</Text>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: C.textPrimary }]}>Daily Reminder</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: C.border, true: C.primary }}
            thumbColor='#fff'
          />
        </View>
        {notificationsEnabled && (
          <View style={[styles.timeRow, { borderTopColor: C.border }]}>
            <Text style={[styles.settingLabel, { color: C.textPrimary }]}>Reminder Time</Text>
            {editingTime ? (
              <View style={styles.timeEditRow}>
                <TextInput
                  style={[styles.timeInput, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary }]}
                  value={timeInput}
                  onChangeText={setTimeInput}
                  placeholder="HH:MM"
                  placeholderTextColor={C.textMuted}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  autoFocus
                />
                <TouchableOpacity style={[styles.saveTimeBtn, { backgroundColor: C.primary }]} onPress={handleTimeSave}>
                  <Text style={styles.saveTimeBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditingTime(true)}>
                <Text style={[styles.timeValue, { color: C.primary }]}>{reminderTime}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>Data</Text>
        <TouchableOpacity
          style={[styles.exportButton, { backgroundColor: C.primary + '15', borderColor: C.primary }]}
          onPress={handleExport}
          disabled={isExporting}
        >
          <Text style={[styles.exportButtonText, { color: C.primary }]}>
            {isExporting ? 'Exporting...' : '📤 Export Tasks to CSV'}
          </Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: C.border }]} />
        <TouchableOpacity style={[styles.dangerButton, { backgroundColor: C.error + '20' }]} onPress={hardReset}>
          <Text style={[styles.dangerButtonText, { color: C.error }]}>Reset All Data</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>About</Text>
        <Text style={[styles.versionText, { color: C.textSecondary }]}>FlowDay v1.2.0</Text>
        <Text style={[styles.versionText, { color: C.textMuted }]}>Offline-first daily task tracker</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { marginHorizontal: 16, marginTop: 16, marginBottom: 0, padding: 16, borderRadius: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 12, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLabel: { fontSize: 16 },
  navButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  navButtonText: { fontSize: 16 },
  navArrow: { fontSize: 20 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  timeEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, fontSize: 16, width: 80, textAlign: 'center' },
  saveTimeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  saveTimeBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  timeValue: { fontSize: 16, fontWeight: '600' },
  exportButton: { padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, marginBottom: 12 },
  exportButtonText: { fontSize: 16, fontWeight: '600' },
  divider: { height: 1, marginBottom: 12 },
  dangerButton: { padding: 14, borderRadius: 12, alignItems: 'center' },
  dangerButtonText: { fontSize: 16, fontWeight: '600' },
  versionText: { fontSize: 14, marginBottom: 4 },
});
