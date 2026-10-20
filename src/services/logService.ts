import { DailyLog, WaterLog, ActivityLog } from '../types/dailyLog';
import { FoodItem, LoggedFoodItem, MealCategory } from '../types/food';
import { storageService } from './storageService';
import { apiService } from './apiService';
import { calculateFoodNutrition } from '../utils/nutritionCalc';
import { getTodayKey } from '../utils/dateUtils';
import { generateSampleDailyLogs, isAppInitialized, markAppInitialized } from '../data/sampleData';

const DAILY_LOGS_KEY = 'daily_logs_map';

export function createEmptyDailyLog(dateKey: string): DailyLog {
  return {
    date: dateKey,
    foods: [],
    water: {
      amountMl: 0,
      targetMl: 2500,
      entries: [],
    },
    activity: {
      steps: 0,
      targetSteps: 8500,
      exerciseMinutes: 0,
      sleepHours: 7.0,
    },
  };
}

export const logService = {
  getAllLogs(): Record<string, DailyLog> {
    const raw = storageService.getData<Record<string, DailyLog> | null>(DAILY_LOGS_KEY, null);
    if (!raw) {
      const emptyMap: Record<string, DailyLog> = {};
      storageService.saveData(DAILY_LOGS_KEY, emptyMap);
      return emptyMap;
    }
    return raw;
  },

  getDailyLog(dateKey: string = getTodayKey()): DailyLog {
    const all = logService.getAllLogs();
    if (!all[dateKey]) {
      const empty = createEmptyDailyLog(dateKey);
      all[dateKey] = empty;
      storageService.saveData(DAILY_LOGS_KEY, all);
      // Fetch from API in background if exists
      apiService.getDailyLog(dateKey).then((apiLog) => {
        if (apiLog && apiLog.foods && apiLog.foods.length > 0) {
          all[dateKey] = apiLog;
          storageService.saveData(DAILY_LOGS_KEY, all);
        }
      }).catch(() => {});
      return empty;
    }
    if (!Array.isArray(all[dateKey].foods)) {
      all[dateKey].foods = [];
    }

    // Try background sync with SQLite DB
    apiService.getDailyLog(dateKey).then((apiLog) => {
      if (apiLog && apiLog.foods && Array.isArray(apiLog.foods)) {
        all[dateKey] = apiLog;
        storageService.saveData(DAILY_LOGS_KEY, all);
      }
    }).catch(() => {});

    return all[dateKey];
  },

  async syncDailyLogFromDB(dateKey: string): Promise<DailyLog> {
    try {
      const apiLog = await apiService.getDailyLog(dateKey);
      if (apiLog) {
        const all = logService.getAllLogs();
        all[dateKey] = apiLog;
        storageService.saveData(DAILY_LOGS_KEY, all);
        return apiLog;
      }
    } catch {
      // fallback
    }
    return logService.getDailyLog(dateKey);
  },

  saveDailyLog(log: DailyLog): void {
    const all = logService.getAllLogs();
    all[log.date] = log;
    storageService.saveData(DAILY_LOGS_KEY, all);
  },

  addFoodToLog(
    dateKey: string,
    food: FoodItem,
    quantity: number,
    mealCategory: MealCategory,
    source: 'manual' | 'ai_scan' = 'manual'
  ): LoggedFoodItem {
    const log = logService.getDailyLog(dateKey);
    const calculated = calculateFoodNutrition(food, quantity);
    const uniqueId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const loggedItem: LoggedFoodItem = {
      logId: uniqueId,
      id: uniqueId,
      foodId: food.id,
      name: food.name,
      foodName: food.name,
      category: food.category,
      mealCategory,
      mealType: mealCategory,
      serving: food.serving,
      quantity,
      unit: food.servingUnit || 'serving',
      ...calculated,
      dietary: food.dietary,
      loggedAt: new Date().toISOString(),
      date: dateKey,
      source,
    };

    log.foods.push(loggedItem);
    logService.saveDailyLog(log);

    // Save to Python SQLite database
    apiService.addFoodToLog(dateKey, {
      foodId: food.id,
      name: food.name,
      category: food.category,
      mealCategory,
      serving: food.serving,
      unit: food.servingUnit || 'serving',
      quantity,
      calories: calculated.calories,
      protein: calculated.protein,
      carbs: calculated.carbs,
      fat: calculated.fat,
      fiber: calculated.fiber,
      dietary: food.dietary,
      source,
    }).then((saved) => {
      if (saved && saved.logId) {
        loggedItem.logId = saved.logId;
        loggedItem.id = saved.logId;
        logService.saveDailyLog(log);
      }
    }).catch(() => {});

    return loggedItem;
  },

  addDetectedFoodsToLog(
    dateKey: string,
    detectedFoods: {
      name: string;
      matchedFoodId?: string;
      quantity: number;
      unit: string;
      serving: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      dietary?: any;
      category?: any;
    }[],
    mealCategory: MealCategory
  ): LoggedFoodItem[] {
    const log = logService.getDailyLog(dateKey);
    const newItems: LoggedFoodItem[] = [];

    detectedFoods.forEach((df, index) => {
      const uniqueId = `log-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 8)}`;
      const loggedItem: LoggedFoodItem = {
        logId: uniqueId,
        id: uniqueId,
        foodId: df.matchedFoodId || `custom-${Date.now()}-${index}`,
        name: df.name,
        foodName: df.name,
        category: df.category || 'Custom',
        mealCategory,
        mealType: mealCategory,
        serving: df.serving || `${df.quantity} ${df.unit}`,
        quantity: df.quantity,
        unit: df.unit,
        calories: Math.round(df.calories || 0),
        protein: Math.round((df.protein || 0) * 10) / 10,
        carbs: Math.round((df.carbs || 0) * 10) / 10,
        fat: Math.round((df.fat || 0) * 10) / 10,
        fiber: Math.round((df.fiber || 0) * 10) / 10,
        dietary: df.dietary || 'veg',
        loggedAt: new Date().toISOString(),
        date: dateKey,
        source: 'ai_scan',
      };
      log.foods.push(loggedItem);
      newItems.push(loggedItem);

      // Persist to SQLite DB
      apiService.addFoodToLog(dateKey, {
        foodId: loggedItem.foodId,
        name: loggedItem.name,
        category: loggedItem.category,
        mealCategory,
        serving: loggedItem.serving,
        unit: loggedItem.unit || 'serving',
        quantity: loggedItem.quantity,
        calories: loggedItem.calories,
        protein: loggedItem.protein,
        carbs: loggedItem.carbs,
        fat: loggedItem.fat,
        fiber: loggedItem.fiber,
        dietary: loggedItem.dietary,
        source: 'ai_scan',
      }).catch(() => {});
    });

    logService.saveDailyLog(log);
    return newItems;
  },

  updateLoggedFoodQuantity(
    dateKey: string,
    logId: string,
    newQuantity: number,
    allFoods: FoodItem[]
  ): void {
    const log = logService.getDailyLog(dateKey);
    const target = log.foods.find((f) => f.logId === logId || f.id === logId);
    if (!target) return;

    const baseFood = allFoods.find((f) => f.id === target.foodId);
    if (baseFood) {
      const calculated = calculateFoodNutrition(baseFood, newQuantity);
      target.quantity = newQuantity;
      target.calories = calculated.calories;
      target.protein = calculated.protein;
      target.carbs = calculated.carbs;
      target.fat = calculated.fat;
      target.fiber = calculated.fiber;
    } else {
      const ratio = target.quantity > 0 ? newQuantity / target.quantity : 1;
      target.quantity = newQuantity;
      target.calories = Math.round(target.calories * ratio);
      target.protein = parseFloat((target.protein * ratio).toFixed(1));
      target.carbs = parseFloat((target.carbs * ratio).toFixed(1));
      target.fat = parseFloat((target.fat * ratio).toFixed(1));
      target.fiber = parseFloat((target.fiber * ratio).toFixed(1));
    }

    logService.saveDailyLog(log);
    // Sync update to SQLite database
    apiService.updateFoodQuantity(dateKey, logId, newQuantity).catch(() => {});
  },

  deleteLoggedFood(dateKey: string, logId: string): void {
    const log = logService.getDailyLog(dateKey);
    log.foods = log.foods.filter((f) => f.logId !== logId && f.id !== logId);
    logService.saveDailyLog(log);
    // Sync delete to SQLite database
    apiService.deleteLoggedFood(dateKey, logId).catch(() => {});
  },

  addWater(dateKey: string, amountMl: number): WaterLog {
    const log = logService.getDailyLog(dateKey);
    const current = log.water || { amountMl: 0, targetMl: 2500, entries: [] };
    const newTotal = Math.max(0, current.amountMl + amountMl);

    const updatedWater: WaterLog = {
      amountMl: newTotal,
      targetMl: current.targetMl || 2500,
      entries: [
        ...(current.entries || []),
        {
          id: `w-${Date.now()}`,
          amountMl,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    log.water = updatedWater;
    logService.saveDailyLog(log);
    // Sync to SQLite database
    apiService.addWater(dateKey, amountMl, current.targetMl).catch(() => {});
    return updatedWater;
  },

  updateWaterTarget(dateKey: string, targetMl: number): void {
    const log = logService.getDailyLog(dateKey);
    if (!log.water) {
      log.water = { amountMl: 0, targetMl, entries: [] };
    } else {
      log.water.targetMl = targetMl;
    }
    logService.saveDailyLog(log);
    apiService.addWater(dateKey, 0, targetMl).catch(() => {});
  },

  updateActivity(dateKey: string, update: Partial<ActivityLog>): ActivityLog {
    const log = logService.getDailyLog(dateKey);
    const current = log.activity || {
      steps: 0,
      targetSteps: 8500,
      exerciseMinutes: 0,
      sleepHours: 7,
    };

    log.activity = {
      ...current,
      ...update,
    };

    logService.saveDailyLog(log);
    // Sync to SQLite database
    apiService.updateActivity(dateKey, update).catch(() => {});
    return log.activity;
  },

  clearMealLog(dateKey: string, mealCategory: MealCategory): void {
    const log = logService.getDailyLog(dateKey);
    log.foods = log.foods.filter((f) => f.mealCategory !== mealCategory);
    logService.saveDailyLog(log);
    apiService.clearMeal(dateKey, mealCategory).catch(() => {});
  },

  clearDayLog(dateKey: string): void {
    const empty = createEmptyDailyLog(dateKey);
    logService.saveDailyLog(empty);
    apiService.clearDay(dateKey).catch(() => {});
  },

  resetAllLogs(): void {
    storageService.saveData(DAILY_LOGS_KEY, {});
  },

  preloadSampleLogs(): void {
    const sample = generateSampleDailyLogs();
    storageService.saveData(DAILY_LOGS_KEY, sample);
    markAppInitialized();
  },
};
