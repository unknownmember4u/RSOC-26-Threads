import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DISTRICTS, SCENARIOS } from '@/config/constants';
import { api } from '../api/urbanmindAPI';

const PREMIUM_INPUT = {
  width: '100%',
  background: 'var(--panel-bg)',
  border: '1px solid var(--panel-border-heavy)',
  borderRadius: 12,
  padding: '12px 16px',
  fontSize: '0.85rem',
  color: 'var(--text-main)',
  outline: 'none',
  fontFamily: 'Inter, system-ui, sans-serif',
  transition: 'all 0.2s ease'
};

function CompareBar({ label, before, after, unit = '', color }) {
  const pct = b => {
    const max = Math.max(before, after) * 1.2;
    return Math.max(4, (b / max) * 100);
  };
  const diff = after - before;
  const delta = (before !== 0 ? (diff / before * 100) : 0).toFixed(1);
  const improved = diff < 0; 
  const isNeon = improved ? '#2ED573' : '#FF4757';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring' }}
      style={{
        background: 'var(--panel-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--panel-border-heavy)',
        borderRadius: 20,
        padding: '24px',
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative gradient orb */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 80, height: 80, background: color, filter: 'blur(50px)', opacity: 0.15, borderRadius: '50%' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--text-primary)', letterSpacing: '0.02em' }}>{label}</div>
        <motion.div 
          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
          style={{
            fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: 50,
            background: improved ? 'rgba(46,213,115,0.15)' : 'rgba(255,71,87,0.15)',
            color: isNeon,
            border: `1px solid ${isNeon}40`,
            boxShadow: `0 0 10px ${isNeon}20`
          }}
        >
          {improved ? '↓' : '↑'} {Math.abs(delta)}%
        </motion.div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <span>Current Baseline</span>
          <span style={{ fontWeight: 700, color: '#CBD5E1' }}>{typeof before === 'number' && before < 1 ? before.toFixed(2) : before}{unit}</span>
        </div>
        <div style={{ height: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 10, overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct(before)}%` }} transition={{ duration: 1, ease: 'easeOut' }}
            style={{ height: '100%', background: '#64748B', borderRadius: 10 }} />
        </div>
      </div>
      
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <span>Projected Impact</span>
          <span style={{ fontWeight: 800, color, textShadow: `0 0 10px ${color}60` }}>{typeof after === 'number' && after < 1 ? after.toFixed(2) : after}{unit}</span>
        </div>
        <div style={{ height: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 10, overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct(after)}%` }} transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
            style={{ 
              height: '100%', 
              background: `linear-gradient(90deg, ${color}90, ${color})`, 
              borderRadius: 10, 
              boxShadow: `0 0 15px ${color}80, inset 0 0 5px rgba(255,255,255,0.5)` 
            }} />
        </div>
      </div>
    </motion.div>
  );
}

export default function Simulator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [sliderVal, setSliderVal] = useState(25);
  const [selection, setSelection] = useState({
    district: DISTRICTS[0],
    policy: SCENARIOS[0]
  });

  const handleSimulate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const scenarioKey = selection.policy.toLowerCase().replace(/ /g, '_');
      const data = await api.simulate({
        district_id: selection.district,
        change: scenarioKey,
        percent: sliderVal
      });

      const metrics = [
        { label: 'Traffic Density', before: data.original_values.traffic_density, after: data.simulated_values.traffic_density, color: '#FF6B6B' },
        { label: 'Air Quality (AQI)', before: data.original_values.aqi, after: data.simulated_values.aqi, color: '#A29BFE' },
        { label: 'Energy Load', before: data.original_values.consumption_kwh, after: data.simulated_values.consumption_kwh, color: '#FDCB6E' },
      ];

      setResult({ metrics, rec: data.recommendation });
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      // Fake delay for realistic premium feel
      setTimeout(() => setLoading(false), 600);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '10px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 380px) 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Advanced Controls Panel */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 100 }}>
          <div style={{
            background: 'var(--panel-bg)',
            backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid var(--panel-border-heavy)',
            borderRadius: 24, padding: 32, 
            boxShadow: 'var(--shadow-md)',
            position: 'relative', overflow: 'hidden'
          }}>
            {/* Glowing background accent */}
            <div style={{ position: 'absolute', top: -50, left: -50, width: 150, height: 150, background: '#38BDF8', filter: 'blur(80px)', opacity: 0.15 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(56, 189, 248, 0.4)', boxShadow: '0 0 15px rgba(56,189,248,0.2)' }}>
                <span style={{ fontSize: '1.2rem' }}>⚗️</span>
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#38BDF8' }}>
                Simulator Sandbox
              </div>
            </div>

            <form onSubmit={handleSimulate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>Target Zone</label>
                <select 
                  style={PREMIUM_INPUT} 
                  value={selection.district}
                  onChange={e => setSelection({...selection, district: e.target.value})}
                  onFocus={e => e.target.style.borderColor = 'rgba(56, 189, 248, 0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                >
                  {DISTRICTS.map(d => <option key={d} style={{ background: '#0F172A', color: '#F1F5F9' }}>{d}</option>)}
                </select>
              </div>

              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>Policy Intervention</label>
                <select 
                  style={PREMIUM_INPUT}
                  value={selection.policy}
                  onChange={e => setSelection({...selection, policy: e.target.value})}
                  onFocus={e => e.target.style.borderColor = 'rgba(56, 189, 248, 0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                >
                  {SCENARIOS.map(s => <option key={s} style={{ background: '#0F172A', color: '#F1F5F9' }}>{s}</option>)}
                </select>
              </div>

              <div style={{ background: 'var(--accent-alpha-10)', padding: 16, borderRadius: 16, border: '1px solid var(--panel-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Intensity</label>
                  <motion.span 
                    key={sliderVal} initial={{ scale: 1.5, color: '#fff' }} animate={{ scale: 1, color: '#38BDF8' }}
                    style={{ fontSize: '1.1rem', fontWeight: 900, textShadow: '0 0 10px rgba(56,189,248,0.5)' }}
                  >
                    {sliderVal}%
                  </motion.span>
                </div>
                
                {/* Custom Glowing Slider Area */}
                <input type="range" min="5" max="50" step="5" value={sliderVal}
                  onChange={e => setSliderVal(+e.target.value)}
                  style={{ 
                    width: '100%', cursor: 'pointer', height: 4, 
                    appearance: 'none', background: 'rgba(255,255,255,0.1)', borderRadius: 10,
                    outline: 'none'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#64748B', marginTop: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span>Min (5%)</span><span>Aggressive (50%)</span>
                </div>
              </div>

              <motion.button 
                type="submit" disabled={loading} 
                whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(56,189,248,0.4)' }} 
                whileTap={{ scale: 0.96 }}
                style={{
                  padding: '16px 0', marginTop: 10,
                  background: loading ? 'var(--accent-alpha-10)' : 'linear-gradient(135deg, #0284C7, #1E40AF)',
                  border: '1px solid var(--panel-border-heavy)', borderRadius: 14, color: 'var(--text-primary)',
                  fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.02em',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  position: 'relative', overflow: 'hidden',
                  boxShadow: loading ? 'none' : 'inset 0 1px 1px rgba(255,255,255,0.4), 0 8px 20px rgba(37, 99, 235, 0.3)',
                }}
              >
                {loading ? (
                  <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    📡 Running Neural Simulation...
                  </motion.span>
                ) : 'Execute Scenario'}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Dynamic Results Area */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#38BDF8', boxShadow: '0 0 10px #38BDF8' }} />
                <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#94A3B8' }}>Simulation Impact Vectors</div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                {result.metrics.map((m, i) => <CompareBar key={i} {...m} />)}
              </div>

              {/* Glossy AI Recommendation Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, type: 'spring' }}
                style={{
                  background: 'linear-gradient(145deg, rgba(46, 213, 115, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
                  border: '1px solid rgba(46, 213, 115, 0.2)',
                  borderRadius: 20, padding: '24px', mt: 8,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.02)',
                  display: 'flex', gap: 16, alignItems: 'flex-start',
                  position: 'relative', overflow: 'hidden'
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: '#2ED573', boxShadow: '0 0 15px #2ED573' }} />
                <div style={{ fontSize: '1.8rem', background: 'var(--accent-alpha-10)', padding: 12, borderRadius: 16, border: '1px solid var(--brand-solid)' }}>🤖</div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#16A34A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Tactical Recommendation</div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{result.rec}</p>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: 500, borderRadius: 24, 
                border: '1px dashed var(--panel-border-heavy)',
                background: 'var(--panel-bg)',
                textAlign: 'center', gap: 16,
              }}
            >
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 20px rgba(56,189,248,0.3))' }}>⚡</div>
                <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} 
                  style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 120, height: 120, background: '#38BDF8', borderRadius: '50%', filter: 'blur(40px)', zIndex: -1 }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.4rem', color: '#F8FAFC', marginBottom: 8, letterSpacing: '-0.02em' }}>Awaiting Parameters</div>
                <div style={{ color: '#94A3B8', fontSize: '0.9rem', maxWidth: 350, lineHeight: 1.5 }}>Configure a policy and dial the intensity slider to project multi-variable outcomes across the city grid.</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
