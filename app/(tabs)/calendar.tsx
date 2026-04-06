import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
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
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={['top']}>
      <GradientHeader title="Calendar">
        <Text style={styles.calendarHeaderTitle}>Calendar</Text>
        <View style={styles.calendarNavRow}>
          <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navBtn}>
            <Text style={styles.navButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{format(currentMonth, 'MMMM yyyy')}</Text>
          <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navBtn}>
            <Text style={styles.navButtonText}>→</Text>
          </TouchableOpacity>
        </View>
      </GradientHeader>

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
                {item.is_completed === 1 && <Text style={styles.historyCheckmark}>✓</Text>}
              </View>
              <View style={styles.historyTaskContent}>
                <Text style={[styles.historyTaskTitle, { color: C.textPrimary }, item.is_completed === 1 && { textDecorationLine: 'line-through', color: C.textMuted }]}>
                  {item.title}
                </Text>
                {item.due_time && <Text style={[styles.historyTaskMeta, { color: C.textMuted }]}>🕐 {item.due_time}</Text>}
              </View>
              <Text style={[styles.priorityDot, { color: getPriorityColor(item.priority) }]}>●</Text>
            </View>
          )}
          ListEmptyComponent={() => (
            <Text style={[styles.emptyTasksText, { color: C.textMuted }]}>No tasks for this day</Text>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  calendarHeaderTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 8 },
  calendarNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navBtn: { padding: 8 },
  navButtonText: { fontSize: 24, color: '#fff' },
  monthTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  weekHeader: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 8 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, paddingBottom: 8 },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  dayInner: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  dayNumber: { fontSize: 14 },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingVertical: 8, borderBottomWidth: 1 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11 },
  tasksSection: { flex: 1, marginTop: 12, padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  tasksTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  historyTaskCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  historyCheckbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  historyCheckmark: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  historyTaskContent: { flex: 1 },
  historyTaskTitle: { fontSize: 15 },
  historyTaskMeta: { fontSize: 12, marginTop: 2 },
  priorityDot: { fontSize: 10, marginLeft: 8 },
  emptyTasksText: { textAlign: 'center', paddingTop: 40 },
});
