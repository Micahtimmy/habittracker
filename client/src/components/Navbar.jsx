import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Flame, LogOut, Sparkles } from 'lucide-react';

export default function Navbar({ onOpenAddModal }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-orange-500/20 ring-1 ring-white/20">
            <Flame className="w-6 h-6 text-white fill-white animate-pulse-subtle" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                StreakKeeper
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Build unstoppable momentum</p>
          </div>
        </div>

        {/* User profile & Actions */}
        {user && (
          <div className="flex items-center gap-3 sm:gap-4">
            {onOpenAddModal && (
              <button
                onClick={onOpenAddModal}
                id="btn-add-habit-nav"
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>New Habit</span>
              </button>
            )}

            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs text-slate-300 font-medium max-w-[140px] sm:max-w-[200px] truncate" title={user.email}>
                {user.email}
              </span>
            </div>

            <button
              onClick={logout}
              id="btn-logout"
              title="Logout"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 hover:text-red-400 border border-slate-700/60 hover:border-red-500/30 text-slate-300 text-xs font-medium transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
