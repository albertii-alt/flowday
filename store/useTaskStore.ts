import { create } from 'zustand';
import { getTasksByDate, addTask, updateTask, updateTaskOrder, updateTaskPriority, toggleTaskCompletion, deleteTask, Task, CreateTaskInput } from '../db/queries/tasks';
import { updateDailyStats } from '../db/queries/stats';
import { generateRecurringTasksForDate } from '../db/queries/recurring';

interface TaskStore {
  todayTasks: Task[];
  isLoading: boolean;
  fetchTodayTasks: (date: string) => Promise<void>;
  refreshTodayTasks: (date: string) => Promise<void>;
  addNewTask: (task: CreateTaskInput) => Promise<string>;
  updateExistingTask: (id: string, updates: Partial<Task>) => Promise<void>;
  toggleTask: (id: string, currentStatus: boolean, taskDate: string) => Promise<void>;
  removeTask: (id: string, taskDate: string) => Promise<void>;
  reorderTasks: (orderedTasks: Task[]) => void;
  reorderWithPriority: (orderedTasks: Task[]) => Promise<void>;
}

const pendingToggles = new Set<string>();

const sanitizeLog = (value: string): string => value.replace(/[\r\n\t]/g, ' ').trim();

const logError = (context: string, error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`${sanitizeLog(context)}: ${sanitizeLog(message)}`);
};

const PRIORITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

const sortByPriority = (tasks: Task[]): Task[] =>
  [...tasks].sort((a, b) => {
    if (a.is_completed !== b.is_completed) return a.is_completed - b.is_completed;
    const rankDiff = (PRIORITY_RANK[b.priority] ?? 1) - (PRIORITY_RANK[a.priority] ?? 1);
    if (rankDiff !== 0) return rankDiff;
    return a.sort_order - b.sort_order; // preserve manual order within same priority
  });

export const useTaskStore = create<TaskStore>((set, get) => ({
  todayTasks: [],
  isLoading: false,

  fetchTodayTasks: async (date: string) => {
    set({ isLoading: true });
    try {
      await generateRecurringTasksForDate(date);
      const tasks = await getTasksByDate(date);
      set({ todayTasks: sortByPriority(tasks), isLoading: false });
    } catch (error) {
      logError('Fetch error', error);
      set({ isLoading: false });
    }
  },

  refreshTodayTasks: async (date: string) => {
    try {
      const tasks = await getTasksByDate(date);
      set({ todayTasks: sortByPriority(tasks) });
    } catch (error) {
      logError('Refresh error', error);
    }
  },

  addNewTask: async (task: CreateTaskInput) => {
    const id = await addTask(task);
    await get().fetchTodayTasks(task.task_date);
    updateDailyStats(task.task_date).catch(err => logError('Stats update', err));
    return id;
  },

  updateExistingTask: async (id: string, updates: Partial<Task>) => {
    await updateTask(id, updates);
    // Sync priority to recurring task if this is a recurring instance
    if (updates.priority) {
      const { todayTasks } = get();
      const task = todayTasks.find(t => t.id === id);
      if (task?.recurring_task_id) {
        const { updateRecurringTask } = await import('../db/queries/recurring');
        await updateRecurringTask(task.recurring_task_id, { priority: updates.priority });
      }
    }
    const { todayTasks } = get();
    if (todayTasks.length > 0 && todayTasks[0]?.task_date) {
      const date = todayTasks[0].task_date;
      const tasks = await getTasksByDate(date);
      const sorted = sortByPriority(tasks);
      set({ todayTasks: sorted });
      updateTaskOrder(sorted.map(t => t.id)).catch(err => logError('Reorder error', err));
      updateDailyStats(date).catch(err => logError('Stats update', err));
    }
  },

  toggleTask: async (id: string, currentStatus: boolean, taskDate: string) => {
    if (pendingToggles.has(id)) return;
    pendingToggles.add(id);

    set(state => ({
      todayTasks: state.todayTasks.map(task =>
        task.id === id ? { ...task, is_completed: task.is_completed === 1 ? 0 : 1 } : task
      ),
    }));

    try {
      await toggleTaskCompletion(id, !currentStatus);
      const { todayTasks } = get();
      const total = todayTasks.length;
      const completed = todayTasks.filter(t => t.is_completed === 1).length;
      updateDailyStats(taskDate, total, completed).catch(err => logError('Stats update', err));
    } catch (error) {
      logError('Toggle error', error);
      set(state => ({
        todayTasks: state.todayTasks.map(task =>
          task.id === id ? { ...task, is_completed: task.is_completed === 1 ? 0 : 1 } : task
        ),
      }));
    } finally {
      pendingToggles.delete(id);
    }
  },

  removeTask: async (id: string, taskDate: string) => {
    try {
      await deleteTask(id);
      await get().fetchTodayTasks(taskDate);
      updateDailyStats(taskDate).catch(err => logError('Stats update', err));
    } catch (error) {
      logError('Delete error', error);
    }
  },

  // Instant optimistic reorder — DB write in background
  reorderTasks: (orderedTasks: Task[]) => {
    set({ todayTasks: orderedTasks });
    updateTaskOrder(orderedTasks.map(t => t.id)).catch(err => logError('Reorder error', err));
  },

  // Reorder + auto-assign priority only when crossing priority zones
  reorderWithPriority: async (orderedTasks: Task[]) => {
    // Build a map of original priorities before drag
    const originalPriority: Record<string, Task['priority']> = {};
    get().todayTasks.forEach(t => { originalPriority[t.id] = t.priority; });

    const updated = orderedTasks.map((task, index) => {
      const above = index > 0 ? orderedTasks[index - 1] : null;
      const below = index < orderedTasks.length - 1 ? orderedTasks[index + 1] : null;

      const aboveRank = above ? (PRIORITY_RANK[above.priority] ?? 1) : null;
      const belowRank = below ? (PRIORITY_RANK[below.priority] ?? 1) : null;
      const taskRank = PRIORITY_RANK[task.priority] ?? 1;

      // Only change priority if task is now between two tasks of a different priority
      if (aboveRank !== null && belowRank !== null) {
        if (taskRank > aboveRank) return { ...task, priority: above!.priority };
        if (taskRank < belowRank) return { ...task, priority: below!.priority };
      } else if (aboveRank !== null && taskRank > aboveRank) {
        // Dropped at the bottom, below a lower priority
        return { ...task, priority: above!.priority };
      } else if (belowRank !== null && taskRank < belowRank) {
        // Dropped at the top, above a higher priority
        return { ...task, priority: below!.priority };
      }

      return task;
    });

    // Optimistic update
    set({ todayTasks: updated });

    // Persist sort order
    updateTaskOrder(updated.map(t => t.id)).catch(err => logError('Reorder error', err));

    // Persist only actual priority changes
    for (const task of updated) {
      if (task.priority !== originalPriority[task.id]) {
        await updateTaskPriority(task.id, task.priority);
        // Sync back to recurring task if this is a recurring instance
        if (task.recurring_task_id) {
          const { updateRecurringTask } = await import('../db/queries/recurring');
          await updateRecurringTask(task.recurring_task_id, { priority: task.priority });
        }
      }
    }
  },
}));
