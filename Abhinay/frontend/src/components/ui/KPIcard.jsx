import { motion } from 'framer-motion';

export default function KPICard({ icon, label, value, change, color = '#FF6B6B', delay = 0 }) {
  const isPositive = change && change > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      className="bg-dark-card border border-dark-border rounded-2xl p-5 hover:border-opacity-50 transition-all duration-300 group cursor-default"
      style={{ borderColor: `${color}20` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${color}15`, color }}>
          {icon}
        </div>
        {change !== undefined && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-status-normal/15 text-status-normal' : 'bg-status-critical/15 text-status-critical'}`}>
            {isPositive ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-black text-text-primary tracking-tight">{value}</div>
      <div className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">{label}</div>
      {/* Hover bar */}
      <div className="mt-3 h-1 bg-dark-surface rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '70%' }}
          transition={{ delay: delay * 0.1 + 0.3, duration: 0.8 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </motion.div>
  );
}
