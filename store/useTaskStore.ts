import { create } from 'zustand';
import { getTasksByDate, addTask, updateTask, toggleTaskCompletion, deleteTask, Task, CreateTaskInput } from '../db/queries/tasks';
import { updateDailyStats } from '../db/queries/stats';
import { generateRecurringTasksForDate } from '../db/queries/recurring';

interface TaskStore {
  todayTasks: Task[];
  isLoading: boolean;
  fetchTodayTasks: (date: string) => Promise<void>;
  addNewTask: (task: CreateTaskInput) => Promise<string>;
  updateExistingTask: (id: string, updates: Partial<Task>) => Promise<void>;
  toggleTask: (id: string, currentStatus: boolean, taskDate: string) => Promise<void>;
  removeTask: (id: string, taskDate: string) => Promise<void>;
}

const pendingToggles = new Set<string>();

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
      console.error('Fetch error:', error);
      set({ isLoading: false });
    }
  },

  addNewTask: async (task: CreateTaskInput) => {
    const id = await addTask(task);
    await updateDailyStats(task.task_date);
    await get().fetchTodayTasks(task.task_date);
    return id;
  },

  updateExistingTask: async (id: string, updates: Partial<Task>) => {
    await updateTask(id, updates);
    const { todayTasks } = get();
    if (todayTasks.length > 0 && todayTasks[0]?.task_date) {
      const date = todayTasks[0].task_date;
      await updateDailyStats(date);
      await get().fetchTodayTasks(date);
    }
  },

  toggleTask: async (id: string, currentStatus: boolean, taskDate: string) => {
    if (pendingToggles.has(id)) return;
    pendingToggles.add(id);

    // Optimistic UI update
    set(state => ({
      todayTasks: state.todayTasks.map(task =>
        task.id === id ? { ...task, is_completed: task.is_completed === 1 ? 0 : 1 } : task
      ),
    }));

    try {
      await toggleTaskCompletion(id, !currentStatus);
      await updateDailyStats(taskDate);
    } catch (error) {
      console.error('Toggle error:', error instanceof Error ? error.message : 'Unknown error');
      // Revert on failure
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
      await updateDailyStats(taskDate);
      await get().fetchTodayTasks(taskDate);
    } catch (error) {
      console.error('Delete error:', error);
    }
  },
}));
