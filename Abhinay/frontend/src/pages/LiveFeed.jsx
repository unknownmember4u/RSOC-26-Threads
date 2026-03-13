import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DISTRICTS } from '@/config/constants';

const generate = id => ({
  id,
  aqi: Math.floor(Math.random() * 160) + 20,
  traffic: (Math.random() * 0.8 + 0.1).toFixed(2),
  energy: (Math.random() * 4 + 1).toFixed(1),
  status: Math.random() > 0.85 ? 'Critical' : Math.random() > 0.6 ? 'Warning' : 'Online',
});

const STATUS_META = {
  Critical: { color: '#FF4757', bg: 'rgba(255,71,87,0.08)', border: 'rgba(255,71,87,0.30)', dot: '#FF4757' },
  Warning:  { color: '#FFA502', bg: 'rgba(255,165,2,0.07)',  border: 'rgba(255,165,2,0.25)',  dot: '#FFA502' },
  Online:   { color: '#2ED573', bg: 'rgba(46,213,115,0.05)', border: 'rgba(46,213,115,0.15)', dot: '#2ED573' },
};

function SensorCard({ node, i }) {
  const m = STATUS_META[node.status];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
      style={{
        background: m.bg, border: `1px solid ${m.border}`,
        borderRadius: 16, padding: '16px 18px', position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Pulse ring for critical */}
      {node.status === 'Critical' && (
        <div style={{
          position: 'absolute', inset: -1, borderRadius: 17,
          border: `1.5px solid ${m.color}`,
          animation: 'pulse-glow-ring 1.8s ease-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>{node.id}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, display: 'block', boxShadow: `0 0 6px ${m.dot}` }} />
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: m.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{node.status}</span>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { icon: '💨', label: 'AQI',     val: node.aqi,     suffix: '',   warn: node.aqi > 100, color: '#6C5CE7' },
          { icon: '🚦', label: 'Traffic', val: node.traffic, suffix: '',   warn: node.traffic > 0.8, color: '#FF6B6B' },
          { icon: '⚡', label: 'Energy',  val: node.energy,  suffix: 'MW', warn: false,          color: '#FDCB6E' },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>{r.icon}</span>{r.label}
            </span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.82rem', color: r.warn ? r.color : 'var(--text-main)' }}>
              {r.val}{r.suffix && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 2 }}>{r.suffix}</span>}
            </span>
          </div>
        ))}
      </div>

      {/* Footer hex ID */}
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#4B5563' }}>0x{Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase()}</span>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2ED573', display: 'block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
      </div>
    </motion.div>
  );
}

export default function LiveFeed() {
  const [nodes, setNodes] = useState([]);
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    const tick = () => {
      setNodes(DISTRICTS.filter(d => d !== 'All').map(generate));
      setLastUpdate(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, []);

  const critical = nodes.filter(n => n.status === 'Critical').length;
  const warning  = nodes.filter(n => n.status === 'Warning').length;

  return (
    <>
      <style>{`
        @keyframes pulse-glow-ring { 0%{transform:scale(1);opacity:.5} 70%{transform:scale(1.03);opacity:0} 100%{transform:scale(1.03);opacity:0} }
        @keyframes pulse-dot { 0%,100%{opacity:.5} 50%{opacity:1} }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {[['Critical', critical, '#FF4757'], ['Warning', warning, '#FFA502'], ['Online', 10 - critical - warning, '#2ED573']].map(([s, n, c]) => (
              <div key={s} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: `${c}10`, border: `1px solid ${c}25`,
                borderRadius: 10, padding: '7px 14px',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, boxShadow: `0 0 8px ${c}`, display: 'block' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>{n}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#B5121B', boxShadow: '0 0 6px #B5121B', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
            Syncing every 5s · Last: {lastUpdate}
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
          {nodes.map((n, i) => <SensorCard key={`${n.id}-${lastUpdate}`} node={n} i={i} />)}
        </div>
      </div>
    </>
  );
}
