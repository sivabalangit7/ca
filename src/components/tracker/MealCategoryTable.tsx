import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, RotateCcw } from 'lucide-react';
import { LoggedFoodItem, MealCategory, FoodItem } from '../../types/food';
import { DietaryBadge } from '../common/Badge';
import { calculateMealTotals } from '../../utils/nutritionCalc';

interface MealCategoryTableProps {
  title: string;
  mealCategory: MealCategory;
  items: LoggedFoodItem[];
  allFoods: FoodItem[];
  onAddClick: (meal: MealCategory) => void;
  onUpdateQuantity: (logId: string, newQty: number) => void;
  onDeleteItem: (logId: string) => void;
  onClearMeal?: (meal: MealCategory) => void;
}

export const MealCategoryTable: React.FC<MealCategoryTableProps> = ({
  title,
  mealCategory,
  items,
  allFoods: _allFoods,
  onAddClick,
  onUpdateQuantity,
  onDeleteItem,
  onClearMeal,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(1);

  const mealTotals = calculateMealTotals(items, mealCategory);

  const handleStartEdit = (item: LoggedFoodItem) => {
    setEditingId(item.logId);
    setEditQty(item.quantity);
  };

  const handleSaveEdit = (logId: string) => {
    onUpdateQuantity(logId, Math.max(0.25, editQty));
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="glass-card overflow-hidden border border-slate-200/80 dark:border-slate-800">
      {/* Header */}
      <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white capitalize">
            {title}
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Totals Pill */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-baseline gap-1 font-bold text-slate-800 dark:text-slate-200">
            <span className="text-sm font-extrabold text-brand-600 dark:text-brand-400">
              {mealTotals.calories}
            </span>
            <span className="text-[10px] text-slate-400">kcal</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
            <span>P: <strong>{mealTotals.protein}g</strong></span>
            <span>C: <strong>{mealTotals.carbs}g</strong></span>
            <span>F: <strong>{mealTotals.fat}g</strong></span>
          </div>

          {items.length > 0 && onClearMeal && (
            <button
              onClick={() => {
                if (window.confirm(`Clear all logged foods in ${title}?`)) {
                  onClearMeal(mealCategory);
                }
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title={`Clear all items in ${title}`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onAddClick(mealCategory)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/50 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            No foods logged for {title.toLowerCase()} yet.
          </p>
          <button
            onClick={() => onAddClick(mealCategory)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log {title}</span>
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {items.map((item) => {
            const isEditing = editingId === item.logId;

            return (
              <div
                key={item.logId}
                className="p-3.5 sm:px-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors flex items-center justify-between gap-3"
              >
                {/* Food Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DietaryBadge type={item.dietary} showText={false} />
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                    <span>
                      {item.quantity} × {item.serving}
                    </span>
                    <span>•</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
                    </span>
                  </div>
                </div>

                {/* Inline Edit Quantity or Macro & Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0.25"
                        step="0.5"
                        value={editQty}
                        onChange={(e) => setEditQty(parseFloat(e.target.value) || 1)}
                        className="w-16 px-2 py-1 text-center text-xs font-bold rounded-lg border border-brand-500 bg-white dark:bg-slate-800 dark:text-white"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(item.logId)}
                        className="p-1 rounded-lg bg-brand-500 text-white hover:bg-brand-600"
                        title="Save quantity"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white block">
                          {item.calories}
                        </span>
                        <span className="text-[10px] text-slate-400">kcal</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Quantity"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.logId)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete logged food"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
