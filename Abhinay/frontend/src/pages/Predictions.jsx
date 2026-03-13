import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Plot from 'react-plotly.js';
import ChartCard from '@/components/ui/ChartCard';
import { DISTRICTS } from '@/config/constants';
import { COLORS, CHART_LAYOUT, CHART_CONFIG } from '@/utils/chartHelpers';
import { api } from '../api/urbanmindAPI';

const TABS = [
  { key: 'Traffic',    color: '#FF6B6B', icon: '🚦', glow: 'rgba(255,107,107,0.3)' },
  { key: 'Pollution',  color: '#A29BFE', icon: '💨', glow: 'rgba(162,155,254,0.3)' },
  { key: 'Transport',  color: '#74B9FF', icon: '🚌', glow: 'rgba(116,185,255,0.3)' },
];

const PREMIUM_INPUT = {
  width: '100%',
  background: 'rgba(15, 23, 42, 0.4)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 12,
  padding: '12px 16px',
  fontSize: '0.85rem',
  color: '#F8FAFC',
  outline: 'none',
  backdropFilter: 'blur(10px)',
  fontFamily: 'Inter, system-ui, sans-serif',
  transition: 'border-color 0.3s, box-shadow 0.3s'
};

export default function Predictions() {
  const [tab, setTab] = useState('Traffic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    district: DISTRICTS[0],
    hour: "14",
    temp: "32",
    weather: "Clear"
  });

  const currentTab = TABS.find(t => t.key === tab);

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const inputs = {
        district_id: formData.district,
        hour: parseInt(formData.hour),
        temperature: parseFloat(formData.temp),
        weather_main: formData.weather
      };

      let data;
      if (tab === 'Traffic') data = await api.predictTraffic(inputs);
      else if (tab === 'Pollution') data = await api.predictPollution(inputs);
      else data = await api.predictTransport(inputs);

      setResult(data);
    } catch (err) {
      console.error("Prediction error:", err);
    } finally {
      setTimeout(() => setLoading(false), 500); // Artificial delay for premium loading animation feel
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '10px 0' }}>
      
      {/* Premium Gradient Tab Selector */}
      <div style={{ display: 'flex', gap: 12, background: 'rgba(15, 23, 42, 0.6)', padding: '6px', borderRadius: 50, border: '1px solid rgba(255,255,255,0.05)', width: 'fit-content' }}>
        {TABS.map(t => {
          const isActive = tab === t.key;
          return (
            <motion.button 
              key={t.key} 
              onClick={() => { setTab(t.key); setResult(null); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 24px', borderRadius: 50, border: 'none',
                background: 'transparent',
                color: isActive ? '#fff' : '#94A3B8',
                fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer',
                transition: 'color 0.3s', zIndex: 1
              }}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeTabBadge"
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    borderRadius: 50, background: `linear-gradient(135deg, ${t.color}90, ${t.color})`,
                    boxShadow: `0 4px 15px ${t.glow}`, zIndex: -1
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
              <span style={{ filter: isActive ? `drop-shadow(0 0 5px rgba(255,255,255,0.5))` : 'none' }}>{t.icon}</span> {t.key}
            </motion.button>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 380px) 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Glassmorphic Engine Configuration Panel */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 100 }}>
          <div style={{
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
            backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 24, padding: 32, 
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 16px 40px rgba(0,0,0,0.3)',
            position: 'relative', overflow: 'hidden'
          }}>
            {/* Dynamic Ambient Backlight matching selected tab */}
            <motion.div 
               animate={{ background: currentTab.color }} transition={{ duration: 0.5 }}
               style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, filter: 'blur(80px)', opacity: 0.15, borderRadius: '50%' }} 
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${currentTab.color}50`, color: currentTab.color }}>
                {currentTab.icon}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: currentTab.color }}>
                Prediction Parameters
              </div>
            </div>

            <form onSubmit={handlePredict} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>Target Zone</label>
                <select 
                  style={PREMIUM_INPUT} 
                  value={formData.district} 
                  onChange={e => setFormData({...formData, district: e.target.value})}
                  onFocus={e => e.target.style.borderColor = `${currentTab.color}80`}
                  onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                >
                  {DISTRICTS.map(d => <option key={d} style={{ background: '#0F172A', color: '#F1F5F9' }}>{d}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ position: 'relative' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>Hour (0–23)</label>
                  <input 
                    type="number" min="0" max="23" 
                    style={PREMIUM_INPUT} 
                    value={formData.hour}
                    onChange={e => setFormData({...formData, hour: e.target.value})}
                    onFocus={e => e.target.style.borderColor = `${currentTab.color}80`}
                    onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>Temp (°C)</label>
                  <input 
                    type="number" 
                    style={PREMIUM_INPUT} 
                    value={formData.temp}
                    onChange={e => setFormData({...formData, temp: e.target.value})}
                    onFocus={e => e.target.style.borderColor = `${currentTab.color}80`}
                    onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  />
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>Weather Conditions</label>
                <select 
                  style={PREMIUM_INPUT}
                  value={formData.weather}
                  onChange={e => setFormData({...formData, weather: e.target.value})}
                  onFocus={e => e.target.style.borderColor = `${currentTab.color}80`}
                  onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                >
                  {['Clear','Rainy','Cloudy','Foggy'].map(w => <option key={w} style={{ background: '#0F172A', color: '#F1F5F9' }}>{w}</option>)}
                </select>
              </div>

              <motion.button
                type="submit" disabled={loading}
                whileHover={{ scale: 1.03, boxShadow: `0 0 25px ${currentTab.glow}` }} 
                whileTap={{ scale: 0.96 }}
                style={{
                  marginTop: 12, padding: '16px 0', borderRadius: 14, border: '1px solid rgba(255,255,255,0.2)',
                  background: loading ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${currentTab.color}, ${currentTab.color}dd)`,
                  color: '#fff', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.02em',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  position: 'relative', overflow: 'hidden',
                  boxShadow: loading ? 'none' : `inset 0 1px 1px rgba(255,255,255,0.4), 0 8px 20px ${currentTab.glow}`,
                }}
              >
                {loading ? (
                  <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    🔮 Generating Topology...
                  </motion.span>
                ) : `Synthesize ${tab} Forecast`}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Dynamic Analytics & Result Render Area */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: currentTab.color, boxShadow: `0 0 10px ${currentTab.color}` }} />
                <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#94A3B8' }}>AI Confidence Matrix</div>
              </div>

              {/* Staggered 3 KPI result cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { label: `Predicted Value`, val: typeof result.prediction === 'number' ? result.prediction.toFixed(2) : result.prediction, color: currentTab.color, icon: '📈' },
                  { label: 'Model Accuracy', val: `${(result.confidence * 100).toFixed(0)}%`, color: '#2ED573', icon: '🎯' },
                  { label: 'Grid Status', val: result.status || 'Normal', color: result.status === 'Critical' ? '#FF4757' : '#FFA502', icon: result.status === 'Critical' ? '🚨' : '⚠️' },
                ].map((card, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 + 0.2, type: 'spring' }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', 
                      border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 20, padding: '24px', 
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02), 0 8px 32px rgba(0,0,0,0.1)',
                      position: 'relative', overflow: 'hidden'
                    }}
                  >
                    <div style={{ position: 'absolute', top: -20, right: -20, fontSize: '4rem', opacity: 0.05, filter: 'grayscale(1)' }}>{card.icon}</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{card.label}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: card.color, letterSpacing: '-0.5px', textShadow: `0 0 15px ${card.color}40` }}>{card.val}</div>
                  </motion.div>
                ))}
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <ChartCard title={`${tab} Comparison — Actual vs Predicted`} accentColor={currentTab.color}>
                  <Plot
                    data={[
                      { 
                        x: ['Historical Baseline', 'AI Model Forecast'], 
                        y: [result.actual_avg || 0.5, result.prediction || 0.8], 
                        type: 'bar', 
                        name: 'Magnitude', 
                        marker: { 
                          color: [ 'rgba(255,255,255,0.1)', currentTab.color ],
                          line: { width: 1, color: [ 'rgba(255,255,255,0.2)', currentTab.color ] }
                        } 
                      },
                    ]}
                    layout={{ ...CHART_LAYOUT, height: 280 }}
                    config={CHART_CONFIG} className="w-full"
                  />
                  <div style={{ padding: '0 24px 24px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.2rem' }}>💡</span>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: currentTab.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Neural Insight</div>
                      <div style={{ fontSize: '0.85rem', color: '#CBD5E1', lineHeight: 1.5 }}>
                        {result.recommendation || "Maintain current infrastructure deployment grid stability."}
                      </div>
                    </div>
                  </div>
                </ChartCard>
              </motion.div>

            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: 500, borderRadius: 24, 
                border: '1px dashed rgba(255,255,255,0.1)',
                background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(10px)',
                textAlign: 'center', gap: 16,
              }}
            >
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: '4rem', filter: `drop-shadow(0 0 20px ${currentTab.glow})` }}>{currentTab.icon}</div>
                <motion.div animate={{ opacity: [0.1, 0.4, 0.1] }} transition={{ repeat: Infinity, duration: 2.5 }} 
                  style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 140, height: 140, background: currentTab.color, borderRadius: '50%', filter: 'blur(50px)', zIndex: -1 }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.4rem', color: '#F8FAFC', marginBottom: 8, letterSpacing: '-0.02em' }}>Initialize {tab} Protocol</div>
                <div style={{ color: '#94A3B8', fontSize: '0.9rem', maxWidth: 350, lineHeight: 1.5 }}>Establish matrix parameters on the left to spin up the predictive inference engine.</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
