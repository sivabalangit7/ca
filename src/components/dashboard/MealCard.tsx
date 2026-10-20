import React, { useState } from 'react';
import {
  Sunrise,
  Sun,
  Apple,
  Moon,
  Plus,
  ChevronDown,
  Trash2,
  Minus,
  Check,
  Edit2,
  X,
} from 'lucide-react';
import { LoggedFoodItem, MealCategory, FoodItem } from '../../types/food';
import { DietaryBadge } from '../common/Badge';
import { calculateMealTotals } from '../../utils/nutritionCalc';

interface MealCardProps {
  title: string;
  mealCategory: MealCategory;
  items: LoggedFoodItem[];
  allFoods?: FoodItem[];
  onAddClick: (meal: MealCategory) => void;
  onUpdateQuantity: (logId: string, newQty: number) => void;
  onDeleteItem: (logId: string) => void;
  defaultExpanded?: boolean;
}

const mealConfig = {
  breakfast: {
    icon: Sunrise,
    iconBg: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    accentText: 'text-amber-500',
    barColor: 'bg-amber-500',
  },
  lunch: {
    icon: Sun,
    iconBg: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    accentText: 'text-emerald-500',
    barColor: 'bg-emerald-500',
  },
  snacks: {
    icon: Apple,
    iconBg: 'bg-lime-500/15 text-lime-500 dark:text-lime-400 border-lime-500/30',
    accentText: 'text-lime-600 dark:text-lime-400',
    barColor: 'bg-lime-500',
  },
  dinner: {
    icon: Moon,
    iconBg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    accentText: 'text-indigo-400',
    barColor: 'bg-indigo-500',
  },
};

export const MealCard: React.FC<MealCardProps> = ({
  title,
  mealCategory,
  items,
  onAddClick,
  onUpdateQuantity,
  onDeleteItem,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded || items.length > 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(1);

  const config = mealConfig[mealCategory] || mealConfig.breakfast;
  const IconComponent = config.icon;
  const totals = calculateMealTotals(items, mealCategory);

  const handleStartEdit = (e: React.MouseEvent, item: LoggedFoodItem) => {
    e.stopPropagation();
    setEditingId(item.logId);
    setEditQty(item.quantity);
  };

  const handleSaveEdit = (e: React.MouseEvent, logId: string) => {
    e.stopPropagation();
    onUpdateQuantity(logId, Math.max(0.25, editQty));
    setEditingId(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleQuickStep = (e: React.MouseEvent, logId: string, currentQty: number, delta: number) => {
    e.stopPropagation();
    const newQty = Math.max(0.25, Math.round((currentQty + delta) * 4) / 4);
    onUpdateQuantity(logId, newQty);
  };

  return (
    <div className="glass-card overflow-hidden border border-slate-200/80 dark:border-[#263247] transition-all duration-200 hover:border-slate-300 dark:hover:border-[#263247]/90 shadow-sm">
      {/* Clickable Header Bar */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className="p-3.5 sm:p-4 cursor-pointer flex items-center justify-between gap-3 select-none hover:bg-slate-50/50 dark:hover:bg-[#172033]/40 transition-colors"
      >
        {/* Left: Thematic Meal Icon & Metadata */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl sm:rounded-2xl flex items-center justify-center border shadow-xs flex-shrink-0 ${config.iconBg}`}
          >
            <IconComponent className="w-5 h-5 stroke-[2.2]" />
          </div>

          <div className="min-w-0">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-[#F8FAFC] tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium">
              {items.length === 0
                ? '0 food items'
                : `${items.length} ${items.length === 1 ? 'food item' : 'food items'}`}
            </p>
          </div>
        </div>

        {/* Right: Calories, + Add food button, Chevron */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Calorie Total */}
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-[#F8FAFC]">
                {totals.calories}
              </span>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-[#94A3B8]">
                kcal
              </span>
            </div>
          </div>

          {/* "+ Add food" Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddClick(mealCategory);
            }}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] dark:text-[#34D399] border border-[#10B981]/30 text-xs font-bold app-btn-press"
            title={`Add food to ${title}`}
            aria-label={`Add food to ${title}`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden xs:inline">Add food</span>
          </button>

          {/* Expand / Collapse Chevron */}
          <button
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform duration-200"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isExpanded ? 'transform rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Content Area */}
      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-[#263247] animate-fade-in bg-slate-50/40 dark:bg-[#080D1B]/40">
          {/* Mini Macro Breakdown strip for this meal */}
          {items.length > 0 && (
            <div className="px-4 py-2 bg-slate-100/60 dark:bg-[#172033]/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-[#94A3B8] border-b border-slate-100 dark:border-[#263247]">
              <span>Meal Nutrients:</span>
              <div className="flex items-center gap-2.5 font-semibold text-slate-700 dark:text-slate-300">
                <span>
                  P: <strong className="text-emerald-600 dark:text-emerald-400">{totals.protein}g</strong>
                </span>
                <span>•</span>
                <span>
                  C: <strong className="text-amber-600 dark:text-amber-400">{totals.carbs}g</strong>
                </span>
                <span>•</span>
                <span>
                  F: <strong className="text-purple-600 dark:text-purple-400">{totals.fat}g</strong>
                </span>
              </div>
            </div>
          )}

          {/* Items list */}
          {items.length === 0 ? (
            <div className="p-5 text-center flex flex-col items-center justify-center">
              <p className="text-xs text-slate-400 dark:text-[#94A3B8] mb-2">
                No food logged in {title.toLowerCase()} yet.
              </p>
              <button
                onClick={() => onAddClick(mealCategory)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10B981] hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold shadow-sm shadow-emerald-500/20 app-btn-press"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Log {title}</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-[#263247]/60">
              {items.map((item) => {
                const isEditing = editingId === item.logId;

                return (
                  <div
                    key={item.logId}
                    className="p-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 hover:bg-white/60 dark:hover:bg-[#111827]/60 transition-colors"
                  >
                    {/* Food Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <DietaryBadge type={item.dietary} showText={false} />
                        <span className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] truncate">
                          {item.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5 flex-wrap">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {item.quantity} × {item.serving}
                        </span>
                        <span>•</span>
                        <span>
                          P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
                        </span>
                      </div>
                    </div>

                    {/* Quantity controls & Calories & Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1 bg-white dark:bg-[#111827] p-1 rounded-xl border border-[#10B981]">
                          <input
                            type="number"
                            min="0.25"
                            step="0.5"
                            value={editQty}
                            onChange={(e) => setEditQty(parseFloat(e.target.value) || 1)}
                            className="w-12 px-1 text-center text-xs font-bold bg-transparent text-slate-900 dark:text-white outline-none"
                            autoFocus
                          />
                          <button
                            onClick={(e) => handleSaveEdit(e, item.logId)}
                            className="p-1 rounded-lg bg-[#10B981] text-white hover:bg-emerald-600"
                            title="Save"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 rounded-lg bg-slate-200 dark:bg-[#172033] text-slate-600 dark:text-slate-300 hover:bg-slate-300"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Quick Step Buttons for portions */}
                          <div className="hidden xs:flex items-center gap-0.5 bg-slate-100 dark:bg-[#172033] rounded-lg p-0.5 border border-slate-200/60 dark:border-[#263247]">
                            <button
                              onClick={(e) => handleQuickStep(e, item.logId, item.quantity, -0.5)}
                              className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-[#111827] app-btn-press"
                              title="Decrease quantity by 0.5"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleQuickStep(e, item.logId, item.quantity, 0.5)}
                              className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-[#111827] app-btn-press"
                              title="Increase quantity by 0.5"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Calories Value */}
                          <div className="text-right min-w-[50px]">
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-[#F8FAFC] block">
                              {item.calories}
                            </span>
                            <span className="text-[9px] text-slate-400 dark:text-[#94A3B8]">kcal</span>
                          </div>

                          {/* Edit & Delete Action Buttons */}
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={(e) => handleStartEdit(e, item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172033] app-btn-press"
                              title="Edit Quantity"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteItem(item.logId);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 app-btn-press"
                              title="Delete Item"
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
      )}
    </div>
  );
};
