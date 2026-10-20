import React, { useState, useMemo } from 'react';
import {
  Scale,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  TrendingDown,
  TrendingUp,
  Minus,
  Target,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { useWeight } from '../hooks/useWeight';
import { WeightEntry } from '../types/weight';
import { getTodayKey } from '../utils/dateUtils';

type TimeRange = 7 | 30 | 90 | 365;

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const WeightManagementPage: React.FC = () => {
  const { entries, stats, addEntry, updateEntry, deleteEntry, setGoalWeight } = useWeight();

  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(getTodayKey());
  const [newNote, setNewNote] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editNote, setEditNote] = useState('');
  const [goalInput, setGoalInput] = useState(stats.goalWeight?.toString() || '');
  const [editingGoal, setEditingGoal] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>(30);
  const [addError, setAddError] = useState('');

  /* ---------- Chart Data ---------- */
  const chartData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - timeRange);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const filtered = timeRange === 365
      ? entries
      : entries.filter((e) => e.date >= cutoffStr);

    return filtered.map((e) => ({
      date: formatDate(e.date),
      weight: e.weight,
    }));
  }, [entries, timeRange]);

  /* ---------- Handlers ---------- */
  const handleAdd = () => {
    const w = parseFloat(newWeight);
    if (isNaN(w) || w < 20 || w > 400) {
      setAddError('Please enter a valid weight (20–400 kg).');
      return;
    }
    addEntry(w, newDate, newNote);
    setNewWeight('');
    setNewNote('');
    setNewDate(getTodayKey());
    setShowAddForm(false);
    setAddError('');
  };

  const handleStartEdit = (entry: WeightEntry) => {
    setEditingId(entry.id);
    setEditWeight(entry.weight.toString());
    setEditNote(entry.note || '');
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const w = parseFloat(editWeight);
    if (isNaN(w) || w < 20 || w > 400) return;
    updateEntry(editingId, w, editNote);
    setEditingId(null);
  };

  const handleSaveGoal = () => {
    const g = parseFloat(goalInput);
    setGoalWeight(isNaN(g) ? null : g);
    setEditingGoal(false);
  };

  const changeColor =
    stats.change === 0
      ? 'text-slate-500'
      : stats.change < 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-rose-500 dark:text-rose-400';

  const ChangIcon =
    stats.change === 0 ? Minus : stats.change < 0 ? TrendingDown : TrendingUp;

  /* ---------- Render ---------- */
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="glass-card p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Weight Management</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track long-term trends — not daily fluctuations.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Log Weight</span>
        </button>
      </div>

      {/* Health Notice */}
      <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
          Day-to-day weight can naturally fluctuate by 1–2 kg due to water retention, meals, digestion, and hormones. Focus on weekly and monthly trends rather than individual readings.
        </p>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="glass-card p-5 border border-blue-200/60 dark:border-blue-800/50 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Log Weight Entry</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Weight (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                min="20"
                max="400"
                placeholder="e.g. 75.5"
                value={newWeight}
                onChange={(e) => { setNewWeight(e.target.value); setAddError(''); }}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Date
              </label>
              <input
                type="date"
                value={newDate}
                max={getTodayKey()}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Note (optional)
              </label>
              <input
                type="text"
                placeholder="Morning, post-workout…"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          {addError && (
            <p className="text-xs text-rose-600 font-semibold">{addError}</p>
          )}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleAdd}
              className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold transition-all"
            >
              Save Entry
            </button>
            <button
              onClick={() => { setShowAddForm(false); setAddError(''); }}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Starting Weight */}
        <div className="glass-card p-4 border border-slate-200/80 dark:border-slate-800 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Starting</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.startingWeight !== null ? `${stats.startingWeight}` : '—'}
            <span className="text-sm font-medium text-slate-400 ml-1">kg</span>
          </p>
        </div>

        {/* Current Weight */}
        <div className="glass-card p-4 border border-slate-200/80 dark:border-slate-800 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Current</p>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
            {stats.currentWeight !== null ? `${stats.currentWeight}` : '—'}
            <span className="text-sm font-medium text-slate-400 ml-1">kg</span>
          </p>
        </div>

        {/* Change */}
        <div className="glass-card p-4 border border-slate-200/80 dark:border-slate-800 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Change</p>
          <p className={`text-2xl font-extrabold flex items-center gap-1 ${changeColor}`}>
            <ChangIcon className="w-5 h-5" />
            {stats.startingWeight !== null
              ? `${stats.change > 0 ? '+' : ''}${stats.change}`
              : '—'}
            <span className="text-sm font-medium text-slate-400 ml-1">kg</span>
          </p>
        </div>

        {/* Goal / Days Tracked */}
        <div className="glass-card p-4 border border-slate-200/80 dark:border-slate-800 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Tracked</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.daysTracked}
            <span className="text-sm font-medium text-slate-400 ml-1">entries</span>
          </p>
        </div>
      </div>

      {/* Goal Weight Section */}
      <div className="glass-card p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Goal Weight</p>
            <p className="text-xs text-slate-400">Optional personal milestone</p>
          </div>
        </div>
        {editingGoal ? (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="number"
              step="0.5"
              min="20"
              max="400"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="kg"
              className="w-24 px-2 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <button onClick={handleSaveGoal} className="p-1.5 rounded-lg bg-teal-500 text-white hover:bg-teal-600">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setEditingGoal(false)} className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xl font-extrabold text-teal-600 dark:text-teal-400">
              {stats.goalWeight !== null ? `${stats.goalWeight} kg` : 'Not set'}
            </span>
            <button
              onClick={() => setEditingGoal(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 inline mr-1" />
              {stats.goalWeight ? 'Edit' : 'Set Goal'}
            </button>
          </div>
        )}
      </div>

      {/* Weight Chart */}
      {entries.length >= 2 && (
        <div className="glass-card p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Weight Trend</h2>
            <div className="flex items-center gap-1">
              {([7, 30, 90, 365] as TimeRange[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    timeRange === t
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t === 365 ? 'All' : `${t}d`}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full h-[220px] min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
                unit=" kg"
                width={52}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 10, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}
                formatter={(v) => [`${v} kg`, 'Weight']}
              />
              {stats.goalWeight && (
                <ReferenceLine
                  y={stats.goalWeight}
                  stroke="#14b8a6"
                  strokeDasharray="5 5"
                  label={{ value: `Goal ${stats.goalWeight}kg`, fontSize: 10, fill: '#14b8a6', position: 'right' }}
                />
              )}
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}

      {entries.length < 2 && entries.length > 0 && (
        <div className="glass-card p-5 border border-slate-200/80 dark:border-slate-800 text-center text-sm text-slate-400">
          Add at least 2 weight entries to see your trend chart.
        </div>
      )}

      {/* Weight History List */}
      <div className="glass-card border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Weight History
            <span className="ml-2 text-xs font-normal text-slate-400">({entries.length} entries)</span>
          </h2>
        </div>

        {entries.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Scale className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto" />
            <p className="text-sm font-semibold text-slate-400">No weight entries yet.</p>
            <p className="text-xs text-slate-400">Tap "Log Weight" above to record your first measurement.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {[...entries].reverse().map((entry) => (
              <div key={entry.id} className="p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                {editingId === entry.id ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      type="number"
                      step="0.1"
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                      className="w-24 px-2 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                    <span className="text-xs text-slate-400">kg</span>
                    <input
                      type="text"
                      placeholder="Note…"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      className="flex-1 min-w-32 px-2 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                    <button onClick={handleSaveEdit} className="p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                          {entry.weight} kg
                        </span>
                        <span className="text-xs text-slate-400">{formatDate(entry.date)}</span>
                      </div>
                      {entry.note && (
                        <p className="text-xs text-slate-400 mt-0.5 italic">{entry.note}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStartEdit(entry)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/60 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Weight management information is for personal awareness only and is not medical advice. Consult a qualified healthcare professional before making significant changes to your diet or activity level. If you are under 18, discuss any weight or diet goals with a parent/guardian and a doctor.
        </p>
      </div>
    </div>
  );
};
