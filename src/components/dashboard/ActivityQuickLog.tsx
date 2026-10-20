import React, { useState } from 'react';
import { Footprints, Activity, Moon, Check, Edit2 } from 'lucide-react';
import { ActivityLog } from '../../types/dailyLog';

interface ActivityQuickLogProps {
  activity: ActivityLog;
  onUpdateActivity: (update: Partial<ActivityLog>) => void;
}

export const ActivityQuickLog: React.FC<ActivityQuickLogProps> = ({
  activity,
  onUpdateActivity,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [steps, setSteps] = useState(activity.steps);
  const [exercise, setExercise] = useState(activity.exerciseMinutes);
  const [sleep, setSleep] = useState(activity.sleepHours);

  const handleSave = () => {
    onUpdateActivity({
      steps: Math.max(0, Number(steps)),
      exerciseMinutes: Math.max(0, Number(exercise)),
      sleepHours: Math.max(0, Number(sleep)),
    });
    setIsEditing(false);
  };

  return (
    <div className="glass-card p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Activity & Recovery</h3>
          <p className="text-[11px] text-slate-400">Movement, workouts & sleep</p>
        </div>
        <button
          onClick={() => {
            if (isEditing) handleSave();
            else setIsEditing(true);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isEditing ? 'Save' : 'Edit values'}
        >
          {isEditing ? <Check className="w-4 h-4 text-brand-600" /> : <Edit2 className="w-4 h-4" />}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {/* Steps */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-center">
          <div className="w-7 h-7 mx-auto mb-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Footprints className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Steps</span>
          {isEditing ? (
            <input
              type="number"
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
              className="w-full text-center text-xs font-bold bg-white dark:bg-slate-900 border border-brand-500 rounded py-0.5 mt-1"
            />
          ) : (
            <span className="text-sm font-extrabold text-slate-900 dark:text-white block mt-0.5">
              {activity.steps.toLocaleString()}
            </span>
          )}
          <span className="text-[10px] text-slate-400">/ {activity.targetSteps.toLocaleString()}</span>
        </div>

        {/* Exercise */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-center">
          <div className="w-7 h-7 mx-auto mb-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Active</span>
          {isEditing ? (
            <input
              type="number"
              value={exercise}
              onChange={(e) => setExercise(Number(e.target.value))}
              className="w-full text-center text-xs font-bold bg-white dark:bg-slate-900 border border-brand-500 rounded py-0.5 mt-1"
            />
          ) : (
            <span className="text-sm font-extrabold text-slate-900 dark:text-white block mt-0.5">
              {activity.exerciseMinutes}
            </span>
          )}
          <span className="text-[10px] text-slate-400">mins</span>
        </div>

        {/* Sleep */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-center">
          <div className="w-7 h-7 mx-auto mb-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Moon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Sleep</span>
          {isEditing ? (
            <input
              type="number"
              step="0.5"
              value={sleep}
              onChange={(e) => setSleep(Number(e.target.value))}
              className="w-full text-center text-xs font-bold bg-white dark:bg-slate-900 border border-brand-500 rounded py-0.5 mt-1"
            />
          ) : (
            <span className="text-sm font-extrabold text-slate-900 dark:text-white block mt-0.5">
              {activity.sleepHours}
            </span>
          )}
          <span className="text-[10px] text-slate-400">hours</span>
        </div>
      </div>

      {isEditing && (
        <button
          onClick={handleSave}
          className="mt-3 w-full py-1.5 rounded-lg bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 transition-colors"
        >
          Save Activity Log
        </button>
      )}
    </div>
  );
};
