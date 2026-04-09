import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { getAllRecurringTasks, deleteRecurringTask, RecurringTask } from '../../db/queries/recurring';
import GradientHeader from '../../components/GradientHeader';
import { useTheme } from '../../utils/useTheme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function RecurringScreen() {
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const C = useTheme();

  const loadTasks = useCallback(async () => {
    const tasks = await getAllRecurringTasks();
    setRecurringTasks(tasks);
  }, []);

  useFocusEffect(useCallback(() => { loadTasks(); }, [loadTasks]));

  const handleDelete = (task: RecurringTask) => {
    Alert.alert(
      'Delete Recurring Task',
      `"${task.title}" will no longer repeat. Already generated tasks for today are not affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteRecurringTask(task.id);
            loadTasks();
          },
        },
      ]
    );
  };

  const getFrequencyLabel = (task: RecurringTask): string => {
    if (task.frequency === 'daily') return '🔁 Every day';
    if (task.frequency === 'weekly' && task.days_of_week) {
      const dayNames = task.days_of_week.split(',').map(d => DAYS[Number(d)]).join(', ');
      return `🔁 Every ${dayNames}`;
    }
    return '🔁 Weekly';
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return C.error;
    if (priority === 'medium') return C.warning;
    return C.success;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={['top']}>
      <GradientHeader title="Recurring Tasks" subtitle="Tasks that repeat automatically" />

      <FlatList
        data={recurringTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: C.surface }]}>
            <View style={styles.cardContent}>
              <View style={styles.cardTop}>
                <Text style={[styles.taskTitle, { color: C.textPrimary }]}>{item.title}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                  <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                    {item.priority}
                  </Text>
                </View>
              </View>
              {item.description && (
                <Text style={[styles.description, { color: C.textSecondary }]}>{item.description}</Text>
              )}
              <Text style={[styles.frequency, { color: C.primary }]}>{getFrequencyLabel(item)}</Text>
              {item.category_id && (
                <Text style={[styles.category, { color: C.textMuted }]}>{item.category_id.replace('cat_', '')}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔁</Text>
            <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>No recurring tasks</Text>
            <Text style={[styles.emptyText, { color: C.textMuted }]}>
              Add a task and set it to repeat daily or weekly
            </Text>
          </View>
        )}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: C.primary }]}
        onPress={() => router.push('/task/create')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardContent: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  taskTitle: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  priorityText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  description: { fontSize: 13, marginBottom: 4 },
  frequency: { fontSize: 13, fontWeight: '500', marginBottom: 2 },
  category: { fontSize: 12, textTransform: 'capitalize' },
  deleteBtn: { padding: 8, marginLeft: 8 },
  deleteIcon: { fontSize: 20 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  fabText: { fontSize: 28, color: '#fff', fontWeight: '600' },
});
