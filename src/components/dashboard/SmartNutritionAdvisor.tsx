import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, ChefHat } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserProfile } from '../../types/profile';
import { DailyLog } from '../../types/dailyLog';

interface SmartNutritionAdvisorProps {
  profile: UserProfile;
  log: DailyLog;
  onOpenAddFood?: (meal?: any, food?: any) => void;
}

interface Suggestion {
  title: string;
  desc: string;
  foodName: string;
  calories: number;
  protein: number;
  category: string;
}

export const SmartNutritionAdvisor: React.FC<SmartNutritionAdvisorProps> = ({
  profile,
  log,
  onOpenAddFood: _onOpenAddFood,
}) => {
  const totalCalories = log.foods.reduce((acc, f) => acc + (f.calories || 0), 0);
  const totalProtein = Math.round(log.foods.reduce((acc, f) => acc + (f.protein || 0), 0) * 10) / 10;
  const totalCarbs = Math.round(log.foods.reduce((acc, f) => acc + (f.carbs || 0), 0) * 10) / 10;
  const totalFat = Math.round(log.foods.reduce((acc, f) => acc + (f.fat || 0), 0) * 10) / 10;

  const calDiff = profile.targetCalories - totalCalories;
  const protDiff = Math.max(0, Math.round((profile.targetProteinG - totalProtein) * 10) / 10);
  const carbsDiff = Math.max(0, Math.round((profile.targetCarbsG - totalCarbs) * 10) / 10);
  const fatDiff = Math.max(0, Math.round((profile.targetFatG - totalFat) * 10) / 10);

  // Dynamic recommendation logic based on remaining macros
  let suggestions: Suggestion[] = [];
  let statusHeadline = '';
  let statusTone: 'success' | 'amber' | 'blue' = 'blue';

  if (totalCalories === 0) {
    statusHeadline = 'Start your day with a high-protein Indian breakfast!';
    statusTone = 'blue';
    suggestions = [
      {
        title: 'High-Protein Breakfast',
        desc: '3 Moong Dal Chillas or 3 Boiled Egg Whites',
        foodName: 'Moong Dal Chilla',
        calories: 220,
        protein: 14.5,
        category: 'North Indian'
      },
      {
        title: 'Traditional South Indian',
        desc: '3 Steamed Idlis with Sambhar & Mint Chutney',
        foodName: 'Idli with Sambhar',
        calories: 240,
        protein: 8.0,
        category: 'South Indian'
      }
    ];
  } else if (calDiff < -150) {
    statusHeadline = 'Daily calorie budget reached! Focus on hydration and light green tea.';
    statusTone = 'amber';
    suggestions = [
      {
        title: 'Calorie-Free Hydration',
        desc: 'Herbal Jeera water or warm Lemon Green Tea',
        foodName: 'Jeera Water',
        calories: 5,
        protein: 0.2,
        category: 'Beverages'
      },
      {
        title: 'Crunchy Fiber Snack',
        desc: 'Sliced cucumber & tomato with chaat masala',
        foodName: 'Cucumber Tomato Salad',
        calories: 35,
        protein: 1.0,
        category: 'Vegetables'
      }
    ];
  } else if (protDiff > 20 && calDiff > 250) {
    statusHeadline = `You need ~${protDiff}g more protein to hit your daily goal!`;
    statusTone = 'amber';
    suggestions = [
      {
        title: 'Power Protein Snack',
        desc: '100g Paneer Bhurji or 3 Whole Boiled Eggs',
        foodName: 'Paneer Bhurji',
        calories: 240,
        protein: 18.2,
        category: 'North Indian'
      },
      {
        title: 'Quick Vegetarian Boost',
        desc: '1 cup Greek Yogurt or Roasted Soya Chunks',
        foodName: 'Roasted Soya Chunks',
        calories: 160,
        protein: 21.0,
        category: 'Snacks'
      }
    ];
  } else if (calDiff > 350) {
    statusHeadline = `You have ${calDiff} kcal remaining today. Great balance!`;
    statusTone = 'blue';
    suggestions = [
      {
        title: 'Satisfying Dinner / Snack',
        desc: '2 Phulkas with Dal Tadka & Bhindi Masala',
        foodName: 'Phulka with Dal Tadka',
        calories: 310,
        protein: 12.0,
        category: 'North Indian'
      },
      {
        title: 'Evening Refreshment',
        desc: 'Sprouted Moong Chaat with pomegranate & lime',
        foodName: 'Sprouts Chaat',
        calories: 150,
        protein: 9.5,
        category: 'Snacks'
      }
    ];
  } else {
    statusHeadline = 'Spot on! You have hit your daily energy targets.';
    statusTone = 'success';
    suggestions = [
      {
        title: 'Recovery & Digestion',
        desc: '1 glass Spiced Chaas (Buttermilk) with roasted cumin',
        foodName: 'Spiced Chaas',
        calories: 45,
        protein: 2.2,
        category: 'Beverages'
      }
    ];
  }

  return (
    <div className="glass-card p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Smart Nutrition Advisor</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/40">
                Diet Coach
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {statusHeadline}
            </p>
          </div>
        </div>

        <Link
          to="/database"
          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
        >
          <span>Explore Foods</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Remaining Budget Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Calories Left</span>
          <p className={`text-base font-extrabold mt-0.5 ${calDiff < 0 ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
            {calDiff > 0 ? `${calDiff} kcal` : `${Math.abs(calDiff)} over`}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-center">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Protein Needed</span>
          <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
            {protDiff > 0 ? `${protDiff}g` : 'Goal Met ✓'}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-center">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Carbs Left</span>
          <p className="text-base font-extrabold text-amber-700 dark:text-amber-300 mt-0.5">
            {carbsDiff > 0 ? `${carbsDiff}g` : '0g'}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 text-center">
          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">Fats Left</span>
          <p className="text-base font-extrabold text-purple-700 dark:text-purple-300 mt-0.5">
            {fatDiff > 0 ? `${fatDiff}g` : '0g'}
          </p>
        </div>
      </div>

      {/* Smart Suggestions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {suggestions.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-start justify-between gap-3 hover:border-brand-500/40 transition-all"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {item.title}
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                {item.desc}
              </p>
              <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                <span className="px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300">
                  {item.calories} kcal
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  +{item.protein}g protein
                </span>
              </div>
            </div>

            <Link
              to="/database"
              className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 active:scale-95 transition-all flex-shrink-0"
              title="Search in database"
            >
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
