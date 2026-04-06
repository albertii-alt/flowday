import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, FlatList } from 'react-native';
import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../db/schema';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    emoji: null,
    title: 'Welcome to FlowDay',
    subtitle: 'Your daily focus companion. Plan tasks, track progress, and build consistency — all offline.',
  },
  {
    id: '2',
    emoji: '✅',
    title: 'Plan Your Day',
    subtitle: 'Add tasks with categories, priorities, and due times. Stay organized and focused every single day.',
  },
  {
    id: '3',
    emoji: '📊',
    title: 'Track Your Progress',
    subtitle: 'See your completion rate, review past days on the calendar, and watch your stats grow over time.',
  },
  {
    id: '4',
    emoji: '🔥',
    title: 'Build Your Streak',
    subtitle: 'Complete 80% or more of your tasks daily to keep your streak alive. Consistency is the key!',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleGetStarted = async () => {
    await db.runAsync(
      `UPDATE settings SET onboarding_completed = 1 WHERE id = 'settings_default'`
    );
    router.replace('/(tabs)');
  };

  const handleSkip = () => handleGetStarted();

  const isLast = currentIndex === slides.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
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
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {item.id === '1' ? (
              <Image
                source={require('../assets/flowday-onboard.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.emojiContainer}>
                <Text style={styles.emoji}>{item.emoji}</Text>
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
          <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
        ))}
      </View>

      {/* Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={isLast ? handleGetStarted : handleNext}
      >
        <Text style={styles.buttonText}>
          {isLast ? "Let's Go! 🚀" : 'Next'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center' },
  skipBtn: { alignSelf: 'flex-end', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  skipText: { fontSize: 15, color: '#64748b' },
  slide: { width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  logo: { width: 140, height: 140, marginBottom: 40 },
  emojiContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 56 },
  title: { fontSize: 30, fontWeight: '800', color: '#f1f5f9', textAlign: 'center', marginBottom: 16 },
  subtitle: { fontSize: 16, color: '#94a3b8', textAlign: 'center', lineHeight: 24 },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#334155' },
  dotActive: { width: 24, backgroundColor: '#818cf8' },
  button: { width: width - 48, backgroundColor: '#4f46e5', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 24 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
