import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, addMonths, subMonths } from 'date-fns';
import { getTasksByDateRange, getTasksByDate, Task } from '../../db/queries/tasks';
import { useTheme } from '../../utils/useTheme';
import GradientHeader from '../../components/GradientHeader';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarScreen() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasksForSelectedDate, setTasksForSelectedDate] = useState<Task[]>([]);
  const [completionMap, setCompletionMap] = useState<Record<string, number>>({});
  const C = useTheme();
  const { bottom } = useSafeAreaInsets();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingBlanks = Array(getDay(monthStart)).fill(null);

  const loadMonthData = useCallback(async () => {
    const tasks = await getTasksByDateRange(format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd'));
    const grouped: Record<string, { total: number; completed: number }> = {};
    for (const task of tasks) {
      if (!grouped[task.task_date]) grouped[task.task_date] = { total: 0, completed: 0 };
      grouped[task.task_date].total++;
      if (task.is_completed === 1) grouped[task.task_date].completed++;
    }
    const completions: Record<string, number> = {};
    for (const [date, { total, completed }] of Object.entries(grouped)) {
      completions[date] = Math.round((completed / total) * 100);
    }
    setCompletionMap(completions);
  }, [currentMonth]);

  const loadTasksForDate = useCallback(async (date: Date) => {
    const tasks = await getTasksByDate(format(date, 'yyyy-MM-dd'));
    setTasksForSelectedDate(tasks);
  }, []);

  useEffect(() => { loadMonthData(); }, [loadMonthData]);
  useEffect(() => { loadTasksForDate(selectedDate); }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      loadMonthData();
      loadTasksForDate(selectedDate);
    }, [loadMonthData, selectedDate])
  );

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  const getDotColor = (rate: number) => {
    if (rate === 100) return C.success;
    if (rate >= 80) return C.accent;
    return C.warning;
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return C.error;
    if (priority === 'medium') return C.warning;
    return C.success;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={[]}>
      <GradientHeader title="Calendar" subtitle="Review your task history" />

      <View style={[styles.monthNav, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, { color: C.textPrimary }]}>{format(currentMonth, 'MMMM yyyy')}</Text>
        <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={22} color={C.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.weekHeader, { backgroundColor: C.surface }]}>
        {WEEKDAYS.map(day => (
          <Text key={day} style={[styles.weekDay, { color: C.textMuted }]}>{day}</Text>
        ))}
      </View>

      <View style={[styles.calendarGrid, { backgroundColor: C.surface }]}>
        {leadingBlanks.map((_, i) => (
          <View key={`blank-${i}`} style={styles.dayCell} />
        ))}
        {monthDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const dateStr = format(day, 'yyyy-MM-dd');
          const rate = completionMap[dateStr];

          return (
            <TouchableOpacity
              key={day.toISOString()}
              style={styles.dayCell}
              onPress={() => setSelectedDate(day)}
            >
              <View style={[styles.dayInner, isSelected && { backgroundColor: C.primary }]}>
                <Text style={[styles.dayNumber, { color: isSelected ? '#fff' : C.textPrimary }, isSelected && { fontWeight: '700' }]}>
                  {format(day, 'd')}
                </Text>
                {rate !== undefined && (
                  <View style={[styles.dot, { backgroundColor: isSelected ? '#fff' : getDotColor(rate) }]} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.legend, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        {[
          { color: C.success, label: '100%' },
          { color: C.accent, label: '≥80%' },
          { color: C.warning, label: '>0%' },
        ].map(({ color, label }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={[styles.legendText, { color: C.textSecondary }]}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.tasksSection, { backgroundColor: C.surface }]}>
        <Text style={[styles.tasksTitle, { color: C.textPrimary }]}>{format(selectedDate, 'MMMM d, yyyy')}</Text>
        <FlatList
          data={tasksForSelectedDate}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.historyTaskCard, { borderBottomColor: C.border }]}>
              <View style={[styles.historyCheckbox, { borderColor: C.primary }, item.is_completed === 1 && { backgroundColor: C.primary }]}>
                {item.is_completed === 1 && <Ionicons name="checkmark" size={11} color="#fff" />}
              </View>
              <View style={styles.historyTaskContent}>
                <Text style={[styles.historyTaskTitle, { color: C.textPrimary }, item.is_completed === 1 && { color: C.textMuted }]}>
                  {item.title}
                </Text>
                {item.due_time && (
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={11} color={C.textMuted} />
                    <Text style={[styles.historyTaskMeta, { color: C.textMuted }]}> {item.due_time}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.priorityDot, { color: getPriorityColor(item.priority) }]}>●</Text>
            </View>
          )}
          ListEmptyComponent={() => (
            <Text style={[styles.emptyTasksText, { color: C.textMuted }]}>No tasks for this day</Text>
          )}
          contentContainerStyle={{ paddingBottom: bottom + 4 + 64 + 16 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  navBtn: { padding: 6 },
  monthTitle: { fontSize: 14, fontWeight: '600', letterSpacing: -0.2 },
  weekHeader: { flexDirection: 'row', paddingHorizontal: 4, paddingVertical: 6 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 4, paddingBottom: 6 },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  dayInner: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  dayNumber: { fontSize: 12, letterSpacing: 0.1 },
  dot: { width: 3, height: 3, borderRadius: 2, marginTop: 1 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 10, letterSpacing: 0.1 },
  tasksSection: { flex: 1, marginTop: 6, paddingHorizontal: 16, paddingTop: 14, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  tasksTitle: { fontSize: 13, fontWeight: '700', marginBottom: 10, letterSpacing: -0.2 },
  historyTaskCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth },
  historyCheckbox: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  historyTaskContent: { flex: 1 },
  historyTaskTitle: { fontSize: 13, fontWeight: '500', letterSpacing: 0.1 },
  historyTaskMeta: { fontSize: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  priorityDot: { fontSize: 8, marginLeft: 6 },
  emptyTasksText: { textAlign: 'center', paddingTop: 32, fontSize: 12 },
});
