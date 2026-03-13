import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { motion } from 'framer-motion';
import { MAP_CENTER, MAP_ZOOM } from '@/config/constants';
import { COLORS } from '@/utils/chartHelpers';

export default function MapPage() {
  const [activeLayer, setActiveLayer] = useState('Traffic');

  const layers = ['Traffic', 'Pollution', 'Clusters', 'Energy'];

  const markers = [
    { id: 'D01', lat: 18.5204, lng: 73.8567, value: 0.84, type: 'high' },
    { id: 'D02', lat: 18.53, lng: 73.86, value: 0.45, type: 'normal' },
    { id: 'D03', lat: 18.51, lng: 73.84, value: 0.92, type: 'critical' },
  ];

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6">
      
      {/* Map Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 rounded-2xl overflow-hidden border border-dark-border bg-dark-surface shadow-lg relative"
      >
        {/* Layer Selector Overlay */}
        <div className="absolute top-4 right-4 z-[9999] bg-dark-bg/90 backdrop-blur border border-dark-border rounded-xl p-2 flex gap-2 shadow-2xl">
          {layers.map(layer => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                activeLayer === layer 
                  ? 'bg-um-primary text-white scale-105 shadow-lg' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-dark-surface'
              }`}
            >
              {layer}
            </button>
          ))}
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-6 left-4 z-[9999] bg-dark-bg/90 backdrop-blur border border-dark-border rounded-xl p-4 shadow-2xl pointer-events-none">
          <div className="text-xs font-bold text-text-muted uppercase mb-3 tracking-wider text-center">{activeLayer} Legend</div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-status-critical shadow-[0_0_10px_#FF4757]"></span>
              <span className="text-sm font-semibold text-text-primary">Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-status-warning shadow-[0_0_10px_#FFA502]"></span>
              <span className="text-sm font-semibold text-text-primary">Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-status-normal shadow-[0_0_10px_#2ED573]"></span>
              <span className="text-sm font-semibold text-text-primary">Normal</span>
            </div>
          </div>
        </div>

        <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {markers.map((m) => {
            const color = m.type === 'critical' ? COLORS.critical : m.type === 'high' ? COLORS.warning : COLORS.normal;
            return (
              <CircleMarker
                key={m.id}
                center={[m.lat, m.lng]}
                radius={m.value * 20}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.4 }}
              >
                <Popup className="custom-popup">
                  <div className="p-1">
                    <div className="font-bold text-sm mb-1">{m.id}</div>
                    <div className="text-xs">Density: <strong>{m.value}</strong></div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </motion.div>

      {/* Analytics Panel */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-full md:w-80 flex flex-col gap-4"
      >
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center justify-between">
            Top Districts
            <span className="text-xs font-medium text-um-primary bg-um-primary/10 px-2 py-0.5 rounded-full">{activeLayer}</span>
          </h3>
          <div className="space-y-3">
            {[
              { id: 'D03', label: 'Downtown', val: 0.92, status: 'critical' },
              { id: 'D01', label: 'North Hub', val: 0.84, status: 'warning' },
              { id: 'D05', label: 'East Side', val: 0.77, status: 'warning' },
            ].map(d => (
              <div key={d.id} className="bg-dark-surface p-3 rounded-xl border border-dark-border flex justify-between items-center group hover:border-um-primary/50 transition-colors">
                <div>
                  <div className="font-bold text-sm text-text-primary">{d.id}</div>
                  <div className="text-xs text-text-secondary">{d.label}</div>
                </div>
                <div className="text-right">
                  <div className={`font-black text-lg ${d.status === 'critical' ? 'text-status-critical' : 'text-status-warning'}`}>
                    {d.val}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

    </div>
  );
}
