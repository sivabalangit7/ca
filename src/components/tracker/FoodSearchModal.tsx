import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Clock,
  ChevronRight,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { DietaryBadge } from '../common/Badge';
import { FoodItem, FoodCategory, MealCategory, DietaryType } from '../../types/food';
import { foodService } from '../../services/foodService';
import { calculateFoodNutrition } from '../../utils/nutritionCalc';

interface FoodSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMeal?: MealCategory;
  initialSelectedFood?: FoodItem;
  onAddFood: (food: FoodItem, quantity: number, mealCategory: MealCategory) => void;
  onOpenCustomFoodModal: () => void;
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

export const FoodSearchModal: React.FC<FoodSearchModalProps> = ({
  isOpen,
  onClose,
  defaultMeal = 'breakfast',
  initialSelectedFood,
  onAddFood,
  onOpenCustomFoodModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'All'>('All');
  const [selectedDietary, setSelectedDietary] = useState<DietaryType | 'all'>('all');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(() => initialSelectedFood || null);
  const [quantity, setQuantity] = useState<number>(1);
  const [targetMeal, setTargetMeal] = useState<MealCategory>(defaultMeal);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevInitialFood, setPrevInitialFood] = useState(initialSelectedFood);

  // Sync state cleanly when props change without effect setState warnings
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setSelectedFood(null);
      setQuantity(1);
      setSearchQuery('');
    } else {
      setTargetMeal(defaultMeal);
      if (initialSelectedFood) {
        setSelectedFood(initialSelectedFood);
        setQuantity(initialSelectedFood.defaultQuantity || 1);
      }
    }
  } else if (initialSelectedFood !== prevInitialFood) {
    setPrevInitialFood(initialSelectedFood);
    if (initialSelectedFood) {
      setSelectedFood(initialSelectedFood);
      setQuantity(initialSelectedFood.defaultQuantity || 1);
    }
  }

  const recentFoods = useMemo(() => foodService.getRecentFoods(5), []);

  const searchResults = useMemo(() => {
    return foodService.searchFoods({
      query: searchQuery,
      category: selectedCategory,
      dietary: selectedDietary,
    });
  }, [searchQuery, selectedCategory, selectedDietary]);

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setQuantity(food.defaultQuantity || 1);
  };

  const handleConfirmAdd = () => {
    if (!selectedFood) return;
    const safeQty = Math.max(0.25, quantity);
    foodService.recordRecentlyUsed(selectedFood.id);
    onAddFood(selectedFood, safeQty, targetMeal);
    setSelectedFood(null);
    onClose();
  };

  // Preview calculations
  const previewNutrition = selectedFood
    ? calculateFoodNutrition(selectedFood, quantity)
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedFood ? 'Log Food Item' : 'Add Indian Food'}
      subtitle={
        selectedFood
          ? 'Confirm serving size and portion for your meal'
          : 'Search authentic Indian dishes, curries, snacks, or custom recipes'
      }
      maxWidth="lg"
    >
      {!selectedFood ? (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dosa, idli, biryani, roti, paneer, egg..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm placeholder:text-slate-400"
              autoFocus
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

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Dietary Filter Pills */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Filter:</span>
            <button
              onClick={() => setSelectedDietary('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium ${
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
          </div>

          {/* Recent Foods if no search query */}
          {!searchQuery && recentFoods.length > 0 && selectedCategory === 'All' && (
            <div className="pt-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Frequently Logged Foods</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recentFoods.map((item) => (
                  <button
                    key={`recent-${item.id}`}
                    onClick={() => handleSelectFood(item)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-brand-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-all group"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{item.serving}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex-shrink-0">
                      {item.calories} kcal
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Results ({searchResults.length})</span>
              <button
                onClick={onOpenCustomFoodModal}
                className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom Food</span>
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No Indian dishes matched "{searchQuery}".
                </p>
                <button
                  onClick={onOpenCustomFoodModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-semibold hover:bg-brand-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add "{searchQuery || 'Food'}" as Custom Food</span>
                </button>
              </div>
            ) : (
              searchResults.map((food) => (
                <button
                  key={food.id}
                  onClick={() => handleSelectFood(food)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-brand-500/50 hover:bg-brand-50/20 dark:hover:bg-brand-950/20 text-left transition-all group"
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-3">
                    <div className="pt-0.5">
                      <DietaryBadge type={food.dietary} showText={false} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">
                          {food.name}
                        </span>
                        {food.isCustom && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-semibold">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>{food.serving}</span>
                        <span>•</span>
                        <span>{food.category}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        <span>P: <strong className="text-slate-700 dark:text-slate-300">{food.protein}g</strong></span>
                        <span>C: <strong className="text-slate-700 dark:text-slate-300">{food.carbs}g</strong></span>
                        <span>F: <strong className="text-slate-700 dark:text-slate-300">{food.fat}g</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white block">
                        {food.calories}
                      </span>
                      <span className="text-[10px] text-slate-400">kcal</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        /* STEP 2: Configure Portion & Add */
        <div className="space-y-5">
          <button
            onClick={() => setSelectedFood(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to food search</span>
          </button>

          {/* Selected Food Overview Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <DietaryBadge type={selectedFood.dietary} />
                  <span className="text-xs text-slate-400">{selectedFood.category}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {selectedFood.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Base serving: {selectedFood.serving}
                </p>
                {selectedFood.notes && (
                  <p className="text-xs text-brand-600 dark:text-brand-400 mt-1 italic">
                    {selectedFood.notes}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {selectedFood.calories}
                </span>
                <span className="text-xs text-slate-400 block">kcal/serving</span>
              </div>
            </div>
          </div>

          {/* Meal Slot Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Meal
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['breakfast', 'lunch', 'snacks', 'dinner'] as MealCategory[]).map((meal) => (
                <button
                  key={meal}
                  type="button"
                  onClick={() => setTargetMeal(meal)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold capitalize transition-all ${
                    targetMeal === meal
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {meal}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Controls */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Quantity / Number of Servings ({selectedFood.servingUnit || 'serving'})
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.max(0.5, prev - 0.5))}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-lg flex items-center justify-center transition-colors"
              >
                -
              </button>

              <input
                type="number"
                min="0.25"
                step="0.5"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0.1, parseFloat(e.target.value) || 1))}
                className="w-24 text-center py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-base text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />

              <button
                type="button"
                onClick={() => setQuantity((prev) => prev + 0.5)}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-lg flex items-center justify-center transition-colors"
              >
                +
              </button>

              <div className="flex gap-1 ml-auto">
                {[1, 2, 3].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setQuantity(val)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                      quantity === val
                        ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {val}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Calculated Totals Preview */}
          {previewNutrition && (
            <div className="p-4 rounded-xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200/60 dark:border-brand-900/40">
              <p className="text-xs font-bold text-brand-900 dark:text-brand-300 mb-2">
                Calculated Nutrition for {quantity} {selectedFood.servingUnit || 'portion'}:
              </p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800/80 shadow-xs">
                  <span className="text-base font-extrabold text-brand-700 dark:text-brand-400 block">
                    {previewNutrition.calories}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Calories (kcal)</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800/80 shadow-xs">
                  <span className="text-base font-extrabold text-slate-800 dark:text-slate-200 block">
                    {previewNutrition.protein}g
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Protein</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800/80 shadow-xs">
                  <span className="text-base font-extrabold text-slate-800 dark:text-slate-200 block">
                    {previewNutrition.carbs}g
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Carbs</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800/80 shadow-xs">
                  <span className="text-base font-extrabold text-slate-800 dark:text-slate-200 block">
                    {previewNutrition.fat}g
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Fat</span>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedFood(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmAdd}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-brand-500/25 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Add to {targetMeal}</span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
