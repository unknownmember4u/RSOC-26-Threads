import { create } from 'zustand';

const useGlobalStore = create((set) => ({
  selectedDistrict: 'All',
  dateRange: { start: null, end: null },
  liveData: [],
  alerts: [],
  predictions: null,

  setDistrict: (d) => set({ selectedDistrict: d }),
  setDateRange: (r) => set({ dateRange: r }),
  setLiveData: (d) => set({ liveData: d }),
  setAlerts: (a) => set({ alerts: a }),
  setPredictions: (p) => set({ predictions: p }),
}));

export default useGlobalStore;
