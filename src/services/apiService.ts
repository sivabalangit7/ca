import { DailyLog, WaterLog, ActivityLog } from '../types/dailyLog';
import { FoodItem, LoggedFoodItem, MealCategory, CustomFoodInput } from '../types/food';
import { UserProfile, MacroCalculationResult } from '../types/profile';
import { WeightEntry } from '../types/weight';

const API_URL_STORAGE_KEY = 'nutritrack_custom_api_url';

const API_KEY_STORAGE_KEY = 'nutritrack_custom_api_key';

export function getEffectiveApiBase(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem(API_URL_STORAGE_KEY);
    if (custom && custom.trim()) {
      const trimmed = custom.trim().replace(/\/+$/, '');
      return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
    }
  }
  return '/api';
}

export function setCustomApiUrl(url: string | null): void {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      localStorage.setItem(API_URL_STORAGE_KEY, url.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem(API_URL_STORAGE_KEY);
    }
  }
}

export function getCustomApiKey(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  }
  return null;
}

export function setCustomApiKey(key: string | null): void {
  if (typeof window !== 'undefined') {
    if (key && key.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  }
}

export interface DatabaseStatus {
  connected: boolean;
  database: string;
  totalFoods: number;
  totalLogs: number;
  engine: string;
  security?: {
    walMode?: boolean;
    secureDelete?: boolean;
    foreignKeys?: boolean;
    integrityVerified?: boolean;
    rateLimitEnabled?: boolean;
  };
}

class ApiService {
  private isOnline: boolean = true;
  private userId: string | null = null;

  get baseUrl(): string {
    return getEffectiveApiBase();
  }

  /** Set the current authenticated user's ID for all API calls */
  setUserId(uid: string | null): void {
    this.userId = uid;
  }

  /** Get the current user ID */
  getUserId(): string | null {
    return this.userId;
  }

  private async fetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
    try {
      const apiKey = getCustomApiKey();
      const authHeaders: Record<string, string> = {};
      if (apiKey) authHeaders['X-API-Key'] = apiKey;
      // Send user ID in a custom header for per-user data isolation
      if (this.userId) authHeaders['X-User-Id'] = this.userId;

      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...(options?.headers || {}),
        },
        ...options,
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        return null;
      }
      this.isOnline = true;
      return (await res.json()) as T;
    } catch (err) {
      console.warn(`API request failed for ${url}:`, err);
      this.isOnline = false;
      return null;
    }
  }

  // Database status check
  async checkHealth(): Promise<DatabaseStatus> {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        this.isOnline = true;
        return {
          connected: true,
          database: data.database || 'SQLite (WAL Mode)',
          totalFoods: data.totalFoodsInDatabase || 0,
          totalLogs: data.totalFoodLogsInDatabase || 0,
          engine: data.engine || 'Python FastAPI + SQLite',
        };
      }
    } catch {
      // offline fallback
    }
    this.isOnline = false;
    return {
      connected: false,
      database: 'Local Database (Offline Fallback)',
      totalFoods: 0,
      totalLogs: 0,
      engine: 'Client Storage',
    };
  }

  // Auth API
  async registerUser(email: string, password: string, name?: string): Promise<{ success: boolean; user: { id: string; email: string; name: string }; message: string }> {
    const res = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('BACKEND_UNREACHABLE_HTML: The backend server did not return JSON. Please connect to your backend IP or use offline mode.');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    return await res.json();
  }

  async loginUser(email: string, password: string): Promise<{ success: boolean; user: { id: string; email: string; name: string }; message: string }> {
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('BACKEND_UNREACHABLE_HTML: The backend server did not return JSON. Please connect to your backend IP or use offline mode.');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    return await res.json();
  }

  // Logs API
  async getDailyLog(date: string): Promise<DailyLog | null> {
    return this.fetchJson<DailyLog>(`${this.baseUrl}/logs/${date}`);
  }

  async addFoodToLog(
    date: string,
    food: {
      foodId: string;
      name: string;
      category: string;
      mealCategory: MealCategory;
      serving: string;
      unit: string;
      quantity: number;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      dietary: string;
      source?: string;
    }
  ): Promise<LoggedFoodItem | null> {
    return this.fetchJson<LoggedFoodItem>(`${this.baseUrl}/logs/${date}/foods`, {
      method: 'POST',
      body: JSON.stringify(food),
    });
  }

  async updateFoodQuantity(date: string, logId: string, quantity: number): Promise<boolean> {
    const res = await this.fetchJson<{ success: boolean }>(`${this.baseUrl}/logs/${date}/foods/${logId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
    return !!res?.success;
  }

  async deleteLoggedFood(date: string, logId: string): Promise<boolean> {
    const res = await this.fetchJson<{ success: boolean }>(`${this.baseUrl}/logs/${date}/foods/${logId}`, {
      method: 'DELETE',
    });
    return !!res?.success;
  }

  async clearMeal(date: string, mealCategory: MealCategory): Promise<boolean> {
    const res = await this.fetchJson<{ success: boolean }>(`${this.baseUrl}/logs/${date}/clear-meal/${mealCategory}`, {
      method: 'DELETE',
    });
    return !!res?.success;
  }

  async clearDay(date: string): Promise<boolean> {
    const res = await this.fetchJson<{ success: boolean }>(`${this.baseUrl}/logs/${date}/clear`, {
      method: 'DELETE',
    });
    return !!res?.success;
  }

  async addWater(date: string, amountMl: number, targetMl?: number): Promise<WaterLog | null> {
    return this.fetchJson<WaterLog>(`${this.baseUrl}/logs/${date}/water`, {
      method: 'POST',
      body: JSON.stringify({ amountMl, targetMl }),
    });
  }

  async updateActivity(date: string, update: Partial<ActivityLog>): Promise<ActivityLog | null> {
    return this.fetchJson<ActivityLog>(`${this.baseUrl}/logs/${date}/activity`, {
      method: 'PUT',
      body: JSON.stringify(update),
    });
  }

  // Foods API
  async searchFoods(params: {
    query?: string;
    category?: string;
    dietary?: string;
    customOnly?: boolean;
    limit?: number;
  }): Promise<FoodItem[] | null> {
    const qParams = new URLSearchParams();
    if (params.query) qParams.append('query', params.query);
    if (params.category && params.category !== 'All') qParams.append('category', params.category);
    if (params.dietary && params.dietary !== 'all') qParams.append('dietary', params.dietary);
    if (params.customOnly) qParams.append('customOnly', 'true');
    if (params.limit) qParams.append('limit', params.limit.toString());

    return this.fetchJson<FoodItem[]>(`${this.baseUrl}/foods?${qParams.toString()}`);
  }

  async getRecentFoods(limit: number = 8): Promise<FoodItem[] | null> {
    return this.fetchJson<FoodItem[]>(`${this.baseUrl}/foods/recent?limit=${limit}`);
  }

  async createCustomFood(food: CustomFoodInput): Promise<FoodItem | null> {
    return this.fetchJson<FoodItem>(`${this.baseUrl}/foods/custom`, {
      method: 'POST',
      body: JSON.stringify(food),
    });
  }

  async deleteCustomFood(foodId: string): Promise<boolean> {
    const res = await this.fetchJson<{ success: boolean }>(`${this.baseUrl}/foods/custom/${foodId}`, {
      method: 'DELETE',
    });
    return !!res?.success;
  }

  // Weight API
  async getWeightEntries(): Promise<WeightEntry[] | null> {
    return this.fetchJson<WeightEntry[]>(`${this.baseUrl}/weight`);
  }

  async addWeightEntry(entry: {
    date: string;
    weightKg: number;
    bmi?: number;
    bodyFatPct?: number;
    waistCm?: number;
    notes?: string;
  }): Promise<WeightEntry | null> {
    return this.fetchJson<WeightEntry>(`${this.baseUrl}/weight`, {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  async deleteWeightEntry(id: string): Promise<boolean> {
    const res = await this.fetchJson<{ success: boolean }>(`${this.baseUrl}/weight/${id}`, {
      method: 'DELETE',
    });
    return !!res?.success;
  }

  // Habits API
  async getHabitLog(date: string): Promise<{ date: string; completedHabitIds: string[] } | null> {
    return this.fetchJson<{ date: string; completedHabitIds: string[] }>(`${this.baseUrl}/habits/${date}`);
  }

  async toggleHabit(date: string, habitId: string): Promise<{ success: boolean; completedHabitIds: string[] } | null> {
    return this.fetchJson<{ success: boolean; completedHabitIds: string[] }>(`${this.baseUrl}/habits/${date}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ habitId }),
    });
  }

  async getHabitStreak(): Promise<{ currentStreak: number; bestStreak: number; totalDaysTracked: number } | null> {
    return this.fetchJson<{ currentStreak: number; bestStreak: number; totalDaysTracked: number }>(`${this.baseUrl}/habits/streak/stats`);
  }

  // Profile API
  async getUserProfile(): Promise<UserProfile | null> {
    return this.fetchJson<UserProfile>(`${this.baseUrl}/profile`);
  }

  async updateUserProfile(profile: UserProfile): Promise<UserProfile | null> {
    return this.fetchJson<UserProfile>(`${this.baseUrl}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  async calculateMacros(input: {
    age: number;
    gender: string;
    heightCm: number;
    weightKg: number;
    activityLevel: string;
    goal: string;
    dietPlan?: string;
  }): Promise<MacroCalculationResult | null> {
    return this.fetchJson<MacroCalculationResult>(`${this.baseUrl}/profile/calculate-macros`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  // Progress Analytics API
  async getProgressAnalytics(days: number = 30): Promise<any | null> {
    return this.fetchJson<any>(`${this.baseUrl}/progress?days=${days}`);
  }

  // Database Security & Maintenance API
  async checkDatabaseIntegrity(): Promise<{
    healthy: boolean;
    integrityCheck: string[];
    quickCheck: string[];
    fileSizeBytes: number;
    journalMode: string;
    secureDelete: boolean;
    foreignKeys: boolean;
  } | null> {
    return this.fetchJson(`${this.baseUrl}/db/integrity`);
  }

  async triggerDatabaseBackup(): Promise<{
    success: boolean;
    message: string;
    backupPath: string;
  } | null> {
    return this.fetchJson(`${this.baseUrl}/db/backup`, { method: 'POST' });
  }

  async exportDatabaseBackup(): Promise<any | null> {
    return this.fetchJson(`${this.baseUrl}/db/export`);
  }

  async importDatabaseBackup(payload: any): Promise<{
    success: boolean;
    message: string;
    restoredTables: Record<string, number>;
  } | null> {
    return this.fetchJson(`${this.baseUrl}/db/import`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const apiService = new ApiService();
