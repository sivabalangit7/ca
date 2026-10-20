import React, { useState } from 'react';
import {
  CalendarDays,
  Copy,
  Plus,
  Trash2,
  Check,
  RotateCcw,
} from 'lucide-react';
import { DayPlan, PlannedMealItem, WeeklyMealPlan } from '../types/mealPlan';
import { FoodItem, MealCategory } from '../types/food';
import { mealPlanService } from '../services/mealPlanService';
import { FoodSearchModal } from '../components/tracker/FoodSearchModal';
import { CustomFoodModal } from '../components/tracker/CustomFoodModal';
import { foodService } from '../services/foodService';
import { DisclaimerNotice } from '../components/common/DisclaimerNotice';

interface MealPlannerPageProps {
  onLogMealToDiary?: (food: FoodItem, qty: number, meal: MealCategory) => void;
}

const DAYS: DayPlan['dayOfWeek'][] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const MealPlannerPage: React.FC<MealPlannerPageProps> = ({ onLogMealToDiary: _onLogMealToDiary }) => {

  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyMealPlan>(() => mealPlanService.getWeeklyPlan());
  const [activeDay, setActiveDay] = useState<DayPlan['dayOfWeek']>('Monday');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [targetMeal, setTargetMeal] = useState<MealCategory>('breakfast');
  const [copyNotice, setCopyNotice] = useState('');

  const currentDayPlan = weeklyPlan[activeDay] || mealPlanService.getDayPlan(activeDay);

  // Compute day totals
  const allDayItems: PlannedMealItem[] = [
    ...currentDayPlan.meals.breakfast,
    ...currentDayPlan.meals.lunch,
    ...currentDayPlan.meals.snacks,
    ...currentDayPlan.meals.dinner,
  ];

  const totalCalories = allDayItems.reduce((acc, i) => acc + (i.calories || 0), 0);
  const totalProtein = Math.round(allDayItems.reduce((acc, i) => acc + (i.protein || 0), 0) * 10) / 10;
  const totalCarbs = Math.round(allDayItems.reduce((acc, i) => acc + (i.carbs || 0), 0) * 10) / 10;
  const totalFat = Math.round(allDayItems.reduce((acc, i) => acc + (i.fat || 0), 0) * 10) / 10;

  const handleOpenAdd = (meal: MealCategory) => {
    setTargetMeal(meal);
    setSearchModalOpen(true);
  };

  const handleAddPlannedFood = (food: FoodItem, quantity: number, meal: MealCategory) => {
    mealPlanService.addFoodToDayPlan(activeDay, meal, food, quantity);
    setWeeklyPlan(mealPlanService.getWeeklyPlan());
  };

  const handleRemovePlannedItem = (meal: MealCategory, itemId: string) => {
    mealPlanService.removeFoodFromDayPlan(activeDay, meal, itemId);
    setWeeklyPlan(mealPlanService.getWeeklyPlan());
  };

  const handleCopyPreviousDay = () => {
    const currentIndex = DAYS.indexOf(activeDay);
    const prevIndex = (currentIndex - 1 + DAYS.length) % DAYS.length;
    const prevDay = DAYS[prevIndex];

    mealPlanService.copyDayPlan(prevDay, activeDay);
    setWeeklyPlan(mealPlanService.getWeeklyPlan());
    setCopyNotice(`Copied ${prevDay}'s meal plan to ${activeDay}!`);
    setTimeout(() => setCopyNotice(''), 3000);
  };

  const handleClearDay = () => {
    if (window.confirm(`Clear planned meals for ${activeDay}?`)) {
      mealPlanService.clearDayPlan(activeDay);
      setWeeklyPlan(mealPlanService.getWeeklyPlan());
    }
  };

  const handleClearWeeklyPlan = () => {
    if (window.confirm('Clear all planned meals for the entire week (Monday to Sunday)?')) {
      mealPlanService.clearWeeklyPlan();
      setWeeklyPlan(mealPlanService.getWeeklyPlan());
    }
  };

  const handleSaveCustomFood = (input: any) => {
    foodService.saveCustomFood(input);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="glass-card p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Weekly Indian Meal Planner
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize your South & North Indian breakfasts, lunches, and dinners from Monday to Sunday.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyPreviousDay}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
            title="Copy meals from the previous day"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Previous Day</span>
          </button>
          <button
            onClick={handleClearDay}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700"
            title={`Clear ${activeDay}'s plan`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Day</span>
          </button>
          <button
            onClick={handleClearWeeklyPlan}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Clear entire week's plan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>


      {copyNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{copyNotice}</span>
        </div>
      )}

      {/* Days of Week Tab Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {DAYS.map((day) => {
          const plan = weeklyPlan[day] || mealPlanService.getDayPlan(day);
          const itemCount =
            plan.meals.breakfast.length +
            plan.meals.lunch.length +
            plan.meals.snacks.length +
            plan.meals.dinner.length;

          const dayCalories = [
            ...plan.meals.breakfast,
            ...plan.meals.lunch,
            ...plan.meals.snacks,
            ...plan.meals.dinner,
          ].reduce((acc, i) => acc + (i.calories || 0), 0);

          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`flex-1 min-w-[110px] p-3 rounded-2xl border text-center transition-all ${
                activeDay === day
                  ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/25 font-bold'
                  : 'glass-card border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand-500/30'
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wider block">{day.slice(0, 3)}</span>
              <span className={`text-base font-extrabold block mt-0.5 ${activeDay === day ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                {dayCalories}
                <span className="text-[10px] font-normal ml-0.5 opacity-80">kcal</span>
              </span>
              <span className="text-[10px] opacity-75 block mt-0.5">{itemCount} foods</span>
            </button>
          );
        })}
      </div>

      {/* Daily Nutrients Summary Card */}
      <div className="glass-card p-4 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {activeDay}'s Planned Nutrition Summary
            </h3>
            <p className="text-[11px] text-slate-400">Total estimated nutrients for all 4 meals</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold text-brand-600 dark:text-brand-400">
                {totalCalories}
              </span>
              <span className="text-[10px] text-slate-400">kcal</span>
            </div>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-600 dark:text-emerald-400">P: {totalProtein}g</span>
            <span className="text-amber-600 dark:text-amber-400">C: {totalCarbs}g</span>
            <span className="text-purple-600 dark:text-purple-400">F: {totalFat}g</span>
          </div>
        </div>
      </div>

      {/* 4 Meal Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {(['breakfast', 'lunch', 'snacks', 'dinner'] as MealCategory[]).map((slot) => {
          const items = currentDayPlan.meals[slot];
          const slotCalories = items.reduce((acc, i) => acc + (i.calories || 0), 0);

          return (
            <div
              key={slot}
              className="glass-card overflow-hidden border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                      {slot === 'snacks' ? 'Snacks & Chai' : slot}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      ({items.length})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {slotCalories} kcal
                    </span>
                    <button
                      onClick={() => handleOpenAdd(slot)}
                      className="p-1 rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 text-xs font-bold transition-colors"
                      title="Add food to meal slot"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {items.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-xs text-slate-400">No items planned for {slot}.</p>
                    <button
                      onClick={() => handleOpenAdd(slot)}
                      className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline mt-1.5"
                    >
                      + Add food
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {item.quantity} × {item.serving} • P: {item.protein}g | C: {item.carbs}g
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            {item.calories} kcal
                          </span>
                          <button
                            onClick={() => handleRemovePlannedItem(slot, item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-2.5 bg-slate-50/40 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 text-right">
                <button
                  onClick={() => handleOpenAdd(slot)}
                  className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add another dish</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <DisclaimerNotice />

      {/* Add Food Modal */}
      <FoodSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        defaultMeal={targetMeal}
        onAddFood={handleAddPlannedFood}
        onOpenCustomFoodModal={() => {
          setSearchModalOpen(false);
          setCustomModalOpen(true);
        }}
      />

      {/* Custom Food Modal */}
      <CustomFoodModal
        isOpen={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        onSave={handleSaveCustomFood}
      />
    </div>
  );
};
