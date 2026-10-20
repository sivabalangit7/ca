import React from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, ArrowRight, Check } from 'lucide-react';
import { HabitDefinition } from '../../types/habit';

interface QuickHabitsWidgetProps {
  habits: HabitDefinition[];
  completedIds: string[];
  todayScore: number;
  onToggleHabit: (id: string) => void;
}

export const QuickHabitsWidget: React.FC<QuickHabitsWidgetProps> = ({
  habits,
  completedIds,
  todayScore,
  onToggleHabit,
}) => {
  return (
    <div className="glass-card p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daily Habits</h3>
            <p className="text-[11px] text-slate-400">
              {completedIds.length} of {habits.length} completed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold">
          <span>{todayScore}%</span>
        </div>
      </div>

      {/* Habits Checklist (Top 4 for quick view on dashboard) */}
      <div className="space-y-2 my-1">
        {habits.slice(0, 4).map((habit) => {
          const isDone = completedIds.includes(habit.id);
          return (
            <button
              key={habit.id}
              onClick={() => onToggleHabit(habit.id)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                isDone
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-slate-900 dark:text-slate-100'
                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  isDone
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'border-2 border-slate-300 dark:border-slate-600'
                }`}
              >
                {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span className={`text-xs font-medium truncate ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                {habit.title}
              </span>
            </button>
          );
        })}
      </div>

      <Link
        to="/habits"
        className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700"
      >
        <span>View all {habits.length} habits & streaks</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
};
