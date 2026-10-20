import React from 'react';

interface NutriTrackLogoProps {
  size?: number;
  className?: string;
  variant?: 'mark' | 'icon' | 'full' | 'badge';
  showSubtitle?: boolean;
  withGlow?: boolean;
}

export const NutriTrackIconMark: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  const uniqueId = React.useId();
  const gradRingId = `nt-ring-grad-${uniqueId}`;
  const gradLeafId = `nt-leaf-grad-${uniqueId}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Emerald to Fresh Lime Gradient for Calorie Progress Ring */}
        <linearGradient id={gradRingId} x1="6" y1="36" x2="42" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="60%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#A3E635" />
        </linearGradient>

        {/* Fresh Lime Accent Gradient for Leaf Accent */}
        <linearGradient id={gradLeafId} x1="18" y1="30" x2="33" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#A3E635" />
        </linearGradient>
      </defs>

      {/* Background Calorie Ring Track (Subtle guide) */}
      <circle
        cx="24"
        cy="24"
        r="18"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        className="opacity-15 text-slate-400 dark:text-slate-600"
      />

      {/* Active Calorie Progress Arc (270° sweep, open at top-right for leaf vitality) */}
      <path
        d="M 12 36.5 A 18 18 0 1 1 39 17.5"
        stroke={`url(#${gradRingId})`}
        strokeWidth="3.6"
        strokeLinecap="round"
      />

      {/* Progress Ring Pulse Terminal Node (Calorie Milestone) */}
      <circle cx="39" cy="17.5" r="2.2" fill="#A3E635" />

      {/* Minimal Geometric Leaf (Nutrition & Health Core) */}
      {/* Left Blade: Deep Emerald Green (#10B981) */}
      <path
        d="M 17.5 30.5 C 14.5 22 19 13.5 32.5 10.5 C 26 19.5 22.5 24.5 17.5 30.5 Z"
        fill="#10B981"
      />

      {/* Right Blade / Highlight: Fresh Lime Accent (#A3E635) */}
      <path
        d="M 32.5 10.5 C 33.5 18 29.5 24 17.5 30.5 C 22.5 24.5 26 19.5 32.5 10.5 Z"
        fill="#A3E635"
      />

      {/* Delicate Geometric Stem / Vein Spine */}
      <path
        d="M 17.5 30.5 Q 24.5 20.5 32.5 10.5"
        stroke="#080D1B"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
};

export const NutriTrackLogo: React.FC<NutriTrackLogoProps> = ({
  size = 36,
  className = '',
  variant = 'full',
  showSubtitle = false,
  withGlow = false,
}) => {
  if (variant === 'mark') {
    return <NutriTrackIconMark size={size} className={className} />;
  }

  if (variant === 'icon') {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#111827] via-[#080D1B] to-[#172033] border border-[#263247] p-2 ${
          withGlow ? 'shadow-lg shadow-emerald-500/20' : 'shadow-sm'
        } ${className}`}
        style={{ width: size, height: size }}
      >
        <NutriTrackIconMark size={Math.round(size * 0.72)} />
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-[#263247] ${className}`}>
        <NutriTrackIconMark size={20} />
        <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-[#F8FAFC]">
          Nutri<span className="text-[#10B981]">Track</span>
        </span>
      </div>
    );
  }

  // Default 'full' variant
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* App Icon Squircle */}
      <div
        className={`relative flex items-center justify-center rounded-xl sm:rounded-2xl bg-[#111827] border border-[#263247] shadow-sm shadow-emerald-500/10 ${
          withGlow ? 'ring-2 ring-emerald-500/30' : ''
        }`}
        style={{ width: size, height: size }}
      >
        <NutriTrackIconMark size={Math.round(size * 0.72)} />
      </div>

      {/* Typography */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1">
          <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Nutri<span className="bg-gradient-to-r from-[#10B981] to-[#A3E635] bg-clip-text text-transparent">Track</span>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-pulse"></span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] font-semibold text-slate-400 dark:text-[#94A3B8] tracking-wider uppercase mt-0.5">
            Health & Calorie Tracker
          </span>
        )}
      </div>
    </div>
  );
};
