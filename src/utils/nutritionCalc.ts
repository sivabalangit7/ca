import { FoodItem, LoggedFoodItem, MealCategory } from '../types/food';
import { MacroTotals } from '../types/dailyLog';

export function roundToDecimal(value: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function calculateFoodNutrition(food: FoodItem, quantity: number): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
} {
  const safeQty = Math.max(0, isNaN(quantity) ? 0 : Number(quantity) || 0);
  const calories = Number(food?.calories) || 0;
  const protein = Number(food?.protein) || 0;
  const carbs = Number(food?.carbs) || 0;
  const fat = Number(food?.fat) || 0;
  const fiber = Number(food?.fiber) || 0;

  return {
    calories: Math.round(calories * safeQty),
    protein: roundToDecimal(protein * safeQty, 1),
    carbs: roundToDecimal(carbs * safeQty, 1),
    fat: roundToDecimal(fat * safeQty, 1),
    fiber: roundToDecimal(fiber * safeQty, 1),
  };
}

export function calculateMacroTotals(foods: LoggedFoodItem[] = []): MacroTotals {
  if (!Array.isArray(foods)) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  }
  return foods.reduce(
    (acc, item) => ({
      calories: acc.calories + (Number(item?.calories) || 0),
      protein: roundToDecimal(acc.protein + (Number(item?.protein) || 0), 1),
      carbs: roundToDecimal(acc.carbs + (Number(item?.carbs) || 0), 1),
      fat: roundToDecimal(acc.fat + (Number(item?.fat) || 0), 1),
      fiber: roundToDecimal(acc.fiber + (Number(item?.fiber) || 0), 1),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

export function calculateMealTotals(
  foods: LoggedFoodItem[] = [],
  meal: MealCategory
): MacroTotals {
  if (!Array.isArray(foods)) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  }
  const mealFoods = foods.filter((f) => f && f.mealCategory === meal);
  return calculateMacroTotals(mealFoods);
}


export function formatMacro(value: number, unit: string = 'g'): string {
  if (value === undefined || value === null || isNaN(value)) return `0 ${unit}`;
  return `${value} ${unit}`;
}

export function formatCalories(value: number): string {
  if (!value || isNaN(value)) return '0 kcal';
  return `${Math.round(value).toLocaleString()} kcal`;
}
