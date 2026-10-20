import React from 'react';

interface MacroNutrientBarProps {
  label: string;
  currentG: number;
  targetG: number;
  color: 'emerald' | 'amber' | 'blue' | 'purple' | 'orange';
  unit?: string;
  icon?: React.ReactNode;
}

const colorMap = {
  emerald: {
    bg: 'bg-emerald-500',
    lightBg: 'bg-emerald-100 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    bar: 'bg-emerald-500',
  },
  amber: {
    bg: 'bg-amber-500',
    lightBg: 'bg-amber-100 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    bar: 'bg-amber-500',
  },
  blue: {
    bg: 'bg-blue-500',
    lightBg: 'bg-blue-100 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    bar: 'bg-blue-500',
  },
  purple: {
    bg: 'bg-purple-500',
    lightBg: 'bg-purple-100 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    bar: 'bg-purple-500',
  },
  orange: {
    bg: 'bg-orange-500',
    lightBg: 'bg-orange-100 dark:bg-orange-950/40',
    text: 'text-orange-700 dark:text-orange-300',
    bar: 'bg-orange-500',
  },
};

export const MacroNutrientBar: React.FC<MacroNutrientBarProps> = ({
  label,
  currentG,
  targetG,
  color,
  unit = 'g',
  icon,
}) => {
  const percentage = targetG > 0 ? Math.min(100, Math.round((currentG / targetG) * 100)) : 0;
  const colors = colorMap[color] || colorMap.emerald;

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-slate-500 dark:text-slate-400">{icon}</span>}
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
            {label}
          </span>
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {percentage}%
        </span>
      </div>

      <div className="flex items-baseline justify-between text-xs my-0.5">
        <span className="text-sm font-bold text-slate-900 dark:text-white">
          {currentG}
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-0.5">{unit}</span>
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          / {targetG} {unit}
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700/60 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
