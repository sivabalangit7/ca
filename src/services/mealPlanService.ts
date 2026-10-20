import { DayPlan, PlannedMealItem, WeeklyMealPlan } from '../types/mealPlan';
import { FoodItem, MealCategory } from '../types/food';
import { calculateFoodNutrition } from '../utils/nutritionCalc';
import { storageService } from './storageService';
import { generateSampleWeeklyMealPlan, isAppInitialized, markAppInitialized } from '../data/sampleData';

const MEAL_PLAN_KEY = 'weekly_meal_plan';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export function createEmptyDayPlan(day: DayPlan['dayOfWeek']): DayPlan {
  return {
    dayOfWeek: day,
    meals: {
      breakfast: [],
      lunch: [],
      snacks: [],
      dinner: [],
    },
  };
}

export function createEmptyWeeklyPlan(): WeeklyMealPlan {
  const plan: WeeklyMealPlan = {};
  DAYS_OF_WEEK.forEach((d) => {
    plan[d] = createEmptyDayPlan(d);
  });
  return plan;
}

export const mealPlanService = {
  getWeeklyPlan(): WeeklyMealPlan {
    const raw = storageService.getData<WeeklyMealPlan | null>(MEAL_PLAN_KEY, null);
    if (!raw) {
      if (!isAppInitialized()) {
        const sample = generateSampleWeeklyMealPlan();
        storageService.saveData(MEAL_PLAN_KEY, sample);
        markAppInitialized();
        return sample;
      }
      const empty = createEmptyWeeklyPlan();
      storageService.saveData(MEAL_PLAN_KEY, empty);
      return empty;
    }
    return raw;
  },

  saveWeeklyPlan(plan: WeeklyMealPlan): void {
    storageService.saveData(MEAL_PLAN_KEY, plan);
  },

  getDayPlan(day: DayPlan['dayOfWeek']): DayPlan {
    const weekly = mealPlanService.getWeeklyPlan();
    if (!weekly[day]) {
      const empty = createEmptyDayPlan(day);
      weekly[day] = empty;
      mealPlanService.saveWeeklyPlan(weekly);
      return empty;
    }
    return weekly[day];
  },

  addFoodToDayPlan(
    day: DayPlan['dayOfWeek'],
    mealCategory: MealCategory,
    food: FoodItem,
    quantity: number
  ): PlannedMealItem {
    const weekly = mealPlanService.getWeeklyPlan();
    const dayPlan = weekly[day] || createEmptyDayPlan(day);

    const calculated = calculateFoodNutrition(food, quantity);
    const plannedItem: PlannedMealItem = {
      id: `pitem-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      foodId: food.id,
      name: food.name,
      serving: food.serving,
      quantity,
      ...calculated,
    };

    dayPlan.meals[mealCategory].push(plannedItem);
    weekly[day] = dayPlan;
    mealPlanService.saveWeeklyPlan(weekly);
    return plannedItem;
  },

  removeFoodFromDayPlan(
    day: DayPlan['dayOfWeek'],
    mealCategory: MealCategory,
    itemId: string
  ): void {
    const weekly = mealPlanService.getWeeklyPlan();
    const dayPlan = weekly[day];
    if (!dayPlan) return;

    dayPlan.meals[mealCategory] = dayPlan.meals[mealCategory].filter((i) => i.id !== itemId);
    weekly[day] = dayPlan;
    mealPlanService.saveWeeklyPlan(weekly);
  },

  copyDayPlan(fromDay: DayPlan['dayOfWeek'], toDay: DayPlan['dayOfWeek']): void {
    const weekly = mealPlanService.getWeeklyPlan();
    const source = weekly[fromDay] || createEmptyDayPlan(fromDay);

    // Deep clone with new IDs
    const clonedMeals = {
      breakfast: source.meals.breakfast.map((item) => ({
        ...item,
        id: `pitem-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      })),
      lunch: source.meals.lunch.map((item) => ({
        ...item,
        id: `pitem-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      })),
      snacks: source.meals.snacks.map((item) => ({
        ...item,
        id: `pitem-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      })),
      dinner: source.meals.dinner.map((item) => ({
        ...item,
        id: `pitem-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      })),
    };

    weekly[toDay] = {
      dayOfWeek: toDay,
      meals: clonedMeals,
    };

    mealPlanService.saveWeeklyPlan(weekly);
  },

  clearMealFromDayPlan(day: DayPlan['dayOfWeek'], mealCategory: MealCategory): void {
    const weekly = mealPlanService.getWeeklyPlan();
    if (weekly[day]?.meals) {
      weekly[day].meals[mealCategory] = [];
      mealPlanService.saveWeeklyPlan(weekly);
    }
  },

  clearDayPlan(day: DayPlan['dayOfWeek']): void {
    const weekly = mealPlanService.getWeeklyPlan();
    weekly[day] = createEmptyDayPlan(day);
    mealPlanService.saveWeeklyPlan(weekly);
  },

  clearWeeklyPlan(): void {
    const empty = createEmptyWeeklyPlan();
    mealPlanService.saveWeeklyPlan(empty);
  },

  preloadSampleMealPlan(): void {
    const sample = generateSampleWeeklyMealPlan();
    mealPlanService.saveWeeklyPlan(sample);
    markAppInitialized();
  },
};

