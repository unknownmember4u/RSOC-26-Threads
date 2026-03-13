import { motion } from 'framer-motion';

export default function ChartCard({ title, subtitle, children, delay = 0, accentColor = '#FDCB6E' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.07, duration: 0.45 }}
      style={{
        background: 'var(--panel-bg)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--panel-border)',
        borderRadius: 18, overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: accentColor,
            marginBottom: 2,
          }}>● {subtitle || 'Live'}</div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>{title}</div>
        </div>
      </div>
      {/* Body */}
      <div style={{ padding: '8px 8px 4px' }}>
        {children}
      </div>
    </motion.div>
  );
}
