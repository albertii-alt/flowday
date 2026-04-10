import { db } from '../schema';

// Serialize all DB writes to prevent database locked errors
let writeQueue: Promise<void> = Promise.resolve();
const enqueueWrite = (fn: () => Promise<void>): Promise<void> => {
  writeQueue = writeQueue.then(fn).catch(() => {});
  return writeQueue;
};

export interface DailyStat {
  date: string;
  total: number;
  completed: number;
  rate: number;
  streakEligible: boolean;
}

export interface Insights {
  mostProductiveDay: string | null;
  averageCompletionRate: number;
  mostConsistentCategory: string | null;
  totalActiveDays: number;
  mostTasksAddedOn: string | null;
}

export interface StatsOverview {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  currentStreak: number;
  bestStreak: number;
  dailyStats: DailyStat[];
  insights: Insights;
}

export const updateDailyStats = async (date: string, total?: number, completed?: number): Promise<void> => {
  return enqueueWrite(async () => {
    let t = total;
    let c = completed;

    if (t === undefined || c === undefined) {
      const tasks = await db.getAllAsync<{ is_completed: number }>(
        'SELECT is_completed FROM tasks WHERE task_date = ?',
        date
      );
      t = tasks.length;
      c = tasks.filter(task => task.is_completed === 1).length;
    }

    const rate = t > 0 ? Math.round((c / t) * 100) : 0;
    const streakEligible = t > 0 && rate >= 80 ? 1 : 0;

    await db.runAsync(
      `INSERT INTO daily_stats (id, date, total_tasks, completed_tasks, completion_rate, streak_eligible, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, date('now'))
       ON CONFLICT(date) DO UPDATE SET
         total_tasks = excluded.total_tasks,
         completed_tasks = excluded.completed_tasks,
         completion_rate = excluded.completion_rate,
         streak_eligible = excluded.streak_eligible,
         updated_at = date('now')`,
      `stat_${date}`, date, t, c, rate, streakEligible
    );
  });
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

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getInsights = async (): Promise<Insights> => {
  // Most productive day of week — highest avg completion rate from daily_stats
  const dayRates = await db.getAllAsync<{ day: number; avg_rate: number }>(
    `SELECT CAST(strftime('%w', date) AS INTEGER) as day,
            AVG(completion_rate) as avg_rate
     FROM daily_stats
     WHERE total_tasks > 0
     GROUP BY day
     ORDER BY avg_rate DESC
     LIMIT 1`
  );
  const mostProductiveDay = dayRates.length > 0 ? DAY_NAMES[dayRates[0].day] : null;

  // Average completion rate across all active days
  const avgRow = await db.getFirstAsync<{ avg_rate: number }>(
    `SELECT AVG(completion_rate) as avg_rate FROM daily_stats WHERE total_tasks > 0`
  );
  const averageCompletionRate = Math.round(avgRow?.avg_rate ?? 0);

  // Most consistent category — category with most completed tasks
  const categoryRow = await db.getFirstAsync<{ category_id: string; count: number }>(
    `SELECT category_id, COUNT(*) as count
     FROM tasks
     WHERE is_completed = 1 AND category_id IS NOT NULL
     GROUP BY category_id
     ORDER BY count DESC
     LIMIT 1`
  );
  const mostConsistentCategory = categoryRow
    ? categoryRow.category_id.replace('cat_', '')
    : null;

  // Total active days — days with at least 1 task
  const activeDaysRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM daily_stats WHERE total_tasks > 0`
  );
  const totalActiveDays = activeDaysRow?.count ?? 0;

  // Day of week most tasks are added on
  const addedDayRow = await db.getFirstAsync<{ day: number; count: number }>(
    `SELECT CAST(strftime('%w', task_date) AS INTEGER) as day, COUNT(*) as count
     FROM tasks
     GROUP BY day
     ORDER BY count DESC
     LIMIT 1`
  );
  const mostTasksAddedOn = addedDayRow ? DAY_NAMES[addedDayRow.day] : null;
  return {
    mostProductiveDay,
    averageCompletionRate,
    mostConsistentCategory,
    totalActiveDays,
    mostTasksAddedOn,
  };
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

  const insights = await getInsights();

  return { totalTasks: total, completedTasks: completed, completionRate, currentStreak, bestStreak, dailyStats, insights };
};
