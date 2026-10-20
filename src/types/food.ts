export type FoodCategory =
  | 'South Indian'
  | 'North Indian'
  | 'Rice'
  | 'Protein'
  | 'Protein foods'
  | 'Vegetables'
  | 'Fruits'
  | 'Snacks'
  | 'Beverages'
  | 'Drinks'
  | 'Custom';

export type DietaryType = 'veg' | 'non-veg' | 'egg' | 'vegan';

export type MealCategory = 'breakfast' | 'lunch' | 'snacks' | 'dinner';

export interface FoodItem {
  id: string;
  name: string;
  hindiName?: string;
  category: FoodCategory;
  serving: string;        // e.g. "1 piece (50g)", "1 bowl (150g)", "1 cup (200ml)"
  servingSize?: string;    // alias for serving
  servingUnit: string;    // e.g. "piece", "bowl", "cup", "plate", "g", "ml"
  defaultQuantity: number;
  calories: number;       // kcal per serving
  protein: number;        // g per serving
  carbs: number;          // g per serving
  fat: number;            // g per serving
  fiber: number;          // g per serving
  dietary: DietaryType;
  isCustom?: boolean;
  notes?: string;
}

export type FoodLogSource = 'manual' | 'ai_scan';

export interface LoggedFoodItem {
  logId: string;
  id?: string; // alias for logId
  foodId: string;
  name: string;
  foodName?: string; // alias for name
  category: FoodCategory;
  mealCategory: MealCategory;
  mealType?: MealCategory; // alias for mealCategory
  serving: string;
  servingSize?: string;
  unit?: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  dietary: DietaryType;
  loggedAt: string; // ISO string
  date?: string; // YYYY-MM-DD
  source: FoodLogSource;
}

export interface CustomFoodInput {
  name: string;
  category: FoodCategory;
  serving: string;
  servingSize?: string;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  dietary: DietaryType;
}

export interface DetectedFoodItem {
  id?: string;
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
  confidence: number;
  dietary: DietaryType;
  category: FoodCategory;
  isMatchedFromDB?: boolean;
}

export interface AIScanResponse {
  foods: {
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    confidence?: number;
  }[];
}
