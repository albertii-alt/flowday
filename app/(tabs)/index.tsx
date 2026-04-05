import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { router } from 'expo-router';
import { format } from 'date-fns';

export default function TodayScreen() {
  const { todayTasks, fetchTodayTasks, toggleTask, removeTask, isLoading } = useTaskStore();
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  useEffect(() => {
    fetchTodayTasks(currentDate);
  }, [currentDate]);
  
  const completedCount = todayTasks.filter(t => t.is_completed === 1).length;
  const progress = todayTasks.length > 0 ? (completedCount / todayTasks.length) * 100 : 0;
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };
  
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      default: return '#10b981';
    }
  };
  
  const handleToggle = async (id: string, currentStatus: number, taskDate: string) => {
    try {
      await toggleTask(id, currentStatus === 1, taskDate);
    } catch (error) {
      console.error('Toggle error:', error);
      Alert.alert('Error', 'Could not update task');
    }
  };
  
  const handleDelete = async (id: string, taskDate: string, title: string) => {
    Alert.alert(
      'Delete Task',
      `Delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await removeTask(id, taskDate);
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Could not delete task');
            }
          }
        }
      ]
    );
  };
  
  const renderTask = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.taskCard}
      onPress={() => handleToggle(item.id, item.is_completed, item.task_date)}
      onLongPress={() => handleDelete(item.id, item.task_date, item.title)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, item.is_completed === 1 && styles.checked]}>
        {item.is_completed === 1 && <Text style={styles.checkmark}>✓</Text>}
      </View>
      
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, item.is_completed === 1 && styles.completedText]}>
          {item.title}
        </Text>
        <View style={styles.taskMeta}>
          {item.category_id && (
            <Text style={styles.category}>{item.category_id.replace('cat_', '')}</Text>
          )}
          {item.due_time && (
            <Text style={styles.time}>🕐 {item.due_time}</Text>
          )}
        </View>
      </View>
      
      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
        <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
          {item.priority}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>
      </View>
      
      <View style={styles.streakCard}>
        <Text style={styles.streakIcon}>🔥</Text>
        <Text style={styles.streakText}>Building consistency</Text>
      </View>
      
      <View style={styles.progressCard}>
        <View style={styles.progressRing}>
          <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
        </View>
        <Text style={styles.progressStats}>
          {completedCount} of {todayTasks.length} tasks completed
        </Text>
        {progress === 100 && todayTasks.length > 0 && (
          <Text style={styles.motivationText}>🎉 Amazing day! You crushed it!</Text>
        )}
        {progress > 0 && progress < 100 && (
          <Text style={styles.motivationText}>
            {todayTasks.length - completedCount} more to go!
          </Text>
        )}
        {todayTasks.length === 0 && (
          <Text style={styles.motivationText}>✨ Add your first task to start</Text>
        )}
      </View>
      
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Today's Tasks</Text>
        <Text style={styles.taskCount}>{todayTasks.length} tasks</Text>
      </View>
      
      <FlatList
        data={todayTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyTitle}>No tasks for today</Text>
            <Text style={styles.emptyText}>
              Tap the + button to add your first task
            </Text>
          </View>
        )}
      />
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/task/create')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff' },
  greeting: { fontSize: 28, fontWeight: '700', color: '#1e293b' },
  date: { fontSize: 16, color: '#64748b', marginTop: 4 },
  streakCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 16, padding: 12, backgroundColor: '#fef3c7', borderRadius: 16 },
  streakIcon: { fontSize: 24, marginRight: 12 },
  streakText: { fontSize: 14, fontWeight: '500', color: '#d97706' },
  progressCard: { margin: 20, padding: 24, backgroundColor: '#fff', borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  progressRing: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  progressPercent: { fontSize: 32, fontWeight: '800', color: '#fff' },
  progressStats: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
  motivationText: { fontSize: 14, color: '#64748b' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  listTitle: { fontSize: 20, fontWeight: '600', color: '#1e293b' },
  taskCount: { fontSize: 14, color: '#64748b' },
  listContent: { paddingBottom: 100 },
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 6, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#4f46e5', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checked: { backgroundColor: '#4f46e5' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '500', color: '#1e293b', marginBottom: 4 },
  completedText: { textDecorationLine: 'line-through', color: '#94a3b8' },
  taskMeta: { flexDirection: 'row', gap: 12 },
  category: { fontSize: 12, color: '#64748b' },
  time: { fontSize: 12, color: '#64748b' },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  priorityText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  fabText: { fontSize: 28, color: '#fff', fontWeight: '600' },
});