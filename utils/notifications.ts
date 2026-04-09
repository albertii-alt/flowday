import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { db } from '../db/schema';

const REMINDER_IDENTIFIER = 'flowday-daily-reminder';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermission = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleDailyReminder = async (time: string): Promise<void> => {
  // Cancel existing reminder first
  await cancelDailyReminder();

  const [hours, minutes] = time.split(':').map(Number);

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_IDENTIFIER,
    content: {
      title: '🌅 Plan your day!',
      body: "Open FlowDay and set your tasks for today. Stay in flow!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    },
  });
};

export const cancelDailyReminder = async (): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER);
};

export const loadNotificationSettings = async (): Promise<{
  enabled: boolean;
  reminderTime: string;
}> => {
  const row = await db.getFirstAsync<{
    notifications_enabled: number;
    reminder_time: string;
  }>(`SELECT notifications_enabled, reminder_time FROM settings WHERE id = 'settings_default'`);

  return {
    enabled: row?.notifications_enabled === 1,
    reminderTime: row?.reminder_time ?? '08:00',
  };
};

export const saveNotificationSettings = async (
  enabled: boolean,
  reminderTime: string
): Promise<void> => {
  await db.runAsync(
    `UPDATE settings SET notifications_enabled = ?, reminder_time = ? WHERE id = 'settings_default'`,
    enabled ? 1 : 0,
    reminderTime
  );
};
