import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../../store/useTaskStore';
import { useTheme } from '../../utils/useTheme';
import { addRecurringTask, generateRecurringTasksForDate, Frequency } from '../../db/queries/recurring';
import { format } from 'date-fns';
import TimePicker from '../../components/TimePicker';
import { scheduleTaskNotification, requestNotificationPermission } from '../../utils/notifications';
import GradientHeader from '../../components/GradientHeader';

const categories = [
  { id: 'cat_personal', name: 'Personal', color: '#4f46e5' },
  { id: 'cat_school', name: 'School', color: '#06b6d4' },
  { id: 'cat_work', name: 'Work', color: '#f59e0b' },
  { id: 'cat_health', name: 'Health', color: '#10b981' },
  { id: 'cat_errands', name: 'Errands', color: '#ef4444' },
];

const priorities = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
];

export default function CreateTaskScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id);
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueTime, setDueTime] = useState('');
  const [frequency, setFrequency] = useState<'none' | Frequency>('none');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const { addNewTask, fetchTodayTasks, refreshTodayTasks } = useTaskStore();
  const C = useTheme();
  const today = format(new Date(), 'yyyy-MM-dd');

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (frequency !== 'none') {
      if (frequency === 'weekly' && selectedDays.length === 0) {
        Alert.alert('Error', 'Please select at least one day for weekly recurrence');
        return;
      }
      const effectiveFrequency = frequency === 'weekly' && selectedDays.length === 7 ? 'daily' : frequency;
      const recurringId = await addRecurringTask({
        title: title.trim(),
        description: description.trim() || undefined,
        category_id: selectedCategory,
        priority: selectedPriority,
        due_time: dueTime || undefined,
        frequency: effectiveFrequency,
        days_of_week: effectiveFrequency === 'weekly' ? [...selectedDays].sort((a, b) => a - b).join(',') : undefined,
      });
      // Wait for DB write to complete before generating
      if (recurringId) {
        await generateRecurringTasksForDate(today);
        await refreshTodayTasks(today);
      }
    } else {
      const taskId = await addNewTask({
        title: title.trim(),
        description: description.trim() || undefined,
        category_id: selectedCategory,
        priority: selectedPriority,
        due_time: dueTime || undefined,
        task_date: today,
      });
      // Schedule notification if due time is set
      if (dueTime && taskId) {
        const granted = await requestNotificationPermission();
        if (granted) {
          await scheduleTaskNotification(taskId, title.trim(), today, dueTime);
        }
      }
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <GradientHeader title="New Task" compact />
      <ScrollView style={[styles.container, { backgroundColor: C.background }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: C.textMuted }]}>Task Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.textPrimary }]}
            placeholder="What needs to be done?"
            placeholderTextColor={C.textMuted}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: C.textMuted }]}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: C.surface, borderColor: C.border, color: C.textPrimary }]}
            placeholder="Add details..."
            placeholderTextColor={C.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: C.textMuted }]}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  { backgroundColor: C.surface, borderColor: C.border },
                  selectedCategory === cat.id && { backgroundColor: cat.color + '20', borderColor: cat.color },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                <Text style={[
                  styles.categoryText, { color: C.textSecondary },
                  selectedCategory === cat.id && { color: cat.color, fontWeight: '600' },
                ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: C.textMuted }]}>Priority</Text>
          <View style={styles.priorityRow}>
            {priorities.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.priorityChip,
                  { backgroundColor: C.surface, borderColor: C.border },
                  selectedPriority === p.value && { backgroundColor: p.color, borderColor: p.color },
                ]}
                onPress={() => setSelectedPriority(p.value as 'low' | 'medium' | 'high')}
              >
                <Text style={[
                  styles.priorityText, { color: C.textSecondary },
                  selectedPriority === p.value && { color: '#fff' },
                ]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: C.textMuted }]}>Due Time (Optional)</Text>
          <TimePicker value={dueTime} onChange={setDueTime} C={C} />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: C.textMuted }]}>Repeat</Text>
          <View style={styles.priorityRow}>
            {(['none', 'daily', 'weekly'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.priorityChip,
                  { backgroundColor: C.surface, borderColor: C.border },
                  frequency === f && { backgroundColor: C.primary, borderColor: C.primary },
                ]}
                onPress={() => setFrequency(f)}
              >
                {f === 'daily' && <Ionicons name="repeat" size={13} color={frequency === f ? '#fff' : C.textSecondary} style={{ marginRight: 4 }} />}
                {f === 'weekly' && <Ionicons name="calendar-outline" size={13} color={frequency === f ? '#fff' : C.textSecondary} style={{ marginRight: 4 }} />}
                <Text style={[styles.priorityText, { color: C.textSecondary }, frequency === f && { color: '#fff' }]}>
                  {f === 'none' ? 'None' : f === 'daily' ? 'Daily' : 'Weekly'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {frequency === 'weekly' && (
          <View style={styles.field}>
            <Text style={[styles.label, { color: C.textMuted }]}>Repeat On</Text>
            <Text style={[styles.todayHint, { color: C.textMuted }]}>
              Today is {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()]}
            </Text>
            <View style={styles.daysRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
                const isToday = index === new Date().getDay();
                const isSelected = selectedDays.includes(index);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayChip,
                      { backgroundColor: C.surface, borderColor: C.border },
                      isToday && !isSelected && { borderColor: C.primary },
                      isSelected && { backgroundColor: C.primary, borderColor: C.primary },
                    ]}
                    onPress={() => setSelectedDays(prev =>
                      prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index]
                    )}
                  >
                    <Text style={[styles.dayText, { color: isSelected ? '#fff' : isToday ? C.primary : C.textSecondary }]}>
                      {day}
                    </Text>
                    {isToday && <View style={[styles.todayDot, { backgroundColor: isSelected ? '#fff' : C.primary }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: C.primary }]} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Task</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 18 },
  label: { fontSize: 11, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.7 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 13, fontSize: 15 },
  textArea: { height: 76, textAlignVertical: 'top' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth },
  categoryDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  categoryText: { fontSize: 13 },
  priorityRow: { flexDirection: 'row', gap: 10 },
  priorityChip: { flex: 1, flexDirection: 'row', paddingVertical: 9, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  priorityText: { fontSize: 13, fontWeight: '500' },
  saveButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayChip: { width: 38, height: 38, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', alignItems: 'center' },
  dayText: { fontSize: 12, fontWeight: '600' },
  todayHint: { fontSize: 11, marginBottom: 8, marginTop: -4 },
  todayDot: { width: 3, height: 3, borderRadius: 2, position: 'absolute', bottom: 5 },
});
