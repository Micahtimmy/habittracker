import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/signup') {
        setAuthView('signup');
      } else {
        setAuthView('login');
      }
    };
    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // When unauthenticated, ensure view defaults to login if not on signup
  useEffect(() => {
    if (!isAuthenticated && window.location.pathname !== '/signup') {
      setAuthView('login');
    }
  }, [isAuthenticated]);

  const navigateToSignup = () => {
    setAuthView('signup');
    window.history.pushState({}, '', '/signup');
  };

  const navigateToLogin = () => {
    setAuthView('login');
    window.history.pushState({}, '', '/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-500 flex items-center justify-center border border-orange-500/30 animate-spin">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-400 tracking-wider uppercase">
          Loading StreakKeeper...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white">
      {isAuthenticated && (
        <Navbar onOpenAddModal={() => setIsAddModalOpen(true)} />
      )}

      <main className="flex-1">
        <ProtectedRoute
          fallback={
            authView === 'signup' ? (
              <SignupPage onNavigateLogin={navigateToLogin} />
            ) : (
              <LoginPage onNavigateSignup={navigateToSignup} />
            )
          }
        >
          <DashboardPage
            isAddModalOpen={isAddModalOpen}
            setIsAddModalOpen={setIsAddModalOpen}
          />
        </ProtectedRoute>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
