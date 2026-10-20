import { useState, useCallback } from 'react';
import { HabitDefinition, HabitLog, HabitStats } from '../types/habit';
import { habitService } from '../services/habitService';
import { getTodayKey } from '../utils/dateUtils';

export function useHabits(dateKey: string = getTodayKey()) {
  const habitsList: HabitDefinition[] = habitService.getHabitsList();
  const [prevDateKey, setPrevDateKey] = useState(dateKey);
  const [currentLog, setCurrentLog] = useState<HabitLog>(() => habitService.getHabitLog(dateKey));
  const [stats, setStats] = useState<HabitStats>(() => habitService.calculateStats(dateKey));

  if (dateKey !== prevDateKey) {
    setPrevDateKey(dateKey);
    setCurrentLog(habitService.getHabitLog(dateKey));
    setStats(habitService.calculateStats(dateKey));
  }

  const refreshHabits = useCallback(() => {
    setCurrentLog(habitService.getHabitLog(dateKey));
    setStats(habitService.calculateStats(dateKey));
  }, [dateKey]);

  const toggleHabit = (habitId: string) => {
    const updated = habitService.toggleHabit(dateKey, habitId);
    setCurrentLog(updated);
    setStats(habitService.calculateStats(dateKey));
  };

  const clearHabitLog = () => {
    const updated = habitService.clearHabitLog(dateKey);
    setCurrentLog(updated);
    setStats(habitService.calculateStats(dateKey));
  };

  const resetAllHabits = () => {
    habitService.resetAllHabits();
    refreshHabits();
  };

  return {
    habitsList,
    currentLog,
    stats,
    toggleHabit,
    clearHabitLog,
    resetAllHabits,
    refreshHabits,
  };
}

