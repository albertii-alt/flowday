import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';

interface DailyStat {
  date: string;
  total: number;
  completed: number;
  rate: number;
}

export default function StatsScreen() {
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const db = SQLite.openDatabaseSync('flowday.db');
      
      // Get all tasks
      const tasks = await db.getAllAsync('SELECT * FROM tasks') as any[];
      
      setTotalTasks(tasks.length);
      const completed = tasks.filter((t: any) => t.is_completed === 1).length;
      setCompletedTasks(completed);
      const rate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
      setCompletionRate(rate);
      
      // Group by date
      const dateMap = new Map<string, { total: number; completed: number }>();
      
      for (const task of tasks) {
        if (!dateMap.has(task.task_date)) {
          dateMap.set(task.task_date, { total: 0, completed: 0 });
        }
        const day = dateMap.get(task.task_date)!;
        day.total++;
        if (task.is_completed === 1) day.completed++;
      }
      
      // Convert to array and sort
      const dailyStats: DailyStat[] = Array.from(dateMap.entries())
        .map(([date, data]) => ({
          date,
          total: data.total,
          completed: data.completed,
          rate: Math.round((data.completed / data.total) * 100)
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setStats(dailyStats);
      
      // Calculate current streak
      let streak = 0;
      let checkDate = new Date();
      
      for (let i = 0; i < 30; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const dayStat = dailyStats.find(d => d.date === dateStr);
        
        if (dayStat && dayStat.rate >= 80) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (dayStat && dayStat.rate < 80) {
          break;
        } else {
          // No tasks on this day - break streak
          break;
        }
      }
      
      setCurrentStreak(streak);
      
    } catch (error) {
      console.error('Stats error:', error);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const getRateColor = (rate: number) => {
    if (rate === 100) return '#10b981';
    if (rate >= 80) return '#06b6d4';
    if (rate >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />}
    >
      <Text style={styles.title}>Statistics</Text>
      
      {/* Streak Card */}
      <View style={styles.streakCard}>
        <Text style={styles.streakEmoji}>🔥</Text>
        <Text style={styles.streakNumber}>{currentStreak}</Text>
        <Text style={styles.streakLabel}>Current Streak</Text>
        <Text style={styles.streakSubtext}>80%+ completion rate</Text>
      </View>
      
      {/* Overall Stats */}
      <View style={styles.overallCard}>
        <Text style={styles.overallLabel}>Overall Completion</Text>
        <Text style={styles.overallRate}>{completionRate}%</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${completionRate}%`, backgroundColor: getRateColor(completionRate) }]} />
        </View>
        <Text style={styles.overallText}>
          {completedTasks} of {totalTasks} tasks completed
        </Text>
      </View>
      
      {/* Daily Breakdown */}
      <View style={styles.dailyCard}>
        <Text style={styles.dailyTitle}>Daily Breakdown</Text>
        {stats.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>Add some tasks to see your stats!</Text>
          </View>
        ) : (
          stats.map((day, index) => (
            <View key={index} style={styles.dayItem}>
              <Text style={styles.dayDate}>{getDayLabel(day.date)}</Text>
              <View style={styles.dayBarContainer}>
                <View style={[styles.dayBar, { width: `${day.rate}%`, backgroundColor: getRateColor(day.rate) }]} />
              </View>
              <Text style={styles.dayRate}>{day.rate}%</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  streakCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    backgroundColor: '#fef3c7',
    borderRadius: 24,
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#d97706',
  },
  streakLabel: {
    fontSize: 16,
    color: '#92400e',
    marginTop: 4,
  },
  streakSubtext: {
    fontSize: 12,
    color: '#b45309',
    marginTop: 4,
  },
  overallCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
  },
  overallLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  overallRate: {
    fontSize: 48,
    fontWeight: '800',
    color: '#4f46e5',
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  overallText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  dailyCard: {
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
  },
  dailyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  dayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayDate: {
    width: 95,
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  dayBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 12,
  },
  dayBar: {
    height: '100%',
    borderRadius: 4,
  },
  dayRate: {
    width: 45,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
});