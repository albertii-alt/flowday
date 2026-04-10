import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { db } from '../db/schema';

interface ExportableTask {
  task_date: string;
  title: string;
  description: string;
  category_id: string;
  priority: string;
  due_time: string;
  is_completed: number;
}

const escapeCsvField = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const buildCsvContent = (tasks: ExportableTask[]): string => {
  const headers = ['Date', 'Title', 'Description', 'Category', 'Priority', 'Due Time', 'Completed'];
  const rows = tasks.map(task => [
    escapeCsvField(task.task_date),
    escapeCsvField(task.title),
    escapeCsvField(task.description || ''),
    escapeCsvField(task.category_id?.replace('cat_', '') || ''),
    escapeCsvField(task.priority),
    escapeCsvField(task.due_time || ''),
    task.is_completed === 1 ? 'Yes' : 'No',
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

// Sanitize filename — remove characters not allowed in Android filenames
const buildFileName = (): string => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return `flowday-export-${dateStr}.csv`;
};

export const exportTasksToCSV = async (): Promise<{ savedToDownloads: boolean }> => {
  const tasks = await db.getAllAsync<ExportableTask>(
    `SELECT task_date, title, description, category_id, priority, due_time, is_completed
     FROM tasks
     ORDER BY task_date DESC, created_at ASC`
  );

  if (tasks.length === 0) {
    throw new Error('No tasks to export');
  }

  const csvContent = buildCsvContent(tasks);
  const fileName = buildFileName();

  // Try saving directly to Downloads folder first
  try {
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (permissions.granted) {
      const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        fileName,
        'text/csv'
      );
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' });
      return { savedToDownloads: true };
    }
  } catch {
    // Fall through to share sheet if direct save fails
  }

  // Fallback — write to app cache and share
  const cacheUri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(cacheUri, csvContent, { encoding: 'utf8' });

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(cacheUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export FlowDay Tasks',
  });

  return { savedToDownloads: false };
};
