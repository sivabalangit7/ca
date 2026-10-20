import React, { useState } from 'react';
import { Copy, Check, Share2, Flame, Droplets, Footprints, Sparkles } from 'lucide-react';
import { Modal } from '../common/Modal';
import { DailyLog } from '../../types/dailyLog';
import { UserProfile } from '../../types/profile';
import { formatDisplayDate } from '../../utils/dateUtils';

interface DailySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  log: DailyLog;
  profile: UserProfile;
}

export const DailySummaryModal: React.FC<DailySummaryModalProps> = ({
  isOpen,
  onClose,
  date,
  log,
  profile,
}) => {
  const [copied, setCopied] = useState(false);

  const totalCalories = log.foods.reduce((acc, f) => acc + (f.calories || 0), 0);
  const totalProtein = Math.round(log.foods.reduce((acc, f) => acc + (f.protein || 0), 0) * 10) / 10;
  const totalCarbs = Math.round(log.foods.reduce((acc, f) => acc + (f.carbs || 0), 0) * 10) / 10;
  const totalFat = Math.round(log.foods.reduce((acc, f) => acc + (f.fat || 0), 0) * 10) / 10;
  const totalFiber = Math.round(log.foods.reduce((acc, f) => acc + (f.fiber || 0), 0) * 10) / 10;

  const displayDate = formatDisplayDate(date);

  const formattedShareText = `🥗 NutriTrack Daily Summary (${displayDate})
━━━━━━━━━━━━━━━━━━
🔥 Calories: ${totalCalories} / ${profile.targetCalories} kcal
🥩 Protein: ${totalProtein}g / ${profile.targetProteinG}g
🍚 Carbs: ${totalCarbs}g / ${profile.targetCarbsG}g
🥑 Fat: ${totalFat}g / ${profile.targetFatG}g
🌾 Fiber: ${totalFiber}g / ${profile.targetFiberG}g
💧 Water: ${log.water.amountMl} ml / ${log.water.targetMl || 2500} ml
👟 Steps: ${log.activity.steps.toLocaleString()} / ${log.activity.targetSteps.toLocaleString()}
🍽️ Meals Logged: ${log.foods.length} items
━━━━━━━━━━━━━━━━━━
Tracked with NutriTrack India 🇮🇳`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedShareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = formattedShareText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Daily Nutrition Summary Card" maxWidth="md">
      <div className="space-y-4">
        {/* Card Preview */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-brand-950 text-white border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">NutriTrack India</h3>
                <p className="text-[10px] text-slate-400">{displayDate}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Verified Daily Log
            </span>
          </div>

          {/* Calorie & Macro Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Calories</span>
              <p className="text-base font-extrabold text-white mt-0.5">{totalCalories} <span className="text-[10px] font-normal text-slate-400">kcal</span></p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-emerald-400 block uppercase">Protein</span>
              <p className="text-base font-extrabold text-emerald-300 mt-0.5">{totalProtein}g</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-amber-400 block uppercase">Carbs</span>
              <p className="text-base font-extrabold text-amber-300 mt-0.5">{totalCarbs}g</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-purple-400 block uppercase">Fat</span>
              <p className="text-base font-extrabold text-purple-300 mt-0.5">{totalFat}g</p>
            </div>
          </div>

          {/* Hydration & Steps */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs">
            <div className="flex items-center gap-1.5 text-blue-300">
              <Droplets className="w-4 h-4" />
              <span>{log.water.amountMl} ml Water</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-300">
              <Footprints className="w-4 h-4" />
              <span>{log.activity.steps.toLocaleString()} Steps</span>
            </div>
          </div>
        </div>

        {/* Copy & Share Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white text-xs font-bold shadow-md shadow-brand-500/25 active:scale-95 transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
