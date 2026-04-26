import { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScaleDecorator } from 'react-native-draggable-flatlist';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Task } from '../db/queries/tasks';
import { Theme } from '../constants/colors';
import IconButton from './IconButton';

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CATEGORY_COLORS: Record<string, string> = {
  cat_personal: '#4f46e5',
  cat_school:   '#06b6d4',
  cat_work:     '#f59e0b',
  cat_health:   '#10b981',
  cat_errands:  '#ef4444',
};

const getRecurringLabel = (frequency?: string, daysOfWeek?: string): string | null => {
  if (!frequency) return null;
  if (frequency === 'daily') return 'Daily';
  if (frequency === 'weekly' && daysOfWeek) {
    return daysOfWeek.split(',').map(d => DAY_SHORT[Number(d)]).join(', ');
  }
  return 'Weekly';
};

const getPriorityColor = (priority: string, C: Theme) => {
  switch (priority) {
    case 'high': return C.error;
    case 'medium': return C.warning;
    default: return C.success;
  }
};

interface TaskItemProps {
  item: Task;
  drag: () => void;
  isActive: boolean;
  onToggle: (id: string, status: number, date: string) => void;
  onDelete: (id: string, date: string, title: string, recurringId?: string) => void;
  C: Theme;
}

const TaskItem = memo(({ item, drag, isActive, onToggle, onDelete, C }: TaskItemProps) => {
  const priorityColor = getPriorityColor(item.priority, C);
  const recurringLabel = getRecurringLabel(item.frequency, item.days_of_week);
  const isCompleted = item.is_completed === 1;

  return (
    <ScaleDecorator activeScale={1.02}>
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: C.surface },
          isActive && styles.cardActive,
        ]}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          drag();
        }}
        delayLongPress={200}
        activeOpacity={0.9}
      >
        {/* Checkbox */}
        <TouchableOpacity
          style={[
            styles.checkbox,
            { borderColor: C.primary },
            isCompleted && { backgroundColor: C.primary, borderColor: C.primary },
          ]}
          onPress={() => onToggle(item.id, item.is_completed, item.task_date)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isCompleted && <Ionicons name="checkmark" size={12} color="#fff" />}
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[
            styles.title,
            { color: C.textPrimary },
            isCompleted && { color: C.textMuted },
          ]}>
            {item.title}
          </Text>
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
            {recurringLabel && (
              <View style={styles.metaRow}>
                <Ionicons name="repeat" size={10} color={C.primary} />
                <Text style={[styles.metaText, { color: C.primary }]}> {recurringLabel}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Priority badge */}
        <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
          <Text style={[styles.priorityText, { color: priorityColor }]}>{item.priority}</Text>
        </View>

        {/* Actions */}
        <IconButton
          name="pencil-outline"
          size={15}
          color={C.textMuted}
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
              recurring_task_id: item.recurring_task_id || '',
            },
          })}
        />
        <IconButton
          name="trash-outline"
          size={15}
          color={C.error}
          onPress={() => onDelete(item.id, item.task_date, item.title, item.recurring_task_id)}
        />
      </TouchableOpacity>
    </ScaleDecorator>
  );
});

export default TaskItem;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 3,
    padding: 11,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardActive: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },
  title: { fontSize: 14, fontWeight: '500', marginBottom: 2, letterSpacing: 0.1 },
  meta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 10 },
  recurringBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  recurringText: { fontSize: 10, fontWeight: '600' },
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginRight: 2 },
  priorityText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize', letterSpacing: 0.3 },
});
