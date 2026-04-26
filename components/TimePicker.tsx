import { memo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../constants/colors';

interface TimePickerProps {
  value: string;        // '24h HH:MM' or '' if not set
  onChange: (time24: string) => void;  // returns 'HH:MM' 24h or ''
  C: Theme;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const to12h = (time24: string) => {
  const [h, m] = time24.split(':').map(Number);
  return {
    hour: h % 12 === 0 ? 12 : h % 12,
    minute: m,
    period: h >= 12 ? 'PM' : 'AM' as 'AM' | 'PM',
  };
};

const to24h = (hour: number, minute: number, period: 'AM' | 'PM'): string => {
  let h = hour % 12;
  if (period === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const formatDisplay = (hour: number, minute: number, period: 'AM' | 'PM') =>
  `${hour}:${String(minute).padStart(2, '0')} ${period}`;

// ─── Component ────────────────────────────────────────────────────────────────
const TimePicker = memo(({ value, onChange, C }: TimePickerProps) => {
  const initial = value ? to12h(value) : { hour: 8, minute: 0, period: 'AM' as 'AM' | 'PM' };

  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initial.period);
  const [editingHour, setEditingHour] = useState(false);
  const [editingMinute, setEditingMinute] = useState(false);
  const [hourInput, setHourInput] = useState('');
  const [minuteInput, setMinuteInput] = useState('');

  const adjustHour = useCallback((delta: number) => {
    setHour(h => { let n = h + delta; if (n > 12) n = 1; if (n < 1) n = 12; return n; });
  }, []);

  const adjustMinute = useCallback((delta: number) => {
    setMinute(m => { let n = m + delta; if (n > 59) n = 0; if (n < 0) n = 59; return n; });
  }, []);

  const commitHour = useCallback((val: string) => {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 1 && n <= 12) setHour(n);
    setEditingHour(false);
  }, []);

  const commitMinute = useCallback((val: string) => {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 0 && n <= 59) setMinute(n);
    setEditingMinute(false);
  }, []);

  const handleSave = useCallback(() => {
    onChange(to24h(hour, minute, period));
    setOpen(false);
  }, [hour, minute, period, onChange]);

  const handleClear = useCallback(() => {
    onChange('');
    setOpen(false);
  }, [onChange]);

  return (
    <View>
      {/* Display row */}
      <TouchableOpacity
        style={[styles.displayRow, { backgroundColor: C.surface, borderColor: open ? C.primary : C.border }]}
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.8}
      >
        <Ionicons name="time-outline" size={16} color={value ? C.primary : C.textMuted} style={{ marginRight: 8 }} />
        <Text style={[styles.displayText, { color: value ? C.textPrimary : C.textMuted }]}>
          {value ? formatDisplay(...Object.values(to12h(value)) as [number, number, 'AM' | 'PM']) : 'Set due time'}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={C.textMuted} />
      </TouchableOpacity>

      {/* Picker */}
      {open && (
        <View style={[styles.picker, { backgroundColor: C.background, borderColor: C.border }]}>
          {/* Hour */}
          <View style={styles.col}>
            <TouchableOpacity onPress={() => adjustHour(1)} style={styles.btn}>
              <Ionicons name="chevron-up" size={18} color={C.primary} />
            </TouchableOpacity>
            {editingHour ? (
              <TextInput
                style={[styles.input, { color: C.textPrimary, borderColor: C.primary }]}
                value={hourInput}
                onChangeText={setHourInput}
                keyboardType="number-pad"
                maxLength={2}
                autoFocus
                selectTextOnFocus
                onBlur={() => commitHour(hourInput)}
                onSubmitEditing={() => commitHour(hourInput)}
              />
            ) : (
              <TouchableOpacity onPress={() => { setHourInput(String(hour)); setEditingHour(true); }}>
                <Text style={[styles.value, { color: C.textPrimary }]}>{String(hour).padStart(2, '0')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => adjustHour(-1)} style={styles.btn}>
              <Ionicons name="chevron-down" size={18} color={C.primary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.sep, { color: C.textPrimary }]}>:</Text>

          {/* Minute */}
          <View style={styles.col}>
            <TouchableOpacity onPress={() => adjustMinute(1)} style={styles.btn}>
              <Ionicons name="chevron-up" size={18} color={C.primary} />
            </TouchableOpacity>
            {editingMinute ? (
              <TextInput
                style={[styles.input, { color: C.textPrimary, borderColor: C.primary }]}
                value={minuteInput}
                onChangeText={setMinuteInput}
                keyboardType="number-pad"
                maxLength={2}
                autoFocus
                selectTextOnFocus
                onBlur={() => commitMinute(minuteInput)}
                onSubmitEditing={() => commitMinute(minuteInput)}
              />
            ) : (
              <TouchableOpacity onPress={() => { setMinuteInput(String(minute)); setEditingMinute(true); }}>
                <Text style={[styles.value, { color: C.textPrimary }]}>{String(minute).padStart(2, '0')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => adjustMinute(-1)} style={styles.btn}>
              <Ionicons name="chevron-down" size={18} color={C.primary} />
            </TouchableOpacity>
          </View>

          {/* AM/PM */}
          <TouchableOpacity
            style={[styles.period, { backgroundColor: C.primary }]}
            onPress={() => setPeriod(p => p === 'AM' ? 'PM' : 'AM')}
          >
            <Text style={styles.periodText}>{period}</Text>
          </TouchableOpacity>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.success }]} onPress={handleSave}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </TouchableOpacity>
            {value !== '' && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.error + '20' }]} onPress={handleClear}>
                <Ionicons name="close" size={16} color={C.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
});

export default TimePicker;

const styles = StyleSheet.create({
  displayRow: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 13 },
  displayText: { flex: 1, fontSize: 15 },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, padding: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, gap: 8 },
  col: { alignItems: 'center' },
  btn: { padding: 6 },
  value: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, minWidth: 36, textAlign: 'center' },
  input: { fontSize: 22, fontWeight: '800', minWidth: 36, textAlign: 'center', borderBottomWidth: 2, paddingBottom: 2 },
  sep: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  period: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  periodText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  actions: { flexDirection: 'column', gap: 6 },
  actionBtn: { padding: 9, borderRadius: 10 },
});
