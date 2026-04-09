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
  recurring_task_id?: string;
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

// Update a task — explicit parameterized query, no dynamic SQL
export const updateTask = async (id: string, updates: Partial<Task>): Promise<void> => {
  await db.runAsync(
    `UPDATE tasks SET
       title = COALESCE(?, title),
       description = CASE WHEN ? = 1 THEN ? ELSE description END,
       category_id = COALESCE(?, category_id),
       priority = COALESCE(?, priority),
       due_time = CASE WHEN ? = 1 THEN ? ELSE due_time END,
       task_date = COALESCE(?, task_date),
       updated_at = date('now')
     WHERE id = ?`,
    updates.title ?? null,
    updates.description !== undefined ? 1 : 0, updates.description ?? null,
    updates.category_id ?? null,
    updates.priority ?? null,
    updates.due_time !== undefined ? 1 : 0, updates.due_time ?? null,
    updates.task_date ?? null,
    id
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