import { motion } from 'framer-motion';

export default function ChartCard({ title, subtitle, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden"
    >
      <div className="px-5 pt-5 pb-3 border-b border-dark-border">
        <h3 className="text-sm font-bold text-text-primary">{title}</h3>
        {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-4">
        {children}
      </div>
    </motion.div>
  );
}
