import { DietaryType } from './food';

export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';

export type GoalType =
  | 'maintain_health'
  | 'maintain'
  | 'lose_025'
  | 'lose_weight_gradual'
  | 'lose_05'
  | 'lose_weight_moderate'
  | 'lose_10'
  | 'gain_025'
  | 'gain_05'
  | 'build_strength'
  | 'general_fitness';

export type GenderType = 'male' | 'female' | 'other';

export type DietPlanTab = 'balanced' | 'low_fat' | 'low_carb' | 'high_protein' | 'custom';

export interface UserProfile {
  name: string;
  age: number;
  gender: GenderType;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: GoalType;
  dietaryPreference: DietaryType;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  targetFiberG: number;
  targetWaterMl: number;
  targetSteps: number;
  isCustomTargets: boolean;
}

export interface MacroRange {
  target: number;
  min: number;
  max: number;
}

export interface MacroCalculationResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetKj: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  saturatedFatG: number;
  proteinRange: { min: number; max: number };
  carbsRange: { min: number; max: number };
  fatRange: { min: number; max: number };
  dietPlan: DietPlanTab;
  deficitOrSurplus?: number;
  estimatedWeeklyChangeKg?: number;
  isYouth: boolean;
  youthMessage?: string;
  notes: string[];
}
