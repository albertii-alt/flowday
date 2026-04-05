import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initDatabase } from '../db';

export default function RootLayout() {
  useEffect(() => {
    // Initialize database when app starts
    initDatabase();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4f46e5',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false 
        }} 
      />
    </Stack>
  );
}