import { db } from '../schema';

export interface DailyStat {
  date: string;
  total: number;
  completed: number;
  rate: number;
  streakEligible: boolean;
}

export interface StatsOverview {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  currentStreak: number;
  bestStreak: number;
  dailyStats: DailyStat[];
}

// Upsert daily stats for a given date — called after every task mutation
export const updateDailyStats = async (date: string): Promise<void> => {
  const tasks = await db.getAllAsync<{ is_completed: number }>(
    'SELECT is_completed FROM tasks WHERE task_date = ?',
    date
  );

  const total = tasks.length;
  const completed = tasks.filter(t => t.is_completed === 1).length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const streakEligible = total > 0 && rate >= 80 ? 1 : 0;

  await db.runAsync(
    `INSERT INTO daily_stats (id, date, total_tasks, completed_tasks, completion_rate, streak_eligible, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, date('now'))
     ON CONFLICT(date) DO UPDATE SET
       total_tasks = excluded.total_tasks,
       completed_tasks = excluded.completed_tasks,
       completion_rate = excluded.completion_rate,
       streak_eligible = excluded.streak_eligible,
       updated_at = date('now')`,
    `stat_${date}`,
    date,
    total,
    completed,
    rate,
    streakEligible
  );
};

// Calculate current streak and best streak from daily_stats
const calculateStreaks = (rows: { date: string; streak_eligible: number }[]) => {
  // Sort descending
  const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  // Current streak: count consecutive eligible days from today backwards
  const today = new Date().toISOString().split('T')[0];
  let expectedDate = today;

  for (const row of sorted) {
    if (row.date !== expectedDate) break;
    if (row.streak_eligible !== 1) break;
    currentStreak++;
    const d = new Date(expectedDate);
    d.setDate(d.getDate() - 1);
    expectedDate = d.toISOString().split('T')[0];
  }

  // Best streak: scan all rows
  for (const row of sorted) {
    if (row.streak_eligible === 1) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  return { currentStreak, bestStreak };
};

export const getStatsOverview = async (): Promise<StatsOverview> => {
  const [totalRow] = await db.getAllAsync<{ total: number; completed: number }>(
    `SELECT COUNT(*) as total, SUM(is_completed) as completed FROM tasks`
  );

  const total = totalRow?.total ?? 0;
  const completed = totalRow?.completed ?? 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const dailyRows = await db.getAllAsync<{
    date: string;
    total_tasks: number;
    completed_tasks: number;
    completion_rate: number;
    streak_eligible: number;
  }>(
    `SELECT date, total_tasks, completed_tasks, completion_rate, streak_eligible
     FROM daily_stats
     ORDER BY date DESC
     LIMIT 30`
  );

  const { currentStreak, bestStreak } = calculateStreaks(dailyRows);

  const dailyStats: DailyStat[] = dailyRows.map(r => ({
    date: r.date,
    total: r.total_tasks,
    completed: r.completed_tasks,
    rate: r.completion_rate,
    streakEligible: r.streak_eligible === 1,
  }));

  return { totalTasks: total, completedTasks: completed, completionRate, currentStreak, bestStreak, dailyStats };
};
