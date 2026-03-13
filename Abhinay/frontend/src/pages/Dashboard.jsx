import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import KPICard from '@/components/ui/KPICard';
import ChartCard from '@/components/ui/ChartCard';
import { COLORS, CHART_LAYOUT, CHART_CONFIG } from '@/utils/chartHelpers';
import useGlobalStore from '@/state/globalStore';
import { fetchDashboardStats } from '@/services/apiClient';

export default function Dashboard() {
  const { selectedDistrict } = useGlobalStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ traffic: 0.74, aqi: 112, energy: '3.2M', transport: '88%', water: '450kL', waste: '120t' });

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await fetchDashboardStats(selectedDistrict);
        setStats(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch stats", err);
        setLoading(false);
      }
    };

    getData();
    const interval = setInterval(getData, 10000); // 10s polling
    return () => clearInterval(interval);
  }, [selectedDistrict]);

  const timeAxis = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">City Intelligence</h1>
          <p className="text-sm text-text-muted mt-1">Real-time overview for district: <strong className="text-um-primary">{selectedDistrict}</strong></p>
        </div>
        <div className="text-xs font-bold bg-status-normal/10 text-status-normal px-3 py-1.5 rounded-full border border-status-normal/20">
          Last Updated: Just now
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard icon="🚦" label="Avg Traffic" value="0.74" change={-5} color={COLORS.traffic} delay={1} />
        <KPICard icon="🌫️" label="Avg AQI" value="112" change={12} color={COLORS.pollution} delay={2} />
        <KPICard icon="⚡" label="Energy kWh" value="3.2M" change={-2} color={COLORS.energy} delay={3} />
        <KPICard icon="🚌" label="Transport Load" value="88%" change={4} color={COLORS.transport} delay={4} />
        <KPICard icon="💧" label="Water Usage" value="450kL" change={-1} color={COLORS.water} delay={5} />
        <KPICard icon="♻️" label="Waste Collected" value="120t" change={8} color={COLORS.waste} delay={6} />
      </div>

      {/* Traffic Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard title="Traffic Density Trends" subtitle="24-hour analysis" delay={7}>
            <Plot
              data={[
                { x: timeAxis, y: [0.3, 0.2, 0.8, 0.6, 0.5, 0.9, 0.4], type: 'scatter', mode: 'lines+markers', name: 'Density', line: { color: COLORS.traffic, width: 3, shape: 'spline' }, marker: { size: 8 } }
              ]}
              layout={{ ...CHART_LAYOUT, height: 320 }}
              config={CHART_CONFIG}
              className="w-full"
            />
          </ChartCard>
        </div>
        <div>
          <ChartCard title="Peak Hours" subtitle="Today vs Yesterday" delay={8}>
            <Plot
              data={[
                { x: ['Morning', 'Evening'], y: [0.85, 0.92], type: 'bar', name: 'Today', marker: { color: COLORS.traffic, borderRadius: 4 } },
                { x: ['Morning', 'Evening'], y: [0.75, 0.88], type: 'bar', name: 'Yesterday', marker: { color: COLORS.transport } }
              ]}
              layout={{ ...CHART_LAYOUT, height: 320, barmode: 'group' }}
              config={CHART_CONFIG}
              className="w-full"
            />
          </ChartCard>
        </div>
      </div>

      {/* Pollution Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ChartCard title="AQI Trend" delay={9}>
          <Plot
            data={[{ x: timeAxis, y: [60, 55, 120, 145, 110, 80, 65], type: 'scatter', fill: 'tozeroy', line: { color: COLORS.pollution, shape: 'spline' } }]}
            layout={{ ...CHART_LAYOUT, height: 280 }}
            config={CHART_CONFIG}
            className="w-full"
          />
        </ChartCard>
        <ChartCard title="Traffic vs AQI Impact" delay={10}>
          <Plot
            data={[{ x: [0.2, 0.5, 0.8, 0.9, 0.3], y: [55, 90, 140, 160, 65], type: 'scatter', mode: 'markers', marker: { size: 12, color: COLORS.pollution, opacity: 0.7 } }]}
            layout={{ ...CHART_LAYOUT, height: 280, xaxis: { title: 'Traffic' }, yaxis: { title: 'AQI' } }}
            config={CHART_CONFIG}
            className="w-full"
          />
        </ChartCard>
        <ChartCard title="Current AQI Level" delay={11}>
          <Plot
            data={[{ type: 'indicator', mode: 'gauge+number', value: 112, gauge: { axis: { range: [0, 500] }, bar: { color: COLORS.pollution }, steps: [{ range: [0, 100], color: '#2ED57320' }, { range: [100, 200], color: '#FFA50220' }, { range: [200, 500], color: '#FF475720' }] } }]}
            layout={{ ...CHART_LAYOUT, height: 280, margin: { t: 40, b: 20, l: 30, r: 30 } }}
            config={CHART_CONFIG}
            className="w-full"
          />
        </ChartCard>
      </div>

      {/* Resources Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ChartCard title="Energy Distribution" delay={12}>
          <Plot
            data={[{ x: ['D01', 'D02', 'D03'], y: [1.2, 0.8, 1.5], type: 'bar', marker: { color: COLORS.energy, borderRadius: 4 } }]}
            layout={{ ...CHART_LAYOUT, height: 260 }}
            config={CHART_CONFIG}
            className="w-full"
          />
        </ChartCard>
        <ChartCard title="Water Supply Pressure" delay={13}>
          <Plot
            data={[{ x: timeAxis, y: [60, 62, 58, 55, 60, 65, 61], type: 'scatter', mode: 'lines', line: { color: COLORS.water, width: 3 } }]}
            layout={{ ...CHART_LAYOUT, height: 260 }}
            config={CHART_CONFIG}
            className="w-full"
          />
        </ChartCard>
        <ChartCard title="Waste Collection Status" delay={14}>
          <Plot
            data={[{ y: ['Organic', 'Recycle', 'Hazard'], x: [40, 25, 10], type: 'bar', orientation: 'h', marker: { color: COLORS.waste, borderRadius: 4 } }]}
            layout={{ ...CHART_LAYOUT, height: 260, margin: { l: 70, t: 30, b: 40, r: 20 } }}
            config={CHART_CONFIG}
            className="w-full"
          />
        </ChartCard>
      </div>

    </div>
  );
}
