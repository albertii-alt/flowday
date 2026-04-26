import { db } from '../schema';
import { generateUUID } from '../../utils/uuid';

export type Frequency = 'daily' | 'weekly';

export interface RecurringTask {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  priority: 'low' | 'medium' | 'high';
  due_time?: string;
  frequency: Frequency;
  days_of_week?: string; // comma-separated: "0,1,2,3,4,5,6" (0=Sun)
  is_active: number;
  created_at: string;
}

export type CreateRecurringTaskInput = Omit<RecurringTask, 'id' | 'created_at' | 'is_active'>;

const PRIORITY_ORDER = `CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`;

export const getAllRecurringTasks = async (): Promise<RecurringTask[]> => {
  const result = await db.getAllAsync<RecurringTask>(
    `SELECT * FROM recurring_tasks WHERE is_active = 1 ORDER BY ${PRIORITY_ORDER} ASC`
  );
  return result;
};

export const addRecurringTask = async (task: CreateRecurringTaskInput): Promise<string> => {
  const id = generateUUID();
  await db.runAsync(
    `INSERT INTO recurring_tasks (id, title, description, category_id, priority, due_time, frequency, days_of_week, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    id,
    task.title,
    task.description || null,
    task.category_id || null,
    task.priority,
    task.due_time || null,
    task.frequency,
    task.days_of_week || null
  );
  return id;
};

export const updateRecurringTask = async (id: string, updates: Partial<CreateRecurringTaskInput>): Promise<void> => {
  await db.runAsync(
    `UPDATE recurring_tasks SET
       title = COALESCE(?, title),
       description = CASE WHEN ? = 1 THEN ? ELSE description END,
       category_id = COALESCE(?, category_id),
       priority = COALESCE(?, priority),
       due_time = CASE WHEN ? = 1 THEN ? ELSE due_time END,
       frequency = COALESCE(?, frequency),
       days_of_week = CASE WHEN ? = 1 THEN ? ELSE days_of_week END
     WHERE id = ?`,
    updates.title ?? null,
    updates.description !== undefined ? 1 : 0, updates.description ?? null,
    updates.category_id ?? null,
    updates.priority ?? null,
    updates.due_time !== undefined ? 1 : 0, updates.due_time ?? null,
    updates.frequency ?? null,
    updates.days_of_week !== undefined ? 1 : 0, updates.days_of_week ?? null,
    id
  );
};

export const deleteRecurringTask = async (id: string): Promise<void> => {
  await db.runAsync(`DELETE FROM recurring_tasks WHERE id = ?`, id);
};

// Sync priority from recurring task to all generated tasks today
export const syncRecurringPriorityToTasks = async (recurringId: string, priority: string, date: string): Promise<void> => {
  await db.runAsync(
    `UPDATE tasks SET priority = ?, updated_at = date('now') WHERE recurring_task_id = ? AND task_date = ?`,
    priority, recurringId, date
  );
};

export const generateRecurringTasksForDate = async (date: string): Promise<void> => {
  const [year, month, day] = date.split('-').map(Number);
  const dayOfWeek = new Date(year, month - 1, day).getDay();
  const recurringTasks = await getAllRecurringTasks();
  if (recurringTasks.length === 0) return;

  const existing = await db.getAllAsync<{ recurring_task_id: string }>(
    `SELECT recurring_task_id FROM tasks WHERE task_date = ? AND recurring_task_id IS NOT NULL`,
    date
  );
  const existingIds = new Set(existing.map(r => r.recurring_task_id));

  for (const recurring of recurringTasks) {
    if (existingIds.has(recurring.id)) continue;

    const shouldRun = recurring.frequency === 'daily'
      || (recurring.frequency === 'weekly'
        && recurring.days_of_week
        && recurring.days_of_week.split(',').map(Number).includes(dayOfWeek));

    if (!shouldRun) continue;

    const priorityOrder = recurring.priority === 'high' ? 0 : recurring.priority === 'medium' ? 1000 : 2000;
    const maxOrderRow = await db.getFirstAsync<{ max_order: number }>(
      `SELECT COALESCE(MAX(sort_order), 0) as max_order FROM tasks WHERE task_date = ?`, date
    );
    const sortOrder = priorityOrder + (maxOrderRow?.max_order ?? 0) + 1;

    await db.runAsync(
      `INSERT INTO tasks (id, title, description, category_id, priority, due_time, task_date, is_completed, sort_order, recurring_task_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      generateUUID(),
      recurring.title,
      recurring.description || null,
      recurring.category_id || null,
      recurring.priority,
      recurring.due_time || null,
      date,
      sortOrder,
      recurring.id
    );
  }
};
