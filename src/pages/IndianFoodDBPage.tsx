import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Plus,
  Trash2,
} from 'lucide-react';
import { FoodItem, FoodCategory, DietaryType } from '../types/food';
import { DietaryBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { DisclaimerNotice } from '../components/common/DisclaimerNotice';

interface IndianFoodDBPageProps {
  allFoods: FoodItem[];
  onOpenAddFoodModal: (food?: FoodItem) => void;
  onOpenCustomFoodModal: () => void;
  onDeleteCustomFood?: (id: string) => void;
}

const CATEGORIES: (FoodCategory | 'All')[] = [
  'All',
  'South Indian',
  'North Indian',
  'Rice',
  'Protein foods',
  'Fruits',
  'Snacks',
  'Beverages',
  'Custom',
];

type MacroFilter = 'all' | 'high_protein' | 'low_carb' | 'low_calorie' | 'high_fiber';

export const IndianFoodDBPage: React.FC<IndianFoodDBPageProps> = ({
  allFoods,
  onOpenAddFoodModal,
  onOpenCustomFoodModal,
  onDeleteCustomFood,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'All'>('All');
  const [selectedDietary, setSelectedDietary] = useState<DietaryType | 'all'>('all');
  const [macroFilter, setMacroFilter] = useState<MacroFilter>('all');
  const [inspectFood, setInspectFood] = useState<FoodItem | null>(null);

  const filteredFoods = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allFoods.filter((item) => {
      // Category
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'Custom') {
          if (!item.isCustom) return false;
        } else if (item.category !== selectedCategory) {
          return false;
        }
      }

      // Dietary
      if (selectedDietary !== 'all') {
        if (selectedDietary === 'veg') {
          if (item.dietary !== 'veg' && item.dietary !== 'vegan') return false;
        } else if (item.dietary !== selectedDietary) {
          return false;
        }
      }

      // Macro Quick Filters
      if (macroFilter === 'high_protein' && item.protein < 12) return false;
      if (macroFilter === 'low_carb' && item.carbs > 20) return false;
      if (macroFilter === 'low_calorie' && item.calories > 150) return false;
      if (macroFilter === 'high_fiber' && (item.fiber || 0) < 4) return false;

      // Query
      if (q) {
        const matchName = item.name.toLowerCase().includes(q);
        const matchHindi = item.hindiName ? item.hindiName.toLowerCase().includes(q) : false;
        const matchNotes = item.notes ? item.notes.toLowerCase().includes(q) : false;
        return matchName || matchHindi || matchNotes;
      }

      return true;
    });
  }, [allFoods, searchQuery, selectedCategory, selectedDietary, macroFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="glass-card p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Indian Food Nutrition Database
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Explore {allFoods.length} authentic dishes across South, North, Rice, Proteins, Snacks and Beverages.
          </p>
        </div>

        <button
          onClick={onOpenCustomFoodModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Recipe</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="glass-card p-4 border border-slate-200/80 dark:border-slate-800 space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, Hindi/regional name, or ingredients (e.g. dosa, biryani, paneer, sambar)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-brand-500 text-white shadow-sm font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dietary Filter */}
        <div className="flex items-center gap-2 text-xs pt-1">
          <span className="text-slate-400 font-medium">Dietary preference:</span>
          <button
            onClick={() => setSelectedDietary('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
              selectedDietary === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedDietary('veg')}
            className={`px-2 py-0.5 rounded-md ${
              selectedDietary === 'veg' ? 'ring-2 ring-emerald-500' : ''
            }`}
          >
            <DietaryBadge type="veg" />
          </button>
          <button
            onClick={() => setSelectedDietary('non-veg')}
            className={`px-2 py-0.5 rounded-md ${
              selectedDietary === 'non-veg' ? 'ring-2 ring-rose-500' : ''
            }`}
          >
            <DietaryBadge type="non-veg" />
          </button>
          <button
            onClick={() => setSelectedDietary('egg')}
            className={`px-2 py-0.5 rounded-md ${
              selectedDietary === 'egg' ? 'ring-2 ring-amber-500' : ''
            }`}
          >
            <DietaryBadge type="egg" />
          </button>
          <button
            onClick={() => setSelectedDietary('vegan')}
            className={`px-2 py-0.5 rounded-md ${
              selectedDietary === 'vegan' ? 'ring-2 ring-teal-500' : ''
            }`}
          >
            <DietaryBadge type="vegan" />
          </button>
        </div>

        {/* Nutritional Target Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar pt-1 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setMacroFilter('all')}
            className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-colors ${
              macroFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Nutrition
          </button>
          <button
            onClick={() => setMacroFilter('high_protein')}
            className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-colors ${
              macroFilter === 'high_protein'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 hover:bg-emerald-100'
            }`}
          >
            💪 High Protein (≥12g)
          </button>
          <button
            onClick={() => setMacroFilter('low_carb')}
            className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-colors ${
              macroFilter === 'low_carb'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 hover:bg-amber-100'
            }`}
          >
            🥗 Low Carb (≤20g)
          </button>
          <button
            onClick={() => setMacroFilter('low_calorie')}
            className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-colors ${
              macroFilter === 'low_calorie'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 hover:bg-blue-100'
            }`}
          >
            🔥 Low Calorie (≤150 kcal)
          </button>
          <button
            onClick={() => setMacroFilter('high_fiber')}
            className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-colors ${
              macroFilter === 'high_fiber'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 hover:bg-purple-100'
            }`}
          >
            🌾 Fiber Rich (≥4g)
          </button>
        </div>
      </div>

      {/* Food Cards Grid */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
          <span>Showing {filteredFoods.length} dishes</span>
        </div>

        {filteredFoods.length === 0 ? (
          <div className="glass-card p-12 text-center space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No Indian foods matched your criteria.
            </p>
            <button
              onClick={onOpenCustomFoodModal}
              className="px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
            >
              + Create this recipe as Custom Food
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFoods.map((food) => (
              <div
                key={food.id}
                className="glass-card-hover p-4.5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <DietaryBadge type={food.dietary} />
                      {food.isCustom && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-400">
                        {food.category}
                      </span>
                      {food.isCustom && onDeleteCustomFood && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete custom food "${food.name}"?`)) {
                              onDeleteCustomFood(food.id);
                            }
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete custom recipe"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                    {food.name}
                  </h3>

                  {food.hindiName && (
                    <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                      {food.hindiName}
                    </p>
                  )}

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Serving: <strong className="text-slate-700 dark:text-slate-300">{food.serving}</strong>
                  </p>

                  {food.notes && (
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 italic">
                      {food.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  {/* Macro Pills */}
                  <div className="grid grid-cols-4 gap-1.5 text-center text-[11px] mb-3">
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                      <span className="font-extrabold text-slate-900 dark:text-white block">
                        {food.calories}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase">kcal</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block">
                        {food.protein}g
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase">Protein</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                      <span className="font-extrabold text-amber-600 dark:text-amber-400 block">
                        {food.carbs}g
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase">Carbs</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                      <span className="font-extrabold text-purple-600 dark:text-purple-400 block">
                        {food.fat}g
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase">Fat</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInspectFood(food)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors text-center"
                    >
                      Nutrient Details
                    </button>
                    <button
                      onClick={() => onOpenAddFoodModal(food)}
                      className="py-1.5 px-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-xs"
                      title="Log to today's diary"
                    >
                      + Log
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DisclaimerNotice />

      {/* Inspect Food Nutrition Facts Modal */}
      {inspectFood && (
        <Modal
          isOpen={true}
          onClose={() => setInspectFood(null)}
          title={inspectFood.name}
          subtitle={`Serving: ${inspectFood.serving} (${inspectFood.category})`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <DietaryBadge type={inspectFood.dietary} />
              <span className="text-xl font-extrabold text-brand-600 dark:text-brand-400">
                {inspectFood.calories} kcal
              </span>
            </div>

            {inspectFood.notes && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                {inspectFood.notes}
              </div>
            )}

            {/* Nutrition Breakdown Table */}
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 flex justify-between font-bold text-slate-800 dark:text-slate-200">
                <span>Nutrient</span>
                <span>Amount Per Serving</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Protein</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {inspectFood.protein} g
                </span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Total Carbohydrates</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {inspectFood.carbs} g
                </span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Total Fat</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {inspectFood.fat} g
                </span>
              </div>
              <div className="p-2.5 flex justify-between">
                <span className="text-slate-500">Dietary Fiber</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {inspectFood.fiber} g
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              *Approximate nutritional analysis for Indian culinary preparations.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setInspectFood(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const f = inspectFood;
                  setInspectFood(null);
                  onOpenAddFoodModal(f);
                }}
                className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-sm"
              >
                Add to Diary
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
