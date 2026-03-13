import { create } from 'zustand';

const getInitTheme = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('um_theme') || 'dark'; // default to dark first to not jump, then user can toggle
  }
  return 'dark';
};

const useGlobalStore = create((set) => ({
  theme: getInitTheme(),
  isAuthenticated: typeof window !== 'undefined' ? localStorage.getItem('um_admin_auth') === 'true' : false,
  selectedDistrict: 'All Cities',
  dateRange: { start: null, end: null },
  liveData: [],
  alerts: [],
  predictions: null,

  setTheme: (t) => {
    localStorage.setItem('um_theme', t);
    set({ theme: t });
  },
  setAuthenticated: (status) => {
    if (status) {
      localStorage.setItem('um_admin_auth', 'true');
    } else {
      localStorage.removeItem('um_admin_auth');
    }
    set({ isAuthenticated: status });
  },
  setDistrict: (d) => set({ selectedDistrict: d }),
  setDateRange: (r) => set({ dateRange: r }),
  setLiveData: (d) => set({ liveData: d }),
  setAlerts: (a) => set({ alerts: a }),
  setPredictions: (p) => set({ predictions: p }),
}));

export default useGlobalStore;
