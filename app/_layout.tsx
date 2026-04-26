import { Stack, router } from 'expo-router';
import { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { initDatabase } from '../db';
import { useUIStore } from '../store/useUIStore';
import { db } from '../db/schema';
import { loadNotificationSettings, scheduleDailyReminder } from '../utils/notifications';

export default function RootLayout() {
  const loadTheme = useUIStore(s => s.loadTheme);

  useEffect(() => {
    const init = async () => {
      await initDatabase();
      await loadTheme();

      // Restore notification if it was enabled — handles app reinstall / OS reboot
      const { enabled, reminderTime } = await loadNotificationSettings();
      if (enabled) {
        await scheduleDailyReminder(reminderTime);
      }

      // Check if onboarding has been completed
      const row = await db.getFirstAsync<{ onboarding_completed: number }>(
        `SELECT onboarding_completed FROM settings WHERE id = 'settings_default'`
      );
      if (row?.onboarding_completed === 0) {
        router.replace('/onboarding');
      }
    };
    init();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen
          name="task/create"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="task/edit"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="task/recurring"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="task/edit-recurring"
          options={{ headerShown: false, presentation: 'modal' }}
        />
      </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
