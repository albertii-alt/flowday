import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { updateRecurringTask, Frequency } from '../../db/queries/recurring';
import { useTheme } from '../../utils/useTheme';

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

export default function EditRecurringScreen() {
  const {
    id,
    title: initialTitle,
    description: initialDesc,
    category_id,
    priority: initialPriority,
    due_time,
    frequency: initialFrequency,
    days_of_week,
  } = useLocalSearchParams<{
    id: string;
    title: string;
    description: string;
    category_id: string;
    priority: string;
    due_time: string;
    frequency: string;
    days_of_week: string;
  }>();

  const C = useTheme();
  const [title, setTitle] = useState(initialTitle || '');
  const [description, setDescription] = useState(initialDesc || '');
  const [selectedCategory, setSelectedCategory] = useState(category_id || 'cat_personal');
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high'>(
    (initialPriority as 'low' | 'medium' | 'high') || 'medium'
  );
  const [dueTime, setDueTime] = useState(due_time || '');
  const [frequency, setFrequency] = useState<Frequency>((initialFrequency as Frequency) || 'daily');
  const [selectedDays, setSelectedDays] = useState<number[]>(
    days_of_week ? days_of_week.split(',').map(Number) : []
  );

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }
    if (frequency === 'weekly' && selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day for weekly recurrence');
      return;
    }
    await updateRecurringTask(id, {
      title: title.trim(),
      description: description.trim() || undefined,
      category_id: selectedCategory,
      priority: selectedPriority,
      due_time: dueTime || undefined,
      frequency,
      days_of_week: frequency === 'weekly' ? selectedDays.sort().join(',') : undefined,
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={[styles.container, { backgroundColor: C.background }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: C.textSecondary }]}>Task Title *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.textPrimary }]}
              placeholder="What needs to be done?"
              placeholderTextColor={C.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: C.textSecondary }]}>Description (Optional)</Text>
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
            <Text style={[styles.label, { color: C.textSecondary }]}>Category</Text>
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
            <Text style={[styles.label, { color: C.textSecondary }]}>Priority</Text>
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
            <Text style={[styles.label, { color: C.textSecondary }]}>Due Time (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.textPrimary }]}
              placeholder="e.g., 3:00 PM"
              placeholderTextColor={C.textMuted}
              value={dueTime}
              onChangeText={setDueTime}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: C.textSecondary }]}>Repeat</Text>
            <View style={styles.priorityRow}>
              {(['daily', 'weekly'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.priorityChip,
                    { backgroundColor: C.surface, borderColor: C.border },
                    frequency === f && { backgroundColor: C.primary, borderColor: C.primary },
                  ]}
                  onPress={() => setFrequency(f)}
                >
                  <Text style={[styles.priorityText, { color: C.textSecondary }, frequency === f && { color: '#fff' }]}>
                    {f === 'daily' ? '🔁 Daily' : '📅 Weekly'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {frequency === 'weekly' && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: C.textSecondary }]}>Repeat On</Text>
              <View style={styles.daysRow}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayChip,
                      { backgroundColor: C.surface, borderColor: C.border },
                      selectedDays.includes(index) && { backgroundColor: C.primary, borderColor: C.primary },
                    ]}
                    onPress={() => setSelectedDays(prev =>
                      prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index]
                    )}
                  >
                    <Text style={[styles.dayText, { color: C.textSecondary }, selectedDays.includes(index) && { color: '#fff' }]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity style={[styles.saveButton, { backgroundColor: C.primary }]} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { padding: 20 },
  field: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  categoryDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  categoryText: { fontSize: 14 },
  priorityRow: { flexDirection: 'row', gap: 12 },
  priorityChip: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  priorityText: { fontSize: 14, fontWeight: '500' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayChip: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  dayText: { fontSize: 13, fontWeight: '600' },
  saveButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
