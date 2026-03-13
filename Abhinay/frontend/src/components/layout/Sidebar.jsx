import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Map, Sparkles, Bell, Brain, FlaskConical, MessageSquare, Radio, ChevronDown } from 'lucide-react';
import { NAV_ITEMS, DISTRICTS } from '@/config/constants';
import useGlobalStore from '@/state/globalStore';

const ICONS = { BarChart3, Map, Sparkles, Bell, Brain, FlaskConical, MessageSquare, Radio };

export default function Sidebar() {
  const location = useLocation();
  const { selectedDistrict, setDistrict } = useGlobalStore();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-dark-card border-r border-dark-border flex flex-col z-50">

      {/* Logo */}
      <div className="px-6 py-6 border-b border-dark-border">
        <a href="/" className="flex items-center gap-3 no-underline">
          <div className="w-9 h-9 bg-um-primary rounded-lg flex items-center justify-center text-white text-sm font-black tracking-tighter">
            UM
          </div>
          <div>
            <div className="text-text-primary font-extrabold text-lg tracking-tight leading-none">UrbanMind</div>
            <div className="text-text-muted text-[0.65rem] font-medium tracking-wider uppercase">Smart City Analytics</div>
          </div>
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="text-text-muted text-[0.65rem] font-bold tracking-widest uppercase px-3 mb-3">Navigation</div>
        <ul className="space-y-1 list-none p-0 m-0">
          {NAV_ITEMS.map((item) => {
            const Icon = ICONS[item.icon];
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 no-underline
                    ${isActive
                      ? 'bg-um-primary/15 text-um-primary'
                      : 'text-text-secondary hover:bg-dark-surface hover:text-text-primary'
                    }`}
                >
                  {Icon && <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />}
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-um-primary"
                    />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Controls */}
      <div className="px-4 py-4 border-t border-dark-border space-y-3">
        {/* District Selector */}
        <div>
          <label className="text-text-muted text-[0.65rem] font-bold tracking-wider uppercase block mb-1.5">District</label>
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full bg-dark-surface border border-dark-border rounded-lg px-3 py-2 text-sm text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-um-primary/50 transition-colors"
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>
        </div>

        {/* Refresh */}
        <button className="w-full bg-dark-surface hover:bg-um-primary/15 border border-dark-border hover:border-um-primary/30 rounded-lg px-3 py-2 text-sm text-text-secondary hover:text-um-primary transition-all duration-200 font-medium">
          ↻ Refresh Data
        </button>
      </div>
    </aside>
  );
}
