import { LoggedFoodItem } from './food';

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface WaterLog {
  amountMl: number;
  targetMl: number;
  entries: { id: string; amountMl: number; timestamp: string }[];
}

export interface ActivityLog {
  steps: number;
  targetSteps: number;
  exerciseMinutes: number;
  sleepHours: number;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  foods: LoggedFoodItem[];
  water: WaterLog;
  activity: ActivityLog;
  notes?: string;
}

export interface DailyNutritionSummary extends MacroTotals {
  date: string;
  mealBreakdown: {
    breakfast: MacroTotals;
    lunch: MacroTotals;
    snacks: MacroTotals;
    dinner: MacroTotals;
  };
}
