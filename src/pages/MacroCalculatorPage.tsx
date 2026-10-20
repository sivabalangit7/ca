import React, { useState } from 'react';
import {
  Calculator,
  AlertTriangle,
  Check,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import {
  UserProfile,
  ActivityLevel,
  GoalType,
  GenderType,
  DietPlanTab,
} from '../types/profile';
import { calculateMacros } from '../utils/macroFormulas';
import { DisclaimerNotice } from '../components/common/DisclaimerNotice';

interface MacroCalculatorPageProps {
  profile: UserProfile;
  onApplyTargets: (newProfile: UserProfile) => void;
}

export const MacroCalculatorPage: React.FC<MacroCalculatorPageProps> = ({
  profile,
  onApplyTargets,
}) => {
  const [age, setAge] = useState<number>(profile.age || 26);
  const [gender, setGender] = useState<GenderType>(profile.gender || 'male');
  const [heightCm, setHeightCm] = useState<number>(profile.heightCm || 174);
  const [weightKg, setWeightKg] = useState<number>(profile.weightKg || 68);
  const [activity, setActivity] = useState<ActivityLevel>(
    profile.activityLevel || 'moderately_active'
  );
  const [goal, setGoal] = useState<GoalType>(profile.goal || 'lose_05');
  const [dietPlan, setDietPlan] = useState<DietPlanTab>('balanced');

  // Custom split percentages (when Create Your Own is chosen)
  const [customProtein, setCustomProtein] = useState<number>(30);
  const [customCarbs, setCustomCarbs] = useState<number>(45);
  const [customFat, setCustomFat] = useState<number>(25);

  const [appliedNotice, setAppliedNotice] = useState(false);

  // Calculate with current parameters
  const result = calculateMacros(
    age,
    gender,
    heightCm,
    weightKg,
    activity,
    goal,
    dietPlan,
    dietPlan === 'custom'
      ? {
          proteinPercent: customProtein,
          carbsPercent: customCarbs,
          fatPercent: customFat,
        }
      : undefined
  );

  const handleApply = () => {
    const updated: UserProfile = {
      ...profile,
      age,
      gender,
      heightCm,
      weightKg,
      activityLevel: activity,
      goal,
      targetCalories: result.targetCalories,
      targetProteinG: result.proteinG,
      targetCarbsG: result.carbsG,
      targetFatG: result.fatG,
      targetFiberG: result.fiberG,
      isCustomTargets: false,
    };
    onApplyTargets(updated);
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 4000);
  };

  const getGoalDescription = () => {
    switch (goal) {
      case 'lose_025':
      case 'lose_weight_gradual':
        return 'to consume daily to lose 0.25 kg per week';
      case 'lose_05':
      case 'lose_weight_moderate':
        return 'to consume daily to lose 0.5 kg per week';
      case 'lose_10':
        return 'to consume daily to lose 1.0 kg per week';
      case 'gain_025':
        return 'to consume daily to gain 0.25 kg per week';
      case 'gain_05':
      case 'build_strength':
        return 'to consume daily to gain 0.5 kg per week';
      case 'general_fitness':
      case 'maintain':
      case 'maintain_health':
      default:
        return 'to consume daily to maintain your current weight';
    }
  };

  const customTotal = customProtein + customCarbs + customFat;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="glass-card p-5 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-amber-500 to-emerald-500 flex items-center justify-center text-white shadow-sm">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            NutriTrack Macro Calculator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Mifflin-St Jeor clinical energy formula with comprehensive macronutrient ranges and customizable diet plans.
          </p>
        </div>
      </div>

      {/* Youth Safety Guardrail */}
      {result.isYouth && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 dark:border-amber-500/30 flex items-start gap-3.5">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h3 className="text-sm font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <span>Youth Wellness & Growth Guidance (Age &lt; 18)</span>
              <ShieldCheck className="w-4 h-4 text-amber-600" />
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed font-medium">
              "{result.youthMessage}"
            </p>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400">
              *Calorie deficits are automatically disabled for adolescent users to nourish normal physiological development, bone density, and academic/athletic performance.
            </p>
          </div>
        </div>
      )}

      {/* Main Form & Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Inputs */}
        <div className="lg:col-span-5 glass-card p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            Personal Parameters
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Age (years) *
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={age}
                onChange={(e) => setAge(Math.max(10, parseInt(e.target.value) || 10))}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:ring-2 focus:ring-brand-500"
              />
              {age < 18 && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block mt-1">
                  Adolescent mode active
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Biological Sex
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as GenderType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:ring-2 focus:ring-brand-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other / Non-binary</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                min="100"
                max="240"
                value={heightCm}
                onChange={(e) => setHeightCm(Math.max(100, parseInt(e.target.value) || 100))}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-[10px] text-slate-400">
                ~{(heightCm / 30.48).toFixed(1)} feet
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                min="30"
                max="250"
                value={weightKg}
                onChange={(e) => setWeightKg(Math.max(30, parseInt(e.target.value) || 30))}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Activity Level
            </label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value as ActivityLevel)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-brand-500"
            >
              <option value="sedentary">Sedentary (Little or no exercise, desk job)</option>
              <option value="lightly_active">Lightly active (Exercise 1–3 times/week)</option>
              <option value="moderately_active">Moderately active (Exercise 4–5 times/week)</option>
              <option value="very_active">Very active (Intense exercise 6–7 times/week)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Weight & Energy Goal
            </label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as GoalType)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-brand-500"
            >
              <optgroup label="Weight Loss (Calorie Deficit)">
                <option value="lose_025">Mild weight loss (0.25 kg/week, -275 kcal/day)</option>
                <option value="lose_05">Weight loss (0.5 kg/week, -550 kcal/day)</option>
                <option value="lose_10">Fast weight loss (1.0 kg/week, -1,000 kcal/day)</option>
              </optgroup>
              <optgroup label="Weight Maintenance">
                <option value="maintain">Maintain weight (0 kcal deficit / TDEE)</option>
                <option value="general_fitness">General fitness & stamina</option>
              </optgroup>
              <optgroup label="Weight Gain (Calorie Surplus)">
                <option value="gain_025">Mild weight gain (0.25 kg/week, +275 kcal/day)</option>
                <option value="gain_05">Weight gain / Muscle building (0.5 kg/week, +500 kcal/day)</option>
              </optgroup>
            </select>
          </div>

          {/* Quick Stats BMR & TDEE */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Basal Metabolic Rate (BMR):</span>
              <span className="font-bold text-slate-900 dark:text-white">{result.bmr} kcal</span>
            </div>
            <div className="flex justify-between">
              <span>Daily Maintenance (TDEE):</span>
              <span className="font-bold text-slate-900 dark:text-white">{result.tdee} kcal</span>
            </div>
          </div>
        </div>

        {/* Right: Output Matching Calculator.net Style */}
        <div className="lg:col-span-7 glass-card p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            {/* Context Headline matching user screenshot */}
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Recommended daily macronutrients <span className="font-semibold text-slate-900 dark:text-white">{getGoalDescription()}</span>.
              Each macronutrient amount is represented with an optimal target and clinical range.
            </p>

            {/* Diet Plan Tabs (Matching Calculator.net) */}
            <div className="flex items-center gap-1.5 flex-wrap pt-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDietPlan('balanced')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dietPlan === 'balanced'
                    ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                Balanced
              </button>
              <button
                type="button"
                onClick={() => setDietPlan('low_fat')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dietPlan === 'low_fat'
                    ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                Low Fat
              </button>
              <button
                type="button"
                onClick={() => setDietPlan('low_carb')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dietPlan === 'low_carb'
                    ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                Low Carb
              </button>
              <button
                type="button"
                onClick={() => setDietPlan('high_protein')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dietPlan === 'high_protein'
                    ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                High Protein
              </button>
              <button
                type="button"
                onClick={() => setDietPlan('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dietPlan === 'custom'
                    ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                Create Your Own
              </button>
            </div>

            {/* Custom Sliders when Create Your Own is active */}
            {dietPlan === 'custom' && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 mb-4">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Custom Split:</span>
                  <span className={customTotal === 100 ? 'text-emerald-600' : 'text-rose-500'}>
                    Total: {customTotal}% {customTotal !== 100 && '(Must equal 100%)'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-emerald-600 block mb-1">
                      Protein: {customProtein}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      step="5"
                      value={customProtein}
                      onChange={(e) => setCustomProtein(parseInt(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-amber-600 block mb-1">
                      Carbs: {customCarbs}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="70"
                      step="5"
                      value={customCarbs}
                      onChange={(e) => setCustomCarbs(parseInt(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-purple-600 block mb-1">
                      Fat: {customFat}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      step="5"
                      value={customFat}
                      onChange={(e) => setCustomFat(parseInt(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Results Table (Matching Calculator.net UI) */}
            <div className="border border-slate-200 dark:border-slate-700/80 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-700/80">
              {/* Protein Row */}
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-44 p-3.5 bg-slate-50 dark:bg-slate-800/40 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700/80 flex items-center justify-between sm:justify-start">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Protein</span>
                </div>
                <div className="flex-1 p-3.5 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col justify-center">
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {result.proteinG}{' '}
                    <span className="text-xs font-bold text-slate-500">grams/day</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Range: {result.proteinRange.min} - {result.proteinRange.max}
                  </div>
                </div>
              </div>

              {/* Carbs Row */}
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-44 p-3.5 bg-slate-50 dark:bg-slate-800/40 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700/80 flex flex-col justify-center">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Carbs</span>
                  <span className="text-[10px] text-slate-400">Includes Sugar</span>
                </div>
                <div className="flex-1 p-3.5 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col justify-center">
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {result.carbsG}{' '}
                    <span className="text-xs font-bold text-slate-500">grams/day</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Range: {result.carbsRange.min} - {result.carbsRange.max}
                  </div>
                </div>
              </div>

              {/* Fat Row */}
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-44 p-3.5 bg-slate-50 dark:bg-slate-800/40 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700/80 flex flex-col justify-center">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Fat</span>
                  <span className="text-[10px] text-slate-400">Includes Saturated Fat</span>
                </div>
                <div className="flex-1 p-3.5 bg-purple-50/40 dark:bg-purple-950/20 flex flex-col justify-center">
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {result.fatG}{' '}
                    <span className="text-xs font-bold text-slate-500">grams/day</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Range: {result.fatRange.min} - {result.fatRange.max}
                  </div>
                </div>
              </div>

              {/* Sugar Row */}
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-44 p-3 bg-slate-50 dark:bg-slate-800/40 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700/80 flex items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Sugar</span>
                </div>
                <div className="flex-1 p-3 bg-white dark:bg-slate-900/50 flex items-center">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    &lt;{result.sugarG}{' '}
                    <span className="text-xs font-semibold text-slate-500">grams/day</span>
                  </span>
                </div>
              </div>

              {/* Saturated Fat Row */}
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-44 p-3 bg-slate-50 dark:bg-slate-800/40 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700/80 flex items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Saturated Fat</span>
                </div>
                <div className="flex-1 p-3 bg-white dark:bg-slate-900/50 flex items-center">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    &lt;{result.saturatedFatG}{' '}
                    <span className="text-xs font-semibold text-slate-500">grams/day</span>
                  </span>
                </div>
              </div>

              {/* Food Energy Hero Row */}
              <div className="flex flex-col sm:flex-row bg-emerald-500/10 dark:bg-emerald-500/15">
                <div className="sm:w-44 p-3.5 bg-slate-100/70 dark:bg-slate-800/80 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700/80 flex items-center">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">Food Energy</span>
                </div>
                <div className="flex-1 p-3.5 flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {result.targetCalories.toLocaleString()}{' '}
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Calories/day</span>
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    or {result.targetKj.toLocaleString()} kJ/day
                  </span>
                </div>
              </div>
            </div>

            {/* Calorie Deficit / Surplus Tag */}
            {result.deficitOrSurplus !== 0 && (
              <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-300">
                <Flame className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="font-semibold">
                  {result.deficitOrSurplus && result.deficitOrSurplus < 0
                    ? `Daily Deficit: ${Math.abs(result.deficitOrSurplus)} kcal (${Math.abs(result.estimatedWeeklyChangeKg || 0.5)} kg estimated fat loss/week)`
                    : `Daily Surplus: +${result.deficitOrSurplus} kcal (+${result.estimatedWeeklyChangeKg || 0.5} kg muscle gain/week)`}
                </span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {appliedNotice && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Successfully applied these exact targets to your Profile & Dashboard!</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleApply}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md shadow-brand-500/25 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Apply These Targets to My Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      <DisclaimerNotice />
    </div>
  );
};
