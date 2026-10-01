/**
 * REST API client for Forex Trading Journal
 */

const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('fx_journal_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  signup: (userData) => request('/auth/signup', { method: 'POST', body: userData }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: data }),

  // Trades
  getTrades: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/trades${queryString}`);
  },
  getTradeById: (id) => request(`/trades/${id}`),
  createTrade: (tradeData) => request('/trades', { method: 'POST', body: tradeData }),
  updateTrade: (id, tradeData) => request(`/trades/${id}`, { method: 'PUT', body: tradeData }),
  deleteTrade: (id) => request(`/trades/${id}`, { method: 'DELETE' }),

  // Strategies
  getStrategies: () => request('/strategies'),
  getStrategyById: (id) => request(`/strategies/${id}`),
  createStrategy: (data) => request('/strategies', { method: 'POST', body: data }),
  updateStrategy: (id, data) => request(`/strategies/${id}`, { method: 'PUT', body: data }),
  deleteStrategy: (id) => request(`/strategies/${id}`, { method: 'DELETE' }),

  // Backtesting
  getBacktestingSessions: () => request('/backtesting'),
  getBacktestingSessionById: (id) => request(`/backtesting/${id}`),
  createBacktestingSession: (data) => request('/backtesting', { method: 'POST', body: data }),
  updateBacktestingSession: (id, data) => request(`/backtesting/${id}`, { method: 'PUT', body: data }),
  deleteBacktestingSession: (id) => request(`/backtesting/${id}`, { method: 'DELETE' }),

  // Analytics
  getOverview: () => request('/analytics/overview'),
  getPairPerformance: () => request('/analytics/pairs'),
  getStrategyPerformance: () => request('/analytics/strategies'),
  getSessionPerformance: () => request('/analytics/sessions'),
  getTimeframePerformance: () => request('/analytics/timeframes'),
  getCalendar: (year, month) => {
    const query = new URLSearchParams();
    if (year) query.append('year', year);
    if (month) query.append('month', month);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/analytics/calendar${queryString}`);
  }
};
