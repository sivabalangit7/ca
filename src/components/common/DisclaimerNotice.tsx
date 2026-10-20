import React from 'react';
import { Info } from 'lucide-react';

interface DisclaimerNoticeProps {
  compact?: boolean;
}

export const DisclaimerNotice: React.FC<DisclaimerNoticeProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 py-1">
        <Info className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
        <span>
          *Nutritional values are realistic estimates. Authentic Indian recipes vary based on oil, tadka, and serving portions.
        </span>
      </div>
    );
  }

  return (
    <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
      <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="font-semibold">Educational Nutrition & Wellness Guidance</p>
        <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
          Nutrition values for Indian dishes (e.g. dosas, curries, rotis) are approximate estimates derived from standard Indian food composition data. Actual macronutrient numbers vary based on culinary methods, oil/ghee usage, and serving sizes. NutriTrack India is designed for balanced lifestyle tracking and does not constitute medical or clinical prescription.
        </p>
      </div>
    </div>
  );
};
