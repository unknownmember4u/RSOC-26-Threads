import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Plot from 'react-plotly.js';
import ChartCard from '@/components/ui/ChartCard';
import { DISTRICTS } from '@/config/constants';
import { COLORS, CHART_LAYOUT, CHART_CONFIG } from '@/utils/chartHelpers';
import { api } from '../api/urbanmindAPI';

const TABS = [
  { key: 'Traffic',    color: '#FF6B6B', icon: '🚦' },
  { key: 'Pollution',  color: '#6C5CE7', icon: '💨' },
  { key: 'Transport',  color: '#74B9FF', icon: '🚌' },
];

const INPUT_STYLE = {
  width: '100%', background: 'var(--app-bg)',
  border: '1px solid var(--panel-border)', borderRadius: 10,
  padding: '9px 14px', fontSize: '0.85rem', color: 'var(--text-main)',
  outline: 'none', transition: 'border-color 0.2s',
  fontFamily: 'Inter, system-ui, sans-serif',
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
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Tab selector */}
      <div style={{ display: 'flex', gap: 8 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setResult(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 20px', borderRadius: 50,
              border: tab === t.key ? `1px solid ${t.color}50` : '1px solid var(--panel-border)',
              background: tab === t.key ? `${t.color}15` : 'transparent',
              color: tab === t.key ? t.color : 'var(--text-muted)',
              fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >{t.icon} {t.key}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>
        {/* Config panel */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{
            background: 'var(--panel-bg)', backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--panel-border)',
            borderRadius: 18, padding: 24,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: currentTab.color, marginBottom: 16 }}>
              {currentTab.icon} {tab} Parameters
            </div>
            <form onSubmit={handlePredict} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>District</label>
                <select 
                  style={INPUT_STYLE} 
                  value={formData.district} 
                  onChange={e => setFormData({...formData, district: e.target.value})}
                >
                  {DISTRICTS.map(d => <option key={d} style={{ background: 'var(--app-bg)', color: 'var(--text-main)' }}>{d}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Hour (0–23)</label>
                  <input 
                    type="number" min="0" max="23" 
                    style={INPUT_STYLE} 
                    value={formData.hour}
                    onChange={e => setFormData({...formData, hour: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Temp (°C)</label>
                  <input 
                    type="number" 
                    style={INPUT_STYLE} 
                    value={formData.temp}
                    onChange={e => setFormData({...formData, temp: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Weather</label>
                <select 
                  style={INPUT_STYLE}
                  value={formData.weather}
                  onChange={e => setFormData({...formData, weather: e.target.value})}
                >
                  {['Clear','Rainy','Cloudy','Foggy'].map(w => <option key={w} style={{ background: 'var(--app-bg)', color: 'var(--text-main)' }}>{w}</option>)}
                </select>
              </div>
              <motion.button
                type="submit" disabled={loading}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{
                  marginTop: 8, padding: '12px 0', borderRadius: 12, border: 'none',
                  background: loading ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${currentTab.color}, ${currentTab.color}aa)`,
                  color: '#fff', fontWeight: 700, fontSize: '0.88rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : `0 4px 20px ${currentTab.color}40`,
                }}
              >
                {loading ? '⟳  Analyzing...' : 'Generate Prediction'}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Results */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 3 KPI result cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  {[
                    { label: `Predicted Value`, val: typeof result.prediction === 'number' ? result.prediction.toFixed(2) : result.prediction, color: currentTab.color },
                    { label: 'Model Confidence', val: `${(result.confidence * 100).toFixed(0)}%`, color: '#2ED573' },
                    { label: 'Infrastructure Load', val: result.status || 'Normal', color: result.status === 'Critical' ? '#FF4757' : '#FFA502' },
                  ].map((card, i) => (
                    <div key={i} style={{
                      background: 'var(--panel-bg)', border: '1px solid var(--panel-border)',
                      borderRadius: 16, padding: '20px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{card.label}</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: card.color, letterSpacing: '-0.5px' }}>{card.val}</div>
                    </div>
                  ))}
                </div>

                <ChartCard title={`${tab} Comparison — Actual vs Predicted`} accentColor={currentTab.color} delay={1}>
                  <Plot
                    data={[
                      { 
                        x: ['Baseline', 'Forecast'], 
                        y: [result.actual_avg || 0.5, result.prediction || 0.8], 
                        type: 'bar', 
                        name: 'Load', 
                        marker: { color: [ 'var(--panel-border)', currentTab.color ] } 
                      },
                    ]}
                    layout={{ ...CHART_LAYOUT, height: 260 }}
                    config={CHART_CONFIG} className="w-full"
                  />
                  <div style={{ padding: '0 20px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    * Model insight: {result.recommendation || "Maintain current grid stability."}
                  </div>
                </ChartCard>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  height: 360, borderRadius: 18,
                  border: '1px dashed var(--panel-border)',
                  background: 'var(--panel-bg)',
                  textAlign: 'center', gap: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ fontSize: '2.5rem' }}>🧠</div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Awaiting Parameters</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: 320 }}>Set your inputs on the left and run the model to see AI-generated forecasts.</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
