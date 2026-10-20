import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { CustomFoodInput, FoodCategory, DietaryType } from '../../types/food';

interface CustomFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (food: CustomFoodInput) => void;
}

const CATEGORIES: FoodCategory[] = [
  'South Indian',
  'North Indian',
  'Rice',
  'Protein foods',
  'Fruits',
  'Snacks',
  'Beverages',
  'Custom',
];

export const CustomFoodModal: React.FC<CustomFoodModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('South Indian');
  const [serving, setServing] = useState('1 piece (60g)');
  const [servingUnit, setServingUnit] = useState('piece');
  const [calories, setCalories] = useState<number | ''>(150);
  const [protein, setProtein] = useState<number | ''>(4);
  const [carbs, setCarbs] = useState<number | ''>(25);
  const [fat, setFat] = useState<number | ''>(5);
  const [fiber, setFiber] = useState<number | ''>(2);
  const [dietary, setDietary] = useState<DietaryType>('veg');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter the food name.');
      return;
    }
    if (calories === '' || calories < 0) {
      setError('Please enter valid calories.');
      return;
    }

    onSave({
      name: name.trim(),
      category,
      serving: serving.trim() || `1 ${servingUnit}`,
      servingUnit: servingUnit.trim() || 'piece',
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      fiber: Number(fiber) || 0,
      dietary,
    });

    // Reset
    setName('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Custom Indian Food"
      subtitle="Save your home-cooked recipe to your personal LocalStorage database"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Food Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Mom's Special Moong Dal Chilla"
            className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FoodCategory)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Dietary Preference
            </label>
            <select
              value={dietary}
              onChange={(e) => setDietary(e.target.value as DietaryType)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            >
              <option value="veg">Vegetarian 🟢</option>
              <option value="non-veg">Non-Vegetarian 🔴</option>
              <option value="egg">Eggitarian 🟡</option>
              <option value="vegan">Vegan 🌿</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Serving Description
            </label>
            <input
              type="text"
              value={serving}
              onChange={(e) => setServing(e.target.value)}
              placeholder="e.g. 1 chilla (80g)"
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Unit
            </label>
            <input
              type="text"
              value={servingUnit}
              onChange={(e) => setServingUnit(e.target.value)}
              placeholder="e.g. piece, bowl"
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>
        </div>

        {/* Nutrition values */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-3">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Estimated Nutrition Per Serving
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Calories (kcal) *
              </label>
              <input
                type="number"
                min="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Protein (g)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={protein}
                onChange={(e) => setProtein(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Carbohydrates (g)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Fat (g)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={fat}
                onChange={(e) => setFat(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Dietary Fiber (g)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={fiber}
                onChange={(e) => setFiber(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition-all"
          >
            Save Custom Food
          </button>
        </div>
      </form>
    </Modal>
  );
};
