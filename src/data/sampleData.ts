import { DailyLog } from '../types/dailyLog';
import { HabitLog } from '../types/habit';
import { UserProfile } from '../types/profile';
import { WeeklyMealPlan } from '../types/mealPlan';
import { FoodItem } from '../types/food';
import { getOffsetDateKey } from '../utils/dateUtils';
import { calculateFoodNutrition } from '../utils/nutritionCalc';
import { INITIAL_INDIAN_FOODS } from './indianFoods';

// Helper to look up sample items
function getFood(id: string): FoodItem {
  const f = INITIAL_INDIAN_FOODS.find((item) => item.id === id);
  if (!f) throw new Error(`Food id ${id} not found in INITIAL_INDIAN_FOODS`);
  return f;
}

export const SAMPLE_PROFILE: UserProfile = {
  name: 'Aditya Sharma',
  age: 26,
  gender: 'male',
  heightCm: 174,
  weightKg: 68,
  activityLevel: 'moderately_active',
  goal: 'maintain_health',
  dietaryPreference: 'non-veg',
  targetCalories: 2150,
  targetProteinG: 95,
  targetCarbsG: 260,
  targetFatG: 65,
  targetFiberG: 32,
  targetWaterMl: 2500,
  targetSteps: 8500,
  isCustomTargets: false,
};

export function generateSampleDailyLogs(): Record<string, DailyLog> {
  const logs: Record<string, DailyLog> = {};

  // Sample items
  const idli = getFood('si-idli');
  const sambar = getFood('si-sambar');
  const boiledEgg = getFood('pr-boiled-egg');
  const whiteRice = getFood('rc-white-rice');
  const dalTadka = getFood('ni-dal-tadka');
  const curd = getFood('ni-curd');
  const banana = getFood('fr-banana');
  const peanuts = getFood('pr-roasted-peanuts');
  const chai = getFood('bv-masala-chai');
  const roti = getFood('ni-roti');
  const chickenCurry = getFood('pr-chicken-curry');

  // Generate for past 30 days so charts have full data
  for (let i = 0; i <= 30; i++) {
    const dateKey = getOffsetDateKey(-i);
    const _daySeed = i % 5;

    // Today's exact prompt specification:
    // Breakfast: 2 idli, 1 cup sambar, 2 eggs
    // Lunch: Rice, Dal, Curd
    // Snack: Banana, Peanuts, Chai
    // Dinner: 2 chapati, Chicken curry
    const foods = [
      {
        logId: `${dateKey}-bf-1`,
        foodId: idli.id,
        name: idli.name,
        category: idli.category,
        mealCategory: 'breakfast' as const,
        serving: idli.serving,
        quantity: 2,
        ...calculateFoodNutrition(idli, 2),
        dietary: idli.dietary,
        loggedAt: `${dateKey}T08:30:00.000Z`,
        source: 'manual' as const,
      },
      {
        logId: `${dateKey}-bf-2`,
        foodId: sambar.id,
        name: sambar.name,
        category: sambar.category,
        mealCategory: 'breakfast' as const,
        serving: sambar.serving,
        quantity: 1,
        ...calculateFoodNutrition(sambar, 1),
        dietary: sambar.dietary,
        loggedAt: `${dateKey}T08:35:00.000Z`,
        source: 'manual' as const,
      },
      {
        logId: `${dateKey}-bf-3`,
        foodId: boiledEgg.id,
        name: boiledEgg.name,
        category: boiledEgg.category,
        mealCategory: 'breakfast' as const,
        serving: boiledEgg.serving,
        quantity: 2,
        ...calculateFoodNutrition(boiledEgg, 2),
        dietary: boiledEgg.dietary,
        loggedAt: `${dateKey}T08:40:00.000Z`,
        source: 'manual' as const,
      },
      {
        logId: `${dateKey}-lu-1`,
        foodId: whiteRice.id,
        name: whiteRice.name,
        category: whiteRice.category,
        mealCategory: 'lunch' as const,
        serving: whiteRice.serving,
        quantity: 1.5,
        ...calculateFoodNutrition(whiteRice, 1.5),
        dietary: whiteRice.dietary,
        loggedAt: `${dateKey}T13:15:00.000Z`,
        source: 'manual' as const,
      },
      {
        logId: `${dateKey}-lu-2`,
        foodId: dalTadka.id,
        name: dalTadka.name,
        category: dalTadka.category,
        mealCategory: 'lunch' as const,
        serving: dalTadka.serving,
        quantity: 1,
        ...calculateFoodNutrition(dalTadka, 1),
        dietary: dalTadka.dietary,
        loggedAt: `${dateKey}T13:20:00.000Z`,
        source: 'manual' as const,
      },
      {
        logId: `${dateKey}-lu-3`,
        foodId: curd.id,
        name: curd.name,
        category: curd.category,
        mealCategory: 'lunch' as const,
        serving: curd.serving,
        quantity: 1,
        ...calculateFoodNutrition(curd, 1),
        dietary: curd.dietary,
        loggedAt: `${dateKey}T13:25:00.000Z`,
        source: 'manual' as const,
      },
      {
        logId: `${dateKey}-sn-1`,
        foodId: banana.id,
        name: banana.name,
        category: banana.category,
        mealCategory: 'snacks' as const,
        serving: banana.serving,
        quantity: 1,
        ...calculateFoodNutrition(banana, 1),
        dietary: banana.dietary,
        loggedAt: `${dateKey}T17:00:00.000Z`,
        source: 'manual' as const,
      },
      {
        logId: `${dateKey}-sn-2`,
        foodId: peanuts.id,
        name: peanuts.name,
        category: peanuts.category,
        mealCategory: 'snacks' as const,
        serving: peanuts.serving,
        quantity: 1,
        ...calculateFoodNutrition(peanuts, 1),
        dietary: peanuts.dietary,
        loggedAt: `${dateKey}T17:05:00.000Z`,
        source: 'manual' as const,
      },
      {
        logId: `${dateKey}-sn-3`,
        foodId: chai.id,
        name: chai.name,
        category: chai.category,
        mealCategory: 'snacks' as const,
        serving: chai.serving,
        quantity: 1,
        ...calculateFoodNutrition(chai, 1),
        dietary: chai.dietary,
        loggedAt: `${dateKey}T17:10:00.000Z`,
        source: 'manual' as const,
      },
      {
        logId: `${dateKey}-di-1`,
        foodId: roti.id,
        name: roti.name,
        category: roti.category,
        mealCategory: 'dinner' as const,
        serving: roti.serving,
        quantity: 2,
        ...calculateFoodNutrition(roti, 2),
        dietary: roti.dietary,
        loggedAt: `${dateKey}T20:30:00.000Z`,
        source: 'manual' as const,
      },
      {
        logId: `${dateKey}-di-2`,
        foodId: chickenCurry.id,
        name: chickenCurry.name,
        category: chickenCurry.category,
        mealCategory: 'dinner' as const,
        serving: chickenCurry.serving,
        quantity: 1,
        ...calculateFoodNutrition(chickenCurry, 1),
        dietary: chickenCurry.dietary,
        loggedAt: `${dateKey}T20:35:00.000Z`,
        source: 'manual' as const,
      },
    ];

    // Some variance for past days to make charts look authentic
    const waterBase = i === 0 ? 1750 : Math.round(2000 + ((i * 137) % 800) - 200);
    const stepsBase = i === 0 ? 7640 : Math.round(7500 + ((i * 383) % 3500) - 1000);
    const exerciseBase = i === 0 ? 35 : Math.round(30 + ((i * 17) % 30));
    const sleepBase = i === 0 ? 7.5 : parseFloat((6.5 + ((i * 0.4) % 2.0)).toFixed(1));

    logs[dateKey] = {
      date: dateKey,
      foods,
      water: {
        amountMl: waterBase,
        targetMl: 2500,
        entries: [
          { id: `${dateKey}-w-1`, amountMl: 500, timestamp: `${dateKey}T09:00:00.000Z` },
          { id: `${dateKey}-w-2`, amountMl: 250, timestamp: `${dateKey}T11:30:00.000Z` },
          { id: `${dateKey}-w-3`, amountMl: 500, timestamp: `${dateKey}T14:00:00.000Z` },
          { id: `${dateKey}-w-4`, amountMl: 500, timestamp: `${dateKey}T16:30:00.000Z` },
        ],
      },
      activity: {
        steps: stepsBase,
        targetSteps: 8500,
        exerciseMinutes: exerciseBase,
        sleepHours: sleepBase,
      },
    };
  }

  return logs;
}

export function generateSampleHabitLogs(): Record<string, HabitLog> {
  const habitLogs: Record<string, HabitLog> = {};
  const allHabitIds = [
    'habit-balanced-meals',
    'habit-protein-rich',
    'habit-fruits-veggies',
    'habit-drink-water',
    'habit-physical-activity',
    'habit-adequate-sleep',
    'habit-limit-screen',
    'habit-track-meals',
  ];

  for (let i = 0; i <= 30; i++) {
    const dateKey = getOffsetDateKey(-i);
    // Complete 6 to 8 habits for realistic high engagement
    const count = i === 0 ? 6 : 5 + (i % 4);
    const completed = allHabitIds.slice(0, Math.min(8, count));
    habitLogs[dateKey] = {
      date: dateKey,
      completedHabitIds: completed,
    };
  }

  return habitLogs;
}

export function generateSampleWeeklyMealPlan(): WeeklyMealPlan {
  const idli = getFood('si-idli');
  const sambar = getFood('si-sambar');
  const whiteRice = getFood('rc-white-rice');
  const dalTadka = getFood('ni-dal-tadka');
  const curd = getFood('ni-curd');
  const banana = getFood('fr-banana');
  const roti = getFood('ni-roti');
  const chickenCurry = getFood('pr-chicken-curry');
  const dosa = getFood('si-plain-dosa');
  const boiledEgg = getFood('pr-boiled-egg');
  const chole = getFood('ni-chole');
  const roastedChana = getFood('pr-roasted-chana');
  const paneerButter = getFood('ni-paneer-butter-masala');

  const makePlanned = (food: FoodItem, qty: number) => ({
    id: `plan-${food.id}-${Math.random().toString(36).substr(2, 6)}`,
    foodId: food.id,
    name: food.name,
    serving: food.serving,
    quantity: qty,
    ...calculateFoodNutrition(food, qty),
  });

  const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const plan: WeeklyMealPlan = {};

  days.forEach((day, index) => {
    if (index % 2 === 0) {
      plan[day] = {
        dayOfWeek: day,
        meals: {
          breakfast: [makePlanned(idli, 2), makePlanned(sambar, 1), makePlanned(boiledEgg, 2)],
          lunch: [makePlanned(whiteRice, 1.5), makePlanned(dalTadka, 1), makePlanned(curd, 1)],
          snacks: [makePlanned(banana, 1), makePlanned(roastedChana, 1)],
          dinner: [makePlanned(roti, 2), makePlanned(chickenCurry, 1)],
        },
      };
    } else {
      plan[day] = {
        dayOfWeek: day,
        meals: {
          breakfast: [makePlanned(dosa, 2), makePlanned(sambar, 1)],
          lunch: [makePlanned(whiteRice, 1), makePlanned(chole, 1), makePlanned(curd, 1)],
          snacks: [makePlanned(roastedChana, 1), makePlanned(banana, 1)],
          dinner: [makePlanned(roti, 3), makePlanned(paneerButter, 1)],
        },
      };
    }
  });

  return plan;
}

export const INITIALIZED_FLAG_KEY = 'nutritrack_india_app_initialized';

export function isAppInitialized(): boolean {
  try {
    return localStorage.getItem(INITIALIZED_FLAG_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markAppInitialized(): void {
  try {
    localStorage.setItem(INITIALIZED_FLAG_KEY, 'true');
  } catch (err) {
    console.error('Error marking app as initialized:', err);
  }
}

export function populateSampleData(force = false): void {
  try {
    const PROFILE_KEY = 'nutritrack_india_user_profile';
    const DAILY_LOGS_KEY = 'nutritrack_india_daily_logs_map';
    const HABIT_LOGS_KEY = 'nutritrack_india_habit_logs_map';
    const MEAL_PLAN_KEY = 'nutritrack_india_weekly_meal_plan';

    // If already initialized and not forced, do not overwrite user data or cleared state
    if (!force && isAppInitialized()) {
      return;
    }

    if (force || !localStorage.getItem(PROFILE_KEY)) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(SAMPLE_PROFILE));
    }
    if (force || !localStorage.getItem(DAILY_LOGS_KEY)) {
      localStorage.setItem(DAILY_LOGS_KEY, JSON.stringify(generateSampleDailyLogs()));
    }
    if (force || !localStorage.getItem(HABIT_LOGS_KEY)) {
      localStorage.setItem(HABIT_LOGS_KEY, JSON.stringify(generateSampleHabitLogs()));
    }
    if (force || !localStorage.getItem(MEAL_PLAN_KEY)) {
      localStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(generateSampleWeeklyMealPlan()));
    }

    markAppInitialized();
  } catch (err) {
    console.error('Error populating sample data:', err);
  }
}

