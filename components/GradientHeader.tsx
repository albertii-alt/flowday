import { View, Text, StyleSheet } from 'react-native';
import { useUIStore } from '../store/useUIStore';

interface GradientHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

// Light mode: indigo → purple → violet mesh
// Dark mode: deep indigo → dark purple → near-black (muted, elegant)
export default function GradientHeader({ title, subtitle, children }: GradientHeaderProps) {
  const isDarkMode = useUIStore(s => s.isDarkMode);

  const colors = isDarkMode
    ? { base: '#1e1b4b', blob1: '#312e81', blob2: '#4c1d95', blob3: '#2e1065' }
    : { base: '#4f46e5', blob1: '#7c3aed', blob2: '#6d28d9', blob3: '#4338ca' };

  return (
    <View style={[styles.container, { backgroundColor: colors.base }]}>
      <View style={[styles.blob1, { backgroundColor: colors.blob1 }]} />
      <View style={[styles.blob2, { backgroundColor: colors.blob2 }]} />
      <View style={[styles.blob3, { backgroundColor: colors.blob3 }]} />
      <View style={styles.content}>
        {children ?? (
          <>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  blob1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -60, right: -40, opacity: 0.5 },
  blob2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, top: -20, right: 80, opacity: 0.35 },
  blob3: { position: 'absolute', width: 120, height: 120, borderRadius: 60, bottom: -40, left: -20, opacity: 0.4 },
  content: { position: 'relative' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
});
