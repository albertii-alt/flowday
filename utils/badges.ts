import { StatsOverview } from '../db/queries/stats';

export interface Badge {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  description: string;
  hint: string;
  unlocked: boolean;
}

type BadgeDefinition = {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  description: string;
  hint: string;
  check: (overview: StatsOverview) => boolean;
};

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_step',
    icon: 'leaf-outline',
    iconColor: '#10b981',
    title: 'First Step',
    description: 'You completed your first task. Every journey starts with a single step.',
    hint: 'Complete your very first task to unlock this.',
    check: (o) => o.completedTasks >= 1,
  },
  {
    id: 'half_century',
    icon: 'radio-button-on-outline',
    iconColor: '#3b82f6',
    title: 'Half Century',
    description: '50 tasks done. You are building serious momentum.',
    hint: 'Complete 50 tasks in total to unlock this.',
    check: (o) => o.completedTasks >= 50,
  },
  {
    id: 'century',
    icon: 'checkmark-done-outline',
    iconColor: '#1e40af',
    title: 'Century',
    description: '100 tasks completed. You are a productivity machine.',
    hint: 'Complete 100 tasks in total to unlock this.',
    check: (o) => o.completedTasks >= 100,
  },
  {
    id: 'on_a_roll',
    icon: 'flame-outline',
    iconColor: '#f59e0b',
    title: 'On a Roll',
    description: '3 days in a row. The streak is alive — keep the fire burning.',
    hint: 'Reach a 3-day streak to unlock this.',
    check: (o) => o.bestStreak >= 3,
  },
  {
    id: 'week_warrior',
    icon: 'shield-outline',
    iconColor: '#6366f1',
    title: 'Week Warrior',
    description: '7 days straight. A full week of discipline and focus.',
    hint: 'Reach a 7-day streak to unlock this.',
    check: (o) => o.bestStreak >= 7,
  },
  {
    id: 'unstoppable',
    icon: 'rocket-outline',
    iconColor: '#06b6d4',
    title: 'Unstoppable',
    description: '30 days without breaking. You are truly unstoppable.',
    hint: 'Reach a 30-day streak to unlock this.',
    check: (o) => o.bestStreak >= 30,
  },
  {
    id: 'perfect_day',
    icon: 'star-outline',
    iconColor: '#f59e0b',
    title: 'Perfect Day',
    description: '100% completion in a single day. Flawless execution.',
    hint: 'Complete 100% of your tasks on any single day.',
    check: (o) => o.dailyStats.some(d => d.rate === 100),
  },
  {
    id: 'perfect_week',
    icon: 'trophy-outline',
    iconColor: '#d97706',
    title: 'Perfect Week',
    description: '7 consecutive perfect days. Elite level consistency.',
    hint: 'Hit 100% completion for 7 days in a row.',
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
    icon: 'calendar-outline',
    iconColor: '#8b5cf6',
    title: 'Consistent',
    description: 'Active on 7 different days. Consistency beats intensity.',
    hint: 'Use FlowDay on 7 different days to unlock this.',
    check: (o) => o.insights.totalActiveDays >= 7,
  },
  {
    id: 'dedicated',
    icon: 'medal-outline',
    iconColor: '#ec4899',
    title: 'Dedicated',
    description: 'Active on 30 different days. This is a lifestyle now.',
    hint: 'Use FlowDay on 30 different days to unlock this.',
    check: (o) => o.insights.totalActiveDays >= 30,
  },
];

export const evaluateBadges = (overview: StatsOverview): Badge[] => {
  return BADGE_DEFINITIONS.map(def => ({
    id: def.id,
    icon: def.icon,
    iconColor: def.iconColor,
    title: def.title,
    description: def.description,
    hint: def.hint,
    unlocked: def.check(overview),
  }));
};
