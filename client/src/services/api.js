const API_BASE = '/api';

/**
 * Helper to get local date string YYYY-MM-DD
 */
export function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generic fetch wrapper with automatic JWT token attachment
 */
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('streakkeeper_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth API
  async signup(email, password) {
    return apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async login(email, password) {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async getMe() {
    return apiRequest('/auth/me');
  },

  // Habits API
  async getHabits(date = getLocalDateString()) {
    return apiRequest(`/habits?date=${date}`);
  },

  async createHabit(name, description = '') {
    return apiRequest('/habits', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  },

  async deleteHabit(habitId) {
    return apiRequest(`/habits/${habitId}`, {
      method: 'DELETE',
    });
  },

  async checkin(habitId, date = getLocalDateString()) {
    return apiRequest(`/habits/${habitId}/checkin`, {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
  },

  async uncheck(habitId, date = getLocalDateString()) {
    return apiRequest(`/habits/${habitId}/checkin`, {
      method: 'DELETE',
      body: JSON.stringify({ date }),
    });
  },
};
