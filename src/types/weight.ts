export interface WeightEntry {
  id: string;
  date: string;      // YYYY-MM-DD
  weight: number;    // kg
  note?: string;
  createdAt: string; // ISO timestamp
}

export interface WeightStats {
  startingWeight: number | null;
  currentWeight: number | null;
  goalWeight: number | null;
  change: number;
  lowestWeight: number | null;
  highestWeight: number | null;
  daysTracked: number;
  averageWeight: number | null;
}
