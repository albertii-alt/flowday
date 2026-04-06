import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initDatabase } from '../db';
import { useUIStore } from '../store/useUIStore';

export default function RootLayout() {
  const loadTheme = useUIStore(s => s.loadTheme);

  useEffect(() => {
    const init = async () => {
      await initDatabase();
      await loadTheme();
    };
    init();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#4f46e5' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
