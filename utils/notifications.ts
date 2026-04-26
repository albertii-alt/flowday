import * as Notifications from 'expo-notifications';
import { db } from '../db/schema';

const REMINDER_IDENTIFIER = 'flowday-daily-reminder';

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
  await cancelDailyReminder();
  const [hours, minutes] = time.split(':').map(Number);
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_IDENTIFIER,
    content: {
      title: '🌅 Plan your day!',
      body: 'Open FlowDay and set your tasks for today. Stay in flow!',
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

// ─── Task due time notifications ─────────────────────────────────────────────────────────────────
// Each task gets its own notification identified by task id.
// Fires once at the exact date + time the task is due.

export const scheduleTaskNotification = async (
  taskId: string,
  taskTitle: string,
  taskDate: string,   // 'yyyy-MM-dd'
  dueTime: string,    // 'HH:MM' 24h
): Promise<void> => {
  // Cancel any existing notification for this task first
  await cancelTaskNotification(taskId);

  const [year, month, day] = taskDate.split('-').map(Number);
  const [hours, minutes] = dueTime.split(':').map(Number);

  // Build the exact date object for the trigger
  const triggerDate = new Date(year, month - 1, day, hours, minutes, 0);

  // Don't schedule if the time is already in the past
  if (triggerDate <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: `flowday-task-${taskId}`,
    content: {
      title: '⏰ Task due now',
      body: taskTitle,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
};

export const cancelTaskNotification = async (taskId: string): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(`flowday-task-${taskId}`);
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
