import { db } from '../schema';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  priority: 'low' | 'medium' | 'high';
  due_time?: string;
  task_date: string;
  is_completed: number;
  created_at: string;
  updated_at: string;
}

export type CreateTaskInput = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'is_completed'>;

// Simple UUID generator
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Get tasks for a specific date
export const getTasksByDate = async (date: string): Promise<Task[]> => {
  const result = await db.getAllAsync(
    `SELECT * FROM tasks 
     WHERE task_date = ? 
     ORDER BY is_completed ASC, 
              CASE priority 
                WHEN 'high' THEN 1 
                WHEN 'medium' THEN 2 
                WHEN 'low' THEN 3 
              END ASC,
              due_time ASC`,
    date
  );
  return result as Task[];
};

// Add a new task
export const addTask = async (task: CreateTaskInput): Promise<string> => {
  const id = generateUUID();
  await db.runAsync(
    `INSERT INTO tasks (id, title, description, category_id, priority, due_time, task_date, is_completed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    task.title,
    task.description || null,
    task.category_id || null,
    task.priority,
    task.due_time || null,
    task.task_date,
    0
  );
  return id;
};

const ALLOWED_UPDATE_FIELDS: ReadonlySet<string> = new Set([
  'title', 'description', 'category_id', 'priority', 'due_time', 'task_date', 'is_completed',
]);

// Update a task
export const updateTask = async (id: string, updates: Partial<Task>): Promise<void> => {
  const safeKeys = Object.keys(updates).filter(k => ALLOWED_UPDATE_FIELDS.has(k));
  if (safeKeys.length === 0) return;

  const fields = safeKeys.map(key => `${key} = ?`).join(', ');
  const values = [...safeKeys.map(k => (updates as any)[k]), id];

  await db.runAsync(
    `UPDATE tasks SET ${fields}, updated_at = date('now') WHERE id = ?`,
    ...values
  );
};

// Toggle task completion - SIMPLE VERSION, NO QUEUE
export const toggleTaskCompletion = async (id: string, isCompleted: boolean): Promise<void> => {
  await db.runAsync(
    `UPDATE tasks SET is_completed = ?, updated_at = date('now') WHERE id = ?`,
    isCompleted ? 1 : 0,
    id
  );
};

// Delete a task
export const deleteTask = async (id: string): Promise<void> => {
  await db.runAsync('DELETE FROM tasks WHERE id = ?', id);
};

// Get tasks for a date range
export const getTasksByDateRange = async (startDate: string, endDate: string): Promise<Task[]> => {
  const result = await db.getAllAsync(
    `SELECT * FROM tasks 
     WHERE task_date >= ? AND task_date <= ? 
     ORDER BY task_date DESC`,
    startDate,
    endDate
  );
  return result as Task[];
};