import React, { useState } from 'react';
import {
  Plus,
  RotateCcw,
  Share2,
} from 'lucide-react';
import { MealCategoryTable } from '../components/tracker/MealCategoryTable';
import { DisclaimerNotice } from '../components/common/DisclaimerNotice';
import { DailySummaryModal } from '../components/tracker/DailySummaryModal';
import { SmartNutritionAdvisor } from '../components/dashboard/SmartNutritionAdvisor';
import { DailyLog } from '../types/dailyLog';
import { FoodItem, MealCategory } from '../types/food';
import { UserProfile } from '../types/profile';

interface FoodTrackerPageProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  log: DailyLog;
  profile: UserProfile;
  allFoods: FoodItem[];
  onOpenAddFood: (meal?: MealCategory) => void;
  onOpenCustomFoodModal: () => void;
  onUpdateFoodQuantity: (logId: string, newQty: number) => void;
  onDeleteFood: (logId: string) => void;
  onClearMeal?: (meal: MealCategory) => void;
  onClearDay?: () => void;
}

export const FoodTrackerPage: React.FC<FoodTrackerPageProps> = ({
  selectedDate,
  onDateChange: _onDateChange,
  log,
  profile,
  allFoods,
  onOpenAddFood,
  onOpenCustomFoodModal,
  onUpdateFoodQuantity,
  onDeleteFood,
  onClearMeal,
  onClearDay,
}) => {
  const [mealFilter, setMealFilter] = useState<MealCategory | 'all'>('all');
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const totalCalories = log.foods.reduce((acc, f) => acc + (f.calories || 0), 0);
  const totalProtein = Math.round(log.foods.reduce((acc, f) => acc + (f.protein || 0), 0) * 10) / 10;
  const totalCarbs = Math.round(log.foods.reduce((acc, f) => acc + (f.carbs || 0), 0) * 10) / 10;
  const totalFat = Math.round(log.foods.reduce((acc, f) => acc + (f.fat || 0), 0) * 10) / 10;

  const breakfastItems = log.foods.filter((f) => f.mealCategory === 'breakfast');
  const lunchItems = log.foods.filter((f) => f.mealCategory === 'lunch');
  const snacksItems = log.foods.filter((f) => f.mealCategory === 'snacks');
  const dinnerItems = log.foods.filter((f) => f.mealCategory === 'dinner');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Date Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-5 border border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Food Diary & Nutrition Log
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log and review your authentic Indian meals, portion sizes, and macronutrients.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {log.foods.length > 0 && onClearDay && (
            <button
              onClick={() => {
                if (window.confirm('Clear all logged foods for this day?')) {
                  onClearDay();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700 whitespace-nowrap"
              title="Clear all foods logged for this day"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Day</span>
            </button>
          )}

          {log.foods.length > 0 && (
            <button
              onClick={() => setShowSummaryModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold transition-colors whitespace-nowrap border border-blue-200/60 dark:border-blue-800/40 active:scale-95"
              title="Share or copy daily nutrition summary"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Day</span>
            </button>
          )}

          <button
            onClick={onOpenCustomFoodModal}
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-semibold transition-colors whitespace-nowrap"
          >
            + Custom Food
          </button>
          <button
            onClick={() => onOpenAddFood()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Food</span>
          </button>
        </div>
      </div>

      {/* Daily Nutrients Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="glass-card p-4 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Calories
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalCalories}
            </span>
            <span className="text-xs text-slate-400">/ {profile.targetCalories} kcal</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{
                width: `${Math.min(100, Math.round((totalCalories / profile.targetCalories) * 100))}%`,
              }}
            />
          </div>
        </div>

        <div className="glass-card p-4 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Protein
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalProtein}g
            </span>
            <span className="text-xs text-slate-400">/ {profile.targetProteinG}g</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{
                width: `${Math.min(100, Math.round((totalProtein / profile.targetProteinG) * 100))}%`,
              }}
            />
          </div>
        </div>

        <div className="glass-card p-4 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Carbohydrates
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalCarbs}g
            </span>
            <span className="text-xs text-slate-400">/ {profile.targetCarbsG}g</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{
                width: `${Math.min(100, Math.round((totalCarbs / profile.targetCarbsG) * 100))}%`,
              }}
            />
          </div>
        </div>

        <div className="glass-card p-4 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
            Fat
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalFat}g
            </span>
            <span className="text-xs text-slate-400">/ {profile.targetFatG}g</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500"
              style={{
                width: `${Math.min(100, Math.round((totalFat / profile.targetFatG) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Smart Macro Advisor */}
      <SmartNutritionAdvisor profile={profile} log={log} onOpenAddFood={onOpenAddFood} />

      {/* Filter Tabs for Meals */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setMealFilter('all')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            mealFilter === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          All Meals ({log.foods.length})
        </button>

        {(['breakfast', 'lunch', 'snacks', 'dinner'] as MealCategory[]).map((meal) => {
          const count = log.foods.filter((f) => f.mealCategory === meal).length;
          return (
            <button
              key={meal}
              onClick={() => setMealFilter(meal)}
              className={`px-4 py-2 rounded-xl font-bold capitalize transition-all ${
                mealFilter === meal
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {meal} ({count})
            </button>
          );
        })}
      </div>

      {/* Meals Tables */}
      <div className="space-y-4">
        {(mealFilter === 'all' || mealFilter === 'breakfast') && (
          <MealCategoryTable
            title="Breakfast"
            mealCategory="breakfast"
            items={breakfastItems}
            allFoods={allFoods}
            onAddClick={onOpenAddFood}
            onUpdateQuantity={onUpdateFoodQuantity}
            onDeleteItem={onDeleteFood}
            onClearMeal={onClearMeal}
          />
        )}

        {(mealFilter === 'all' || mealFilter === 'lunch') && (
          <MealCategoryTable
            title="Lunch"
            mealCategory="lunch"
            items={lunchItems}
            allFoods={allFoods}
            onAddClick={onOpenAddFood}
            onUpdateQuantity={onUpdateFoodQuantity}
            onDeleteItem={onDeleteFood}
            onClearMeal={onClearMeal}
          />
        )}

        {(mealFilter === 'all' || mealFilter === 'snacks') && (
          <MealCategoryTable
            title="Snacks & Evening Chai"
            mealCategory="snacks"
            items={snacksItems}
            allFoods={allFoods}
            onAddClick={onOpenAddFood}
            onUpdateQuantity={onUpdateFoodQuantity}
            onDeleteItem={onDeleteFood}
            onClearMeal={onClearMeal}
          />
        )}

        {(mealFilter === 'all' || mealFilter === 'dinner') && (
          <MealCategoryTable
            title="Dinner"
            mealCategory="dinner"
            items={dinnerItems}
            allFoods={allFoods}
            onAddClick={onOpenAddFood}
            onUpdateQuantity={onUpdateFoodQuantity}
            onDeleteItem={onDeleteFood}
            onClearMeal={onClearMeal}
          />
        )}
      </div>

      <DisclaimerNotice />

      {/* Daily Summary Card Modal */}
      <DailySummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        date={selectedDate}
        log={log}
        profile={profile}
      />
    </div>
  );
};
