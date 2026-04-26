import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, FlatList } from 'react-native';
import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../db/schema';

const { width } = Dimensions.get('window');

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const slides: {
  id: string;
  icon: IoniconsName | null;
  iconColor: string;
  title: string;
  subtitle: string;
}[] = [
  {
    id: '1',
    icon: null,
    iconColor: '',
    title: 'Welcome to FlowDay',
    subtitle: 'Your daily focus companion. Plan tasks, track progress, and build consistency — all offline.',
  },
  {
    id: '2',
    icon: 'checkmark-circle',
    iconColor: '#3b82f6',
    title: 'Plan Your Day',
    subtitle: 'Add tasks with categories, priorities, and due times. Stay organized and focused every day.',
  },
  {
    id: '3',
    icon: 'bar-chart',
    iconColor: '#06b6d4',
    title: 'Track Progress',
    subtitle: 'See your completion rate, review past days on the calendar, and watch your stats grow.',
  },
  {
    id: '4',
    icon: 'flame',
    iconColor: '#f59e0b',
    title: 'Build Your Streak',
    subtitle: 'Complete 80% or more of your tasks daily to keep your streak alive. Consistency is everything.',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const next = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
    }
  };

  const handleGetStarted = async () => {
    await db.runAsync(
      `UPDATE settings SET onboarding_completed = 1 WHERE id = 'settings_default'`
    );
    router.replace('/(tabs)');
  };

  const isLast = currentIndex === slides.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleGetStarted}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {item.id === '1' ? (
              <View style={styles.logoWrapper}>
                <View style={styles.logoGlow} />
                <Image
                  source={require('../assets/flowday-icon.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={[styles.iconWrapper, { backgroundColor: item.iconColor + '18' }]}>
                <View style={[styles.iconGlow, { backgroundColor: item.iconColor + '20' }]} />
                <Ionicons name={item.icon!} size={52} color={item.iconColor} />
              </View>
            )}
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={isLast ? handleGetStarted : handleNext}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>
          {isLast ? "Get Started" : "Continue"}
        </Text>
        <Ionicons
          name={isLast ? "checkmark" : "arrow-forward"}
          size={18}
          color="#fff"
          style={{ marginLeft: 8 }}
        />
      </TouchableOpacity>

      <Text style={styles.footerText}>No account needed. Everything stays on your device.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0f',
    alignItems: 'center',
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  skipText: {
    fontSize: 14,
    color: '#52525b',
    fontWeight: '500',
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  // Logo slide
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 44,
  },
  logoGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 28,
  },
  // Icon slides
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 44,
  },
  iconGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f4f4f5',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 23,
    fontWeight: '400',
  },
  // Dots
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 24,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#27272a',
  },
  dotActive: {
    width: 22,
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  // Button
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: width - 48,
    backgroundColor: '#1e40af',
    paddingVertical: 15,
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  footerText: {
    fontSize: 11,
    color: '#3f3f46',
    marginBottom: 8,
    textAlign: 'center',
  },
});
