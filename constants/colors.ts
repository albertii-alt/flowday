export const Colors = {
  light: {
    primary: '#1e40af',       // deep navy blue
    primaryLight: '#3b82f6',
    accent: '#0891b2',        // teal
    background: '#eef2f7',    // blue-tinted slate — Option C
    surface: '#f8fafc',       // near white with blue tint
    textPrimary: '#0f172a',   // near black
    textSecondary: '#334155', // dark slate
    textMuted: '#94a3b8',
    border: '#dde3ed',        // blue-tinted border
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    streakBg: '#eff6ff',      // light blue tint
    streakText: '#1e40af',
    donutGlow: 'rgba(30,64,175,0.15)',
  },
  dark: {
    primary: '#3b82f6',       // blue — clean, masculine
    primaryLight: '#60a5fa',
    accent: '#06b6d4',        // teal
    background: '#0d0d0f',    // near black — premium
    surface: '#18181b',       // graphite
    textPrimary: '#f4f4f5',   // off-white
    textSecondary: '#a1a1aa', // zinc
    textMuted: '#52525b',     // dark zinc
    border: '#27272a',        // subtle graphite border
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    streakBg: '#1c1400',
    streakText: '#f59e0b',
    donutGlow: 'rgba(59,130,246,0.18)',
  },
} as const;

export type Theme = typeof Colors.light;
