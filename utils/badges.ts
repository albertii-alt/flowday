import { StatsOverview } from '../db/queries/stats';

export interface Badge {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
}

type BadgeDefinition = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  check: (overview: StatsOverview) => boolean;
};

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_step',
    emoji: '🌱',
    title: 'First Step',
    description: 'Complete your first task',
    check: (o) => o.completedTasks >= 1,
  },
  {
    id: 'half_century',
    emoji: '🎯',
    title: 'Half Century',
    description: 'Complete 50 tasks total',
    check: (o) => o.completedTasks >= 50,
  },
  {
    id: 'century',
    emoji: '💯',
    title: 'Century',
    description: 'Complete 100 tasks total',
    check: (o) => o.completedTasks >= 100,
  },
  {
    id: 'on_a_roll',
    emoji: '🔥',
    title: 'On a Roll',
    description: 'Reach a 3-day streak',
    check: (o) => o.bestStreak >= 3,
  },
  {
    id: 'week_warrior',
    emoji: '⚔️',
    title: 'Week Warrior',
    description: 'Reach a 7-day streak',
    check: (o) => o.bestStreak >= 7,
  },
  {
    id: 'unstoppable',
    emoji: '🚀',
    title: 'Unstoppable',
    description: 'Reach a 30-day streak',
    check: (o) => o.bestStreak >= 30,
  },
  {
    id: 'perfect_day',
    emoji: '⭐',
    title: 'Perfect Day',
    description: '100% completion on any day',
    check: (o) => o.dailyStats.some(d => d.rate === 100),
  },
  {
    id: 'perfect_week',
    emoji: '👑',
    title: 'Perfect Week',
    description: '7 consecutive days at 100%',
    check: (o) => {
      let consecutive = 0;
      for (const day of o.dailyStats) {
        if (day.rate === 100) {
          consecutive++;
          if (consecutive >= 7) return true;
        } else {
          consecutive = 0;
        }
      }
      return false;
    },
  },
  {
    id: 'consistent',
    emoji: '📅',
    title: 'Consistent',
    description: 'Be active on 7 different days',
    check: (o) => o.insights.totalActiveDays >= 7,
  },
  {
    id: 'dedicated',
    emoji: '🏅',
    title: 'Dedicated',
    description: 'Be active on 30 different days',
    check: (o) => o.insights.totalActiveDays >= 30,
  },
];

export const evaluateBadges = (overview: StatsOverview): Badge[] => {
  return BADGE_DEFINITIONS.map(def => ({
    id: def.id,
    emoji: def.emoji,
    title: def.title,
    description: def.description,
    unlocked: def.check(overview),
  }));
};
