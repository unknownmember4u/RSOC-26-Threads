import { useState } from 'react';
import Plot from 'react-plotly.js';
import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet';
import ChartCard from '@/components/ui/ChartCard';
import { COLORS, CHART_LAYOUT, CHART_CONFIG } from '@/utils/chartHelpers';
import { MAP_CENTER, MAP_ZOOM } from '@/config/constants';

// Simulated District Polygons
const polygon = [
  [18.51, 73.84], [18.52, 73.86], [18.51, 73.87]
];

export default function Clusters() {
  const [activeCluster, setActiveCluster] = useState('C1');

  const clusters = [
    { id: 'C1', label: 'Industrial Hotspot', color: '#FF4757', districts: 'D01, D07', risk: 85 },
    { id: 'C2', label: 'High Congestion', color: '#FFA502', districts: 'D03, D04', risk: 72 },
    { id: 'C3', label: 'Clean Zone', color: '#2ED573', districts: 'D08, D09', risk: 15 },
    { id: 'C4', label: 'Balanced', color: '#1D4ED8', districts: 'D02, D05, D06', risk: 45 },
  ];

  return (
    <div className="space-y-6">
      
      <div className="mb-6">
        <h1 className="text-2xl font-black text-text-primary tracking-tight flex items-center gap-2">
          <span className="text-um-primary">🧠</span> Urban Grouping Analysis
        </h1>
        <p className="text-sm text-text-muted mt-1">Multi-dimensional k-means clustering of city districts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Table */}
        <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-lg h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-surface border-b border-dark-border text-xs font-bold text-text-muted uppercase tracking-wider">
                <th className="p-4 w-16">ID</th>
                <th className="p-4">Profile Label</th>
                <th className="p-4">Districts</th>
                <th className="p-4 text-right">Avg Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {clusters.map(c => (
                <tr 
                  key={c.id} 
                  onClick={() => setActiveCluster(c.id)}
                  className={`border-b border-dark-border cursor-pointer transition-colors ${activeCluster === c.id ? 'bg-um-primary/10' : 'hover:bg-dark-surface'} group`}
                >
                  <td className="p-4 font-black">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white" style={{ backgroundColor: c.color }}>{c.id}</span>
                  </td>
                  <td className="p-4 font-bold text-sm text-text-primary group-hover:text-um-primary transition-colors">{c.label}</td>
                  <td className="p-4 text-sm text-text-secondary">{c.districts}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-lg font-black" style={{ color: c.color }}>{c.risk}</span>
                      <div className="w-16 h-1.5 bg-dark-bg rounded-full overflow-hidden border border-dark-border/50">
                        <div className="h-full rounded-full" style={{ width: `${c.risk}%`, backgroundColor: c.color }}></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right: Map */}
        <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-lg h-[400px] relative">
          <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {clusters.map(c => (
              <Polygon 
                key={c.id} 
                positions={polygon.map(p => [p[0] + (c.id === 'C1' ? 0.02 : c.id === 'C2' ? -0.01 : 0), p[1] + (c.id === 'C3' ? 0.03 : 0)])}
                pathOptions={{ color: c.color, fillColor: c.color, fillOpacity: activeCluster === c.id ? 0.6 : 0.2, weight: activeCluster === c.id ? 3 : 1 }}
              >
                <Popup className="custom-popup"><div className="font-bold">{c.label}</div></Popup>
              </Polygon>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Radar Chart */}
      <ChartCard title="Cluster Feature Comparison">
        <Plot
          data={[
            { type: 'scatterpolar', r: [0.9, 0.8, 0.4, 0.7, 0.9], theta: ['Traffic', 'Pollution', 'Energy', 'Transport', 'Traffic'], fill: 'toself', name: 'Industrial Hotspot', marker: { color: '#FF4757' } },
            { type: 'scatterpolar', r: [0.3, 0.2, 0.8, 0.4, 0.3], theta: ['Traffic', 'Pollution', 'Energy', 'Transport', 'Traffic'], fill: 'toself', name: 'Clean Zone', marker: { color: '#2ED573' } }
          ]}
          layout={{ 
            ...CHART_LAYOUT, 
            height: 400,
            polar: { radialaxis: { visible: true, range: [0, 1], gridcolor: '#2D3348', linecolor: '#2D3348' }, angularaxis: { gridcolor: '#2D3348', linecolor: '#2D3348' }, bgcolor: 'transparent' },
          }}
          config={CHART_CONFIG}
          className="w-full"
        />
      </ChartCard>

    </div>
  );
}
