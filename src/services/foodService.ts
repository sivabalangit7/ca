import { FoodItem, CustomFoodInput, FoodCategory, DietaryType } from '../types/food';
import { INITIAL_INDIAN_FOODS } from '../data/indianFoods';
import { storageService } from './storageService';

const CUSTOM_FOODS_KEY = 'custom_foods';
const RECENT_FOODS_KEY = 'recent_foods_ids';

export const foodService = {
  getCustomFoods(): FoodItem[] {
    return storageService.getData<FoodItem[]>(CUSTOM_FOODS_KEY, []);
  },

  getAllFoods(): FoodItem[] {
    const custom = foodService.getCustomFoods();
    return [...custom, ...INITIAL_INDIAN_FOODS];
  },

  getFoodById(id: string): FoodItem | undefined {
    return foodService.getAllFoods().find((f) => f.id === id);
  },

  searchFoods(params: {
    query?: string;
    category?: FoodCategory | 'All';
    dietary?: DietaryType | 'all';
  }): FoodItem[] {
    const all = foodService.getAllFoods();
    const q = (params.query || '').trim().toLowerCase();
    const category = params.category;
    const dietary = params.dietary;

    return all.filter((item) => {
      // Category match
      if (category && category !== 'All') {
        if (category === 'Custom') {
          if (!item.isCustom) return false;
        } else if (item.category !== category) {
          return false;
        }
      }

      // Dietary match
      if (dietary && dietary !== 'all') {
        if (dietary === 'veg') {
          // vegan is also veg
          if (item.dietary !== 'veg' && item.dietary !== 'vegan') return false;
        } else if (item.dietary !== dietary) {
          return false;
        }
      }

      // Partial text match (name or hindi name)
      if (q) {
        const nameMatch = item.name.toLowerCase().includes(q);
        const hindiMatch = item.hindiName ? item.hindiName.toLowerCase().includes(q) : false;
        const notesMatch = item.notes ? item.notes.toLowerCase().includes(q) : false;
        return nameMatch || hindiMatch || notesMatch;
      }

      return true;
    });
  },

  saveCustomFood(input: CustomFoodInput): FoodItem {
    const newFood: FoodItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: input.name.trim(),
      category: input.category,
      serving: input.serving.trim() || `1 ${input.servingUnit || 'serving'}`,
      servingUnit: input.servingUnit.trim() || 'serving',
      defaultQuantity: 1,
      calories: Math.max(0, Math.round(input.calories)),
      protein: Math.max(0, input.protein),
      carbs: Math.max(0, input.carbs),
      fat: Math.max(0, input.fat),
      fiber: Math.max(0, input.fiber || 0),
      dietary: input.dietary,
      isCustom: true,
      notes: 'Custom food item added by user',
    };

    storageService.updateData<FoodItem[]>(
      CUSTOM_FOODS_KEY,
      (prev) => [newFood, ...prev],
      []
    );

    return newFood;
  },

  deleteCustomFood(id: string): void {
    storageService.updateData<FoodItem[]>(
      CUSTOM_FOODS_KEY,
      (prev) => prev.filter((f) => f.id !== id),
      []
    );
  },

  clearCustomFoods(): void {
    storageService.saveData(CUSTOM_FOODS_KEY, []);
  },

  recordRecentlyUsed(foodId: string): void {
    storageService.updateData<string[]>(
      RECENT_FOODS_KEY,
      (prev) => {
        const filtered = prev.filter((id) => id !== foodId);
        return [foodId, ...filtered].slice(0, 10);
      },
      []
    );
  },

  clearRecentFoods(): void {
    storageService.saveData(RECENT_FOODS_KEY, []);
  },

  getRecentFoods(limit: number = 6): FoodItem[] {
    const recentIds = storageService.getData<string[]>(RECENT_FOODS_KEY, [
      'si-idli',
      'si-plain-dosa',
      'ni-roti',
      'rc-white-rice',
      'pr-boiled-egg',
      'ni-dal-tadka',
    ]);
    const all = foodService.getAllFoods();
    const result: FoodItem[] = [];

    recentIds.forEach((id) => {
      const found = all.find((f) => f.id === id);
      if (found && result.length < limit) {
        result.push(found);
      }
    });

    return result;
  },
};

