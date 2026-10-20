import { UserProfile } from '../types/profile';
import { SAMPLE_PROFILE, markAppInitialized } from '../data/sampleData';
import { storageService } from './storageService';
import { apiService } from './apiService';
import { calculateMacros } from '../utils/macroFormulas';
import { logService } from './logService';
import { habitService } from './habitService';
import { mealPlanService } from './mealPlanService';
import { foodService } from './foodService';
import { weightService } from './weightService';

const PROFILE_KEY = 'user_profile';
const THEME_KEY = 'color_theme';

export const profileService = {
  getProfile(): UserProfile {
    const local = storageService.getData<UserProfile>(PROFILE_KEY, SAMPLE_PROFILE);
    apiService.getUserProfile().then((p) => {
      if (p) {
        storageService.saveData(PROFILE_KEY, p);
      }
    }).catch(() => {});
    return local;
  },

  saveProfile(profile: UserProfile): void {
    storageService.saveData(PROFILE_KEY, profile);
    apiService.updateUserProfile(profile).catch(() => {});
  },

  updateProfileWithCalculatedMacros(profile: UserProfile): UserProfile {
    const calc = calculateMacros(
      profile.age,
      profile.gender,
      profile.heightCm,
      profile.weightKg,
      profile.activityLevel,
      profile.goal
    );

    const updated: UserProfile = {
      ...profile,
      targetCalories: calc.targetCalories,
      targetProteinG: calc.proteinG,
      targetCarbsG: calc.carbsG,
      targetFatG: calc.fatG,
      targetFiberG: calc.fiberG,
      targetWaterMl: profile.targetWaterMl || 2500,
      isCustomTargets: false,
    };

    profileService.saveProfile(updated);
    return updated;
  },

  getTheme(): 'light' | 'dark' {
    const saved = storageService.getData<'light' | 'dark' | null>(THEME_KEY, null);
    if (saved) return saved;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  },

  saveTheme(theme: 'light' | 'dark'): void {
    storageService.saveData(THEME_KEY, theme);
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  },

  resetAllApplicationData(): void {
    const currentTheme = profileService.getTheme();
    storageService.clearAllData();
    storageService.saveData(THEME_KEY, currentTheme);
    markAppInitialized();
    logService.resetAllLogs();
    habitService.resetAllHabits();
    mealPlanService.clearWeeklyPlan();
    foodService.clearCustomFoods();
    foodService.clearRecentFoods();
    weightService.clearAll();
    profileService.saveProfile(SAMPLE_PROFILE);
  },
};
