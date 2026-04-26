import { memo } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '../store/useUIStore';

interface GradientHeaderProps {
  title: string;
  subtitle?: string;
  compact?: boolean;
  onBack?: () => void;
  rightIcon?: React.ReactNode;
  onRightAction?: () => void;
  children?: React.ReactNode;
}

function GradientHeader({ title, subtitle, compact, onBack, rightIcon, onRightAction, children }: GradientHeaderProps) {
  const isDarkMode = useUIStore(s => s.isDarkMode);

  const lightColors: [string, string, string] = ['#0a0f1e', '#0f2044', '#0c2a4a'];
  const darkColors: [string, string] = ['#0a0f1e', '#0d2137'];

  const { top } = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={isDarkMode ? darkColors : lightColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: top + 10 }]}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.content}>
        {children ?? (
          onBack ? (
            <View style={styles.navRow}>
              <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
              {onRightAction
                ? <TouchableOpacity style={styles.iconBtn} onPress={onRightAction} activeOpacity={0.7}>{rightIcon}</TouchableOpacity>
                : <View style={styles.iconBtn} />}
            </View>
          ) : (
            <>
              <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </>
          )
        )}
      </View>
    </LinearGradient>
  );
}

export default memo(GradientHeader);

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 14 },
  content: {},
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  titleCompact: { fontSize: 17, fontWeight: '700', letterSpacing: 0 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 3, letterSpacing: 0.1 },
});
