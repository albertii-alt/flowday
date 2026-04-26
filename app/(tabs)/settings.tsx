import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUIStore } from '../../store/useUIStore';
import { useTheme } from '../../utils/useTheme';
import { Ionicons } from '@expo/vector-icons';
import GradientHeader from '../../components/GradientHeader';
import { db, createTables } from '../../db/schema';
import { router } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import {
  requestNotificationPermission,
  scheduleDailyReminder,
  cancelDailyReminder,
  loadNotificationSettings,
  saveNotificationSettings,
} from '../../utils/notifications';
import { exportTasksToCSV } from '../../utils/export';

// ─── Time helpers ───────────────────────────────────────────────────────────────────
// Convert 24h "HH:MM" to 12h parts
const to12h = (time24: string) => {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return { hour: hour12, minute: m, period };
};

// Convert 12h parts back to 24h "HH:MM"
const to24h = (hour: number, minute: number, period: 'AM' | 'PM'): string => {
  let h = hour % 12;
  if (period === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

// Format for display: "8:00 AM"
const formatDisplay = (hour: number, minute: number, period: 'AM' | 'PM') =>
  `${hour}:${String(minute).padStart(2, '0')} ${period}`;

export default function SettingsScreen() {
  const { isDarkMode, setDarkMode } = useUIStore();
  const C = useTheme();
  const { bottom } = useSafeAreaInsets();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [showTimePicker, setShowTimePicker] = useState(false);

  // 12h picker state
  const initial = to12h('08:00');
  const [pickerHour, setPickerHour] = useState(initial.hour);
  const [pickerMinute, setPickerMinute] = useState(initial.minute);
  const [pickerPeriod, setPickerPeriod] = useState<'AM' | 'PM'>(initial.period);

  useEffect(() => {
    loadNotificationSettings().then(({ enabled, reminderTime: time }) => {
      setNotificationsEnabled(enabled);
      setReminderTime(time);
      const parts = to12h(time);
      setPickerHour(parts.hour);
      setPickerMinute(parts.minute);
      setPickerPeriod(parts.period);
    });
  }, []);

  const handleDarkModeToggle = (value: boolean) => {
    setDarkMode(value);
  };

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setNotificationsEnabled(false);
        Alert.alert('Permission Required', 'Please enable notifications in your phone settings.');
        return;
      }
      await scheduleDailyReminder(reminderTime);
    } else {
      await cancelDailyReminder();
    }
    await saveNotificationSettings(value, reminderTime);
  };

  const handleTimeSave = useCallback(async () => {
    const time24 = to24h(pickerHour, pickerMinute, pickerPeriod);
    setReminderTime(time24);
    setShowTimePicker(false);
    await saveNotificationSettings(notificationsEnabled, time24);
    if (notificationsEnabled) {
      await scheduleDailyReminder(time24);
    }
  }, [pickerHour, pickerMinute, pickerPeriod, notificationsEnabled]);

  const adjustHour = useCallback((delta: number) => {
    setPickerHour(h => {
      let next = h + delta;
      if (next > 12) next = 1;
      if (next < 1) next = 12;
      return next;
    });
  }, []);

  const adjustMinute = useCallback((delta: number) => {
    setPickerMinute(m => {
      let next = m + delta;
      if (next > 59) next = 0;
      if (next < 0) next = 59;
      return next;
    });
  }, []);

  const [editingHour, setEditingHour] = useState(false);
  const [editingMinute, setEditingMinute] = useState(false);
  const [hourInput, setHourInput] = useState('');
  const [minuteInput, setMinuteInput] = useState('');

  const commitHour = useCallback((val: string) => {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 1 && n <= 12) setPickerHour(n);
    setEditingHour(false);
  }, []);

  const commitMinute = useCallback((val: string) => {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 0 && n <= 59) setPickerMinute(n);
    setEditingMinute(false);
  }, []);

  const togglePeriod = useCallback(() => {
    setPickerPeriod(p => p === 'AM' ? 'PM' : 'AM');
  }, []);

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
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={[]}>
      <GradientHeader title="Settings" subtitle="Preferences & configuration" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottom + 4 + 64 + 16 }]}>

      <View style={[styles.section, { backgroundColor: C.surface }]}>
        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>Tasks</Text>
        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/task/recurring')}>
          <View style={styles.navButtonInner}>
            <Ionicons name="repeat" size={16} color={C.primary} style={{ marginRight: 10 }} />
            <Text style={[styles.navButtonText, { color: C.textPrimary }]}>Recurring Tasks</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: C.surface }]}>
        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>Appearance</Text>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: C.textPrimary }]}>Dark Mode</Text>
          <Switch
            value={isDarkMode}
            onValueChange={handleDarkModeToggle}
            trackColor={{ false: C.border, true: C.primary }}
            thumbColor='#fff'
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: C.surface }]}>
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
            <TouchableOpacity onPress={() => setShowTimePicker(p => !p)}>
              <Text style={[styles.timeValue, { color: C.primary }]}>
                {formatDisplay(pickerHour, pickerMinute, pickerPeriod)}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {notificationsEnabled && showTimePicker && (
          <View style={[styles.pickerCard, { backgroundColor: C.background, borderColor: C.border }]}>
            {/* Hour */}
            <View style={styles.pickerCol}>
              <TouchableOpacity onPress={() => adjustHour(1)} style={styles.pickerBtn}>
                <Ionicons name="chevron-up" size={18} color={C.primary} />
              </TouchableOpacity>
              {editingHour ? (
                <TextInput
                  style={[styles.pickerInput, { color: C.textPrimary, borderColor: C.primary }]}
                  value={hourInput}
                  onChangeText={setHourInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  autoFocus
                  selectTextOnFocus
                  onBlur={() => commitHour(hourInput)}
                  onSubmitEditing={() => commitHour(hourInput)}
                />
              ) : (
                <TouchableOpacity onPress={() => { setHourInput(String(pickerHour)); setEditingHour(true); }}>
                  <Text style={[styles.pickerValue, { color: C.textPrimary }]}>
                    {String(pickerHour).padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => adjustHour(-1)} style={styles.pickerBtn}>
                <Ionicons name="chevron-down" size={18} color={C.primary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.pickerSep, { color: C.textPrimary }]}>:</Text>

            {/* Minute */}
            <View style={styles.pickerCol}>
              <TouchableOpacity onPress={() => adjustMinute(1)} style={styles.pickerBtn}>
                <Ionicons name="chevron-up" size={18} color={C.primary} />
              </TouchableOpacity>
              {editingMinute ? (
                <TextInput
                  style={[styles.pickerInput, { color: C.textPrimary, borderColor: C.primary }]}
                  value={minuteInput}
                  onChangeText={setMinuteInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  autoFocus
                  selectTextOnFocus
                  onBlur={() => commitMinute(minuteInput)}
                  onSubmitEditing={() => commitMinute(minuteInput)}
                />
              ) : (
                <TouchableOpacity onPress={() => { setMinuteInput(String(pickerMinute)); setEditingMinute(true); }}>
                  <Text style={[styles.pickerValue, { color: C.textPrimary }]}>
                    {String(pickerMinute).padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => adjustMinute(-1)} style={styles.pickerBtn}>
                <Ionicons name="chevron-down" size={18} color={C.primary} />
              </TouchableOpacity>
            </View>

            {/* AM/PM */}
            <TouchableOpacity
              style={[styles.periodBtn, { backgroundColor: C.primary }]}
              onPress={togglePeriod}
            >
              <Text style={styles.periodText}>{pickerPeriod}</Text>
            </TouchableOpacity>

            {/* Save */}
            <TouchableOpacity
              style={[styles.saveTimeBtn, { backgroundColor: C.success }]}
              onPress={handleTimeSave}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: C.surface }]}>
        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>Data</Text>
        <TouchableOpacity
          style={[styles.exportButton, { backgroundColor: C.primary + '15', borderColor: C.primary }]}
          onPress={handleExport}
          disabled={isExporting}
        >
          <Text style={[styles.exportButtonText, { color: C.primary }]}>
            {isExporting ? 'Exporting...' : 'Export Tasks to CSV'}
          </Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: C.border }]} />
        <TouchableOpacity style={[styles.dangerButton, { backgroundColor: C.error + '20' }]} onPress={hardReset}>
          <Text style={[styles.dangerButtonText, { color: C.error }]}>Reset All Data</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: C.surface }]}>
        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>About</Text>
        <Text style={[styles.versionText, { color: C.textSecondary }]}>FlowDay v1.7.0</Text>
        <Text style={[styles.versionText, { color: C.textMuted }]}>Offline-first daily task tracker</Text>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 6 },
  section: { marginHorizontal: 16, marginTop: 8, padding: 14, borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 10, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 32 },
  settingLabel: { fontSize: 14, fontWeight: '400' },
  navButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  navButtonInner: { flexDirection: 'row', alignItems: 'center' },
  navButtonText: { fontSize: 14 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  timeValue: { fontSize: 14, fontWeight: '700' },
  pickerCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  pickerCol: { alignItems: 'center' },
  pickerBtn: { padding: 6 },
  pickerValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, minWidth: 36, textAlign: 'center' },
  pickerInput: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, minWidth: 36, textAlign: 'center', borderBottomWidth: 2, paddingBottom: 2 },
  pickerSep: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  periodBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginLeft: 4 },
  periodText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  saveTimeBtn: { padding: 10, borderRadius: 10, marginLeft: 4 },
  exportButton: { padding: 11, borderRadius: 10, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, marginBottom: 8 },
  exportButtonText: { fontSize: 14, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth, marginBottom: 8 },
  dangerButton: { padding: 11, borderRadius: 10, alignItems: 'center' },
  dangerButtonText: { fontSize: 14, fontWeight: '600' },
  versionText: { fontSize: 12, marginBottom: 2, lineHeight: 18 },
});
