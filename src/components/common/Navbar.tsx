import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Sun,
  Moon,
  Calendar,
  User,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDisplayDate, getOffsetDateKey, getTodayKey } from '../../utils/dateUtils';
import { apiService, DatabaseStatus } from '../../services/apiService';
import { NutriTrackLogo } from './NutriTrackLogo';
import { UserProfile } from '../../types/profile';

interface NavbarProps {
  selectedDate: string;
  onDateChange: (newDate: string) => void;
  onOpenAddFood: () => void;
  streak: number;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  profile?: UserProfile;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedDate,
  onDateChange,
  onOpenAddFood,
  streak,
  theme,
  toggleTheme,
  profile,
}) => {
  const today = getTodayKey();
  const isToday = selectedDate === today;
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);

  useEffect(() => {
    apiService.checkHealth().then((status) => {
      setDbStatus(status);
    });
    const interval = setInterval(() => {
      apiService.checkHealth().then(setDbStatus);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handlePrevDay = () => {
    onDateChange(getOffsetDateKey(-1, selectedDate));
  };

  const handleNextDay = () => {
    onDateChange(getOffsetDateKey(1, selectedDate));
  };

  const handleTodayClick = () => {
    onDateChange(today);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#080D1B]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-[#263247] px-3 sm:px-6 py-2 transition-colors duration-200 pt-safe select-none">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {/* Main Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Brand Identity Logo & Name */}
          <Link to="/" className="flex items-center gap-2 app-btn-press group">
            <NutriTrackLogo size={32} variant="full" />
            
            {/* Live Database Sync Indicator Dot */}
            <div
              className="flex items-center"
              title={
                dbStatus?.connected
                  ? `Connected to ${dbStatus.database} (${dbStatus.totalFoods} foods)`
                  : 'Local Storage Mode'
              }
            >
              <span className="relative flex h-2 w-2">
                {dbStatus?.connected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-60"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    dbStatus?.connected ? 'bg-[#10B981]' : 'bg-amber-400'
                  }`}
                ></span>
              </span>
            </div>
          </Link>

          {/* Desktop/Tablet Center: Date Navigator (hidden on mobile row, shown on sm+) */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-[#172033] p-1 rounded-xl border border-slate-200/60 dark:border-[#263247]">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-[#111827] app-btn-press"
              title="Previous Day"
              aria-label="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleTodayClick}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-slate-800 dark:text-[#F8FAFC] hover:bg-white dark:hover:bg-[#111827] app-btn-press"
              title="Jump to Today"
            >
              <Calendar className="w-3.5 h-3.5 text-[#10B981]" />
              <span>{formatDisplayDate(selectedDate)}</span>
              {isToday && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-sm shadow-[#10B981]/50"></span>
              )}
            </button>

            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-[#111827] app-btn-press"
              title="Next Day"
              aria-label="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right Action Icons: Streak, Theme Toggle, Profile/Settings, Add Food */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Streak Indicator */}
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold shadow-xs"
              title={`${streak} Day Logging Streak`}
            >
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
              <span>{streak}d</span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#172033] app-btn-press"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-600" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Profile / Settings Access */}
            <Link
              to="/profile"
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#172033] hover:bg-slate-200 dark:hover:bg-[#263247] border border-slate-200/80 dark:border-[#263247] text-slate-700 dark:text-slate-200 app-btn-press"
              title="Profile & Settings"
              aria-label="Profile and Settings"
            >
              {profile?.name ? (
                <span className="text-xs font-extrabold text-[#10B981]">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              )}
            </Link>

            {/* Desktop Add Food Button */}
            <button
              onClick={onOpenAddFood}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#10B981] to-emerald-600 hover:from-emerald-500 hover:to-[#10B981] active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-500/20 app-btn-press"
              id="global-add-food-btn"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Food</span>
            </button>
          </div>
        </div>

        {/* Mobile Date Navigator Strip (< sm screens) */}
        <div className="flex sm:hidden items-center justify-between bg-slate-100/90 dark:bg-[#111827] px-2 py-1 rounded-xl border border-slate-200/60 dark:border-[#263247]">
          <button
            onClick={handlePrevDay}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white app-btn-press"
            aria-label="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleTodayClick}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold text-slate-800 dark:text-[#F8FAFC] app-btn-press"
          >
            <Calendar className="w-3.5 h-3.5 text-[#10B981]" />
            <span>{formatDisplayDate(selectedDate)}</span>
            {isToday && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-sm shadow-[#10B981]/50"></span>
            )}
          </button>

          <button
            onClick={handleNextDay}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white app-btn-press"
            aria-label="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
