import React, { useState, useEffect } from 'react';
import { api, getLocalDateString } from '../services/api';
import HabitCard from '../components/HabitCard';
import AddHabitModal from '../components/AddHabitModal';
import { Flame, CheckCircle2, Trophy, Plus, Sparkles, Target, RefreshCw } from 'lucide-react';

export default function DashboardPage({ isAddModalOpen, setIsAddModalOpen }) {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const fetchHabits = async () => {
    try {
      const todayStr = getLocalDateString();
      const res = await api.getHabits(todayStr);
      setHabits(res.habits || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load habits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleCreateHabit = async (name, description) => {
    const res = await api.createHabit(name, description);
    setHabits((prev) => [res.habit, ...prev]);
    showToast(`Created habit "${name}"!`);
  };

  const handleCheckin = async (habitId) => {
    try {
      const todayStr = getLocalDateString();
      const res = await api.checkin(habitId, todayStr);
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? res.habit : h))
      );
      showToast('Checked in for today! 🔥 Streak updated.');
    } catch (err) {
      setError(err.message || 'Failed to check in.');
    }
  };

  const handleUncheck = async (habitId) => {
    try {
      const todayStr = getLocalDateString();
      const res = await api.uncheck(habitId, todayStr);
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? res.habit : h))
      );
      showToast('Check-in removed.');
    } catch (err) {
      setError(err.message || 'Failed to un-check.');
    }
  };

  const handleDelete = async (habitId) => {
    try {
      await api.deleteHabit(habitId);
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      showToast('Habit deleted.');
    } catch (err) {
      setError(err.message || 'Failed to delete habit.');
    }
  };

  const showToast = (msg) => {
    setActionMessage(msg);
    setTimeout(() => {
      setActionMessage('');
    }, 3500);
  };

  // Stats Calculations
  const totalHabits = habits.length;
  const habitsDoneToday = habits.filter((h) => h.checkedToday).length;
  const activeStreaksCount = habits.filter((h) => h.currentStreak > 0).length;
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak || 0), 0);
  const completionPercentage = totalHabits > 0 ? Math.round((habitsDoneToday / totalHabits) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Toast Notification */}
      {actionMessage && (
        <div
          id="dashboard-toast"
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-orange-500/40 text-white text-xs font-semibold shadow-2xl flex items-center gap-2.5 animate-pop"
        >
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Header Banner & Stats */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Habit Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Consistency is the key to mastering your day.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            id="btn-add-habit-main"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create New Habit</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          {/* Card 1: Total Habits */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Habits</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-white" id="stat-total-habits">{totalHabits}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">Active trackings</p>
            </div>
          </div>

          {/* Card 2: Today's Done */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Goal</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-white" id="stat-today-done">{habitsDoneToday}</span>
                <span className="text-xs text-slate-400">/ {totalHabits} completed</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Active Streaks */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Streaks</span>
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-orange-400" id="stat-active-streaks">{activeStreaksCount}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">Habits on fire 🔥</p>
            </div>
          </div>

          {/* Card 4: Best Streak */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Best Streak</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-amber-300" id="stat-best-streak">{maxStreak}</span>
              <span className="text-xs text-slate-400 ml-1">days record</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-200 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchHabits}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-900/60 hover:bg-red-800 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Habits List or Loading or Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-6 border border-slate-800 animate-pulse space-y-4">
              <div className="h-6 bg-slate-800 rounded-md w-1/3" />
              <div className="h-4 bg-slate-800/60 rounded-md w-2/3" />
              <div className="h-10 bg-slate-800/40 rounded-xl" />
            </div>
          ))}
        </div>
      ) : habits.length === 0 ? (
        <div
          id="empty-habits-state"
          className="glass-card rounded-3xl p-10 sm:p-14 text-center border border-slate-800 max-w-xl mx-auto"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-4">
            <Flame className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">No habits tracked yet</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
            Ready to transform your routine? Create your first habit and start racking up daily streaks.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            id="btn-create-first-habit"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Your First Habit</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" id="habits-list">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onCheckin={handleCheckin}
              onUncheck={handleUncheck}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <AddHabitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreate={handleCreateHabit}
      />
    </div>
  );
}
