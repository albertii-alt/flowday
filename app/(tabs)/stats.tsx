import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState, useRef, useCallback, memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useStatsStore } from '../../store/useStatsStore';
import { useTheme } from '../../utils/useTheme';
import GradientHeader from '../../components/GradientHeader';
import BadgeDialog from '../../components/BadgeDialog';
import { Badge } from '../../utils/badges';
import { Theme } from '../../constants/colors';

// ─── Fully isolated animated section ───────────────────────────────────────────────
// All setState lives here — parent StatsScreen never re-renders from animation
interface AnimatedStatsSectionProps {
  currentStreak: number;
  bestStreak: number;
  completionRate: number;
  completedTasks: number;
  totalTasks: number;
  shouldAnimate: boolean;
  C: Theme;
}

const AnimatedStatsSection = memo(({ currentStreak, bestStreak, completionRate, completedTasks, totalTasks, shouldAnimate, C }: AnimatedStatsSectionProps) => {
  const barProgress = useRef(new Animated.Value(0)).current;
  const countProgress = useRef(new Animated.Value(0)).current;

  const [dispStreak, setDispStreak] = useState(0);
  const [dispBest, setDispBest] = useState(0);
  const [dispRate, setDispRate] = useState(0);
  const [dispCompleted, setDispCompleted] = useState(0);

  const barWidth = barProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${completionRate}%`],
    extrapolate: 'clamp',
  });

  const getRateColor = (rate: number) => {
    if (rate === 100) return C.success;
    if (rate >= 80) return C.primary;
    if (rate >= 50) return C.warning;
    return C.error;
  };

  useEffect(() => {
    if (!shouldAnimate) return;

    barProgress.setValue(0);
    countProgress.setValue(0);
    setDispStreak(0);
    setDispBest(0);
    setDispRate(0);
    setDispCompleted(0);

    // Bar — pure interpolation, no listener, no setState
    Animated.timing(barProgress, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Counters — every frame, all setState batched in one re-render of THIS component only
    const id = countProgress.addListener(({ value }) => {
      setDispStreak(Math.round(currentStreak * value));
      setDispBest(Math.round(bestStreak * value));
      setDispRate(Math.round(completionRate * value));
      setDispCompleted(Math.round(completedTasks * value));
    });

    Animated.timing(countProgress, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start(() => {
      countProgress.removeListener(id);
      setDispStreak(currentStreak);
      setDispBest(bestStreak);
      setDispRate(completionRate);
      setDispCompleted(completedTasks);
    });
  }, [shouldAnimate, currentStreak, bestStreak, completionRate, completedTasks]);

  return (
    <>
      <View style={animStyles.streakRow}>
        <View style={[animStyles.streakCard, { backgroundColor: C.surface }]}>
          <Ionicons name="flame" size={26} color={C.warning} style={{ marginBottom: 6 }} />
          <Text style={[animStyles.streakValue, { color: C.textPrimary }]}>{dispStreak}</Text>
          <Text style={[animStyles.streakLabel, { color: C.textSecondary }]}>Current Streak</Text>
        </View>
        <View style={[animStyles.streakCard, { backgroundColor: C.surface }]}>
          <Ionicons name="trophy" size={26} color={C.primary} style={{ marginBottom: 6 }} />
          <Text style={[animStyles.streakValue, { color: C.textPrimary }]}>{dispBest}</Text>
          <Text style={[animStyles.streakLabel, { color: C.textSecondary }]}>Best Streak</Text>
        </View>
      </View>

      <View style={[animStyles.overallCard, { backgroundColor: C.surface }]}>
        <Text style={[animStyles.overallLabel, { color: C.textSecondary }]}>Overall Completion</Text>
        <Text style={[animStyles.overallRate, { color: getRateColor(completionRate) }]}>{dispRate}%</Text>
        <View style={[animStyles.bar, { backgroundColor: C.border }]}>
          <Animated.View style={[animStyles.barFill, { width: barWidth, backgroundColor: getRateColor(completionRate) }]} />
        </View>
        <Text style={[animStyles.overallText, { color: C.textSecondary }]}>{dispCompleted} of {totalTasks} tasks done</Text>
      </View>
    </>
  );
});

const animStyles = StyleSheet.create({
  streakRow: { flexDirection: 'row', marginHorizontal: 16, gap: 8, marginTop: 10, marginBottom: 2 },
  streakCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  streakValue: { fontSize: 30, fontWeight: '800', letterSpacing: -1 },
  streakLabel: { fontSize: 10, marginTop: 2, letterSpacing: 0.2 },
  overallCard: { marginHorizontal: 16, marginTop: 8, padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  overallLabel: { fontSize: 10, marginBottom: 4, letterSpacing: 0.3, textTransform: 'uppercase' },
  overallRate: { fontSize: 44, fontWeight: '800', marginBottom: 10, letterSpacing: -2 },
  bar: { width: '100%', height: 5, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  barFill: { height: '100%', borderRadius: 3 },
  overallText: { fontSize: 12, marginTop: 4 },
});

export default function StatsScreen() {
  const { overview, badges, isLoading, fetchStats } = useStatsStore();
  const { totalTasks, completedTasks, completionRate, currentStreak, bestStreak, dailyStats, insights } = overview;
  const C = useTheme();
  const { bottom } = useSafeAreaInsets();
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!isLoading && totalTasks > 0) {
      setShouldAnimate(false);
      requestAnimationFrame(() => setShouldAnimate(true));
    }
  }, [isLoading, totalTasks]));

  const [showAllDays, setShowAllDays] = useState(false);
  const chevronAnim = useRef(new Animated.Value(0)).current;

  const toggleDays = useCallback(() => {
    setShowAllDays(prev => !prev);
    Animated.timing(chevronAnim, {
      toValue: showAllDays ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [showAllDays]);

  const chevronRotation = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const LIMIT = 5;

  const getRateColor = (rate: number) => {
    if (rate === 100) return C.success;
    if (rate >= 80) return C.primary;
    if (rate >= 50) return C.warning;
    return C.error;
  };

  if (isLoading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={[]}>
      <GradientHeader title="Statistics" subtitle="Your productivity overview" />
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchStats} tintColor={C.primary} />}
        contentContainerStyle={{ paddingBottom: bottom + 4 + 64 + 16 }}
      >
      {totalTasks === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: C.surface }]}>
          <Ionicons name="clipboard-outline" size={48} color={C.textMuted} style={{ marginBottom: 14 }} />
          <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>No tasks yet</Text>
          <Text style={[styles.emptyText, { color: C.textSecondary }]}>Add your first task from the Today tab</Text>
        </View>
      ) : (
        <>
          <AnimatedStatsSection
            currentStreak={currentStreak}
            bestStreak={bestStreak}
            completionRate={completionRate}
            completedTasks={completedTasks}
            totalTasks={totalTasks}
            shouldAnimate={shouldAnimate}
            C={C}
          />

          <View style={[styles.dailyCard, { backgroundColor: C.surface }]}>
            <Text style={[styles.dailyTitle, { color: C.textPrimary }]}>Daily Breakdown</Text>
            {dailyStats
              .slice(0, showAllDays ? dailyStats.length : LIMIT)
              .map((day, i) => (
                <View key={i} style={styles.dayItem}>
                  <Text style={[styles.dayDate, { color: C.textSecondary }]}>{day.date}</Text>
                  <View style={[styles.dayBarContainer, { backgroundColor: C.border }]}>
                    <View style={[styles.dayBar, { width: `${day.rate}%`, backgroundColor: getRateColor(day.rate) }]} />
                  </View>
                  <Text style={[styles.dayRate, { color: getRateColor(day.rate) }]}>{day.rate}%</Text>
                  {day.streakEligible && <Ionicons name="flame" size={12} color={C.warning} style={{ marginLeft: 4 }} />}
                </View>
              ))
            }
            {dailyStats.length > LIMIT && (
              <TouchableOpacity
                style={[styles.chevronBtn, { borderTopColor: C.border }]}
                onPress={toggleDays}
                activeOpacity={0.7}
              >
                <Text style={[styles.chevronLabel, { color: C.textMuted }]}>
                  {showAllDays ? 'Show less' : `${dailyStats.length - LIMIT} more days`}
                </Text>
                <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
                  <Ionicons name="chevron-down" size={16} color={C.textMuted} />
                </Animated.View>
              </TouchableOpacity>
            )}
          </View>

          {/* Badges Card */}
          <View style={[styles.insightsCard, { backgroundColor: C.surface }]}>
            <Text style={[styles.dailyTitle, { color: C.textPrimary }]}>Achievements</Text>
            <Text style={[styles.badgeSubtitle, { color: C.textMuted }]}>
              {badges.filter(b => b.unlocked).length} of {badges.length} unlocked
            </Text>
            <View style={styles.badgeGrid}>
              {badges.map(badge => (
                <TouchableOpacity
                  key={badge.id}
                  style={[
                    styles.badgeItem,
                    {
                      backgroundColor: badge.iconColor + (badge.unlocked ? '22' : '0f'),
                      borderColor: badge.iconColor + (badge.unlocked ? '70' : '30'),
                    },
                  ]}
                  onPress={() => setSelectedBadge(badge)}
                  activeOpacity={0.75}
                >
                  {/* Lock/unlock corner pill */}
                  <View style={[styles.statusCorner, {
                    backgroundColor: badge.unlocked ? badge.iconColor : badge.iconColor + '50',
                  }]}>
                    <Ionicons
                      name={badge.unlocked ? 'lock-open' : 'lock-closed'}
                      size={8}
                      color="#fff"
                    />
                  </View>

                  {/* Icon circle */}
                  <View style={[styles.badgeIconWrap, {
                    backgroundColor: badge.iconColor + (badge.unlocked ? '30' : '18'),
                  }]}>
                    <Ionicons
                      name={badge.icon as any}
                      size={28}
                      color={badge.iconColor}
                      style={{ opacity: badge.unlocked ? 1 : 0.4 }}
                    />
                  </View>

                  <Text style={[styles.badgeTitle, {
                    color: badge.iconColor,
                    opacity: badge.unlocked ? 1 : 0.5,
                  }]}>
                    {badge.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={[styles.insightsCard, styles.insightsCardLast, { backgroundColor: C.surface }]}>
            <Text style={[styles.dailyTitle, { color: C.textPrimary }]}>Insights</Text>
            {[
              insights.mostProductiveDay && { icon: 'trending-up-outline' as const, text: `Most productive: ${insights.mostProductiveDay}` },
              insights.averageCompletionRate > 0 && { icon: 'analytics-outline' as const, text: `${insights.averageCompletionRate}% avg completion` },
              insights.mostConsistentCategory && { icon: 'pricetag-outline' as const, text: `Top category: ${insights.mostConsistentCategory}` },
              insights.totalActiveDays > 0 && { icon: 'calendar-outline' as const, text: `Active ${insights.totalActiveDays} day${insights.totalActiveDays === 1 ? '' : 's'} total` },
              insights.mostTasksAddedOn && { icon: 'create-outline' as const, text: `Most tasks added on ${insights.mostTasksAddedOn}` },
            ]
              .filter(Boolean)
              .map((insight: any, i) => (
                <View key={i} style={[styles.insightRow, { borderBottomColor: C.border }]}>
                  <Ionicons name={insight.icon} size={16} color={C.primary} style={{ marginRight: 12 }} />
                  <Text style={[styles.insightText, { color: C.textPrimary }]}>{insight.text}</Text>
                </View>
              ))
            }
          </View>
        </>
      )}
      </ScrollView>

      <BadgeDialog
        badge={selectedBadge}
        onClose={() => setSelectedBadge(null)}
        C={C}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyCard: { margin: 16, padding: 32, borderRadius: 16, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4, letterSpacing: -0.2 },
  emptyText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  dailyCard: { marginHorizontal: 16, marginTop: 8, padding: 14, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  dailyTitle: { fontSize: 13, fontWeight: '700', marginBottom: 10, letterSpacing: -0.2 },
  dayItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  dayDate: { width: 80, fontSize: 10, letterSpacing: 0.1 },
  dayBarContainer: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden', marginHorizontal: 6 },
  dayBar: { height: '100%', borderRadius: 2 },
  dayRate: { width: 32, fontSize: 10, fontWeight: '600', textAlign: 'right' },
  chevronBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 10, marginTop: 2, borderTopWidth: StyleSheet.hairlineWidth, gap: 6 },
  chevronLabel: { fontSize: 11, fontWeight: '500' },
  streakDot: { marginLeft: 4 },
  insightEmoji: { marginRight: 10 },
  badgeSubtitle: { fontSize: 11, marginBottom: 10, marginTop: -4 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgeItem: { width: '47%', borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center', position: 'relative' },
  badgeIconWrap: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statusCorner: { position: 'absolute', top: 8, right: 8, width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  badgeTitle: { fontSize: 11, fontWeight: '700', textAlign: 'center', letterSpacing: 0.1 },
  insightsCard: { marginHorizontal: 16, marginTop: 8, padding: 14, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  insightsCardLast: { marginBottom: 0 },
  insightRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth },
  insightText: { flex: 1, fontSize: 12, lineHeight: 17 },
});
