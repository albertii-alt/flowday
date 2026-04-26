import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../utils/useTheme';
import { useUIStore } from '../../store/useUIStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const C = useTheme();
  const isDarkMode = useUIStore(s => s.isDarkMode);
  const { bottom } = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: bottom + 4,
          left: 24,
          right: 24,
          height: 64,
          borderRadius: 32,
          backgroundColor: isDarkMode ? '#111318' : '#ffffff',
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDarkMode ? 0.5 : 0.15,
          shadowRadius: 16,
          paddingBottom: 0,
          paddingTop: 0,
        },
        tabBarItemStyle: {
          height: 64,
          paddingVertical: 10,
        },
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
