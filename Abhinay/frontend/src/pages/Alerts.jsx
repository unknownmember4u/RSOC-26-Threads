import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAlerts } from '@/services/apiClient';

const FALLBACK_ALERTS = [
  { id: 1, severity: 'critical', title: 'AQI Threshold Exceeded',     district: 'D04', time: '2 min ago',  message: 'Air Quality Index surged to 210 in District D04. Mobilize clean air protocol.', domain: 'Pollution' },
  { id: 2, severity: 'critical', title: 'Traffic Grid Overload',       district: 'D02', time: '5 min ago',  message: 'Traffic density at 93% — approaching saturation. Open overflow routes via D06.', domain: 'Traffic' },
  { id: 3, severity: 'warning',  title: 'Energy Overconsumption',       district: 'D07', time: '11 min ago', message: 'Power load 18% above hourly target. Recommend load-shedding protocol for industrial zone 7B.', domain: 'Energy' },
  { id: 4, severity: 'warning',  title: 'Water Pressure Anomaly',       district: 'D07', time: '18 min ago', message: 'Valve station #22 showing irregular output. Manual inspection required within 6 hours.', domain: 'Water' },
  { id: 5, severity: 'normal',   title: 'Waste Collection Optimised',  district: 'D01', time: '32 min ago', message: 'Route 7 compaction increased efficiency by 22%. All bins cleared 1.5h ahead of schedule.', domain: 'Waste' },
  { id: 6, severity: 'normal',   title: 'Transport Load Normalised',   district: 'D05', time: '45 min ago', message: 'Post-event traffic cleared. Metro lines running on schedule. Load drop to 72%.', domain: 'Transport' },
];

const SEVERITY_META = {
  critical: { color: '#FF4757', bg: 'rgba(255,71,87,0.08)', label: 'Critical',  icon: '⚠' },
  warning:  { color: '#FFA502', bg: 'rgba(255,165,2,0.08)',  label: 'Warning',   icon: '⚡' },
  normal:   { color: '#2ED573', bg: 'rgba(46,213,115,0.08)', label: 'Normal',    icon: '✓' },
};

function AlertCard({ id, severity, title, district, time, message, domain, i }) {
  const meta = SEVERITY_META[severity] || SEVERITY_META.normal;
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
      transition={{ delay: i * 0.06 }}
      style={{
        background: meta.bg,
        border: `1px solid ${meta.color}25`,
        borderRadius: 16, padding: '16px 20px',
        display: 'flex', gap: 16, alignItems: 'flex-start',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Severity dot */}
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: `${meta.color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.2rem', color: meta.color,
        position: 'relative',
      }}>
        {meta.icon}
        {severity === 'critical' && (
          <span style={{
            position: 'absolute', inset: -3, borderRadius: 15,
            border: `1.5px solid ${meta.color}`,
            animation: 'pulse-alert 1.8s ease-out infinite',
          }} />
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)' }}>{title}</span>
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 50,
            background: `${meta.color}20`, color: meta.color,
          }}>{meta.label}</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--panel-border)', borderRadius: 50, padding: '2px 8px' }}>{domain}</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 8 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, fontSize: '0.7rem', color: '#64748B' }}>
          <span>📍 {district}</span>
          <span>🕐 {time}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Alerts() {
  const [filter, setFilter] = useState('All');
  const [alerts, setAlerts] = useState(FALLBACK_ALERTS);

  useEffect(() => {
    const load = async () => {
      try { const data = await fetchAlerts(); if (data?.length) setAlerts(data); } catch {}
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const filtered = filter === 'All' ? alerts : alerts.filter(a => a.severity === filter.toLowerCase());
  const counts = { critical: alerts.filter(a => a.severity === 'critical').length, warning: alerts.filter(a => a.severity === 'warning').length, normal: alerts.filter(a => a.severity === 'normal').length };

  return (
    <>
      <style>{`
        @keyframes pulse-alert { 0%{transform:scale(1);opacity:.6} 70%{transform:scale(1.4);opacity:0} 100%{transform:scale(1.4);opacity:0} }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Count strips */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[['critical','⚠',counts.critical],['warning','⚡',counts.warning],['normal','✓',counts.normal]].map(([sev, icon, n]) => {
            const m = SEVERITY_META[sev];
            return (
              <div key={sev} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: m.bg, border: `1px solid ${m.color}25`,
                borderRadius: 12, padding: '10px 18px', fontWeight: 700,
              }}>
                <span style={{ color: m.color, fontSize: '1rem' }}>{icon}</span>
                <span style={{ fontSize: '1.4rem', color: m.color, letterSpacing: '-0.5px' }}>{n}</span>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'capitalize' }}>{sev}</span>
              </div>
            );
          })}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#64748B' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2ED573', boxShadow: '0 0 6px #2ED573', display: 'inline-block', animation: 'pulse-alert 2s infinite' }} />
            Auto-refreshing (30s)
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--panel-border)', paddingBottom: 16 }}>
          {['All','Critical','Warning','Normal'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 18px', borderRadius: 50, fontWeight: 700,
              fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s',
              border: filter === f ? '1px solid var(--panel-border)' : '1px solid transparent',
              background: filter === f ? 'var(--panel-glass)' : 'transparent',
              color: filter === f ? 'var(--text-main)' : 'var(--text-muted)',
            }}>{f}</button>
          ))}
        </div>

        {/* Alert feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnimatePresence>
            {filtered.map((alert, i) => <AlertCard key={alert.id} {...alert} i={i} />)}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', background: 'var(--panel-bg)', border: '1px dashed var(--panel-border)', borderRadius: 16 }}>
              No active alerts in this category.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
