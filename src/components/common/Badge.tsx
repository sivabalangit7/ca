import React from 'react';
import { DietaryType } from '../../types/food';

interface BadgeProps {
  type: DietaryType;
  showText?: boolean;
  className?: string;
}

export const DietaryBadge: React.FC<BadgeProps> = ({ type, showText = true, className = '' }) => {
  switch (type) {
    case 'veg':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50 ${className}`}
          title="Vegetarian"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-700"></span>
          {showText && <span>Veg</span>}
        </span>
      );
    case 'non-veg':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50 ${className}`}
          title="Non-Vegetarian"
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-300 dark:ring-rose-700"></span>
          {showText && <span>Non-Veg</span>}
        </span>
      );
    case 'egg':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50 ${className}`}
          title="Contains Egg"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-300 dark:ring-amber-700"></span>
          {showText && <span>Egg</span>}
        </span>
      );
    case 'vegan':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/50 ${className}`}
          title="100% Plant-Based Vegan"
        >
          <span className="w-2 h-2 rounded-full bg-teal-500 ring-2 ring-teal-300 dark:ring-teal-700"></span>
          {showText && <span>Vegan</span>}
        </span>
      );
    default:
      return null;
  }
};
