import React, { useState } from 'react';
import { Droplet, Plus, Settings2, Sparkles, Coffee, CupSoda, GlassWater, Wine } from 'lucide-react';
import { WaterLog } from '../../types/dailyLog';

interface QuickWaterWidgetProps {
  water: WaterLog;
  onAddWater: (amountMl: number) => void;
  onUpdateTarget?: (targetMl: number) => void;
}

export const QuickWaterWidget: React.FC<QuickWaterWidgetProps> = ({
  water,
  onAddWater,
  onUpdateTarget,
}) => {
  const [customMl, setCustomMl] = useState<string>('');
  const [showCustom, setShowCustom] = useState(false);
  const [showTargetEdit, setShowTargetEdit] = useState(false);
  const [editTargetMl, setEditTargetMl] = useState(water.targetMl || 2500);

  const amountLiters = (water.amountMl / 1000).toFixed(2);
  const targetLiters = ((water.targetMl || 2500) / 1000).toFixed(1);
  const percentage = Math.min(100, Math.round((water.amountMl / (water.targetMl || 2500)) * 100));
  const isGoalMet = water.amountMl >= (water.targetMl || 2500);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customMl, 10);
    if (!isNaN(val) && val > 0) {
      onAddWater(val);
      setCustomMl('');
      setShowCustom(false);
    }
  };

  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateTarget && editTargetMl >= 1000) {
      onUpdateTarget(editTargetMl);
      setShowTargetEdit(false);
    }
  };

  return (
    <div className="glass-card p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Droplet className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Water & Hydration</span>
              {isGoalMet && (
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  Goal Met 🎉
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">Water, Chaas, Coconut water, Green Tea</p>
          </div>
        </div>

        <button
          onClick={() => setShowTargetEdit(!showTargetEdit)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
          title="Adjust water goal"
          aria-label="Adjust water goal"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Target Edit Form */}
      {showTargetEdit && (
        <form onSubmit={handleSaveTarget} className="mb-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <input
            type="number"
            step="100"
            min="1000"
            max="6000"
            value={editTargetMl}
            onChange={(e) => setEditTargetMl(Number(e.target.value))}
            className="w-24 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
          <span className="text-xs text-slate-400">ml target</span>
          <button
            type="submit"
            className="px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 ml-auto"
          >
            Save
          </button>
        </form>
      )}

      {/* Amount Display & Visual Level */}
      <div className="my-2">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {amountLiters}
            </span>
            <span className="text-sm font-bold text-slate-400 ml-1">L</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
              Target: ~{targetLiters} L ({percentage}%)
            </span>
          </div>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50">
            {water.amountMl} ml
          </span>
        </div>

        {/* Fluid wave bar with glow */}
        <div className="relative w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isGoalMet
                ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 shadow-sm shadow-emerald-500/50'
                : 'bg-gradient-to-r from-blue-500 to-cyan-400'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Quick Action Buttons: +150ml, +250ml, +500ml, +750ml, Custom */}
      <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <button
          onClick={() => onAddWater(150)}
          className="py-1.5 px-1 rounded-xl bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all"
          title="Chai / Coffee cup (150 ml)"
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>+150ml</span>
        </button>

        <button
          onClick={() => onAddWater(250)}
          className="py-1.5 px-1 rounded-xl bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all"
          title="Standard Glass (250 ml)"
        >
          <GlassWater className="w-3.5 h-3.5" />
          <span>+250ml</span>
        </button>

        <button
          onClick={() => onAddWater(500)}
          className="py-1.5 px-1 rounded-xl bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all"
          title="Bottle (500 ml)"
        >
          <CupSoda className="w-3.5 h-3.5" />
          <span>+500ml</span>
        </button>

        <button
          onClick={() => setShowCustom(!showCustom)}
          className="py-1.5 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all"
          title="Custom amount"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Custom</span>
        </button>
      </div>

      {/* Custom Amount Drawer */}
      {showCustom && (
        <form onSubmit={handleAddCustom} className="mt-3 pt-2 flex items-center gap-2">
          <input
            type="number"
            min="50"
            step="50"
            placeholder="ml (e.g. 750)"
            value={customMl}
            onChange={(e) => setCustomMl(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95"
          >
            Add
          </button>
        </form>
      )}

      <p className="text-[10px] text-slate-400 mt-2 italic">
        *Hydration targets vary with climate, sweat, and activity.
      </p>
    </div>
  );
};
