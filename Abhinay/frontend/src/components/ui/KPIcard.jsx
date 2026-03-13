import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';

function CountUp({ target, color }) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { damping: 55, stiffness: 120 });
  const display = useRef(target);

  useEffect(() => {
    const numeric = parseFloat(String(target).replace(/[^0-9.]/g, ''));
    if (!isNaN(numeric)) motionVal.set(numeric);
  }, [target]);

  // For non-numeric values, just render directly
  const isNumeric = !isNaN(parseFloat(String(target).replace(/[^0-9.]/g, '')));

  return (
    <span style={{ fontSize: '1.7rem', fontWeight: 900, color, letterSpacing: '-0.5px', lineHeight: 1 }}>
      {target}
    </span>
  );
}

export default function KPICard({ icon, label, value, change, color = '#FF6B6B', delay = 0 }) {
  const isPositive = change !== undefined && change < 0; // lower is better for most metrics
  const isNeutral  = change === undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.08, duration: 0.45 }}
      style={{
        background: 'var(--panel-bg)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${color}22`,
        borderRadius: 18, padding: '20px',
        position: 'relative', overflow: 'hidden',
        cursor: 'default',
        transition: 'transform 0.25s, border-color 0.25s, box-shadow 0.25s, background 0.25s',
      }}
      whileHover={{
        y: -4,
        borderColor: `${color}55`,
        boxShadow: `0 8px 32px ${color}20`,
      }}
    >
      {/* Glow orb background */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Icon + change badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: `${color}18`, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem',
          boxShadow: `0 0 0 1px ${color}22`,
        }}>
          {icon}
        </div>
        {!isNeutral && (
          <span style={{
            fontSize: '0.68rem', fontWeight: 700,
            padding: '3px 8px', borderRadius: 50,
            background: isPositive ? 'rgba(46,213,115,0.12)' : 'rgba(255,71,87,0.12)',
            color: isPositive ? '#2ED573' : '#FF4757',
            border: `1px solid ${isPositive ? 'rgba(46,213,115,0.20)' : 'rgba(255,71,87,0.20)'}`,
          }}>
            {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>

      {/* Value */}
      <div style={{ fontSize: '1.7rem', fontWeight: 900, color, letterSpacing: '-0.5px', lineHeight: 1, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>

      {/* Bottom accent bar */}
      <div style={{ marginTop: 16, height: 2, background: 'var(--panel-border)', borderRadius: 2, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '65%' }}
          transition={{ delay: delay * 0.08 + 0.4, duration: 0.9 }}
          style={{ height: '100%', background: `linear-gradient(90deg, ${color}, ${color}44)`, borderRadius: 2 }}
        />
      </div>
    </motion.div>
  );
}
