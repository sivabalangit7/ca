import React from 'react';
import { Heart, Sparkles } from 'lucide-react';

interface SupportiveMessageProps {
  calorieRatio: number;
  habitsCompleted: number;
  totalHabits: number;
}

export const SupportiveMessage: React.FC<SupportiveMessageProps> = ({
  calorieRatio,
  habitsCompleted,
  totalHabits: _totalHabits,
}) => {
  let message = 'Consistency matters more than perfection.';
  let submessage = 'Every wholesome meal and glass of water contributes to your long-term vitality.';

  if (habitsCompleted >= 6) {
    message = 'Fantastic dedication today! You are thriving.';
    submessage = 'Your mindful choices around food, hydration, and movement are setting a great rhythm.';
  } else if (calorieRatio >= 0.85 && calorieRatio <= 1.15) {
    message = 'Great balance maintained today.';
    submessage = 'Fueling your day steadily with energy-giving Indian meals.';
  } else if (calorieRatio > 1.25) {
    message = 'Enjoy your food and listen to your body.';
    submessage = 'Healthy living is a journey of balance, not strict restriction. Stay hydrated and rest well tonight.';
  } else if (calorieRatio > 0) {
    message = 'Nice work logging your meals today.';
    submessage = 'Mindful tracking is the first step toward building lifelong healthy intuition.';
  }

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-amber-500/10 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-amber-950/30 border border-emerald-500/20 dark:border-emerald-800/40 flex items-center gap-3.5 shadow-xs">
      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 dark:bg-emerald-500/30 flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400">
        <Sparkles className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <span>{message}</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
          {submessage}
        </p>
      </div>
    </div>
  );
};
