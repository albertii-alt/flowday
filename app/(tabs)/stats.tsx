import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { useStatsStore } from '../../store/useStatsStore';
import { useTheme } from '../../utils/useTheme';

export default function StatsScreen() {
  const { overview, isLoading, fetchStats } = useStatsStore();
  const { totalTasks, completedTasks, completionRate, currentStreak, bestStreak, dailyStats } = overview;
  const C = useTheme();

  useEffect(() => {
    fetchStats();
  }, []);

  const getRateColor = (rate: number) => {
    if (rate === 100) return C.success;
    if (rate >= 80) return C.accent;
    if (rate >= 50) return C.warning;
    return C.error;
  };

  if (isLoading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.background }]}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchStats} tintColor={C.primary} />}
    >
      <Text style={[styles.title, { color: C.textPrimary }]}>Statistics</Text>

      {totalTasks === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: C.surface }]}>
          <Text style={styles.emptyEmoji}>📝</Text>
          <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>No tasks yet</Text>
          <Text style={[styles.emptyText, { color: C.textSecondary }]}>Add your first task from the Today tab</Text>
        </View>
      ) : (
        <>
          <View style={styles.streakRow}>
            <View style={[styles.streakCard, { backgroundColor: C.surface }]}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={[styles.streakValue, { color: C.textPrimary }]}>{currentStreak}</Text>
              <Text style={[styles.streakLabel, { color: C.textSecondary }]}>Current Streak</Text>
            </View>
            <View style={[styles.streakCard, { backgroundColor: C.surface }]}>
              <Text style={styles.streakEmoji}>🏆</Text>
              <Text style={[styles.streakValue, { color: C.textPrimary }]}>{bestStreak}</Text>
              <Text style={[styles.streakLabel, { color: C.textSecondary }]}>Best Streak</Text>
            </View>
          </View>

          <View style={[styles.overallCard, { backgroundColor: C.surface }]}>
            <Text style={[styles.overallLabel, { color: C.textSecondary }]}>Overall Completion</Text>
            <Text style={[styles.overallRate, { color: getRateColor(completionRate) }]}>{completionRate}%</Text>
            <View style={[styles.bar, { backgroundColor: C.border }]}>
              <View style={[styles.barFill, { width: `${completionRate}%`, backgroundColor: getRateColor(completionRate) }]} />
            </View>
            <Text style={[styles.overallText, { color: C.textSecondary }]}>{completedTasks} of {totalTasks} tasks done</Text>
          </View>

          <View style={[styles.dailyCard, { backgroundColor: C.surface }]}>
            <Text style={[styles.dailyTitle, { color: C.textPrimary }]}>Daily Breakdown</Text>
            {dailyStats.map((day, i) => (
              <View key={i} style={styles.dayItem}>
                <Text style={[styles.dayDate, { color: C.textSecondary }]}>{day.date}</Text>
                <View style={[styles.dayBarContainer, { backgroundColor: C.border }]}>
                  <View style={[styles.dayBar, { width: `${day.rate}%`, backgroundColor: getRateColor(day.rate) }]} />
                </View>
                <Text style={[styles.dayRate, { color: getRateColor(day.rate) }]}>{day.rate}%</Text>
                {day.streakEligible && <Text style={styles.streakDot}>🔥</Text>}
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '700', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  emptyCard: { margin: 20, padding: 40, borderRadius: 24, alignItems: 'center' },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  streakRow: { flexDirection: 'row', marginHorizontal: 20, gap: 12, marginBottom: 4 },
  streakCard: { flex: 1, borderRadius: 20, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  streakEmoji: { fontSize: 32, marginBottom: 8 },
  streakValue: { fontSize: 36, fontWeight: '800' },
  streakLabel: { fontSize: 12, marginTop: 4 },
  overallCard: { margin: 20, padding: 24, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  overallLabel: { fontSize: 14, marginBottom: 8 },
  overallRate: { fontSize: 56, fontWeight: '800', marginBottom: 16 },
  bar: { width: '100%', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 12 },
  barFill: { height: '100%', borderRadius: 5 },
  overallText: { fontSize: 14 },
  dailyCard: { margin: 20, padding: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  dailyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  dayItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dayDate: { width: 90, fontSize: 12 },
  dayBarContainer: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden', marginHorizontal: 8 },
  dayBar: { height: '100%', borderRadius: 4 },
  dayRate: { width: 38, fontSize: 12, fontWeight: '600', textAlign: 'right' },
  streakDot: { fontSize: 14, marginLeft: 6 },
});
