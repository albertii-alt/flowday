import { memo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../utils/useTheme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

function GlassCard({ children, style }: GlassCardProps) {
  const C = useTheme();
  return (
    <View style={[
      styles.card,
      { backgroundColor: C.surface, borderColor: C.border },
      style,
    ]}>
      {children}
    </View>
  );
}

export default memo(GlassCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
});
