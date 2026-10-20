export interface PlannedMealItem {
  id: string;
  foodId: string;
  name: string;
  serving: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface DayPlan {
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  meals: {
    breakfast: PlannedMealItem[];
    lunch: PlannedMealItem[];
    snacks: PlannedMealItem[];
    dinner: PlannedMealItem[];
  };
}

export type WeeklyMealPlan = Record<string, DayPlan>;
