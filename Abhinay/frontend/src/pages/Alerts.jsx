import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';
import AlertCard from '@/components/ui/AlertCard';
import { fetchAlerts } from '@/services/apiClient';

export default function Alerts() {
  const [filter, setFilter] = useState('All');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getAlertsData = async () => {
      try {
        const data = await fetchAlerts();
        setAlerts(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch alerts", err);
        setLoading(false);
      }
    };

    getAlertsData();
    const interval = setInterval(getAlertsData, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  const filtered = filter === 'All' ? alerts : alerts.filter(a => a.severity === filter.toLowerCase());

  const counts = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    normal: alerts.filter(a => a.severity === 'normal').length,
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Stats Strip */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Active Alerts</h1>
          <p className="text-sm text-text-muted mt-1">Real-time incident response management</p>
        </div>
        
        <div className="flex gap-3 bg-dark-surface p-2 rounded-xl border border-dark-border">
          <div className="flex items-center gap-2 px-3 py-1 bg-status-critical/10 text-status-critical rounded-lg font-bold text-sm border border-status-critical/20">
            <span className="w-2 h-2 rounded-full bg-status-critical animate-pulse"></span> {counts.critical} Critical
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-status-warning/10 text-status-warning rounded-lg font-bold text-sm border border-status-warning/20">
            <span className="w-2 h-2 rounded-full bg-status-warning"></span> {counts.warning} Warning
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-status-normal/10 text-status-normal rounded-lg font-bold text-sm border border-status-normal/20">
            <span className="w-2 h-2 rounded-full bg-status-normal"></span> {counts.normal} Normal
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 border-b border-dark-border pb-4 mb-6">
        <div className="text-sm font-bold text-text-muted flex items-center gap-2"><Filter size={16}/> Filter by:</div>
        {['All', 'Critical', 'Warning', 'Normal'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${filter === f ? 'bg-dark-surface text-text-primary border border-text-secondary' : 'text-text-muted border border-transparent hover:text-text-primary'}`}
          >
            {f}
          </button>
        ))}
        
        <div className="ml-auto text-xs text-text-muted italic flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-status-normal animate-pulse"></span>
          Auto-refreshing (30s)
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-4">
        {filtered.map((alert, i) => (
          <AlertCard key={alert.id} {...alert} delay={i + 1} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-text-muted bg-dark-card border border-dark-border border-dashed rounded-2xl">
            No active alerts in this category.
          </div>
        )}
      </div>

    </div>
  );
}
