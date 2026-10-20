import { HabitLog, HabitStats, HabitDefinition } from '../types/habit';
import { DEFAULT_HABITS } from '../data/defaultHabits';
import { storageService } from './storageService';
import { apiService } from './apiService';
import { getTodayKey, getLastNDays } from '../utils/dateUtils';
import { generateSampleHabitLogs, isAppInitialized, markAppInitialized } from '../data/sampleData';

const HABIT_LOGS_KEY = 'habit_logs_map';

export const habitService = {
  getHabitsList(): HabitDefinition[] {
    return DEFAULT_HABITS;
  },

  getAllHabitLogs(): Record<string, HabitLog> {
    const raw = storageService.getData<Record<string, HabitLog> | null>(HABIT_LOGS_KEY, null);
    if (!raw) {
      if (!isAppInitialized()) {
        const sample = generateSampleHabitLogs();
        storageService.saveData(HABIT_LOGS_KEY, sample);
        markAppInitialized();
        return sample;
      }
      return {};
    }
    return raw;
  },

  getHabitLog(dateKey: string = getTodayKey()): HabitLog {
    const all = habitService.getAllHabitLogs();
    if (!all[dateKey]) {
      const empty: HabitLog = { date: dateKey, completedHabitIds: [] };
      all[dateKey] = empty;
      storageService.saveData(HABIT_LOGS_KEY, all);
      
      apiService.getHabitLog(dateKey).then((h) => {
        if (h && Array.isArray(h.completedHabitIds) && h.completedHabitIds.length > 0) {
          all[dateKey] = { date: dateKey, completedHabitIds: h.completedHabitIds };
          storageService.saveData(HABIT_LOGS_KEY, all);
        }
      }).catch(() => {});
      return empty;
    }
    if (!Array.isArray(all[dateKey].completedHabitIds)) {
      all[dateKey].completedHabitIds = [];
    }
    return all[dateKey];
  },

  toggleHabit(dateKey: string, habitId: string): HabitLog {
    const all = habitService.getAllHabitLogs();
    const currentLog = all[dateKey] || { date: dateKey, completedHabitIds: [] };
    const currentIds = Array.isArray(currentLog.completedHabitIds) ? currentLog.completedHabitIds : [];
    const isCompleted = currentIds.includes(habitId);

    const updatedIds = isCompleted
      ? currentIds.filter((id) => id !== habitId)
      : [...currentIds, habitId];

    all[dateKey] = {
      date: dateKey,
      completedHabitIds: updatedIds,
    };

    storageService.saveData(HABIT_LOGS_KEY, all);

    // Sync to SQLite database
    apiService.toggleHabit(dateKey, habitId).catch(() => {});

    return all[dateKey];
  },

  clearHabitLog(dateKey: string = getTodayKey()): HabitLog {
    const all = habitService.getAllHabitLogs();
    const cleared: HabitLog = { date: dateKey, completedHabitIds: [] };
    all[dateKey] = cleared;
    storageService.saveData(HABIT_LOGS_KEY, all);
    return cleared;
  },

  resetAllHabits(): void {
    storageService.saveData(HABIT_LOGS_KEY, {});
  },

  calculateStats(dateKey: string = getTodayKey()): HabitStats {
    const allLogs = habitService.getAllHabitLogs();
    const totalHabitsCount = DEFAULT_HABITS.length;
    if (totalHabitsCount === 0) {
      return { todayScore: 0, weeklyScore: 0, currentStreak: 0, bestStreak: 0 };
    }

    const todayLog = allLogs[dateKey];
    const todayCount = todayLog && Array.isArray(todayLog.completedHabitIds) ? todayLog.completedHabitIds.length : 0;
    const todayScore = Math.round((todayCount / totalHabitsCount) * 100);

    const past7Days = getLastNDays(7);
    let weeklyTotalCompleted = 0;
    past7Days.forEach((d) => {
      const log = allLogs[d];
      if (log && Array.isArray(log.completedHabitIds)) {
        weeklyTotalCompleted += log.completedHabitIds.length;
      }
    });
    const weeklyScore = Math.round((weeklyTotalCompleted / (totalHabitsCount * 7)) * 100);

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    const checkDays = getLastNDays(60);
    const chronological = [...checkDays].reverse();

    chronological.forEach((d) => {
      const log = allLogs[d];
      const completed = log && Array.isArray(log.completedHabitIds) ? log.completedHabitIds.length : 0;
      const ratio = completed / totalHabitsCount;
      if (ratio >= 0.5) {
        tempStreak += 1;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    });

    for (let i = 0; i < checkDays.length; i++) {
      const d = checkDays[i];
      const log = allLogs[d];
      const completed = log && Array.isArray(log.completedHabitIds) ? log.completedHabitIds.length : 0;
      const ratio = completed / totalHabitsCount;

      if (i === 0 && ratio < 0.5) {
        continue;
      }

      if (ratio >= 0.5) {
        currentStreak += 1;
      } else {
        break;
      }
    }

    return {
      todayScore,
      weeklyScore,
      currentStreak,
      bestStreak: Math.max(bestStreak, currentStreak),
    };
  },

  preloadSampleHabits(): void {
    const sample = generateSampleHabitLogs();
    storageService.saveData(HABIT_LOGS_KEY, sample);
    markAppInitialized();
  },
};
