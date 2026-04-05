import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { getTasksByDate, Task } from '../../db/queries/tasks';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasksForSelectedDate, setTasksForSelectedDate] = useState<Task[]>([]);
  const [completionMap, setCompletionMap] = useState<Record<string, number>>({});

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Load completion data for each day in month
  useEffect(() => {
    const loadMonthData = async () => {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      // This is simplified - we'll enhance later
      const map: Record<string, number> = {};
      for (const day of monthDays) {
        const dateStr = format(day, 'yyyy-MM-dd');
        const tasks = await getTasksByDate(dateStr);
        if (tasks.length > 0) {
          const completed = tasks.filter(t => t.is_completed === 1).length;
          map[dateStr] = Math.round((completed / tasks.length) * 100);
        }
      }
      setCompletionMap(map);
    };
    loadMonthData();
  }, [currentMonth]);

  const loadTasksForDate = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const tasks = await getTasksByDate(dateStr);
    setTasksForSelectedDate(tasks);
  };

  const getDayStyle = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const completion = completionMap[dateStr];
    
    if (completion === 100) return styles.dayComplete;
    if (completion && completion >= 80) return styles.dayGood;
    if (completion) return styles.dayPartial;
    return styles.dayDefault;
  };

  return (
    <View style={styles.container}>
      {/* Month Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}>
          <Text style={styles.navButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{format(currentMonth, 'MMMM yyyy')}</Text>
        <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}>
          <Text style={styles.navButton}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekHeader}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Text key={day} style={styles.weekDay}>{day}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {monthDays.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.dayCell, getDayStyle(day)]}
            onPress={() => {
              setSelectedDate(day);
              loadTasksForDate(day);
            }}
          >
            <Text style={[
              styles.dayNumber,
              isSameDay(day, selectedDate) && styles.selectedDayNumber
            ]}>
              {format(day, 'd')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Selected Date Tasks */}
      <View style={styles.tasksSection}>
        <Text style={styles.tasksTitle}>
          Tasks for {format(selectedDate, 'MMMM d, yyyy')}
        </Text>
        <FlatList
          data={tasksForSelectedDate}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.historyTaskCard}>
              <View style={[
                styles.historyCheckbox,
                item.is_completed === 1 && styles.historyChecked
              ]}>
                {item.is_completed === 1 && <Text style={styles.historyCheckmark}>✓</Text>}
              </View>
              <Text style={[
                styles.historyTaskTitle,
                item.is_completed === 1 && styles.historyCompletedText
              ]}>
                {item.title}
              </Text>
            </View>
          )}
          ListEmptyComponent={() => (
            <Text style={styles.emptyTasksText}>No tasks for this day</Text>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  navButton: {
    fontSize: 24,
    color: '#4f46e5',
    padding: 8,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  dayDefault: {
    backgroundColor: '#fff',
  },
  dayComplete: {
    backgroundColor: '#10b98120',
  },
  dayGood: {
    backgroundColor: '#06b6d420',
  },
  dayPartial: {
    backgroundColor: '#f59e0b20',
  },
  dayNumber: {
    fontSize: 16,
    color: '#1e293b',
  },
  selectedDayNumber: {
    color: '#4f46e5',
    fontWeight: '700',
  },
  tasksSection: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  tasksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  historyTaskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  historyCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#4f46e5',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyChecked: {
    backgroundColor: '#4f46e5',
  },
  historyCheckmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyTaskTitle: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
  },
  historyCompletedText: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  emptyTasksText: {
    textAlign: 'center',
    color: '#94a3b8',
    paddingTop: 40,
  },
});