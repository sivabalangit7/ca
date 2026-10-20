import React from 'react';

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  label?: string;
  sublabel?: string;
  unit?: string;
  showRemaining?: boolean;
  useGradient?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max,
  size = 200,
  strokeWidth = 14,
  label = 'Consumed',
  sublabel,
  unit = 'kcal',
  showRemaining = true,
  useGradient = true,
}) => {
  const uniqueId = React.useId();
  const gradId = `circ-grad-${uniqueId}`;
  const overGradId = `circ-over-grad-${uniqueId}`;

  // Safe numerical calculations
  const safeMax = Math.max(0, max);
  const safeVal = Math.max(0, value);
  const isTargetMissing = safeMax <= 0;
  const isExceeded = !isTargetMissing && safeVal > safeMax;
  const percentage = isTargetMissing
    ? 0
    : Math.round((safeVal / safeMax) * 100);
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  // Geometry
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * clampedPercentage) / 100;
  const remaining = Math.max(0, safeMax - safeVal);
  const exceededBy = safeVal - safeMax;

  return (
    <div className="relative inline-flex flex-col items-center justify-center w-full h-full select-none">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90 w-full h-full drop-shadow-sm"
      >
        <defs>
          {/* Emerald to Fresh Lime Gradient */}
          <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#A3E635" />
          </linearGradient>

          {/* Exceeded Target Warning Gradient */}
          <linearGradient id={overGradId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
        </defs>

        {/* Outer subtle glow track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-slate-200/70 dark:stroke-[#172033]"
          fill="transparent"
        />

        {/* Animated Progress Fill Arc */}
        {!isTargetMissing && safeVal > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke={useGradient ? `url(#${isExceeded ? overGradId : gradId})` : '#10B981'}
            className="transition-all duration-700 ease-out"
            fill="transparent"
          />
        )}
      </svg>

      {/* Center Informational Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
        {/* Label */}
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
          {label}
        </span>

        {/* Consumed Calorie Figure */}
        <div className="flex items-baseline gap-1 my-0.5">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            {Math.round(safeVal).toLocaleString()}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-slate-400 dark:text-[#94A3B8]">
            {unit}
          </span>
        </div>

        {/* Remaining or Status Pill */}
        {isTargetMissing ? (
          <span className="text-[11px] text-amber-500 font-semibold mt-0.5">
            Set target in profile
          </span>
        ) : isExceeded ? (
          <span className="text-[11px] font-bold text-rose-500 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
            +{exceededBy.toLocaleString()} kcal over
          </span>
        ) : showRemaining ? (
          <span className="text-[11px] sm:text-xs text-slate-600 dark:text-[#94A3B8] font-medium">
            <strong className="text-[#10B981] font-bold">{remaining.toLocaleString()}</strong> {unit} left
          </span>
        ) : null}

        {/* Percentage Chip */}
        {!isTargetMissing && (
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-1.5 transition-colors ${
              isExceeded
                ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                : percentage >= 100
                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                : 'bg-slate-100 dark:bg-[#172033] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#263247]'
            }`}
          >
            {percentage}% completed
          </span>
        )}

        {sublabel && (
          <span className="text-[9px] text-slate-400 mt-0.5">{sublabel}</span>
        )}
      </div>
    </div>
  );
};
