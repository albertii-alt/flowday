import * as SQLite from 'expo-sqlite';
import { generateUUID } from '../../utils/uuid';

const db = SQLite.openDatabaseSync('flowday.db');

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

// Simple stats update function (inline, no external dependency)
const updateSimpleStats = async (date: string) => {
  try {
    // Get tasks for this date
    const tasks = await db.getAllAsync('SELECT * FROM tasks WHERE task_date = ?', date) as Task[];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: Task) => t.is_completed === 1).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const streakEligible = completionRate >= 80 ? 1 : 0;
    
    // Update or insert stats
    await db.runAsync(
      `INSERT OR REPLACE INTO daily_stats (id, date, total_tasks, completed_tasks, completion_rate, streak_eligible, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, date('now'))`,
      `stats_${date}`,
      date,
      totalTasks,
      completedTasks,
      completionRate,
      streakEligible
    );
    
    console.log(`✅ Stats updated for ${date}: ${completedTasks}/${totalTasks}`);
  } catch (error) {
    console.error('Stats update error:', error);
    // Don't throw - stats are not critical
  }
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

// Add a new task - WITH STATS UPDATE
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
  
  // Update stats for this date
  await updateSimpleStats(task.task_date);
  
  return id;
};

// Update a task - WITH STATS UPDATE
export const updateTask = async (id: string, updates: Partial<Task>): Promise<void> => {
  const fields = Object.keys(updates)
    .map(key => `${key} = ?`)
    .join(', ');
  const values = [...Object.values(updates), id];
  
  await db.runAsync(
    `UPDATE tasks SET ${fields}, updated_at = date('now') WHERE id = ?`,
    ...values
  );
  
  // If task_date changed, update stats for both old and new dates
  if (updates.task_date) {
    const oldTask = await db.getAllAsync(`SELECT task_date FROM tasks WHERE id = ?`, id) as any[];
    if (oldTask[0]) {
      await updateSimpleStats(oldTask[0].task_date);
    }
    await updateSimpleStats(updates.task_date);
  } else {
    const task = await db.getAllAsync(`SELECT task_date FROM tasks WHERE id = ?`, id) as any[];
    if (task[0]) {
      await updateSimpleStats(task[0].task_date);
    }
  }
};

// Toggle task completion - WITH STATS UPDATE
export const toggleTaskCompletion = async (id: string, isCompleted: boolean): Promise<void> => {
  // Get task date first
  const task = await db.getAllAsync(`SELECT task_date FROM tasks WHERE id = ?`, id) as any[];
  
  await db.runAsync(
    `UPDATE tasks SET is_completed = ?, updated_at = date('now') WHERE id = ?`,
    isCompleted ? 1 : 0,
    id
  );
  
  // Update stats for this date
  if (task[0]) {
    await updateSimpleStats(task[0].task_date);
  }
};

// Delete a task - WITH STATS UPDATE
export const deleteTask = async (id: string): Promise<void> => {
  // Get task date first
  const task = await db.getAllAsync(`SELECT task_date FROM tasks WHERE id = ?`, id) as any[];
  
  await db.runAsync('DELETE FROM tasks WHERE id = ?', id);
  
  // Update stats for this date
  if (task[0]) {
    await updateSimpleStats(task[0].task_date);
  }
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