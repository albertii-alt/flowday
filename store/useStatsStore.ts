import { create } from 'zustand';
import { getStatsOverview, StatsOverview, Insights } from '../db/queries/stats';

interface StatsStore {
  overview: StatsOverview;
  isLoading: boolean;
  fetchStats: () => Promise<void>;
}

const defaultInsights: Insights = {
  mostProductiveDay: null,
  averageCompletionRate: 0,
  mostConsistentCategory: null,
  totalActiveDays: 0,
  mostTasksAddedOn: null,
};

const defaultOverview: StatsOverview = {
  totalTasks: 0,
  completedTasks: 0,
  completionRate: 0,
  currentStreak: 0,
  bestStreak: 0,
  dailyStats: [],
  insights: defaultInsights,
};

export const useStatsStore = create<StatsStore>((set) => ({
  overview: defaultOverview,
  isLoading: false,

  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const overview = await getStatsOverview();
      set({ overview, isLoading: false });
    } catch (error) {
      console.error('Stats fetch error:', error);
      set({ isLoading: false });
    }
  },
}));
