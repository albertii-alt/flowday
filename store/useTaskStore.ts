import { create } from 'zustand';
import { getTasksByDate, addTask, updateTask, updateTaskOrder, toggleTaskCompletion, deleteTask, Task, CreateTaskInput } from '../db/queries/tasks';
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
}

const pendingToggles = new Set<string>();

const logError = (context: string, error: unknown) => {
  console.error(`${context}:`, error instanceof Error ? error.message : 'Unknown error');
};

export const useTaskStore = create<TaskStore>((set, get) => ({
  todayTasks: [],
  isLoading: false,

  fetchTodayTasks: async (date: string) => {
    set({ isLoading: true });
    try {
      await generateRecurringTasksForDate(date);
      const tasks = await getTasksByDate(date);
      set({ todayTasks: tasks, isLoading: false });
    } catch (error) {
      logError('Fetch error', error);
      set({ isLoading: false });
    }
  },

  refreshTodayTasks: async (date: string) => {
    try {
      const tasks = await getTasksByDate(date);
      set({ todayTasks: tasks });
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
    const { todayTasks } = get();
    if (todayTasks.length > 0 && todayTasks[0]?.task_date) {
      const date = todayTasks[0].task_date;
      await get().fetchTodayTasks(date);
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
}));
