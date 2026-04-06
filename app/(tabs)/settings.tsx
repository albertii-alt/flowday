import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUIStore } from '../../store/useUIStore';
import { useTheme } from '../../utils/useTheme';
import GradientHeader from '../../components/GradientHeader';
import { db, createTables } from '../../db/schema';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { isDarkMode, setDarkMode } = useUIStore();
  const C = useTheme();

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
              await db.execAsync(`
                DROP TABLE IF EXISTS tasks;
                DROP TABLE IF EXISTS daily_stats;
                DROP TABLE IF EXISTS categories;
                DROP TABLE IF EXISTS settings;
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
        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>Data</Text>
        <TouchableOpacity style={[styles.dangerButton, { backgroundColor: C.error + '20' }]} onPress={hardReset}>
          <Text style={[styles.dangerButtonText, { color: C.error }]}>Reset All Data</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>About</Text>
        <Text style={[styles.versionText, { color: C.textSecondary }]}>FlowDay v1.0.0</Text>
        <Text style={[styles.versionText, { color: C.textMuted }]}>Offline-first daily task tracker</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 12, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLabel: { fontSize: 16 },
  dangerButton: { padding: 14, borderRadius: 12, alignItems: 'center' },
  dangerButtonText: { fontSize: 16, fontWeight: '600' },
  versionText: { fontSize: 14, marginBottom: 4 },
});
