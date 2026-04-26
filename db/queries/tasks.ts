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
  frequency?: string;
  days_of_week?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type CreateTaskInput = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'is_completed' | 'sort_order'>;

// Simple UUID generator
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Get tasks for a specific date — sorted by completion then user-defined order
export const getTasksByDate = async (date: string): Promise<Task[]> => {
  const result = await db.getAllAsync(
    `SELECT t.*, r.frequency, r.days_of_week
     FROM tasks t
     LEFT JOIN recurring_tasks r ON t.recurring_task_id = r.id
     WHERE t.task_date = ?
     ORDER BY t.is_completed ASC, t.sort_order ASC`,
    date
  );
  return result as Task[];
};

// Add a new task — sort_order set to max + 1
export const addTask = async (task: CreateTaskInput): Promise<string> => {
  const id = generateUUID();
  const maxOrderRow = await db.getFirstAsync<{ max_order: number }>(
    `SELECT COALESCE(MAX(sort_order), 0) as max_order FROM tasks WHERE task_date = ?`,
    task.task_date
  );
  const sortOrder = (maxOrderRow?.max_order ?? 0) + 1;
  await db.runAsync(
    `INSERT INTO tasks (id, title, description, category_id, priority, due_time, task_date, is_completed, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    task.title,
    task.description || null,
    task.category_id || null,
    task.priority,
    task.due_time || null,
    task.task_date,
    0,
    sortOrder
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
       recurring_task_id = CASE
         WHEN ? = 1 THEN NULL
         WHEN ? IS NOT NULL THEN ?
         ELSE recurring_task_id
       END,
       updated_at = date('now')
     WHERE id = ?`,
    updates.title ?? null,
    updates.description !== undefined ? 1 : 0, updates.description ?? null,
    updates.category_id ?? null,
    updates.priority ?? null,
    updates.due_time !== undefined ? 1 : 0, updates.due_time ?? null,
    updates.task_date ?? null,
    'recurring_task_id' in updates && updates.recurring_task_id === undefined ? 1 : 0,
    updates.recurring_task_id ?? null,
    updates.recurring_task_id ?? null,
    id
  );
};

// Toggle task completion
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

// Update sort order — fully parameterized, one query per task
export const updateTaskOrder = async (orderedIds: string[]): Promise<void> => {
  if (orderedIds.length === 0) return;
  for (let i = 0; i < orderedIds.length; i++) {
    await db.runAsync(`UPDATE tasks SET sort_order = ? WHERE id = ?`, i, orderedIds[i]);
  }
};

// Update task priority only
export const updateTaskPriority = async (id: string, priority: string): Promise<void> => {
  await db.runAsync(`UPDATE tasks SET priority = ?, updated_at = date('now') WHERE id = ?`, priority, id);
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
