import { Stack, router } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase } from '../db';
import { useUIStore } from '../store/useUIStore';
import { db } from '../db/schema';

export default function RootLayout() {
  const loadTheme = useUIStore(s => s.loadTheme);

  useEffect(() => {
    const init = async () => {
      await initDatabase();
      await loadTheme();

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
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen
          name="task/create"
          options={{
            headerShown: true,
            headerTitle: 'New Task',
            headerStyle: { backgroundColor: '#4f46e5' },
            headerTintColor: '#fff',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="task/edit"
          options={{
            headerShown: true,
            headerTitle: 'Edit Task',
            headerStyle: { backgroundColor: '#4f46e5' },
            headerTintColor: '#fff',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="task/recurring"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="task/edit-recurring"
          options={{
            headerShown: true,
            headerTitle: 'Edit Recurring Task',
            headerStyle: { backgroundColor: '#4f46e5' },
            headerTintColor: '#fff',
            presentation: 'modal',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
