import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, fallback }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-500 flex items-center justify-center border border-orange-500/30 animate-spin">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
        </div>
        <p className="mt-4 text-xs font-medium text-slate-400 tracking-wider uppercase animate-pulse">
          Loading StreakKeeper...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback;
  }

  return children;
}
