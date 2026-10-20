import { WeightEntry, WeightStats } from '../types/weight';
import { storageService } from './storageService';
import { apiService } from './apiService';

const WEIGHT_KEY = 'weight_logs';
const GOAL_WEIGHT_KEY = 'goal_weight';

export const weightService = {
  getAllEntries(): WeightEntry[] {
    const local = storageService.getData<WeightEntry[]>(WEIGHT_KEY, []);
    // Try background sync with SQLite DB
    apiService.getWeightEntries().then((dbEntries) => {
      if (dbEntries && dbEntries.length > 0) {
        const mapped: WeightEntry[] = dbEntries.map((e: any) => ({
          id: e.id,
          date: e.date,
          weight: e.weightKg || e.weight,
          bmi: e.bmi,
          bodyFatPct: e.bodyFatPct,
          waistCm: e.waistCm,
          note: e.notes || e.note,
          createdAt: e.loggedAt || e.createdAt,
        }));
        mapped.sort((a, b) => a.date.localeCompare(b.date));
        storageService.saveData(WEIGHT_KEY, mapped);
      }
    }).catch(() => {});
    return local;
  },

  addEntry(weight: number, date: string, note?: string): WeightEntry {
    const entries = weightService.getAllEntries();
    const entry: WeightEntry = {
      id: `w-${date}-${Date.now()}`,
      date,
      weight: Math.round(weight * 10) / 10,
      note: note?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    const idx = entries.findIndex((e) => e.date === date);
    if (idx >= 0) {
      entries[idx] = entry;
    } else {
      entries.push(entry);
    }
    entries.sort((a, b) => a.date.localeCompare(b.date));
    storageService.saveData(WEIGHT_KEY, entries);

    // Sync to SQLite database
    apiService.addWeightEntry({
      date,
      weightKg: entry.weight,
      notes: entry.note,
    }).catch(() => {});

    return entry;
  },

  updateEntry(id: string, weight: number, note?: string): void {
    const entries = weightService.getAllEntries();
    const idx = entries.findIndex((e) => e.id === id);
    if (idx < 0) return;
    entries[idx] = {
      ...entries[idx],
      weight: Math.round(weight * 10) / 10,
      note: note?.trim() || undefined,
    };
    storageService.saveData(WEIGHT_KEY, entries);
    apiService.addWeightEntry({
      date: entries[idx].date,
      weightKg: entries[idx].weight,
      notes: entries[idx].note,
    }).catch(() => {});
  },

  deleteEntry(id: string): void {
    const entries = weightService.getAllEntries().filter((e) => e.id !== id);
    storageService.saveData(WEIGHT_KEY, entries);
    apiService.deleteWeightEntry(id).catch(() => {});
  },

  getLastNEntries(n: number): WeightEntry[] {
    const all = weightService.getAllEntries();
    return all.slice(-n);
  },

  getEntriesInRange(startDate: string, endDate: string): WeightEntry[] {
    return weightService.getAllEntries().filter(
      (e) => e.date >= startDate && e.date <= endDate
    );
  },

  getStats(): WeightStats {
    const all = weightService.getAllEntries();
    if (all.length === 0) {
      return {
        startingWeight: null,
        currentWeight: null,
        goalWeight: weightService.getGoalWeight(),
        change: 0,
        lowestWeight: null,
        highestWeight: null,
        daysTracked: 0,
        averageWeight: null,
      };
    }

    const weights = all.map((e) => e.weight);
    const starting = all[0].weight;
    const current = all[all.length - 1].weight;

    return {
      startingWeight: starting,
      currentWeight: current,
      goalWeight: weightService.getGoalWeight(),
      change: Math.round((current - starting) * 10) / 10,
      lowestWeight: Math.min(...weights),
      highestWeight: Math.max(...weights),
      daysTracked: all.length,
      averageWeight: Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10,
    };
  },

  getGoalWeight(): number | null {
    return storageService.getData<number | null>(GOAL_WEIGHT_KEY, null);
  },

  setGoalWeight(weight: number | null): void {
    storageService.saveData(GOAL_WEIGHT_KEY, weight);
  },

  clearAll(): void {
    storageService.saveData(WEIGHT_KEY, []);
    storageService.saveData(GOAL_WEIGHT_KEY, null);
  },
};
