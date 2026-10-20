import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Utensils,
  BookOpen,
  Calculator,
  CalendarDays,
  CheckSquare,
  TrendingUp,
  Settings,
  Sparkles,
  Sun,
  Moon,
  Camera,
  Scale,
} from 'lucide-react';
import { NutriTrackLogo } from './NutriTrackLogo';
import { UserProfile } from '../../types/profile';

interface SidebarProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  profile: UserProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({ theme, toggleTheme, profile }) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tracker', label: 'Food Tracker', icon: Utensils },
    { to: '/database', label: 'Indian Food DB', icon: BookOpen },
    { to: '/calculator', label: 'Macro Calculator', icon: Calculator },
    { to: '/weight', label: 'Weight', icon: Scale },
    { to: '/habits', label: 'Habit Tracker', icon: CheckSquare },
    { to: '/progress', label: 'Progress & Charts', icon: TrendingUp },
    { to: '/planner', label: 'Meal Planner', icon: CalendarDays },
    { to: '/profile', label: 'Profile & Settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200/80 dark:border-[#263247] bg-white dark:bg-[#111827]/95 backdrop-blur-md h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 dark:border-[#263247]">
        <NutriTrackLogo size={38} variant="full" showSubtitle={true} withGlow={true} />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Profile & Theme Toggle */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center text-xs flex-shrink-0">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {profile.name || 'User'}
              </p>
              <p className="text-[10px] text-slate-400 capitalize truncate">
                {profile.goal === 'lose_weight_gradual'
                  ? 'Weight Loss (Gradual)'
                  : profile.goal === 'lose_weight_moderate'
                  ? 'Weight Loss (Moderate)'
                  : (profile.goal || 'maintain_health').replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
