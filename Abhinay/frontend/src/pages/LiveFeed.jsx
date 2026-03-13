import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DISTRICTS } from '@/config/constants';

// Simulated raw IoT data
const generateNodeData = (id) => ({
  id,
  aqi: Math.floor(Math.random() * 150) + 20,
  traffic: (Math.random() * 0.8 + 0.1).toFixed(2),
  energy: (Math.random() * 4 + 1).toFixed(1),
  status: Math.random() > 0.85 ? 'Critical' : Math.random() > 0.6 ? 'Warning' : 'Online',
});

export default function LiveFeed() {
  const [nodes, setNodes] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());

  // Auto-refresh simulation
  useEffect(() => {
    const fetchNodes = () => {
      setNodes(DISTRICTS.filter(d => d !== 'All').map(generateNodeData));
      setLastUpdate(new Date().toLocaleTimeString());
    };
    
    fetchNodes();
    const interval = setInterval(fetchNodes, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight flex items-center gap-2">
            <span className="text-um-primary">📡</span> Raw IoT Telemetry Feed
          </h1>
          <p className="text-sm text-text-muted mt-1">Direct stream from municipal sensor arrays</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-text-muted flex items-center gap-2 bg-dark-surface px-3 py-1.5 rounded-full border border-dark-border">
            <span className="w-2 h-2 rounded-full bg-um-primary animate-pulse"></span>
            Syncing (5s)
          </div>
          <div className="text-xs font-mono text-text-secondary bg-dark-card px-3 py-1.5 rounded-full border border-dark-border">
            {lastUpdate}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {nodes.map((n, i) => (
          <motion.div 
            key={`${n.id}-${lastUpdate}`} // force re-animation on update if critical
            initial={n.status === 'Critical' ? { scale: 0.95, opacity: 0.8 } : false}
            animate={n.status === 'Critical' ? { scale: 1, opacity: 1 } : false}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className={`bg-dark-card border rounded-2xl p-5 relative overflow-hidden ${
              n.status === 'Critical' ? 'border-status-critical/50 shadow-[0_0_15px_rgba(255,71,87,0.15)] bg-status-critical/5' : 
              n.status === 'Warning' ? 'border-status-warning/30 bg-status-warning/5' : 
              'border-dark-border'
            }`}
          >
            {n.status === 'Critical' && <div className="absolute inset-0 border-2 border-status-critical/30 rounded-2xl animate-pulse-glow pointer-events-none"></div>}
            
            <div className="flex justify-between items-start mb-4">
              <div className="text-lg font-black text-text-primary">{n.id}</div>
              <div className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                n.status === 'Critical' ? 'bg-status-critical text-white' : 
                n.status === 'Warning' ? 'bg-status-warning/20 text-status-warning border border-status-warning/30' : 
                'bg-status-normal/10 text-status-normal border border-status-normal/20'
              }`}>
                {n.status}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted font-medium flex items-center gap-1.5"><span className="text-[#6C5CE7]">🌫️</span> AQI</span>
                <span className={`font-mono font-bold ${n.aqi > 100 ? 'text-status-warning' : 'text-text-primary'}`}>{n.aqi}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted font-medium flex items-center gap-1.5"><span className="text-[#FF6B6B]">🚦</span> TRF</span>
                <span className={`font-mono font-bold ${n.traffic > 0.8 ? 'text-status-critical' : 'text-text-primary'}`}>{n.traffic}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted font-medium flex items-center gap-1.5"><span className="text-[#FDCB6E]">⚡</span> ENG</span>
                <span className="font-mono font-bold text-text-primary">{n.energy} <span className="text-[0.6rem] text-text-muted">MW</span></span>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-dark-border flex justify-between items-center">
              <div className="text-[0.6rem] text-text-muted font-mono">0x{Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}</div>
              <div className="w-1.5 h-1.5 rounded-full bg-status-normal animate-pulse"></div>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
}
