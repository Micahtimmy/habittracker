import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Flame, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignupPage({ onNavigateLogin }) {
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await signup(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isPasswordLongEnough = password.length >= 8;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 shadow-xl shadow-orange-500/25 mb-4 ring-1 ring-white/20">
            <Flame className="w-9 h-9 text-white fill-white animate-pulse-subtle" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Start Your Streak
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Create your account and build lasting habits today
          </p>
        </div>

        {/* Signup Form Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-800 relative">
          {error && (
            <div
              id="auth-error-alert"
              className="mb-5 p-3.5 rounded-xl bg-red-950/70 border border-red-800/80 text-xs text-red-200 flex items-start gap-2.5 animate-pop"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="signup-email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="signup-email"
                  type="email"
                  required
                  maxLength={254}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="signup-password"
                  type="password"
                  required
                  maxLength={128}
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Password Requirement Hint */}
              <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    isPasswordLongEnough ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                />
                <span className={isPasswordLongEnough ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                  At least 8 characters
                </span>
              </div>
            </div>

            <button
              type="submit"
              id="btn-signup-submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 active:scale-98 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-400">
            <span>Already have an account? </span>
            <button
              type="button"
              id="link-to-login"
              onClick={onNavigateLogin}
              className="text-orange-400 hover:text-orange-300 font-semibold transition-colors underline-offset-4 hover:underline"
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
