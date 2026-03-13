import { useState } from 'react';
import { motion } from 'framer-motion';
import { DISTRICTS, SCENARIOS } from '@/config/constants';
import MetricBadge from '@/components/ui/MetricBadge';

export default function Simulator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [sliderVal, setSliderVal] = useState(25);

  const handleSimulate = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setResult({
        metrics: [
          { label: 'Traffic Density', before: 0.80, after: 0.80 - (0.80 * (sliderVal/100)), type: 'improvement' },
          { label: 'AQI Index', before: 160, after: Math.round(160 - (160 * (sliderVal/200))), type: 'improvement' },
          { label: 'Economic Impact', before: 100, after: 100 - (sliderVal/5), type: 'deterioration' }
        ],
        recommendation: `Implementing this policy at ${sliderVal}% intensity yields significant environmental benefits but carries a minor economic penalty. Recommended to phase in over 6 months.`
      });
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      <div className="mb-6">
        <h1 className="text-2xl font-black text-text-primary tracking-tight flex items-center gap-2">
          <span className="text-um-primary">🧪</span> Policy Simulation Lab
        </h1>
        <p className="text-sm text-text-muted mt-1">Test governance scenarios using digital twin algorithms</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Input Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="w-full lg:w-96 shrink-0">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-text-primary mb-5">Scenario Parameters</h3>
            <form onSubmit={handleSimulate} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1.5">Target District</label>
                <select className="w-full bg-dark-surface border border-dark-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:border-um-primary/50 outline-none">
                  {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1.5">Policy Action</label>
                <select className="w-full bg-dark-surface border border-dark-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:border-um-primary/50 outline-none">
                  {SCENARIOS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="flex justify-between text-xs font-bold text-text-muted uppercase mb-1.5">
                  <span>Intensity / Reduction Target</span>
                  <span className="text-um-primary">{sliderVal}%</span>
                </label>
                <input 
                  type="range" min="5" max="50" step="5" 
                  value={sliderVal} onChange={e => setSliderVal(e.target.value)}
                  className="w-full accent-um-primary h-1.5 bg-dark-surface rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[0.65rem] text-text-muted mt-1 font-bold">
                  <span>5% (Mild)</span>
                  <span>50% (Aggressive)</span>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-4 bg-um-primary hover:bg-um-primary-dark disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all hover:shadow-[0_4px_12px_rgba(181,18,27,0.3)] flex justify-center items-center gap-2"
              >
                {loading ? <span className="animate-pulse">Running Simulation...</span> : 'Execute Simulation'}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Results Panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col gap-6">
          
          {result ? (
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-lg h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-um-primary/10 rounded-full blur-3xl"></div>
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-text-primary">Impact Analysis Result</h3>
                <button className="text-xs font-bold text-um-primary bg-um-primary/10 hover:bg-um-primary/20 transition-colors px-3 py-1.5 rounded-lg border border-um-primary/20">
                  Save PDF Report
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {result.metrics.map((m, i) => (
                  <div key={i} className="bg-dark-surface p-4 rounded-xl border border-dark-border flex flex-col justify-center items-center text-center relative pointer-events-none hover:border-um-primary/50 transition-colors pointer-events-auto">
                    <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">{m.label}</div>
                    <div className="flex items-center justify-center gap-4 w-full">
                      <div className="text-xl font-bold text-text-secondary">{typeof m.before === 'number' && m.before < 1 ? m.before.toFixed(2) : m.before}</div>
                      <div className="text-sm text-text-muted">→</div>
                      <div className="text-2xl font-black text-text-primary">{typeof m.after === 'number' && m.after < 1 ? m.after.toFixed(2) : m.after}</div>
                    </div>
                    <div className="mt-3">
                      <MetricBadge type={m.type} value={`${Math.abs(Math.round(((m.after - m.before) / m.before) * 100))}%`} label="Delta" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-dark-surface/50 border border-dark-border rounded-xl p-5">
                <h4 className="text-sm font-bold text-text-primary mb-2 flex items-center gap-2">
                  <span className="text-status-warning">💡</span> AI System Recommendation
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {result.recommendation}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-dark-surface border border-dark-border border-dashed rounded-2xl h-[400px] flex flex-col items-center justify-center p-10 text-center">
              <div className="w-16 h-16 bg-dark-bg rounded-2xl flex items-center justify-center text-2xl mb-4 border border-dark-border">🧪</div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Simulation Sandbox Empty</h3>
              <p className="text-sm text-text-secondary max-w-sm">Use the controls to model the impact of various municipal policies on the city's overall ecosystem before implementation.</p>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
