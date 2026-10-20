import { useState, useCallback } from 'react';
import { WeightEntry, WeightStats } from '../types/weight';
import { weightService } from '../services/weightService';

export function useWeight() {
  const [entries, setEntries] = useState<WeightEntry[]>(() => weightService.getAllEntries());
  const [stats, setStats] = useState<WeightStats>(() => weightService.getStats());

  const refresh = useCallback(() => {
    setEntries(weightService.getAllEntries());
    setStats(weightService.getStats());
  }, []);

  const addEntry = useCallback((weight: number, date: string, note?: string) => {
    weightService.addEntry(weight, date, note);
    refresh();
  }, [refresh]);

  const updateEntry = useCallback((id: string, weight: number, note?: string) => {
    weightService.updateEntry(id, weight, note);
    refresh();
  }, [refresh]);

  const deleteEntry = useCallback((id: string) => {
    weightService.deleteEntry(id);
    refresh();
  }, [refresh]);

  const setGoalWeight = useCallback((weight: number | null) => {
    weightService.setGoalWeight(weight);
    refresh();
  }, [refresh]);

  const clearAll = useCallback(() => {
    weightService.clearAll();
    refresh();
  }, [refresh]);


  return {
    entries,
    stats,
    refresh,
    addEntry,
    updateEntry,
    deleteEntry,
    setGoalWeight,
    clearAll,
  };
}

