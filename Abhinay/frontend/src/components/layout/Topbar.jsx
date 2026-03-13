import { Search, Bell, User } from 'lucide-react';
import useGlobalStore from '@/state/globalStore';

export default function Topbar() {
  const { selectedDistrict } = useGlobalStore();

  return (
    <header className="h-16 bg-dark-card/80 backdrop-blur-md border-b border-dark-border flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search analytics..."
            className="bg-dark-surface border border-dark-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder-text-muted w-72 focus:outline-none focus:border-um-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <span className="text-[0.75rem] font-semibold text-text-muted bg-dark-surface px-3 py-1.5 rounded-full border border-dark-border">
          📍 District: {selectedDistrict}
        </span>
        
        {/* Alerts bell */}
        <button className="relative p-2 rounded-lg bg-dark-surface border border-dark-border text-text-secondary hover:text-text-primary hover:border-um-primary/30 transition-all">
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-status-critical text-[0.6rem] text-white rounded-full flex items-center justify-center font-bold">3</span>
        </button>

        {/* User */}
        <div className="flex items-center gap-2 bg-dark-surface border border-dark-border rounded-lg px-3 py-1.5">
          <div className="w-7 h-7 bg-um-primary/15 rounded-full flex items-center justify-center">
            <User size={14} className="text-um-primary" />
          </div>
          <span className="text-sm font-medium text-text-primary">Admin</span>
        </div>
      </div>
    </header>
  );
}
