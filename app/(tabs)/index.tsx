import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../../store/useTaskStore';
import { useStatsStore } from '../../store/useStatsStore';
import { useTheme } from '../../utils/useTheme';
import GradientHeader from '../../components/GradientHeader';
import ConfettiOverlay from '../../components/ConfettiOverlay';
import ProgressDonut from '../../components/ProgressDonut';
import TaskItem from '../../components/TaskItem';
import ConfettiCannon from 'react-native-confetti-cannon';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { Task } from '../../db/queries/tasks';

const TODAY = format(new Date(), 'yyyy-MM-dd');

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};
export default function TodayScreen() {
  // Selective subscriptions — only re-render when these specific values change
  const todayTasks = useTaskStore(s => s.todayTasks);
  const isLoading = useTaskStore(s => s.isLoading);
  const fetchTodayTasks = useTaskStore(s => s.fetchTodayTasks);
  const toggleTask = useTaskStore(s => s.toggleTask);
  const removeTask = useTaskStore(s => s.removeTask);
  const reorderTasks = useTaskStore(s => s.reorderTasks);
  const reorderWithPriority = useTaskStore(s => s.reorderWithPriority);

  const currentStreak = useStatsStore(s => s.overview.currentStreak);
  const bestStreak = useStatsStore(s => s.overview.bestStreak);
  const fetchStats = useStatsStore(s => s.fetchStats);

  const C = useTheme();
  const { bottom } = useSafeAreaInsets();
  const confettiRef = useRef<ConfettiCannon>(null);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);

  useEffect(() => {
    fetchTodayTasks(TODAY);
    fetchStats();
  }, []);

  const { completedCount, totalCount, progress } = useMemo(() => {
    const completed = todayTasks.filter(t => t.is_completed === 1).length;
    const total = todayTasks.length;
    return { completedCount: completed, totalCount: total, progress: total > 0 ? (completed / total) * 100 : 0 };
  }, [todayTasks]);

  const streakMessage = useMemo(() => {
    if (currentStreak === 0) return 'Start your streak today!';
    if (currentStreak === 1) return '1 day streak — keep going!';
    return `${currentStreak} day streak — on fire!`;
  }, [currentStreak]);

  const greeting = useMemo(() => getGreeting(), []);
  const dateLabel = useMemo(() => format(new Date(), 'EEEE, MMMM d'), []);

  const handleToggle = useCallback((id: string, currentStatus: number, taskDate: string) => {
    const completing = currentStatus === 0;
    if (completing) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newCompleted = completing ? completedCount + 1 : completedCount - 1;
    const newProgress = totalCount > 0 ? (newCompleted / totalCount) * 100 : 0;

    if (newProgress === 100 && totalCount > 0 && !hasShownConfetti) {
      setHasShownConfetti(true);
      // Delay confetti until donut animation finishes (700ms)
      setTimeout(() => confettiRef.current?.start(), 750);
    }
    if (newProgress < 100) setHasShownConfetti(false);

    toggleTask(id, currentStatus === 1, taskDate);
  }, [completedCount, totalCount, hasShownConfetti, toggleTask]);

  const handleDelete = useCallback((id: string, taskDate: string, title: string, recurringTaskId?: string) => {
    Alert.alert('Delete Task', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (recurringTaskId) {
              const { deleteRecurringTask } = await import('../../db/queries/recurring');
              await deleteRecurringTask(recurringTaskId);
            }
            await removeTask(id, taskDate);
            fetchStats();
          } catch {
            Alert.alert('Error', 'Could not delete task');
          }
        },
      },
    ]);
  }, [removeTask, fetchStats]);

  const handleDragEnd = useCallback(({ data }: { data: Task[] }) => {
    reorderWithPriority(data);
  }, [reorderWithPriority]);

  const renderTask = useCallback(({ item, drag, isActive }: RenderItemParams<Task>) => (
    <TaskItem
      item={item}
      drag={drag}
      isActive={isActive}
      onToggle={handleToggle}
      onDelete={handleDelete}
      C={C}
    />
  ), [handleToggle, handleDelete, C]);

  const keyExtractor = useCallback((item: Task) => item.id, []);

  const ListEmpty = useMemo(() => (
    <View style={styles.emptyState}>
      <Ionicons name="clipboard-outline" size={48} color={C.textMuted} style={{ marginBottom: 16 }} />
      <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>No tasks for today</Text>
      <Text style={[styles.emptyText, { color: C.textMuted }]}>Tap + to add your first task</Text>
    </View>
  ), [C.textPrimary, C.textMuted]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={[]}>
      <GradientHeader title={greeting} subtitle={dateLabel} />

      <View style={[styles.streakCard, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Ionicons name="flame" size={18} color={C.warning} style={{ marginRight: 10 }} />
        <View>
          <Text style={[styles.streakText, { color: C.textPrimary }]}>{streakMessage}</Text>
          {bestStreak > 0 && (
            <Text style={[styles.streakBest, { color: C.textSecondary }]}>Best: {bestStreak} days</Text>
          )}
        </View>
      </View>

      <View style={[styles.progressCard, { backgroundColor: C.surface }]}>
        <ProgressDonut
          progress={progress}
          size={160}
          strokeWidth={12}
          color={C.primary}
          trackColor={C.border}
          textColor={C.textPrimary}
          glowColor={C.donutGlow}
          completedCount={completedCount}
          totalCount={totalCount}
          subtitleColor={C.textSecondary}
        />
        {progress === 100 && totalCount > 0 && (
          <Text style={[styles.motivationText, { color: C.success }]}>All done. Excellent.</Text>
        )}
        {progress > 0 && progress < 100 && (
          <Text style={[styles.motivationText, { color: C.textSecondary }]}>{totalCount - completedCount} remaining</Text>
        )}
        {totalCount === 0 && (
          <Text style={[styles.motivationText, { color: C.textMuted }]}>Add a task to begin</Text>
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
        <View style={{ flex: 1 }}>
          <DraggableFlatList
            data={todayTasks}
            keyExtractor={keyExtractor}
            renderItem={renderTask}
            onDragEnd={handleDragEnd}
            contentContainerStyle={[styles.listContent, { paddingBottom: bottom + 4 + 64 + 16 }]}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews
            ListEmptyComponent={ListEmpty}
          />
        </View>
      )}

      <TouchableOpacity style={[styles.fab, { backgroundColor: C.primary, bottom: bottom + 4 + 64 + 8, right: 32 }]} onPress={() => router.push('/task/create')} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <ConfettiOverlay ref={confettiRef} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Streak — glass card, no heavy border
  streakCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 10, padding: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  streakText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.1 },
  streakBest: { fontSize: 11, marginTop: 1, opacity: 0.6 },
  progressCard: { alignItems: 'center', marginHorizontal: 16, marginTop: 10, marginBottom: 2, padding: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 3 },
  motivationText: { fontSize: 12, letterSpacing: 0.1, marginTop: 10, fontWeight: '500' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  listTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },
  taskCount: { fontSize: 11, fontWeight: '500' },
  listContent: { paddingHorizontal: 4, paddingBottom: 160 },
  centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  taskCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 3, padding: 11, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4, letterSpacing: -0.2 },
  emptyText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  fab: { position: 'absolute', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  fabText: { fontSize: 24, color: '#fff', fontWeight: '400', lineHeight: 28 },
});
