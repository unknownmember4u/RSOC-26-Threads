import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DISTRICTS, SCENARIOS } from '@/config/constants';

const INPUT_STYLE = {
  width: '100%', background: 'var(--app-bg)',
  border: '1px solid var(--panel-border)', borderRadius: 10,
  padding: '9px 14px', fontSize: '0.85rem', color: 'var(--text-main)',
  outline: 'none', fontFamily: 'Inter, system-ui, sans-serif',
};

function CompareBar({ label, before, after, unit = '', color }) {
  const pct = b => {
    const max = Math.max(before, after) * 1.2;
    return Math.max(4, (b / max) * 100);
  };
  const delta = ((after - before) / before * 100).toFixed(1);
  const improved = after < before;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--panel-bg)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--panel-border)',
        borderRadius: 14, padding: '18px 20px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, alignItems: 'flex-start' }}>
        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-main)' }}>{label}</div>
        <span style={{
          fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 50,
          background: improved ? 'rgba(46,213,115,0.12)' : 'rgba(255,71,87,0.12)',
          color: improved ? '#2ED573' : '#FF4757',
        }}>{improved ? '↓' : '↑'} {Math.abs(delta)}%</span>
      </div>

      {/* Before bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 5 }}>
          <span>Before</span><span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{typeof before === 'number' && before < 1 ? before.toFixed(2) : before}{unit}</span>
        </div>
        <div style={{ height: 6, background: 'var(--panel-border)', borderRadius: 4, overflow: 'hidden' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct(before)}%` }} transition={{ duration: 0.8, delay: 0.2 }}
            style={{ height: '100%', background: 'rgba(255,255,255,0.25)', borderRadius: 4 }} />
        </div>
      </div>
      {/* After bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 5 }}>
          <span>After</span><span style={{ fontWeight: 700, color }}>{typeof after === 'number' && after < 1 ? after.toFixed(2) : after}{unit}</span>
        </div>
        <div style={{ height: 6, background: 'var(--panel-border)', borderRadius: 4, overflow: 'hidden' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct(after)}%` }} transition={{ duration: 0.9, delay: 0.4 }}
            style={{ height: '100%', background: color, borderRadius: 4, boxShadow: `0 0 10px ${color}60` }} />
        </div>
      </div>
    </motion.div>
  );
}

export default function Simulator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [sliderVal, setSliderVal] = useState(25);

  const handleSimulate = e => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const r = sliderVal / 100;
      setResult({
        metrics: [
          { label: 'Traffic Density', before: 0.80, after: parseFloat((0.80 - 0.80 * r * 0.7).toFixed(2)), color: '#FF6B6B' },
          { label: 'AQI Index',       before: 160,  after: Math.round(160 - 160 * r * 0.5),                color: '#6C5CE7' },
          { label: 'Energy (GWh)',    before: 4.2,  after: parseFloat((4.2 - 4.2 * r * 0.3).toFixed(2)),  color: '#FDCB6E' },
        ],
        rec: `Implementing this policy at ${sliderVal}% intensity yields meaningful environmental gains. Recommend a phased 6-month rollout to mitigate economic disruption.`,
      });
      setLoading(false);
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Controls */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{
            background: 'var(--panel-bg)', backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--panel-border)',
            borderRadius: 18, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#A29BFE', marginBottom: 16 }}>⚗ Scenario Parameters</div>
            <form onSubmit={handleSimulate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Target District</label>
                <select style={INPUT_STYLE}>{DISTRICTS.map(d => <option key={d} style={{ background: 'var(--app-bg)', color: 'var(--text-main)' }}>{d}</option>)}</select>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Policy Action</label>
                <select style={INPUT_STYLE}>{SCENARIOS.map(s => <option key={s} style={{ background: 'var(--app-bg)', color: 'var(--text-main)' }}>{s}</option>)}</select>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Intensity</label>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: '#A29BFE' }}>{sliderVal}%</span>
                </div>
                <input type="range" min="5" max="50" step="5" value={sliderVal}
                  onChange={e => setSliderVal(+e.target.value)}
                  style={{ width: '100%', accentColor: '#A29BFE' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  <span>5% Mild</span><span>50% Aggressive</span>
                </div>
              </div>
              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{
                  padding: '12px 0', marginTop: 8,
                  background: loading ? 'var(--panel-border)' : 'linear-gradient(135deg, #6C5CE7, #A29BFE)',
                  border: 'none', borderRadius: 12, color: '#fff',
                  fontWeight: 700, fontSize: '0.88rem', cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(162,155,254,0.4)',
                }}
              >{loading ? '⟳  Simulating...' : 'Execute Simulation'}</motion.button>
            </form>
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#64748B' }}>Before → After Impact</div>
              {result.metrics.map((m, i) => <CompareBar key={i} {...m} />)}
              {/* Recommendation */}
              <div style={{
                background: 'rgba(253,203,110,0.06)', border: '1px solid rgba(253,203,110,0.18)',
                borderRadius: 14, padding: '16px 20px',
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: '1.3rem' }}>💡</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#FDCB6E', marginBottom: 4 }}>AI Recommendation</div>
                  <p style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.6 }}>{result.rec}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: 400, borderRadius: 18, border: '1px dashed var(--panel-border)',
                background: 'var(--panel-bg)', textAlign: 'center', gap: 12,
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ fontSize: '2.8rem' }}>⚗</div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Simulation Sandbox Empty</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: 300 }}>Configure a scenario and run the simulation to see animated before/after impact analysis.</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
