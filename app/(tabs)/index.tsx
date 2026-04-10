import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { useStatsStore } from '../../store/useStatsStore';
import { useTheme } from '../../utils/useTheme';
import GradientHeader from '../../components/GradientHeader';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { format } from 'date-fns';

const TODAY = format(new Date(), 'yyyy-MM-dd');

export default function TodayScreen() {
  const { todayTasks, fetchTodayTasks, toggleTask, removeTask, isLoading } = useTaskStore();
  const { overview, fetchStats } = useStatsStore();
  const C = useTheme();
  const confettiRef = useRef<ConfettiCannon>(null);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);

  useEffect(() => {
    fetchTodayTasks(TODAY);
    fetchStats();
  }, []);

  const completedCount = todayTasks.filter(t => t.is_completed === 1).length;
  const totalCount = todayTasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return C.error;
      case 'medium': return C.warning;
      default: return C.success;
    }
  };

  const handleToggle = (id: string, currentStatus: number, taskDate: string) => {
    const completing = currentStatus === 0;
    if (completing) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Predict progress before DB call — fire confetti instantly
    const newCompletedCount = completing ? completedCount + 1 : completedCount - 1;
    const newProgress = totalCount > 0 ? (newCompletedCount / totalCount) * 100 : 0;
    if (newProgress === 100 && totalCount > 0 && !hasShownConfetti) {
      setHasShownConfetti(true);
      confettiRef.current?.start();
    }
    if (newProgress < 100) setHasShownConfetti(false);

    // Fire and forget — UI already updated optimistically
    toggleTask(id, currentStatus === 1, taskDate);
  };

  const handleDelete = (id: string, taskDate: string, title: string) => {
    Alert.alert('Delete Task', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeTask(id, taskDate),
      },
    ]);
  };

  const getStreakMessage = () => {
    const { currentStreak } = overview;
    if (currentStreak === 0) return 'Start your streak today!';
    if (currentStreak === 1) return '1 day streak — keep going!';
    return `${currentStreak} day streak — on fire!`;
  };

  const renderTask = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.taskCard, { backgroundColor: C.surface }]}
      onLongPress={() => handleDelete(item.id, item.task_date, item.title)}
      activeOpacity={0.7}
    >
      <TouchableOpacity
        style={[styles.checkbox, { borderColor: C.primary }, item.is_completed === 1 && { backgroundColor: C.primary, borderColor: C.primary }]}
        onPress={(e) => { e.stopPropagation(); handleToggle(item.id, item.is_completed, item.task_date); }}
      >
        {item.is_completed === 1 && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>

      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, { color: C.textPrimary }, item.is_completed === 1 && { textDecorationLine: 'line-through', color: C.textMuted }]}>
          {item.title}{item.recurring_task_id ? ' 🔁' : ''}
        </Text>
        <View style={styles.taskMeta}>
          {item.category_id && (
            <Text style={[styles.metaText, { color: C.textSecondary }]}>{item.category_id.replace('cat_', '')}</Text>
          )}
          {item.due_time && <Text style={[styles.metaText, { color: C.textSecondary }]}>🕐 {item.due_time}</Text>}
        </View>
      </View>

      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
        <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
          {item.priority}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => router.push({
          pathname: '/task/edit',
          params: {
            id: item.id,
            title: item.title,
            description: item.description || '',
            category_id: item.category_id,
            priority: item.priority,
            due_time: item.due_time || '',
            task_date: item.task_date,
          },
        })}
      >
        <Text style={styles.editButtonText}>✏️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={['top']}>
      <GradientHeader title={getGreeting()} subtitle={format(new Date(), 'EEEE, MMMM d')} />

      <View style={[styles.streakCard, { backgroundColor: C.streakBg }]}>
        <Text style={styles.streakIcon}>🔥</Text>
        <View>
          <Text style={[styles.streakText, { color: C.streakText }]}>{getStreakMessage()}</Text>
          {overview.bestStreak > 0 && (
            <Text style={[styles.streakBest, { color: C.streakText }]}>Best: {overview.bestStreak} days</Text>
          )}
        </View>
      </View>

      <View style={[styles.progressCard, { backgroundColor: C.surface }]}>
        <View style={[styles.progressRing, { backgroundColor: C.primary }]}>
          <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
        </View>
        <Text style={[styles.progressStats, { color: C.textPrimary }]}>
          {completedCount} of {todayTasks.length} tasks completed
        </Text>
        {progress === 100 && totalCount > 0 && (
          <Text style={[styles.motivationText, { color: C.textSecondary }]}>🎉 Amazing day! You crushed it!</Text>
        )}
        {progress > 0 && progress < 100 && (
          <Text style={[styles.motivationText, { color: C.textSecondary }]}>{totalCount - completedCount} more to go!</Text>
        )}
        {totalCount === 0 && (
          <Text style={[styles.motivationText, { color: C.textSecondary }]}>✨ Add your first task to start</Text>
        )}
      </View>

      <View style={styles.listHeader}>
        <Text style={[styles.listTitle, { color: C.textPrimary }]}>Today's Tasks</Text>
        <Text style={[styles.taskCount, { color: C.textSecondary }]}>{totalCount} tasks</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={todayTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>No tasks for today</Text>
              <Text style={[styles.emptyText, { color: C.textMuted }]}>Tap the + button to add your first task</Text>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={[styles.fab, { backgroundColor: C.primary }]} onPress={() => router.push('/task/create')} activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <ConfettiCannon
        ref={confettiRef}
        count={120}
        origin={{ x: Dimensions.get('window').width / 2, y: -20 }}
        autoStart={false}
        fadeOut
        fallSpeed={3000}
        explosionSpeed={350}
        colors={['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#fff']}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  streakCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 16, padding: 12, borderRadius: 16 },
  streakIcon: { fontSize: 24, marginRight: 12 },
  streakText: { fontSize: 14, fontWeight: '600' },
  streakBest: { fontSize: 12, marginTop: 2, opacity: 0.8 },
  progressCard: { margin: 20, padding: 24, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  progressRing: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  progressPercent: { fontSize: 32, fontWeight: '800', color: '#fff' },
  progressStats: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  motivationText: { fontSize: 14 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  listTitle: { fontSize: 20, fontWeight: '600' },
  taskCount: { fontSize: 14 },
  listContent: { paddingBottom: 100 },
  centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  taskCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 6, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  taskMeta: { flexDirection: 'row', gap: 12 },
  metaText: { fontSize: 12 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  priorityText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  editButton: { padding: 8, marginLeft: 4 },
  editButtonText: { fontSize: 18 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  fabText: { fontSize: 28, color: '#fff', fontWeight: '600' },
});
