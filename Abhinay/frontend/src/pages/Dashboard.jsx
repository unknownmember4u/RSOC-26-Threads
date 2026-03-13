import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Plot from 'react-plotly.js';
import KPICard from '@/components/ui/KPICard';
import ChartCard from '@/components/ui/ChartCard';
import { COLORS, CHART_LAYOUT, CHART_CONFIG } from '@/utils/chartHelpers';
import useGlobalStore from '@/state/globalStore';
import { fetchDashboardStats } from '@/services/apiClient';

/* ── Per-district seed data ── */
const DISTRICT_DATA = {
  All: { traffic: 0.74, aqi: 112, energy: '3.2M', transport: '88%', water: '450kL', waste: '120t', health: 82 },
  D01: { traffic: 0.61, aqi:  78, energy: '2.1M', transport: '74%', water: '380kL', waste: '88t',  health: 91 },
  D02: { traffic: 0.88, aqi: 165, energy: '4.2M', transport: '96%', water: '520kL', waste: '148t', health: 58 },
  D03: { traffic: 0.52, aqi:  90, energy: '1.8M', transport: '68%', water: '310kL', waste: '70t',  health: 87 },
  D04: { traffic: 0.93, aqi: 210, energy: '5.1M', transport: '99%', water: '600kL', waste: '190t', health: 34 },
  D05: { traffic: 0.70, aqi: 130, energy: '3.0M', transport: '85%', water: '430kL', waste: '115t', health: 74 },
  D06: { traffic: 0.55, aqi:  85, energy: '2.3M', transport: '71%', water: '360kL', waste: '80t',  health: 89 },
  D07: { traffic: 0.82, aqi: 175, energy: '4.8M', transport: '91%', water: '555kL', waste: '165t', health: 48 },
  D08: { traffic: 0.48, aqi:  65, energy: '1.6M', transport: '62%', water: '295kL', waste: '55t',  health: 95 },
  D09: { traffic: 0.63, aqi:  95, energy: '2.0M', transport: '78%', water: '340kL', waste: '76t',  health: 85 },
  D10: { traffic: 0.45, aqi:  72, energy: '1.4M', transport: '60%', water: '280kL', waste: '50t',  health: 93 },
};

const INSIGHTS = [
  { icon: '🚦', color: '#FF6B6B', title: 'Traffic Surge',        body: 'D02 will peak at 93% load between 6–8 PM due to office egress. Rerouting via D06 recommended.' },
  { icon: '💨', color: '#6C5CE7', title: 'Air Quality Alert',    body: 'D04 AQI exceeds safe limit (210). Reduce industrial outflow and increase green transport on D04 corridor.' },
  { icon: '⚡', color: '#FDCB6E', title: 'Energy Optimization',  body: 'D08 consuming 38% below forecast — surplus available for redistribution to D02 and D07.' },
  { icon: '💧', color: '#55EFC4', title: 'Water Pressure Drop',  body: 'Flushing events detected in D07. Pressure may drop 12% post-7 PM. Check valve stations #14 and #22.' },
];

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
        {/* Background ring */}
        <circle cx="65" cy="65" r={r} fill="none" stroke="var(--panel-border)" strokeWidth="10" />
        {/* Animated fill */}
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
        {/* Center text */}
        <text x="65" y="60" textAnchor="middle" fill={color} fontSize="24" fontWeight="900" fontFamily="Inter,sans-serif">{score}</text>
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

const timeAxis   = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];

export default function Dashboard() {
  const { selectedDistrict } = useGlobalStore();
  const d = DISTRICT_DATA[selectedDistrict] || DISTRICT_DATA.All;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── AI Insights row ── */}
      <div>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#64748B', marginBottom: 12 }}>⬡ AI Insights</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {INSIGHTS.map((ins, i) => (
            <motion.div
              key={ins.title}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{
                background: `${ins.color}0A`,
                border: `1px solid ${ins.color}25`,
                borderRadius: 16, padding: '16px',
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: `${ins.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', flexShrink: 0,
              }}>{ins.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: ins.color, marginBottom: 4 }}>{ins.title}</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.5 }}>{ins.body}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── KPIs + Health Score ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <KPICard icon="🚦" label="Avg Traffic"     value={d.traffic} change={-5}  color={COLORS.traffic}    delay={1} />
          <KPICard icon="💨" label="Avg AQI"         value={d.aqi}     change={12}  color={COLORS.pollution}  delay={2} />
          <KPICard icon="⚡" label="Energy kWh"      value={d.energy}  change={-2}  color={COLORS.energy}     delay={3} />
          <KPICard icon="🚌" label="Transport Load"  value={d.transport} change={4} color={COLORS.transport}  delay={4} />
          <KPICard icon="💧" label="Water Usage"     value={d.water}   change={-1}  color={COLORS.water}      delay={5} />
          <KPICard icon="♻️" label="Waste Collected" value={d.waste}   change={8}   color={COLORS.waste}      delay={6} />
        </div>
        <HealthScore score={d.health} />
      </div>

      {/* ── Charts row 1: Traffic + AQI ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <ChartCard title="Traffic Density — 24h Trend" subtitle="Traffic" accentColor={COLORS.traffic} delay={7}>
          <Plot
            data={[{
              x: timeAxis,
              y: [0.3, 0.2, 0.8, 0.6, 0.5, 0.9, 0.4],
              type: 'scatter', mode: 'lines+markers', name: 'Density',
              line: { color: COLORS.traffic, width: 3, shape: 'spline' },
              marker: { size: 7, color: COLORS.traffic },
              fill: 'tozeroy',
              fillcolor: `${COLORS.traffic}15`,
            }]}
            layout={{ ...CHART_LAYOUT, height: 260 }}
            config={CHART_CONFIG} className="w-full"
          />
        </ChartCard>

        <ChartCard title="AQI Gauge" subtitle="Pollution" accentColor={COLORS.pollution} delay={8}>
          <Plot
            data={[{
              type: 'indicator', mode: 'gauge+number',
              value: d.aqi,
              gauge: {
                axis: { range: [0, 500], tickcolor: '#64748B' },
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
        </ChartCard>
      </div>

      {/* ── Charts row 2: Energy + Water + Waste ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <ChartCard title="Energy by District" subtitle="Energy" accentColor={COLORS.energy} delay={9}>
          <Plot
            data={[{
              x: ['D01','D02','D03','D04','D05'],
              y: [1.2, 2.8, 1.8, 3.5, 2.0],
              type: 'bar',
              marker: { color: ['#FDCB6E','#FF6B6B','#FDCB6E','#FF4757','#FDCB6E'] },
            }]}
            layout={{ ...CHART_LAYOUT, height: 240 }}
            config={CHART_CONFIG} className="w-full"
          />
        </ChartCard>

        <ChartCard title="Water Supply Pressure" subtitle="Water" accentColor={COLORS.water} delay={10}>
          <Plot
            data={[{
              x: timeAxis,
              y: [60, 62, 58, 55, 60, 65, 61],
              type: 'scatter', mode: 'lines',
              line: { color: COLORS.water, width: 3, shape: 'spline' },
              fill: 'tozeroy', fillcolor: `${COLORS.water}15`,
            }]}
            layout={{ ...CHART_LAYOUT, height: 240 }}
            config={CHART_CONFIG} className="w-full"
          />
        </ChartCard>

        <ChartCard title="Waste Collection" subtitle="Waste" accentColor={COLORS.waste} delay={11}>
          <Plot
            data={[{
              y: ['Organic','Recyclable','Hazardous'],
              x: [40, 25, 10],
              type: 'bar', orientation: 'h',
              marker: { color: [COLORS.waste, '#A29BFE99', '#A29BFE44'] },
            }]}
            layout={{ ...CHART_LAYOUT, height: 240, margin: { l: 85, t: 20, b: 40, r: 20 } }}
            config={CHART_CONFIG} className="w-full"
          />
        </ChartCard>
      </div>

    </div>
  );
}
