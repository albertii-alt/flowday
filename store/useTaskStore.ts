import { create } from 'zustand';
import { getTasksByDate, addTask, toggleTaskCompletion, deleteTask, Task, CreateTaskInput } from '../db/queries/tasks';

interface TaskStore {
  todayTasks: Task[];
  isLoading: boolean;
  fetchTodayTasks: (date: string) => Promise<void>;
  addNewTask: (task: CreateTaskInput) => Promise<string>;
  toggleTask: (id: string, currentStatus: boolean, taskDate: string) => Promise<void>;
  removeTask: (id: string, taskDate: string) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  todayTasks: [],
  isLoading: false,
  
  fetchTodayTasks: async (date: string) => {
    set({ isLoading: true });
    try {
      const tasks = await getTasksByDate(date);
      set({ todayTasks: tasks, isLoading: false });
    } catch (error) {
      console.error('Fetch error:', error);
      set({ isLoading: false });
    }
  },
  
  addNewTask: async (task: CreateTaskInput) => {
    const id = await addTask(task);
    await get().fetchTodayTasks(task.task_date);
    return id;
  },
  
  toggleTask: async (id: string, currentStatus: boolean, taskDate: string) => {
    try {
      await toggleTaskCompletion(id, !currentStatus);
      await get().fetchTodayTasks(taskDate);
    } catch (error) {
      console.error('Toggle error:', error);
    }
  },
  
  removeTask: async (id: string, taskDate: string) => {
    try {
      await deleteTask(id);
      await get().fetchTodayTasks(taskDate);
    } catch (error) {
      console.error('Delete error:', error);
    }
  },
}));