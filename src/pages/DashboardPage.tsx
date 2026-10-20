import React from 'react';
import {
  Utensils,
  Droplets,
  BookOpen,
  Scale,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { DailyCalorieHero } from '../components/dashboard/DailyCalorieHero';
import { MealCard } from '../components/dashboard/MealCard';
import { SupportiveMessage } from '../components/dashboard/SupportiveMessage';
import { QuickWaterWidget } from '../components/dashboard/QuickWaterWidget';
import { QuickHabitsWidget } from '../components/dashboard/QuickHabitsWidget';
import { ActivityQuickLog } from '../components/dashboard/ActivityQuickLog';
import { SmartNutritionAdvisor } from '../components/dashboard/SmartNutritionAdvisor';
import { DailyLog } from '../types/dailyLog';
import { UserProfile } from '../types/profile';
import { HabitDefinition } from '../types/habit';
import { FoodItem, MealCategory } from '../types/food';

interface DashboardPageProps {
  selectedDate: string;
  log: DailyLog;
  profile: UserProfile;
  habitsList: HabitDefinition[];
  completedHabitIds: string[];
  todayHabitScore: number;
  allFoods: FoodItem[];
  onOpenAddFood: (meal?: MealCategory) => void;
  onUpdateFoodQuantity: (logId: string, newQty: number) => void;
  onDeleteFood: (logId: string) => void;
  onAddWater: (amountMl: number) => void;
  onUpdateWaterTarget: (targetMl: number) => void;
  onUpdateActivity: (update: Partial<DailyLog['activity']>) => void;
  onToggleHabit: (id: string) => void;
  onClearDay?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  selectedDate: _selectedDate,
  log,
  profile,
  habitsList,
  completedHabitIds,
  todayHabitScore,
  allFoods,
  onOpenAddFood,
  onUpdateFoodQuantity,
  onDeleteFood,
  onAddWater,
  onUpdateWaterTarget,
  onUpdateActivity,
  onToggleHabit,
  onClearDay,
}) => {
  const navigate = useNavigate();

  // Aggregate nutrition
  const totalCalories = log.foods.reduce((acc, f) => acc + (f.calories || 0), 0);
  const totalProtein = Math.round(log.foods.reduce((acc, f) => acc + (f.protein || 0), 0) * 10) / 10;
  const totalCarbs = Math.round(log.foods.reduce((acc, f) => acc + (f.carbs || 0), 0) * 10) / 10;
  const totalFat = Math.round(log.foods.reduce((acc, f) => acc + (f.fat || 0), 0) * 10) / 10;
  const totalFiber = Math.round(log.foods.reduce((acc, f) => acc + (f.fiber || 0), 0) * 10) / 10;

  // Calorie ratio for mindful messages
  const calorieRatio = profile.targetCalories > 0 ? totalCalories / profile.targetCalories : 0;

  // Split meals
  const breakfastItems = log.foods.filter((f) => f.mealCategory === 'breakfast');
  const lunchItems = log.foods.filter((f) => f.mealCategory === 'lunch');
  const snacksItems = log.foods.filter((f) => f.mealCategory === 'snacks');
  const dinnerItems = log.foods.filter((f) => f.mealCategory === 'dinner');

  const bCal = breakfastItems.reduce((s, i) => s + i.calories, 0);
  const lCal = lunchItems.reduce((s, i) => s + i.calories, 0);
  const sCal = snacksItems.reduce((s, i) => s + i.calories, 0);
  const dCal = dinnerItems.reduce((s, i) => s + i.calories, 0);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-12 sm:pb-16 animate-fade-in">
      {/* Mobile Quick Action Buttons Bar */}
      <div className="grid grid-cols-4 gap-2 sm:hidden">
        <button
          onClick={() => onOpenAddFood('breakfast')}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 active:scale-95 transition-all app-btn-press"
          aria-label="Add food"
        >
          <Utensils className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-bold">Add Food</span>
        </button>

        <button
          onClick={() => navigate('/database')}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/30 active:scale-95 transition-all app-btn-press"
          aria-label="Food Database"
        >
          <BookOpen className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-bold">Food DB</span>
        </button>

        <button
          onClick={() => onAddWater(250)}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/30 active:scale-95 transition-all app-btn-press"
          aria-label="Quick log water"
        >
          <Droplets className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-bold">+250ml</span>
        </button>

        <button
          onClick={() => navigate('/weight')}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30 active:scale-95 transition-all app-btn-press"
          aria-label="Track weight"
        >
          <Scale className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-bold">Weight</span>
        </button>
      </div>

      {/* Mindful Supportive Message */}
      <SupportiveMessage
        calorieRatio={calorieRatio}
        habitsCompleted={completedHabitIds.length}
        totalHabits={habitsList.length}
      />

      {/* Daily Calorie Progress Hero Section (Primary Visual Focus) */}
      <DailyCalorieHero
        totalCalories={totalCalories}
        totalProtein={totalProtein}
        totalCarbs={totalCarbs}
        totalFat={totalFat}
        totalFiber={totalFiber}
        profile={profile}
        bCal={bCal}
        lCal={lCal}
        sCal={sCal}
        dCal={dCal}
      />

      {/* Smart Nutrition & Indian Diet Advisor */}
      <SmartNutritionAdvisor profile={profile} log={log} onOpenAddFood={onOpenAddFood} />

      {/* Meal Tracking Section with 4 Dedicated Professional Meal Cards */}
      <div className="space-y-3.5 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
              Today's Meals
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Track portions, calories, and macronutrients across all four meals
            </p>
          </div>

          <div className="flex items-center gap-2">
            {log.foods.length > 0 && onClearDay && (
              <button
                onClick={() => {
                  if (window.confirm("Clear all foods logged for today and start fresh?")) {
                    onClearDay();
                  }
                }}
                className="text-xs font-semibold text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors app-btn-press"
                title="Clear today's meals and start fresh"
              >
                <RotateCcw className="w-3 h-3 text-amber-500" />
                <span>Reset Today</span>
              </button>
            )}

            <Link
              to="/tracker"
              className="text-xs font-bold text-[#10B981] hover:text-emerald-400 flex items-center gap-1 app-btn-press"
            >
              <span>Full Diary</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 Professional Meal Cards: Breakfast, Lunch, Snacks, Dinner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {/* 1. Breakfast */}
          <MealCard
            title="Breakfast"
            mealCategory="breakfast"
            items={breakfastItems}
            allFoods={allFoods}
            onAddClick={() => onOpenAddFood('breakfast')}
            onUpdateQuantity={onUpdateFoodQuantity}
            onDeleteItem={onDeleteFood}
            defaultExpanded={true}
          />

          {/* 2. Lunch */}
          <MealCard
            title="Lunch"
            mealCategory="lunch"
            items={lunchItems}
            allFoods={allFoods}
            onAddClick={() => onOpenAddFood('lunch')}
            onUpdateQuantity={onUpdateFoodQuantity}
            onDeleteItem={onDeleteFood}
            defaultExpanded={true}
          />

          {/* 3. Snacks */}
          <MealCard
            title="Snacks"
            mealCategory="snacks"
            items={snacksItems}
            allFoods={allFoods}
            onAddClick={() => onOpenAddFood('snacks')}
            onUpdateQuantity={onUpdateFoodQuantity}
            onDeleteItem={onDeleteFood}
            defaultExpanded={true}
          />

          {/* 4. Dinner */}
          <MealCard
            title="Dinner"
            mealCategory="dinner"
            items={dinnerItems}
            allFoods={allFoods}
            onAddClick={() => onOpenAddFood('dinner')}
            onUpdateQuantity={onUpdateFoodQuantity}
            onDeleteItem={onDeleteFood}
            defaultExpanded={true}
          />
        </div>
      </div>

      {/* Daily Habits, Water, & Activity Quick Log Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        <QuickWaterWidget
          water={log.water}
          onAddWater={onAddWater}
          onUpdateTarget={onUpdateWaterTarget}
        />

        <QuickHabitsWidget
          habits={habitsList}
          completedIds={completedHabitIds}
          todayScore={todayHabitScore}
          onToggleHabit={onToggleHabit}
        />

        <ActivityQuickLog
          activity={log.activity}
          onUpdateActivity={onUpdateActivity}
        />
      </div>
    </div>
  );
};
