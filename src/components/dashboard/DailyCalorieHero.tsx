import React from 'react';
import {
  Target,
  Flame,
  Hourglass,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CircularProgress } from '../common/CircularProgress';
import { MacroNutrientBar } from '../common/MacroNutrientBar';
import { UserProfile } from '../../types/profile';

interface DailyCalorieHeroProps {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  profile: UserProfile;
  bCal: number;
  lCal: number;
  sCal: number;
  dCal: number;
}

export const DailyCalorieHero: React.FC<DailyCalorieHeroProps> = ({
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFat,
  totalFiber,
  profile,
  bCal,
  lCal,
  sCal,
  dCal,
}) => {
  const targetCalories = profile.targetCalories || 0;
  const isTargetMissing = targetCalories <= 0;
  const remainingCalories = Math.max(0, targetCalories - totalCalories);
  const isExceeded = !isTargetMissing && totalCalories > targetCalories;
  const exceededBy = totalCalories - targetCalories;
  const completedPercentage = isTargetMissing
    ? 0
    : Math.round((totalCalories / targetCalories) * 100);

  return (
    <div className="glass-card p-4 sm:p-6 border border-slate-200/80 dark:border-[#263247] shadow-md relative overflow-hidden transition-all duration-200">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-gradient-to-br from-[#10B981]/10 via-[#A3E635]/5 to-transparent rounded-full blur-3xl pointer-events-none -z-0"></div>

      {/* Top Header Row */}
      <div className="relative z-10 flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 dark:border-[#263247] mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-[#10B981] flex items-center justify-center">
            <Zap className="w-4 h-4 fill-[#10B981]" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
              Daily Energy Budget
            </span>
          </div>
        </div>

        <Link
          to="/calculator"
          className="text-xs font-bold text-[#10B981] hover:text-emerald-400 flex items-center gap-1 bg-[#10B981]/10 px-2.5 py-1 rounded-xl border border-[#10B981]/20 app-btn-press"
          title="Adjust macro targets"
        >
          <span>Goal: {targetCalories.toLocaleString()} kcal</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Main Grid: Circular Progress Hero + Macronutrients Breakdown */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
        {/* Left / Center: Circular Progress Ring & Primary Stats */}
        <div className="lg:col-span-6 flex flex-col items-center">
          {/* Animated Circular Progress Ring Container */}
          <div className="w-48 h-48 sm:w-56 sm:h-56 relative my-1">
            <CircularProgress
              value={totalCalories}
              max={targetCalories}
              size={220}
              strokeWidth={15}
              label="Consumed"
              unit="kcal"
              showRemaining={true}
              useGradient={true}
            />
          </div>

          {/* 4 Core Stat Chips (Target, Consumed, Remaining, Completed) */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-[#263247]">
            {/* 1. Target */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-[#172033]/70 border border-slate-100 dark:border-[#263247]/60 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#94A3B8] flex items-center justify-center gap-1">
                <Target className="w-3 h-3 text-[#10B981]" />
                Target
              </span>
              <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-[#F8FAFC] mt-0.5">
                {targetCalories.toLocaleString()} <span className="text-[9px] font-medium text-slate-400">kcal</span>
              </p>
            </div>

            {/* 2. Consumed */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-[#172033]/70 border border-slate-100 dark:border-[#263247]/60 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#94A3B8] flex items-center justify-center gap-1">
                <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                Consumed
              </span>
              <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-[#F8FAFC] mt-0.5">
                {totalCalories.toLocaleString()} <span className="text-[9px] font-medium text-slate-400">kcal</span>
              </p>
            </div>

            {/* 3. Remaining */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-[#172033]/70 border border-slate-100 dark:border-[#263247]/60 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#94A3B8] flex items-center justify-center gap-1">
                {isExceeded ? (
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                ) : (
                  <Hourglass className="w-3 h-3 text-emerald-500" />
                )}
                {isExceeded ? 'Exceeded' : 'Remaining'}
              </span>
              <p
                className={`text-xs sm:text-sm font-extrabold mt-0.5 ${
                  isExceeded
                    ? 'text-rose-500 dark:text-rose-400'
                    : 'text-[#10B981] dark:text-[#34D399]'
                }`}
              >
                {isExceeded ? `+${exceededBy.toLocaleString()}` : remainingCalories.toLocaleString()}{' '}
                <span className="text-[9px] font-medium text-slate-400">kcal</span>
              </p>
            </div>

            {/* 4. Completed */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-[#172033]/70 border border-slate-100 dark:border-[#263247]/60 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#94A3B8] flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-lime-500" />
                Completed
              </span>
              <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-[#F8FAFC] mt-0.5">
                {completedPercentage}%
              </p>
            </div>
          </div>
        </div>

        {/* Right: Macronutrient Distribution Breakdown */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
              Macronutrient Goals
            </span>
            <span className="text-[11px] text-slate-400">
              Indian Diet Balance
            </span>
          </div>

          <div className="space-y-2.5">
            <MacroNutrientBar
              label="Protein"
              currentG={totalProtein}
              targetG={profile.targetProteinG}
              color="emerald"
            />
            <MacroNutrientBar
              label="Carbohydrates"
              currentG={totalCarbs}
              targetG={profile.targetCarbsG}
              color="amber"
            />
            <MacroNutrientBar
              label="Fats"
              currentG={totalFat}
              targetG={profile.targetFatG}
              color="purple"
            />
            <MacroNutrientBar
              label="Dietary Fiber"
              currentG={totalFiber}
              targetG={profile.targetFiberG}
              color="blue"
            />
          </div>

          {/* Quick Meal-by-Meal Calorie Pills */}
          <div className="pt-3 border-t border-slate-100 dark:border-[#263247] grid grid-cols-4 gap-1.5 text-center">
            <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-[#172033]/60">
              <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Breakfast</span>
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                {bCal} <span className="text-[9px] font-normal text-slate-400">kcal</span>
              </p>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-[#172033]/60">
              <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Lunch</span>
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                {lCal} <span className="text-[9px] font-normal text-slate-400">kcal</span>
              </p>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-[#172033]/60">
              <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Snacks</span>
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                {sCal} <span className="text-[9px] font-normal text-slate-400">kcal</span>
              </p>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-[#172033]/60">
              <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Dinner</span>
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                {dCal} <span className="text-[9px] font-normal text-slate-400">kcal</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
