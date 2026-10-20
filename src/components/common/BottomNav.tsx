import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Utensils,
  BookOpen,
  TrendingUp,
  MoreHorizontal,
} from 'lucide-react';

interface BottomNavProps {
  onOpenMoreMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenMoreMenu }) => {
  const items = [
    { to: '/', label: 'Home', icon: LayoutDashboard },
    { to: '/tracker', label: 'Diary', icon: Utensils },
    { to: '/database', label: 'Foods', icon: BookOpen },
    { to: '/progress', label: 'Progress', icon: TrendingUp },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-2xl border-t border-slate-200/80 dark:border-[#263247] px-3 py-1 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)] select-none">
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {items.map((item) => {
          const Icon = item.icon;
          const isCenter = item.to === '/database';

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isCenter
                  ? 'flex flex-col items-center justify-center -mt-5 relative z-10'
                  : `flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 ${
                      isActive
                        ? 'text-[#10B981] dark:text-[#34D399] font-bold scale-105'
                        : 'text-slate-400 dark:text-[#94A3B8] hover:text-slate-700 dark:hover:text-slate-200'
                    }`
              }
            >
              {({ isActive }) =>
                isCenter ? (
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#10B981] via-emerald-500 to-[#A3E635] flex items-center justify-center text-[#080D1B] shadow-lg shadow-emerald-500/30 transition-transform duration-200 ${
                        isActive ? 'scale-110 ring-4 ring-[#10B981]/30' : 'hover:scale-105'
                      }`}
                    >
                      <Icon className="w-6 h-6 stroke-[2.4]" />
                    </div>
                    <span className="text-[10px] tracking-tight font-extrabold text-[#10B981] dark:text-[#34D399] mt-1">
                      Foods
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Icon className="w-5 h-5 mb-0.5" />
                      {isActive && (
                        <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-xs shadow-emerald-500/80 animate-pulse"></span>
                      )}
                    </div>
                    <span className="text-[10px] tracking-tight font-semibold">
                      {item.label}
                    </span>
                  </>
                )
              }
            </NavLink>
          );
        })}

        {/* More Menu Trigger */}
        <button
          onClick={onOpenMoreMenu}
          className="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl text-slate-400 dark:text-[#94A3B8] hover:text-slate-700 dark:hover:text-slate-200 transition-all duration-200 active:scale-95"
          aria-label="More navigation options"
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight font-semibold">More</span>
        </button>
      </div>
    </nav>
  );
};
