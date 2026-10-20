export interface HabitDefinition {
  id: string;
  title: string;
  description: string;
  category: 'nutrition' | 'hydration' | 'activity' | 'lifestyle';
  icon: string; // lucide icon identifier
}

export interface HabitLog {
  date: string; // YYYY-MM-DD
  completedHabitIds: string[];
}

export interface HabitStats {
  todayScore: number;       // percentage 0 - 100
  weeklyScore: number;      // percentage 0 - 100
  currentStreak: number;    // consecutive days with >= 70% completion
  bestStreak: number;
}
