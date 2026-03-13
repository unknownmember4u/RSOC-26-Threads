import { useState } from 'react';
import { motion } from 'framer-motion';
import Plot from 'react-plotly.js';
import ChartCard from '@/components/ui/ChartCard';
import MetricBadge from '@/components/ui/MetricBadge';
import { DISTRICTS } from '@/config/constants';
import { COLORS, CHART_LAYOUT, CHART_CONFIG } from '@/utils/chartHelpers';

export default function Predictions() {
  const [tab, setTab] = useState('Traffic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const tabs = ['Traffic', 'Pollution', 'Transport'];

  const handlePredict = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call to /api/ml/predict/{type}
    setTimeout(() => {
      setResult({
        value: tab === 'Traffic' ? '0.86' : tab === 'Pollution' ? '145' : '92%',
        confidence: 88,
        level: tab === 'Traffic' ? 'Critical' : 'Warning',
        forecast: [0.75, 0.82, 0.86, 0.80]
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight flex items-center gap-2">
            <span className="text-um-primary">✨</span> Predictive Intelligence
          </h1>
          <p className="text-sm text-text-muted mt-1">Machine learning forecasts for proactive governance</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-dark-card border border-dark-border rounded-xl w-fit mb-6">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setResult(null); }}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${tab === t ? 'bg-um-primary text-white shadow-md' : 'text-text-secondary hover:text-text-primary hover:bg-dark-surface'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-text-primary mb-5">{tab} Parameters</h3>
            <form onSubmit={handlePredict} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1.5">District</label>
                <select className="w-full bg-dark-surface border border-dark-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:border-um-primary/50 outline-none">
                  {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase mb-1.5">Hour (0-23)</label>
                  <input type="number" min="0" max="23" defaultValue="14" className="w-full bg-dark-surface border border-dark-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:border-um-primary/50 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase mb-1.5">Temp (°C)</label>
                  <input type="number" defaultValue="32" className="w-full bg-dark-surface border border-dark-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:border-um-primary/50 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1.5">Weather</label>
                <select className="w-full bg-dark-surface border border-dark-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:border-um-primary/50 outline-none">
                  <option>Clear</option><option>Rain</option><option>Cloudy</option>
                </select>
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-6 bg-um-primary hover:bg-um-primary-dark disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all hover:shadow-[0_4px_12px_rgba(181,18,27,0.3)] flex justify-center items-center gap-2"
              >
                {loading ? <span className="animate-pulse">Analyzing Model...</span> : 'Generate Prediction'}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Results Panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 flex flex-col gap-6">
          
          {result ? (
            <>
              {/* Top Result Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-lg flex flex-col justify-center items-center relative overflow-hidden">
                  <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-um-primary to-um-accent"></div>
                  <div className="text-xs font-bold text-text-muted uppercase mb-2">Predicted {tab}</div>
                  <div className={`text-4xl font-black ${result.level === 'Critical' ? 'text-status-critical' : 'text-status-warning'}`}>{result.value}</div>
                </div>
                <div className="bg-dark-card border border-status-normal/30 rounded-2xl p-5 shadow-lg flex flex-col justify-center items-center">
                  <div className="text-xs font-bold text-status-normal uppercase mb-2">Confidence Score</div>
                  <div className="text-3xl font-black text-text-primary">{result.confidence}%</div>
                  <div className="w-full bg-dark-surface h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-status-normal h-full rounded-full" style={{ width: `${result.confidence}%` }}></div>
                  </div>
                </div>
                <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-lg flex flex-col justify-center items-center">
                  <div className="text-xs font-bold text-text-muted uppercase mb-2">Risk Level</div>
                  <MetricBadge 
                    type={result.level === 'Critical' ? 'deterioration' : 'neutral'} 
                    value={result.level} 
                  />
                </div>
              </div>

              {/* Forecast Chart */}
              <ChartCard title={`Next 3 Hours Forecast — ${tab}`}>
                <Plot
                  data={[
                    { x: ['Now', '+1h', '+2h', '+3h'], y: [0.65, ...result.forecast.slice(1)], type: 'scatter', name: 'Actual', line: { color: COLORS.normal, dash: 'dot' } },
                    { x: ['Now', '+1h', '+2h', '+3h'], y: result.forecast, type: 'scatter', name: 'Predicted', line: { color: COLORS[tab.toLowerCase()], width: 3, shape: 'spline' }, fill: 'tozeroy' }
                  ]}
                  layout={{ ...CHART_LAYOUT, height: 280 }}
                  config={CHART_CONFIG}
                  className="w-full"
                />
              </ChartCard>
            </>
          ) : (
            <div className="bg-dark-surface border border-dark-border border-dashed rounded-2xl flex-1 flex flex-col items-center justify-center p-10 text-center">
              <div className="w-16 h-16 bg-dark-bg rounded-2xl flex items-center justify-center text-2xl mb-4 border border-dark-border">🧠</div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Awaiting Parameters</h3>
              <p className="text-sm text-text-secondary max-w-sm">Configure the parameters on the left and run the prediction model to view the AI forecast and risk analysis.</p>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
