import { UserProfile } from '../types/profile';
import { storageService } from './storageService';
import { apiService } from './apiService';
import { calculateMacros } from '../utils/macroFormulas';
import { logService } from './logService';
import { habitService } from './habitService';
import { mealPlanService } from './mealPlanService';
import { foodService } from './foodService';
import { weightService } from './weightService';
import { getCachedAuthUser } from './authService';
import { markAppInitialized } from '../data/sampleData';

const PROFILE_KEY = 'user_profile';
const THEME_KEY = 'color_theme';

export function createDefaultProfile(email?: string, name?: string): UserProfile {
  let displayName = name?.trim();
  if (!displayName && email) {
    const raw = email.split('@')[0].replace(/[._-]/g, ' ');
    displayName = raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  displayName = displayName || 'User';

  return {
    name: displayName,
    age: 26,
    gender: 'male',
    heightCm: 172,
    weightKg: 68,
    activityLevel: 'moderately_active',
    goal: 'maintain_health',
    dietaryPreference: 'veg',
    targetCalories: 2000,
    targetProteinG: 100,
    targetCarbsG: 225,
    targetFatG: 55,
    targetFiberG: 30,
    targetWaterMl: 2500,
    targetSteps: 8500,
    isCustomTargets: false,
  };
}

export const profileService = {
  getProfile(): UserProfile {
    const cachedAuth = getCachedAuthUser();
    const fallback = createDefaultProfile(cachedAuth?.email, cachedAuth?.displayName);
    const local = storageService.getData<UserProfile | null>(PROFILE_KEY, null);

    let profileToUse = local || fallback;

    // If local was stored with a generic legacy mock name ("Aditya Sharma", "Aarav Sharma")
    // but the user is logged in with their own name, update the name!
    if (cachedAuth && (profileToUse.name === 'Aditya Sharma' || profileToUse.name === 'Aarav Sharma')) {
      profileToUse = {
        ...profileToUse,
        name: cachedAuth.displayName || fallback.name,
      };
      storageService.saveData(PROFILE_KEY, profileToUse);
    }

    if (!local) {
      storageService.saveData(PROFILE_KEY, profileToUse);
    }

    apiService.getUserProfile().then((p) => {
      if (p && p.name && p.name !== 'Aarav Sharma' && p.name !== 'Fitness Enthusiast') {
        storageService.saveData(PROFILE_KEY, p);
      }
    }).catch(() => {});

    return profileToUse;
  },

  initializeUserProfile(authUser: { email: string; displayName?: string }): UserProfile {
    const local = storageService.getData<UserProfile | null>(PROFILE_KEY, null);
    if (!local || local.name === 'Aditya Sharma' || local.name === 'Aarav Sharma') {
      const defaultProf = createDefaultProfile(authUser.email, authUser.displayName);
      storageService.saveData(PROFILE_KEY, defaultProf);
      apiService.updateUserProfile(defaultProf).catch(() => {});
      return defaultProf;
    }
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
    const cachedAuth = getCachedAuthUser();
    profileService.saveProfile(createDefaultProfile(cachedAuth?.email, cachedAuth?.displayName));
  },
};
