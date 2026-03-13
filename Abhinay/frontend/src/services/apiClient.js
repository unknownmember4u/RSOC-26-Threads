import axios from 'axios';
import { API_BASE } from '@/config/apiConfig';

const api = axios.create({ baseURL: API_BASE, timeout: 15000 });

export const fetchDashboardStats = () => api.get('/dashboard/stats').then(r => r.data);
export const fetchAlerts = () => api.get('/alerts').then(r => r.data);
export const fetchClusters = () => api.get('/clusters').then(r => r.data);
export const fetchLiveData = () => api.get('/stream/latest').then(r => r.data);
export const postPredict = (type, payload) => api.post(`/ml/predict/${type}`, payload).then(r => r.data);
export const postSimulate = (payload) => api.post('/ml/simulate', payload).then(r => r.data);
export const postChat = (payload) => api.post('/ml/chat', payload).then(r => r.data);

export default api;
