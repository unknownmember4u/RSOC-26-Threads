import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Plot from 'react-plotly.js';
import KPICard from '@/components/ui/KPICard';
import ChartCard from '@/components/ui/ChartCard';
import ExplainButton from '@/components/ui/ExplainButton';
import { COLORS, CHART_LAYOUT, CHART_CONFIG } from '@/utils/chartHelpers';
import useGlobalStore from '@/state/globalStore';
import { api } from '../api/urbanmindAPI';

/* City Health Score ring */
function HealthScore({ score }) {
  const r = 52, circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 80 ? '#2ED573' : score >= 50 ? '#FFA502' : '#FF4757';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: 'var(--panel-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--panel-border)',
        borderRadius: 20, padding: '24px 28px', minWidth: 200,
        boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>City Health Score</div>
      <svg width={130} height={130} viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="var(--panel-border)" strokeWidth="10" />
        <motion.circle
          cx="65" cy="65" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - fill }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          transform="rotate(-90 65 65)"
          style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
        <text x="65" y="60" textAnchor="middle" fill={color} fontSize="24" fontWeight="900" fontFamily="Inter,sans-serif">{Math.round(score)}</text>
        <text x="65" y="78" textAnchor="middle" fill="#64748B" fontSize="10" fontFamily="Inter,sans-serif">out of 100</text>
      </svg>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
        {['Traffic','AQI','Energy','Water','Waste'].map(k => (
          <span key={k} style={{ fontSize: '0.62rem', color: '#94A3B8', background: 'var(--app-bg)', border: '1px solid var(--panel-border)', borderRadius: 50, padding: '2px 8px' }}>{k}</span>
        ))}
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { selectedDistrict } = useGlobalStore();
  const [stats, setStats] = useState(null);
  const [trafficChart, setTrafficChart] = useState(null);
  const [pollutionChart, setPollutionChart] = useState(null);
  const [loading, setLoading] = useState(true);

  // Refs for ExplainButton
  const trafficRef = useRef(null);
  const pollutionRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [overview, traffic, pollution] = await Promise.all([
          api.getOverview(selectedDistrict),
          api.getTrafficData(selectedDistrict),
          api.getPollutionData(selectedDistrict)
        ]);
        setStats(overview);
        setTrafficChart(traffic);
        setPollutionChart(pollution);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDistrict]);

  if (loading && !stats) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading City Intelligence...</div>;

  const d = stats || {};
  
  // -- HARDCODED INDIA CONTEXT (Avg AQI ~ 275, Severe) --
  const INDIA_AQI = 275;
  const INDIA_ALERTS = 14; 
  
  // Override real data with hardcoded context for these specific metrics
  const display_aqi = INDIA_AQI;
  const display_alerts = INDIA_ALERTS;
  
  const healthScore = 100 - ( (display_aqi/500)*50 + (d.avg_traffic_density || 0)*20 + (display_alerts*5) );
  const clampedHealth = Math.max(10, Math.min(100, healthScore));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── KPIs + Health Score ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <KPICard icon="🚦" label="Avg Traffic"     value={((d.avg_traffic_density || 0) * 100).toFixed(1) + '%'} color={COLORS.traffic}    delay={1} />
          <KPICard icon="💨" label="Avg AQI"         value={display_aqi} color={COLORS.pollution}  delay={2} />
          <KPICard icon="⚡" label="Energy Consumption" value={((d.total_energy_kwh || 0) / 1000).toFixed(1) + ' MWh'} color={COLORS.energy} delay={3} />
          <KPICard icon="🚌" label="Transport Load"  value={((d.avg_transport_load || 0) * 100).toFixed(1) + '%'} color={COLORS.transport}  delay={4} />
          <KPICard icon="💧" label="Water Usage"     value={((d.total_water_liters || 0) / 1000000).toFixed(2) + ' ML'} color={COLORS.water} delay={5} />
          <KPICard icon="⚠️" label="Critical Alerts" value={display_alerts} color={COLORS.waste} delay={6} />
        </div>
        <HealthScore score={clampedHealth} />
      </div>

      {/* ── Charts row 1: Traffic + AQI ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        <ChartCard title="Traffic Density — 24h Trend" subtitle="Traffic" accentColor={COLORS.traffic} delay={7}>
          <div ref={trafficRef}>
            <Plot
              data={[{
                x: trafficChart?.labels || [],
                y: trafficChart?.traffic_density || [],
                type: 'scatter', mode: 'lines+markers', name: 'Density',
                line: { color: COLORS.traffic, width: 3, shape: 'spline' },
                marker: { size: 6, color: COLORS.traffic },
                fill: 'tozeroy',
                fillcolor: `${COLORS.traffic}15`,
              }]}
              layout={{ ...CHART_LAYOUT, height: 260 }}
              config={CHART_CONFIG} className="w-full"
            />
          </div>
          <ExplainButton chartRef={trafficRef} />
        </ChartCard>

        <ChartCard title="AQI Gauge" subtitle="Pollution" accentColor={COLORS.pollution} delay={8}>
          <div ref={pollutionRef}>
            <Plot
              data={[{
                type: 'indicator', mode: 'gauge+number',
                value: display_aqi,
                gauge: {
                  axis: { range: [0, 500], tickcolor: 'var(--text-muted)' },
                  bar: { color: COLORS.pollution },
                  bgcolor: 'transparent',
                  steps: [
                    { range: [0,100], color: 'rgba(46,213,115,0.1)' },
                    { range: [100,200], color: 'rgba(255,165,2,0.1)' },
                    { range: [200,500], color: 'rgba(255,71,87,0.1)' },
                  ],
                },
              }]}
              layout={{ ...CHART_LAYOUT, height: 260, margin: { t: 40, b: 20, l: 30, r: 30 } }}
              config={CHART_CONFIG} className="w-full"
            />
          </div>
          <ExplainButton chartRef={pollutionRef} />
        </ChartCard>
      </div>

      {/* ── Energy trend chart (replacing static district bar) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        <ChartCard title="Pollution Metrics — PM2.5 vs PM10" subtitle="Pollution" accentColor={COLORS.pollution} delay={9}>
           <Plot
            data={[
              {
                x: pollutionChart?.labels || [],
                y: pollutionChart?.pm25 || [],
                type: 'bar', name: 'PM2.5',
                marker: { color: COLORS.pollution },
              },
              {
                x: pollutionChart?.labels || [],
                y: pollutionChart?.pm10 || [],
                type: 'bar', name: 'PM10',
                marker: { color: '#A29BFE' },
              }
            ]}
            layout={{ ...CHART_LAYOUT, height: 300, barmode: 'group' }}
            config={CHART_CONFIG} className="w-full"
          />
        </ChartCard>
      </div>

    </div>
  );
}
