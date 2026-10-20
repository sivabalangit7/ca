import React, { useState } from 'react';
import {
  CheckSquare,
  Flame,
  Award,
  Calendar,
  Check,
  Utensils,
  Egg,
  Apple,
  Droplets,
  Footprints,
  Moon,
  Smartphone,
  ClipboardCheck,
} from 'lucide-react';
import { HabitDefinition, HabitLog, HabitStats } from '../types/habit';
import { getLastNDays, parseDateKey } from '../utils/dateUtils';
import { habitService } from '../services/habitService';

interface HabitTrackerPageProps {
  selectedDate: string;
  habitsList: HabitDefinition[];
  currentLog: HabitLog;
  stats: HabitStats;
  onToggleHabit: (id: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Utensils: <Utensils className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
  Egg: <Egg className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
  Apple: <Apple className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
  Droplets: <Droplets className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
  Footprints: <Footprints className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
  Moon: <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
  Smartphone: <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
  ClipboardCheck: <ClipboardCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />,
};

export const HabitTrackerPage: React.FC<HabitTrackerPageProps> = ({
  selectedDate,
  habitsList,
  currentLog,
  stats,
  onToggleHabit,
}) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'nutrition' | 'hydration' | 'activity' | 'lifestyle'>('all');

  const allLogs = habitService.getAllHabitLogs();
  const past7Days = getLastNDays(7);

  const filteredHabits = habitsList.filter((h) => {
    if (filterCategory === 'all') return true;
    return h.category === filterCategory;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="glass-card p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Daily Healthy Habit Tracker
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build sustainable, lifelong routines around balanced Indian nourishment, hydration, rest, and activity.
          </p>
        </div>
      </div>

      {/* 3 Metric Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Today's Score */}
        <div className="glass-card p-5 border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-brand-500/20">
            {stats.todayScore}%
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Today's Score
            </span>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
              {currentLog.completedHabitIds.length} of {habitsList.length} habits
            </p>
            <p className="text-[11px] text-slate-400">Target: at least 70% daily</p>
          </div>
        </div>

        {/* Current Streak */}
        <div className="glass-card p-5 border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-amber-500/20">
            <Flame className="w-7 h-7 fill-white" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Active Streak
            </span>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
              {stats.currentStreak} Consecutive Days
            </p>
            <p className="text-[11px] text-slate-400">Best Streak: {stats.bestStreak} days</p>
          </div>
        </div>

        {/* Weekly Score */}
        <div className="glass-card p-5 border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-blue-500/20">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Weekly Score
            </span>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
              {stats.weeklyScore}% Average
            </p>
            <p className="text-[11px] text-slate-400">Past 7 days aggregate</p>
          </div>
        </div>
      </div>

      {/* 7-Day Completion Timeline Matrix */}
      <div className="glass-card p-5 border border-slate-200/80 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-500" />
          <span>Past 7 Days Consistency Heatmap</span>
        </h3>
        <div className="grid grid-cols-7 gap-2 text-center">
          {past7Days.map((d) => {
            const dateObj = parseDateKey(d);
            const log = allLogs[d];
            const completedCount = log ? log.completedHabitIds.length : 0;
            const ratio = habitsList.length > 0 ? completedCount / habitsList.length : 0;
            const isToday = d === selectedDate;

            let bgColor = 'bg-slate-100 dark:bg-slate-800 text-slate-400';
            if (ratio >= 0.75) bgColor = 'bg-emerald-500 text-white font-bold';
            else if (ratio >= 0.5) bgColor = 'bg-emerald-300 dark:bg-emerald-700 text-emerald-950 dark:text-white';
            else if (ratio > 0) bgColor = 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300';

            return (
              <div
                key={d}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                  isToday
                    ? 'border-brand-500 ring-2 ring-brand-500/30'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {dateObj.toLocaleDateString('en-IN', { weekday: 'narrow' })}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 my-0.5">
                  {dateObj.getDate()}
                </span>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] mt-1 ${bgColor}`}
                >
                  {completedCount}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {(['all', 'nutrition', 'hydration', 'activity', 'lifestyle'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl font-bold capitalize transition-all ${
              filterCategory === cat
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Habits Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredHabits.map((habit) => {
          const isDone = currentLog.completedHabitIds.includes(habit.id);
          const icon = iconMap[habit.icon] || <CheckSquare className="w-5 h-5 text-brand-500" />;

          return (
            <div
              key={habit.id}
              onClick={() => onToggleHabit(habit.id)}
              className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start justify-between gap-4 select-none ${
                isDone
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 shadow-sm'
                  : 'glass-card-hover border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    isDone
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {icon}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-sm font-bold truncate ${
                        isDone
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {habit.title}
                    </h3>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {habit.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {habit.description}
                  </p>
                </div>
              </div>

              {/* Checkbox circle */}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                  isDone
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                    : 'border-2 border-slate-300 dark:border-slate-600 hover:border-brand-500'
                }`}
              >
                {isDone && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
