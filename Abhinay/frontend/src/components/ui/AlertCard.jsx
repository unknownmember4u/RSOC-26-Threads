import { motion } from 'framer-motion';
import { AlertTriangle, XOctagon, Info } from 'lucide-react';

const SEVERITY = {
  critical: { icon: XOctagon, border: 'border-status-critical/40', bg: 'bg-status-critical/10', text: 'text-status-critical', label: '⛔ Critical' },
  warning: { icon: AlertTriangle, border: 'border-status-warning/40', bg: 'bg-status-warning/10', text: 'text-status-warning', label: '⚠ Warning' },
  normal: { icon: Info, border: 'border-status-normal/40', bg: 'bg-status-normal/10', text: 'text-status-normal', label: '✓ Normal' },
};

export default function AlertCard({ type, district, message, timestamp, recommendation, severity = 'warning', delay = 0 }) {
  const s = SEVERITY[severity] || SEVERITY.normal;
  const Icon = s.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay * 0.08, duration: 0.35 }}
      className={`bg-dark-card border ${s.border} rounded-xl p-5 transition-all duration-300 hover:scale-[1.01]`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.bg}`}>
          <Icon size={20} className={s.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
            <span className="text-xs text-text-muted font-medium">{district}</span>
            <span className="text-xs text-text-muted ml-auto">{timestamp}</span>
          </div>
          <div className="text-sm font-semibold text-text-primary mb-1">{type}</div>
          <p className="text-xs text-text-secondary leading-relaxed">{message}</p>
          {recommendation && (
            <div className="mt-3 bg-dark-surface rounded-lg p-3 text-xs text-text-secondary">
              <span className="font-bold text-text-primary">Recommendation: </span>{recommendation}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
