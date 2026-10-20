import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Calculator,
  CheckSquare,
  Settings,
  X,
  Sparkles,
  Scale,
  CalendarDays,
} from 'lucide-react';

import { NutriTrackIconMark } from './NutriTrackLogo';

interface MobileMoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMoreMenu: React.FC<MobileMoreMenuProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const moreItems = [
    {
      to: '/weight',
      label: 'Weight Management',
      desc: 'Track weight history & trend chart',
      icon: Scale,
      color: 'bg-blue-500/15 text-blue-500 border border-blue-500/20',
    },
    {
      to: '/habits',
      label: 'Habit Tracker',
      desc: 'Daily habits, streaks & weekly score',
      icon: CheckSquare,
      color: 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20',
    },
    {
      to: '/database',
      label: 'Indian Food DB',
      desc: 'Browse 154+ authentic regional dishes',
      icon: BookOpen,
      color: 'bg-amber-500/15 text-amber-500 border border-amber-500/20',
    },
    {
      to: '/calculator',
      label: 'Macro Calculator',
      desc: 'Estimate BMR, TDEE & macro targets',
      icon: Calculator,
      color: 'bg-[#A3E635]/20 text-lime-600 dark:text-lime-400 border border-lime-500/30',
    },
    {
      to: '/planner',
      label: 'Meal Planner',
      desc: 'Plan your weekly meals in advance',
      icon: CalendarDays,
      color: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
    },
    {
      to: '/profile',
      label: 'Profile & Settings',
      desc: 'Preferences, data export & theme',
      icon: Settings,
      color: 'bg-slate-500/15 text-slate-400 border border-slate-500/20',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in lg:hidden select-none"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white dark:bg-[#111827] rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-[#263247] p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-slide-up"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex sm:hidden justify-center -mt-1 mb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#263247]">
          <div className="flex items-center gap-2">
            <NutriTrackIconMark size={22} />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-[#F8FAFC]">More Features</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172033] app-btn-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {moreItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</h4>
                  <p className="text-[11px] text-slate-400 truncate">{item.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
