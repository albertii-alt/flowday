import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAllRecurringTasks, deleteRecurringTask, RecurringTask } from '../../db/queries/recurring';
import GradientHeader from '../../components/GradientHeader';
import { useTheme } from '../../utils/useTheme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CATEGORY_COLORS: Record<string, string> = {
  cat_personal: '#4f46e5',
  cat_school:   '#06b6d4',
  cat_work:     '#f59e0b',
  cat_health:   '#10b981',
  cat_errands:  '#ef4444',
};

export default function RecurringScreen() {
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [allSelected, setAllSelected] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const C = useTheme();
  const { bottom } = useSafeAreaInsets();

  const loadTasks = useCallback(async () => {
    const tasks = await getAllRecurringTasks();
    setRecurringTasks(tasks);
  }, []);

  useFocusEffect(useCallback(() => { loadTasks(); }, [loadTasks]));

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
      setAllSelected(false);
    } else {
      setSelectedIds(new Set(recurringTasks.map(t => t.id)));
      setAllSelected(true);
    }
  }, [allSelected, recurringTasks]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      setAllSelected(next.size === recurringTasks.length);
      return next;
    });
  }, [recurringTasks]);

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
            setSelectedIds(prev => { const n = new Set(prev); n.delete(task.id); return n; });
            loadTasks();
          },
        },
      ]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      'Delete Selected',
      `Delete ${selectedIds.size} recurring task${selectedIds.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Promise.all([...selectedIds].map(id => deleteRecurringTask(id)));
            setSelectedIds(new Set());
            setAllSelected(false);
            loadTasks();
          },
        },
      ]
    );
  };

  const getFrequencyLabel = (task: RecurringTask): string => {
    if (task.frequency === 'daily') return 'Every day';
    if (task.frequency === 'weekly' && task.days_of_week) {
      const dayNames = task.days_of_week.split(',').map(d => DAYS[Number(d)]).join(', ');
      return `Every ${dayNames}`;
    }
    return 'Weekly';
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return C.error;
    if (priority === 'medium') return C.warning;
    return C.success;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={[]}>
      <GradientHeader
        title="Recurring Tasks"
        subtitle="Tasks that repeat automatically"
        compact
        onBack={() => router.back()}
        rightIcon={<Ionicons name={allSelected ? 'checkmark-done' : 'checkmark-done-outline'} size={18} color="#fff" />}
        onRightAction={toggleSelectAll}
      />

      {selectedIds.size > 0 && (
        <TouchableOpacity
          style={[styles.deleteBar, { backgroundColor: C.error }]}
          onPress={handleDeleteSelected}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.deleteBarText}>Delete {selectedIds.size} selected</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={recurringTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottom + 4 + 64 + 16 }]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: C.surface }, selectedIds.has(item.id) && { borderWidth: 1.5, borderColor: C.primary }]}
            onPress={() => toggleSelect(item.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.selectionDot, { borderColor: C.primary }, selectedIds.has(item.id) && { backgroundColor: C.primary }]}>
              {selectedIds.has(item.id) && <Ionicons name="checkmark" size={11} color="#fff" />}
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.taskTitle, { color: C.textPrimary }]}>{item.title}</Text>
              <View style={styles.meta}>
                {item.category_id && (
                  <Text style={[styles.metaText, { color: CATEGORY_COLORS[item.category_id] ?? C.textSecondary }]}>
                    {item.category_id.replace('cat_', '')}
                  </Text>
                )}
                {item.due_time && (
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={10} color={C.textSecondary} />
                    <Text style={[styles.metaText, { color: C.textSecondary }]}> {item.due_time}</Text>
                  </View>
                )}
                <View style={styles.metaRow}>
                  <Ionicons name="repeat" size={10} color={C.primary} />
                  <Text style={[styles.metaText, { color: C.primary }]}> {getFrequencyLabel(item)}</Text>
                </View>
              </View>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>{item.priority}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color={C.error} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push({
                pathname: '/task/edit-recurring',
                params: {
                  id: item.id,
                  title: item.title,
                  description: item.description || '',
                  category_id: item.category_id || 'cat_personal',
                  priority: item.priority,
                  due_time: item.due_time || '',
                  frequency: item.frequency,
                  days_of_week: item.days_of_week || '',
                },
              })}
              style={styles.editBtn}
            >
              <Ionicons name="pencil-outline" size={18} color={C.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="repeat" size={56} color={C.textMuted} style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>No recurring tasks</Text>
            <Text style={[styles.emptyText, { color: C.textMuted }]}>
              Add a task and set it to repeat daily or weekly
            </Text>
          </View>
        )}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: C.primary, bottom: bottom + 4 + 64 + 8, right: 24 }]}
        onPress={() => router.push('/task/create')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingTop: 4, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 3, padding: 11, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardContent: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '500', marginBottom: 2, letterSpacing: 0.1 },
  meta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 10 },
  recurringBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  recurringText: { fontSize: 10, fontWeight: '600', flexShrink: 1 },
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginRight: 2 },
  priorityText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize', letterSpacing: 0.3 },
  selectionDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { padding: 8, marginLeft: 4, alignSelf: 'center' },
  deleteBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 8, marginBottom: 4, padding: 10, borderRadius: 10 },
  deleteBarText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  editBtn: { padding: 8, marginLeft: 4, alignSelf: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  fab: { position: 'absolute', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
});
