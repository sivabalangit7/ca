import {
  ActivityLevel,
  GenderType,
  GoalType,
  DietPlanTab,
  MacroCalculationResult,
} from '../types/profile';

export interface CustomMacroSplit {
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
}

export function calculateMacros(
  age: number,
  gender: GenderType,
  heightCm: number,
  weightKg: number,
  activity: ActivityLevel,
  goal: GoalType,
  dietPlan: DietPlanTab = 'balanced',
  customSplit?: CustomMacroSplit
): MacroCalculationResult {
  const isYouth = age < 18;
  const youthMessage =
    "Because you're still growing, calorie and weight goals should be discussed with a parent/guardian and a qualified healthcare professional. Focus on balanced meals, regular activity, sleep, and overall health rather than aggressive calorie restriction.";

  // Safe bounds
  const safeAge = Math.max(10, Math.min(100, isNaN(age) ? 25 : age));
  const safeHeight = Math.max(100, Math.min(250, isNaN(heightCm) ? 170 : heightCm));
  const safeWeight = Math.max(30, Math.min(250, isNaN(weightKg) ? 65 : weightKg));

  // Mifflin-St Jeor formula for BMR (clinical standard)
  let bmr: number;
  if (gender === 'female') {
    bmr = 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge - 161;
  } else if (gender === 'male') {
    bmr = 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge + 5;
  } else {
    // Non-binary / other neutral average
    bmr = 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge - 78;
  }

  // Activity multipliers
  const activityFactors: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
  };

  const factor = activityFactors[activity] || 1.375;
  const tdee = Math.round(bmr * factor);

  let targetCalories = tdee;
  let deficitOrSurplus = 0;
  let estimatedWeeklyChangeKg = 0;

  const notes: string[] = [
    'Calculations are estimates based on standard metabolic formulas (Mifflin-St Jeor & ICMR guidelines).',
    'Actual energy expenditure varies with genetics, metabolism, climate, and body composition.',
  ];

  // Absolute safe minimum calorie floors
  const minSafeCalories = gender === 'female' ? 1200 : gender === 'male' ? 1500 : 1350;

  if (isYouth) {
    // Adolescent guardrail
    targetCalories = Math.max(1800, tdee);
    deficitOrSurplus = 0;
    estimatedWeeklyChangeKg = 0;
    notes.unshift(
      'Youth Guidelines Active: Calorie deficits are disabled to support natural physical development, bone density, and growth.'
    );
  } else {
    // Adult goal calorie adjustment
    switch (goal) {
      case 'lose_025':
      case 'lose_weight_gradual': {
        const deficit = 275;
        targetCalories = Math.max(minSafeCalories, Math.round(tdee - deficit));
        deficitOrSurplus = targetCalories - tdee;
        estimatedWeeklyChangeKg = -0.25;
        notes.push('Mild Weight Loss: ~275 kcal daily deficit targeting ~0.25 kg loss per week.');
        break;
      }

      case 'lose_05':
      case 'lose_weight_moderate': {
        const deficit = 550;
        targetCalories = Math.max(minSafeCalories, Math.round(tdee - deficit));
        deficitOrSurplus = targetCalories - tdee;
        estimatedWeeklyChangeKg = -0.5;
        notes.push('Weight Loss: ~550 kcal daily deficit targeting ~0.50 kg loss per week.');
        break;
      }

      case 'lose_10': {
        const deficit = 1000;
        targetCalories = Math.max(minSafeCalories, Math.round(tdee - deficit));
        deficitOrSurplus = targetCalories - tdee;
        estimatedWeeklyChangeKg = -1.0;
        notes.push('Accelerated Weight Loss: ~1,000 kcal deficit targeting ~1.0 kg loss per week.');
        break;
      }

      case 'gain_025': {
        const surplus = 275;
        targetCalories = Math.round(tdee + surplus);
        deficitOrSurplus = surplus;
        estimatedWeeklyChangeKg = 0.25;
        notes.push('Mild Weight Gain: +275 kcal daily surplus targeting ~0.25 kg gain per week.');
        break;
      }

      case 'gain_05':
      case 'build_strength': {
        const surplus = 500;
        targetCalories = Math.round(tdee + surplus);
        deficitOrSurplus = surplus;
        estimatedWeeklyChangeKg = 0.5;
        notes.push('Muscle & Weight Gain: +500 kcal daily surplus targeting ~0.50 kg gain per week.');
        break;
      }

      case 'general_fitness':
      case 'maintain':
      case 'maintain_health':
      default:
        targetCalories = tdee;
        deficitOrSurplus = 0;
        estimatedWeeklyChangeKg = 0;
        notes.push('Maintenance energy balance to support daily vitality and long-term health.');
        break;
    }
  }

  // Energy in kilojoules (1 kcal = 4.184 kJ)
  const targetKj = Math.round(targetCalories * 4.184);

  // Macronutrient calculation by Diet Plan Tab (matching Calculator.net standards)
  let proteinRatio = 0.244;
  let proteinMinRatio = 0.151;
  let proteinMaxRatio = 0.341;

  let carbsRatio = 0.533;
  let carbsMinRatio = 0.427;
  let carbsMaxRatio = 0.689;

  let fatRatio = 0.257;
  let fatMinRatio = 0.205;
  let fatMaxRatio = 0.360;

  let sugarRatio = 0.107;      // < 10%
  let satFatRatio = 0.102;     // < 10%

  if (dietPlan === 'low_fat') {
    proteinRatio = 0.25;
    proteinMinRatio = 0.15;
    proteinMaxRatio = 0.35;

    carbsRatio = 0.60;
    carbsMinRatio = 0.50;
    carbsMaxRatio = 0.70;

    fatRatio = 0.15;
    fatMinRatio = 0.10;
    fatMaxRatio = 0.20;

    sugarRatio = 0.10;
    satFatRatio = 0.06;
  } else if (dietPlan === 'low_carb') {
    proteinRatio = 0.35;
    proteinMinRatio = 0.25;
    proteinMaxRatio = 0.40;

    carbsRatio = 0.25;
    carbsMinRatio = 0.15;
    carbsMaxRatio = 0.35;

    fatRatio = 0.40;
    fatMinRatio = 0.30;
    fatMaxRatio = 0.50;

    sugarRatio = 0.05;
    satFatRatio = 0.10;
  } else if (dietPlan === 'high_protein') {
    proteinRatio = 0.35;
    proteinMinRatio = 0.30;
    proteinMaxRatio = 0.40;

    carbsRatio = 0.40;
    carbsMinRatio = 0.30;
    carbsMaxRatio = 0.50;

    fatRatio = 0.25;
    fatMinRatio = 0.20;
    fatMaxRatio = 0.35;

    sugarRatio = 0.08;
    satFatRatio = 0.08;
  } else if (dietPlan === 'custom' && customSplit) {
    const totalP = (customSplit.proteinPercent || 30) / 100;
    const totalC = (customSplit.carbsPercent || 45) / 100;
    const totalF = (customSplit.fatPercent || 25) / 100;

    proteinRatio = totalP;
    proteinMinRatio = Math.max(0.10, totalP - 0.08);
    proteinMaxRatio = Math.min(0.45, totalP + 0.08);

    carbsRatio = totalC;
    carbsMinRatio = Math.max(0.10, totalC - 0.10);
    carbsMaxRatio = Math.min(0.70, totalC + 0.10);

    fatRatio = totalF;
    fatMinRatio = Math.max(0.10, totalF - 0.08);
    fatMaxRatio = Math.min(0.50, totalF + 0.08);
  }

  // 1g Protein = 4 kcal, 1g Carb = 4 kcal, 1g Fat = 9 kcal
  const proteinG = Math.round((targetCalories * proteinRatio) / 4);
  const carbsG = Math.round((targetCalories * carbsRatio) / 4);
  const fatG = Math.round((targetCalories * fatRatio) / 9);

  const proteinRange = {
    min: Math.round((targetCalories * proteinMinRatio) / 4),
    max: Math.round((targetCalories * proteinMaxRatio) / 4),
  };

  const carbsRange = {
    min: Math.round((targetCalories * carbsMinRatio) / 4),
    max: Math.round((targetCalories * carbsMaxRatio) / 4),
  };

  const fatRange = {
    min: Math.round((targetCalories * fatMinRatio) / 9),
    max: Math.round((targetCalories * fatMaxRatio) / 9),
  };

  const sugarG = Math.round((targetCalories * sugarRatio) / 4);
  const saturatedFatG = Math.round((targetCalories * satFatRatio) / 9);

  // Fiber: recommended minimum 25-35g
  const fiberG = Math.round(Math.max(25, (targetCalories / 1000) * 14));

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories,
    targetKj,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    sugarG,
    saturatedFatG,
    proteinRange,
    carbsRange,
    fatRange,
    dietPlan,
    deficitOrSurplus,
    estimatedWeeklyChangeKg,
    isYouth,
    youthMessage: isYouth ? youthMessage : undefined,
    notes,
  };
}
