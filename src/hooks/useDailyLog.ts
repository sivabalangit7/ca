import { useState, useCallback } from 'react';
import { DailyLog } from '../types/dailyLog';
import { FoodItem, MealCategory } from '../types/food';
import { logService } from '../services/logService';
import { getTodayKey } from '../utils/dateUtils';
import { calculateMacroTotals } from '../utils/nutritionCalc';

export function useDailyLog(dateKey: string = getTodayKey()) {
  const [prevDateKey, setPrevDateKey] = useState(dateKey);
  const [log, setLog] = useState<DailyLog>(() => logService.getDailyLog(dateKey));

  if (dateKey !== prevDateKey) {
    setPrevDateKey(dateKey);
    setLog(logService.getDailyLog(dateKey));
  }

  const refreshLog = useCallback(() => {
    setLog(logService.getDailyLog(dateKey));
  }, [dateKey]);

  const totals = calculateMacroTotals(log?.foods || []);

  const addFood = useCallback(
    (food: FoodItem, quantity: number, mealCategory: MealCategory) => {
      logService.addFoodToLog(dateKey, food, quantity, mealCategory);
      refreshLog();
    },
    [dateKey, refreshLog]
  );

  const updateFoodQty = useCallback(
    (logId: string, quantity: number, allFoods: FoodItem[]) => {
      logService.updateLoggedFoodQuantity(dateKey, logId, quantity, allFoods);
      refreshLog();
    },
    [dateKey, refreshLog]
  );

  const deleteFood = useCallback(
    (logId: string) => {
      logService.deleteLoggedFood(dateKey, logId);
      refreshLog();
    },
    [dateKey, refreshLog]
  );

  const clearMealLog = useCallback(
    (mealCategory: MealCategory) => {
      logService.clearMealLog(dateKey, mealCategory);
      refreshLog();
    },
    [dateKey, refreshLog]
  );

  const clearDayLog = useCallback(() => {
    logService.clearDayLog(dateKey);
    refreshLog();
  }, [dateKey, refreshLog]);

  const resetAllLogs = useCallback(() => {
    logService.resetAllLogs();
    refreshLog();
  }, [refreshLog]);

  const addWater = useCallback(
    (amountMl: number) => {
      logService.addWater(dateKey, amountMl);
      refreshLog();
    },
    [dateKey, refreshLog]
  );

  const updateWaterTarget = useCallback(
    (targetMl: number) => {
      logService.updateWaterTarget(dateKey, targetMl);
      refreshLog();
    },
    [dateKey, refreshLog]
  );

  const updateActivity = useCallback(
    (update: Partial<DailyLog['activity']>) => {
      logService.updateActivity(dateKey, update);
      refreshLog();
    },
    [dateKey, refreshLog]
  );

  return {
    log,
    totals,
    refreshLog,
    addFood,
    updateFoodQty,
    deleteFood,
    clearMealLog,
    clearDayLog,
    resetAllLogs,
    addWater,
    updateWaterTarget,
    updateActivity,
  };
}

