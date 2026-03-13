import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from 'react-leaflet';
import { motion } from 'framer-motion';
import { MAP_CENTER, MAP_ZOOM } from '@/config/constants';
import { COLORS } from '@/utils/chartHelpers';

function MapClickHandler({ activeSpike, onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (activeSpike) {
        onLocationSelect(e.latlng);
      }
    }
  });
  return null;
}

export default function MapPage() {
  const [activeLayer, setActiveLayer] = useState('Traffic');
  const [activeSpike, setActiveSpike] = useState(null);
  const [activeToast, setActiveToast] = useState(null);

  const layers = ['Traffic', 'Pollution', 'Clusters', 'Energy'];

  const [markers, setMarkers] = useState([
    { id: '1', name: 'New Delhi', lat: 28.6139, lng: 77.2090, value: 0.95, type: 'critical' },
    { id: '2', name: 'Mumbai', lat: 19.0760, lng: 72.8777, value: 0.88, type: 'critical' },
    { id: '3', name: 'Bengaluru', lat: 12.9716, lng: 77.5946, value: 0.76, type: 'warning' },
    { id: '4', name: 'Chennai', lat: 13.0827, lng: 80.2707, value: 0.65, type: 'normal' },
    { id: '5', name: 'Kolkata', lat: 22.5726, lng: 88.3639, value: 0.82, type: 'warning' },
  ]);

  const handleMapClick = (latlng) => {
    if (!activeSpike) return;
    
    const newMarker = {
      id: `Spike-${Date.now()}`,
      name: `Incident Zone`,
      lat: latlng.lat,
      lng: latlng.lng,
      value: 1.0, 
      type: 'critical'
    };
    
    setMarkers([...markers, newMarker]);
    
    setActiveToast(`🚨 CRITICAL PROTOCOL INITIATED: Severe ${activeSpike} detected at [${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}]. Emergency response units notified.`);
    setTimeout(() => setActiveToast(null), 6000);
    
    setActiveSpike(null);
  };


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
          <div className="text-xs font-bold text-text-muted uppercase mb-3 tracking-wider text-center flex flex-col items-center">
            <span>India AQI-based {activeLayer} Legend</span>
            <span className="text-[10px] text-um-primary bg-um-primary/10 px-2 py-0.5 rounded-full mt-1">Avg AQI: 275 (Severe)</span>
          </div>
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

        {/* Toast Notification */}
        {activeToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            className="absolute top-4 left-1/2 z-[9999] bg-status-critical/95 backdrop-blur text-white px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(255,71,87,0.4)] border border-white/20 font-medium text-sm max-w-lg text-center leading-relaxed"
          >
            {activeToast}
          </motion.div>
        )}

        {/* Spike Controls Overlay */}
        <div className="absolute top-16 right-4 z-[9999] flex flex-col gap-3 mt-4">
          {['Traffic Spike', 'AQI Spike', 'Energy Spike'].map(spike => (
            <button
              key={spike}
              onClick={() => setActiveSpike(activeSpike === spike ? null : spike)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-xl transition-all border flex items-center justify-between gap-3 cursor-pointer ${
                activeSpike === spike
                  ? 'bg-status-critical text-white border-status-critical shadow-[0_0_20px_#FF4757] animate-pulse'
                  : 'bg-dark-bg/90 backdrop-blur border-dark-border text-text-secondary hover:text-white hover:bg-dark-surface'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${activeSpike === spike ? 'bg-white' : 'bg-status-critical'}`}></div>
              {spike}
            </button>
          ))}
        </div>

        <MapContainer 
          center={MAP_CENTER} 
          zoom={MAP_ZOOM} 
          style={{ height: '100%', width: '100%', cursor: activeSpike ? 'crosshair' : 'grab' }}
        >
          <MapClickHandler activeSpike={activeSpike} onLocationSelect={handleMapClick} />
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
                    <div className="font-bold text-sm mb-1">{m.name}</div>
                    <div className="text-xs">Severity Level: <strong>{(m.value * 100).toFixed(0)}%</strong></div>
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
            {markers.filter(d => d.type !== 'normal').slice().sort((a,b) => b.value - a.value).slice(0, 5).map(d => (
              <div key={d.id} className="bg-dark-surface p-3 rounded-xl border border-dark-border flex justify-between items-center group hover:border-um-primary/50 transition-colors">
                <div>
                  <div className="font-bold text-sm text-text-primary">{d.name}</div>
                  <div className="text-xs text-text-secondary">{d.id.includes('Spike') ? 'Custom Incident' : 'Major Hub'}</div>
                </div>
                <div className="text-right">
                  <div className={`font-black text-lg ${d.type === 'critical' ? 'text-status-critical' : 'text-status-warning'}`}>
                    {(d.value * 100).toFixed(0)}%
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
