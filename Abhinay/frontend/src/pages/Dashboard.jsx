import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Plot from 'react-plotly.js';
import ExplainButton from '@/components/ui/ExplainButton';
import CityMap3D from '@/components/ui/CityMap3D';
import { COLORS, CHART_LAYOUT, CHART_CONFIG } from '@/utils/chartHelpers';
import useGlobalStore from '@/state/globalStore';
import { api } from '../api/urbanmindAPI';

/* ─── Static Styles (Sub-Pixel Border Layering) ─── */
const CONTAINER_STYLE = {
  background: 'var(--panel-bg)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid var(--panel-border-heavy)',
  borderRadius: 16,
  transition: 'all 0.25s ease',
};

/* ─── Ultra-Thin SVG Sparkline ─── */
function SVGSparkline({ color, points = [30, 45, 35, 60, 50, 75, 65] }) {
  const width = 100, height = 30;
  const max = Math.max(...points), min = Math.min(...points);
  const range = max - min || 1;
  const coords = points.map((p, i) => ({
    x: (i / (points.length - 1)) * width,
    y: height - ((p - min) / range) * height,
  }));
  const pathData = `M ${coords.map(c => `${c.x},${c.y}`).join(' L ')}`;
  
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible', opacity: 0.6 }}>
      <path d={pathData} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── KPI Card ─── */
function StatCard({ icon, label, value, color, change }) {
  const isGood = change !== undefined && change < 0;
  return (
    <div style={{
      ...CONTAINER_STYLE,
      padding: '24px 24px 16px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%',
      minHeight: 150,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--accent-alpha-10)',
          border: '1px solid var(--brand-solid)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem',
        }}>
          {icon}
        </div>
        {change !== undefined && (
          <span style={{
            fontSize: '0.65rem', fontWeight: 900,
            color: isGood ? '#16A34A' : '#DC2626',
            background: isGood ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
            padding: '2px 8px', borderRadius: 4,
            display: 'flex', alignItems: 'center', gap: 3,
            letterSpacing: '0.05em'
          }}>
            {change > 0 ? '▲' : '▼'} {Math.abs(change)}%
          </span>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>
          {value}
        </div>
        <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7 }}>
          {label}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <SVGSparkline color={color} points={change ? [30, 40, 20, 50, 45, change > 0 ? 70 : 10] : [50, 55, 45, 60, 50, 55]} />
      </div>
    </div>
  );
}

/* ─── Section Label ─── */
function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.25em', textTransform: 'uppercase', opacity: 0.8 }}>{children}</div>
      <div style={{ flex: 1, height: 1, background: 'var(--panel-border)' }} />
    </div>
  );
}

/* ─── Health Score Arc ─── */
function HealthArc({ score }) {
  const r = 36, circ = 2 * Math.PI * r;
  const fill = Math.max(0, Math.min(1, score / 100)) * circ;
  const color = score >= 60 ? '#2ED573' : score >= 40 ? '#FFA502' : '#FF4757';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        <svg width={72} height={72} viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
          <motion.circle cx="40" cy="40" r={r} fill="none"
            stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - fill }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            transform="rotate(-90 40 40)"
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color, lineHeight: 1 }}>{Math.round(score)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', opacity: 0.6, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>City Integrity</div>
        <div style={{ fontSize: '0.75rem', color, fontWeight: 800 }}>{score >= 60 ? 'OPTIMIZED' : score >= 40 ? 'NOMINAL' : 'DEGRADED'}</div>
      </div>
    </div>
  );
}

/* ─── Chart Panel ─── */
function ChartPanel({ title, subtitle, color, children }) {
  return (
    <div style={{ ...CONTAINER_STYLE, display: 'flex', flexDirection: 'column', background: 'var(--panel-bg)' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--panel-border-heavy)' }}>
        <div style={{ fontSize: '0.55rem', fontWeight: 800, color: color, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 4 }}>
          {subtitle}
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          {title}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

/* ─── MAIN ─── */
export default function Dashboard() {
  const { selectedDistrict } = useGlobalStore();
  const [stats, setStats] = useState(null);
  const [trafficChart, setTrafficChart] = useState(null);
  const [pollutionChart, setPollutionChart] = useState(null);
  const [loading, setLoading] = useState(true);
  const trafficRef = useRef(null);
  const pollutionRef = useRef(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [overview, traffic, pollution] = await Promise.all([
          api.getOverview(selectedDistrict),
          api.getTrafficData(selectedDistrict),
          api.getPollutionData(selectedDistrict),
        ]);
        setStats(overview);
        setTrafficChart(traffic);
        setPollutionChart(pollution);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedDistrict]);

  if (loading && !stats)
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 12, flexDirection: 'column' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
          style={{ width: 24, height: 24, border: '1px solid rgba(255,255,255,0.1)', borderTopColor: '#84B179', borderRadius: '50%' }} />
        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 300 }}>Initializing Core</span>
      </div>
    );

  const d = stats || {};
  const INDIA_AQI = 275, INDIA_ALERTS = 14;
  const avg_traffic = ((d.avg_traffic_density || 0) * 100).toFixed(1);
  const energyMWh = ((d.total_energy_kwh || 0) / 1000).toFixed(1);
  const transportLoad = ((d.avg_transport_load || 0) * 100).toFixed(1);
  const waterML = ((d.total_water_liters || 0) / 1000000).toFixed(2);
  const healthScore = Math.max(10, Math.min(100, 100 - ((INDIA_AQI / 500) * 50 + (d.avg_traffic_density || 0) * 20 + INDIA_ALERTS * 5)));

  const cleanChartSettings = {
    ...CHART_LAYOUT,
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    margin: { t: 16, b: 32, l: 40, r: 16 },
    font: { color: '#64748B', family: 'Inter, sans-serif', size: 10, weight: '700' },
    xaxis: { ...CHART_LAYOUT.xaxis, gridcolor: 'var(--panel-border)', linecolor: 'var(--panel-border)' },
    yaxis: { ...CHART_LAYOUT.yaxis, gridcolor: 'var(--panel-border)', linecolor: 'var(--panel-border)' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingBottom: 24, 
        borderBottom: '1px solid var(--panel-border-heavy)' 
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--brand-solid)', letterSpacing: '0.35em', textTransform: 'uppercase' }}>
            Central Control Interface
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Operational <span style={{ color: 'var(--brand-solid)' }}>Status</span>
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <HealthArc score={healthScore} />
          <div style={{ height: 44, width: 1, background: 'rgba(255,255,255,0.06)' }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--accent-alpha-10)', 
            border: '1px solid var(--brand-solid)',
            borderRadius: 50, padding: '8px 20px',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.15em' }}>LIVE FEED</span>
          </div>
        </div>
      </div>

      {/* ── KPI GRID ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionLabel>Core Telemetry</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
          <StatCard icon="🚦" label="Traffic" value={`${avg_traffic}%`} color={COLORS.traffic} change={8} />
          <StatCard icon="💨" label="AQI Level" value={INDIA_AQI} color={COLORS.pollution} change={5} />
          <StatCard icon="⚡" label="Power" value={`${energyMWh} MWh`} color={COLORS.energy} />
          <StatCard icon="🚌" label="Public T." value={`${transportLoad}%`} color={COLORS.transport} change={-3} />
          <StatCard icon="💧" label="Water ML" value={`${waterML} ML`} color={COLORS.water} />
          
          <div style={{
            ...CONTAINER_STYLE,
            background: 'rgba(220,38,38,0.1)', 
            border: '1px solid #DC2626',
            padding: '24px 24px 0px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            height: '100%',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626' }} />
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#DC2626', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Alert Level</span>
            </div>
            <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#DC2626', lineHeight: 1 }}>{INDIA_ALERTS}</div>
            <div style={{ fontSize: '0.65rem', color: '#DC2626', marginTop: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Critical Threads</div>
            <div style={{ marginTop: 20 }}>
               <SVGSparkline color="#DC2626" points={[80, 70, 90, 60, 100, 85]} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3D GEOSPATIAL INTELLIGENCE ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionLabel>3D Geospatial Intelligence</SectionLabel>
        <div style={{ ...CONTAINER_STYLE, height: 420, padding: 0, overflow: 'hidden' }}>
          <CityMap3D />
        </div>
      </div>

      {/* ── CHARTS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionLabel>Trend Intelligence</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
          <ChartPanel title="Traffic Flow Dynamics" subtitle="Density Waveform" color={COLORS.traffic}>
            <div ref={trafficRef}>
              <Plot
                data={[{
                  x: trafficChart?.labels || [],
                  y: trafficChart?.traffic_density || [],
                  type: 'scatter', mode: 'lines',
                  line: { color: COLORS.traffic, width: 2, shape: 'linear' },
                }]}
                layout={{ ...cleanChartSettings, height: 260 }}
                config={CHART_CONFIG} className="w-full"
              />
            </div>
            <div style={{ padding: '0 24px 20px' }}><ExplainButton chartRef={trafficRef} /></div>
          </ChartPanel>

          <ChartPanel title="Atmospheric Integrity" subtitle="AQI Distribution" color={COLORS.pollution}>
            <div ref={pollutionRef}>
              <Plot
                data={[{
                  type: 'indicator', mode: 'gauge+number',
                  value: INDIA_AQI,
                  number: { font: { color: COLORS.pollution, size: 36, weight: '900' } },
                  gauge: {
                    axis: { range: [0, 500], tickcolor: 'rgba(255,255,255,0.05)' },
                    bar: { color: COLORS.pollution, thickness: 0.1 },
                    bgcolor: 'transparent',
                    steps: [
                      { range: [0, 500], color: 'rgba(255,255,255,0.02)' },
                    ],
                  },
                }]}
                layout={{ ...cleanChartSettings, height: 260, margin: { t: 40, b: 20, l: 30, r: 30 } }}
                config={CHART_CONFIG} className="w-full"
              />
            </div>
            <div style={{ padding: '0 24px 20px' }}><ExplainButton chartRef={pollutionRef} /></div>
          </ChartPanel>
        </div>

        <ChartPanel title="District Pollution Breakdown" subtitle="Pollution Metrics — PM2.5 vs PM10" color={COLORS.pollution}>
          <div style={{ padding: '8px 16px' }}>
            <Plot
              data={[
                { x: pollutionChart?.labels || [], y: pollutionChart?.pm25 || [], type: 'bar', name: 'PM2.5', marker: { color: COLORS.pollution } },
                { x: pollutionChart?.labels || [], y: pollutionChart?.pm10 || [], type: 'bar', name: 'PM10', marker: { color: '#A29BFE' } },
              ]}
              layout={{
                ...cleanChartSettings, height: 300, barmode: 'group',
                legend: { x: 1, xanchor: 'right', y: 1.1, orientation: 'h', font: { color: 'rgba(255,255,255,0.2)', size: 9 } },
              }}
              config={CHART_CONFIG} className="w-full"
            />
          </div>
        </ChartPanel>
      </div>
    </div>
  );
}
