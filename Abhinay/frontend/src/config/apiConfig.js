export const API_BASE = '/api';

export const ENDPOINTS = {
  dashboardStats: `/dashboard/stats`,
  predict: (type) => `/ml/predict/${type}`,
  simulate: `/ml/simulate`,
  chat: `/ml/chat`,
  alerts: `/alerts`,
  clusters: `/clusters`,
  streamLatest: `/stream/latest`,
};
