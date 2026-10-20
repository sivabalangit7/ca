import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Droplets,
  CheckSquare,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { logService } from '../services/logService';
import { habitService } from '../services/habitService';
import { DEFAULT_HABITS } from '../data/defaultHabits';
import { getLastNDays, parseDateKey } from '../utils/dateUtils';
import { UserProfile } from '../types/profile';
import { WeightEntry } from '../types/weight';

interface ProgressPageProps {
  profile: UserProfile;
  weightEntries?: WeightEntry[];
}

const MACRO_COLORS = {
  protein: '#10b981', // emerald-500
  carbs: '#f59e0b',   // amber-500
  fat: '#a855f7',     // purple-500
  fiber: '#3b82f6',   // blue-500
};

export const ProgressPage: React.FC<ProgressPageProps> = ({ profile, weightEntries: _weightEntries = [] }) => {
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);

  const daysList = useMemo(() => getLastNDays(timeRange), [timeRange]);

  // Aggregate data for charts
  const chartData = useMemo(() => {
    const allLogs = logService.getAllLogs();
    const habitLogs = habitService.getAllHabitLogs();
    const totalHabits = DEFAULT_HABITS.length;

    return daysList.map((d) => {
      const log = allLogs[d];
      const hLog = habitLogs[d];
      const dateObj = parseDateKey(d);
      const label = timeRange === 7 
        ? dateObj.toLocaleDateString('en-IN', { weekday: 'short' })
        : `${dateObj.getDate()} ${dateObj.toLocaleDateString('en-IN', { month: 'short' })}`;

      if (!log) {
        const completedCount = hLog ? hLog.completedHabitIds.length : 0;
        const habitScore = Math.round((completedCount / totalHabits) * 100);
        return {
          date: d,
          label,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          water: 0,
          steps: 0,
          exerciseMin: 0,
          sleepHours: 0,
          habitScore,
        };
      }

      const calories = log.foods.reduce((acc, f) => acc + (f.calories || 0), 0);
      const protein = Math.round(log.foods.reduce((acc, f) => acc + (f.protein || 0), 0));
      const carbs = Math.round(log.foods.reduce((acc, f) => acc + (f.carbs || 0), 0));
      const fat = Math.round(log.foods.reduce((acc, f) => acc + (f.fat || 0), 0));
      const water = log.water ? log.water.amountMl || 0 : 0;
      const steps = log.activity.steps || 0;
      const exerciseMin = log.activity.exerciseMinutes || 0;
      const sleepHours = log.activity.sleepHours || 0;

      const completedCount = hLog ? hLog.completedHabitIds.length : 0;
      const habitScore = Math.round((completedCount / totalHabits) * 100);

      return {
        date: d,
        label,
        calories,
        protein,
        carbs,
        fat,
        water,
        steps,
        exerciseMin,
        sleepHours,
        habitScore,
      };
    });
  }, [daysList, timeRange]);

  // Overall aggregates
  const activeDaysWithData = chartData.filter((d) => d.calories > 0);
  const avgCalories = activeDaysWithData.length
    ? Math.round(activeDaysWithData.reduce((s, d) => s + d.calories, 0) / activeDaysWithData.length)
    : 0;
  const avgProtein = activeDaysWithData.length
    ? Math.round(activeDaysWithData.reduce((s, d) => s + d.protein, 0) / activeDaysWithData.length)
    : 0;
  const avgWater = activeDaysWithData.length
    ? Math.round(activeDaysWithData.reduce((s, d) => s + d.water, 0) / activeDaysWithData.length)
    : 0;
  const avgHabit = chartData.length
    ? Math.round(chartData.reduce((s, d) => s + d.habitScore, 0) / chartData.length)
    : 0;

  // Macro pie totals
  const totalProteinSum = activeDaysWithData.reduce((s, d) => s + d.protein, 0);
  const totalCarbsSum = activeDaysWithData.reduce((s, d) => s + d.carbs, 0);
  const totalFatSum = activeDaysWithData.reduce((s, d) => s + d.fat, 0);

  const pieData = [
    { name: 'Protein (g)', value: totalProteinSum, color: MACRO_COLORS.protein },
    { name: 'Carbs (g)', value: totalCarbsSum, color: MACRO_COLORS.carbs },
    { name: 'Fat (g)', value: totalFatSum, color: MACRO_COLORS.fat },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Filter */}
      <div className="glass-card p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Health & Nutrition Trends
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visual analytics of your calories, macro split, water, daily activity, and habit consistency.
          </p>
        </div>

        {/* Time range buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0">
          {([7, 30, 90] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === r
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span className="sm:hidden">{r}d</span>
              <span className="hidden sm:inline">Last {r} Days</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Avg Daily Calories
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {avgCalories}
            </span>
            <span className="text-xs text-slate-400">kcal</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Target: {profile.targetCalories} kcal</span>
        </div>

        <div className="glass-card p-4 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Avg Daily Protein
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {avgProtein}
            </span>
            <span className="text-xs text-slate-400">g</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Target: {profile.targetProteinG} g</span>
        </div>

        <div className="glass-card p-4 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
            Avg Daily Water
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {(avgWater / 1000).toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">L / day</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Target: 2.5 L</span>
        </div>

        <div className="glass-card p-4 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Avg Habit Score
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {avgHabit}
            </span>
            <span className="text-xs text-slate-400">%</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Daily completion index</span>
        </div>
      </div>

      {/* Chart 1: Calorie Intake vs Target */}
      <div className="glass-card p-5 border border-slate-200/80 dark:border-slate-800 space-y-3 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Daily Calorie Intake (kcal)
            </h3>
            <p className="text-[11px] text-slate-400">
              Consistency relative to your {profile.targetCalories} kcal daily goal
            </p>
          </div>
        </div>

        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(23, 23, 23, 0.85)',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <ReferenceLine
                y={profile.targetCalories}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{ value: 'Target', fill: '#10b981', fontSize: 10, position: 'top' }}
              />
              <Bar dataKey="calories" fill="#f97316" radius={[4, 4, 0, 0]} name="Calories (kcal)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2 & 3: Macronutrients Breakdown (Stacked Bar + Pie Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 glass-card p-5 border border-slate-200/80 dark:border-slate-800 space-y-3 min-w-0 overflow-hidden">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Daily Macronutrients Balance
            </h3>
            <p className="text-[11px] text-slate-400">
              Protein (g), Carbs (g), and Fat (g) intake over time
            </p>
          </div>

          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(23, 23, 23, 0.85)',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Area
                  type="monotone"
                  dataKey="carbs"
                  stackId="1"
                  stroke={MACRO_COLORS.carbs}
                  fill={MACRO_COLORS.carbs}
                  fillOpacity={0.4}
                  name="Carbs (g)"
                />
                <Area
                  type="monotone"
                  dataKey="protein"
                  stackId="1"
                  stroke={MACRO_COLORS.protein}
                  fill={MACRO_COLORS.protein}
                  fillOpacity={0.6}
                  name="Protein (g)"
                />
                <Area
                  type="monotone"
                  dataKey="fat"
                  stackId="1"
                  stroke={MACRO_COLORS.fat}
                  fill={MACRO_COLORS.fat}
                  fillOpacity={0.5}
                  name="Fat (g)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Aggregate Macro Pie Chart */}
        <div className="lg:col-span-4 glass-card p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Total Macro Ratio
            </h3>
            <p className="text-[11px] text-slate-400">Overall grams proportion</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(23, 23, 23, 0.85)',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
              <span className="font-bold text-emerald-700 dark:text-emerald-300 block">
                {totalProteinSum}g
              </span>
              <span className="text-[10px] text-slate-400">Protein</span>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
              <span className="font-bold text-amber-700 dark:text-amber-300 block">
                {totalCarbsSum}g
              </span>
              <span className="text-[10px] text-slate-400">Carbs</span>
            </div>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30">
              <span className="font-bold text-purple-700 dark:text-purple-300 block">
                {totalFatSum}g
              </span>
              <span className="text-[10px] text-slate-400">Fat</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart 4 & 5: Water Hydration & Steps/Habits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Water Intake Chart */}
        <div className="glass-card p-5 border border-slate-200/80 dark:border-slate-800 space-y-3 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Hydration Trend (ml)
            </h3>
          </div>

          <div className="h-56 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(23, 23, 23, 0.85)',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine y={2500} stroke="#3b82f6" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="water"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                  name="Water (ml)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Habit Completion Index */}
        <div className="glass-card p-5 border border-slate-200/80 dark:border-slate-800 space-y-3 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Habit Completion Index (%)
            </h3>
          </div>

          <div className="h-56 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(23, 23, 23, 0.85)',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine y={70} stroke="#10b981" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="habitScore"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                  name="Habit Score (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
