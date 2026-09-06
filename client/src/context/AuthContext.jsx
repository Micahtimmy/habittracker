import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('streakkeeper_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('streakkeeper_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (err) {
          console.warn('Session restoration failed:', err.message);
          localStorage.removeItem('streakkeeper_token');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    }
    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      window.history.pushState({}, '', '/login');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    localStorage.setItem('streakkeeper_token', res.token);
    setToken(res.token);
    setUser(res.user);
    window.history.pushState({}, '', '/');
    return res.user;
  };

  const signup = async (email, password) => {
    const res = await api.signup(email, password);
    localStorage.setItem('streakkeeper_token', res.token);
    setToken(res.token);
    setUser(res.user);
    window.history.pushState({}, '', '/');
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('streakkeeper_token');
    setToken(null);
    setUser(null);
    window.history.pushState({}, '', '/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
