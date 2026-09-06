import React, { useState } from 'react';
import { Flame, Check, Trash2, Calendar, AlertCircle } from 'lucide-react';
import Heatmap from './Heatmap';

export default function HabitCard({ habit, onCheckin, onUncheck, onDelete }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleToggleCheckin = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      if (habit.checkedToday) {
        await onUncheck(habit.id);
      } else {
        await onCheckin(habit.id);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await onDelete(habit.id);
    } finally {
      setIsUpdating(false);
    }
  };

  const hasStreak = habit.currentStreak > 0;

  return (
    <div
      id={`habit-card-${habit.id}`}
      className="glass-card rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:border-slate-700/80 hover:shadow-xl hover:shadow-black/40 group relative overflow-hidden"
    >
      {/* Decorative background glow for active streaks */}
      {hasStreak && (
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-orange-500/20 transition-all" />
      )}

      {/* Card Header: Title, Streak Badge, Delete */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate" title={habit.name}>
              {habit.name}
            </h3>

            {/* Streak Pill */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                hasStreak
                  ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-400 glow-orange-sm'
                  : 'bg-slate-800/80 border border-slate-700/50 text-slate-400'
              }`}
            >
              <Flame
                className={`w-4 h-4 ${
                  hasStreak
                    ? 'text-orange-500 fill-orange-500 animate-bounce'
                    : 'text-slate-500'
                }`}
              />
              <span id={`habit-streak-${habit.id}`}>
                {habit.currentStreak} {habit.currentStreak === 1 ? 'day' : 'days'}
              </span>
            </div>
          </div>

          {habit.description && (
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed line-clamp-2">
              {habit.description}
            </p>
          )}
        </div>

        {/* Delete Action */}
        <div className="flex items-center">
          {confirmDelete ? (
            <div className="flex items-center gap-1 bg-red-950/80 border border-red-800/80 rounded-lg p-1 animate-pop">
              <button
                onClick={handleDelete}
                disabled={isUpdating}
                className="px-2 py-1 text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                id={`btn-confirm-delete-${habit.id}`}
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 text-[11px] text-slate-300 hover:text-white rounded"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              title="Delete habit"
              id={`btn-delete-habit-${habit.id}`}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-60 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Card Action: Today's Check-in Button */}
      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Total check-ins: <strong className="text-slate-200">{habit.totalCheckins || 0}</strong></span>
        </div>

        <button
          onClick={handleToggleCheckin}
          disabled={isUpdating}
          id={`btn-checkin-${habit.id}`}
          className={`relative inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 ${
            habit.checkedToday
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:border-orange-500/50 hover:text-white'
          }`}
        >
          {isUpdating ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : habit.checkedToday ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Done Today!</span>
            </>
          ) : (
            <>
              <div className="w-3.5 h-3.5 rounded-full border border-slate-400" />
              <span>Check In</span>
            </>
          )}
        </button>
      </div>

      {/* 30-Day Activity Heatmap */}
      <Heatmap history={habit.history30Days} />
    </div>
  );
}
