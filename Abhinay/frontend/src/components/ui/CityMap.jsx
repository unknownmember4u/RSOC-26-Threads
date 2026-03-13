import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGlobalStore from '@/state/globalStore';

/* ─── Abstract Technical District Coordinates (10 Districts) ─── */
const DISTRICT_DATA = [
  { id: 'Ahmedabad', label: 'Ahmedabad', path: 'M 20 40 L 40 20 L 60 20 L 70 40 L 60 60 L 40 60 Z', baseColor: '#84B179', health: 82 },
  { id: 'Bengaluru', label: 'Bengaluru', path: 'M 70 40 L 90 20 L 110 20 L 120 40 L 110 60 L 90 60 Z', baseColor: '#84B179', health: 74 },
  { id: 'Chennai', label: 'Chennai', path: 'M 40 60 L 60 60 L 70 80 L 60 100 L 40 100 L 30 80 Z', baseColor: '#FFA502', health: 58 },
  { id: 'Dehradun', label: 'Dehradun', path: 'M 90 60 L 110 60 L 120 80 L 110 100 L 90 100 L 80 80 Z', baseColor: '#2ED573', health: 88 },
  { id: 'Indore', label: 'Indore', path: 'M 20 100 L 40 100 L 50 120 L 40 140 L 20 140 L 0 120 Z', baseColor: '#84B179', health: 79 },
  { id: 'Lucknow', label: 'Lucknow', path: 'M 70 100 L 90 100 L 100 120 L 90 140 L 70 140 L 60 120 Z', baseColor: '#FF4757', health: 32 },
  { id: 'Nagpur', label: 'Nagpur', path: 'M 120 40 L 140 20 L 160 20 L 170 40 L 160 60 L 140 60 Z', baseColor: '#FFA502', health: 52 },
  { id: 'Pune', label: 'Pune', path: 'M 120 100 L 140 100 L 150 120 L 140 140 L 120 140 L 110 120 Z', baseColor: '#84B179', health: 71 },
  { id: 'Thane', label: 'Thane', path: 'M 170 40 L 190 20 L 210 20 L 220 40 L 210 60 L 190 60 Z', baseColor: '#2ED573', health: 85 },
  { id: 'Visakhapatnam', label: 'Vizag', path: 'M 170 100 L 190 100 L 200 120 L 190 140 L 170 140 L 160 120 Z', baseColor: '#84B179', health: 68 },
];

export default function CityMap() {
  const { selectedDistrict, setDistrict } = useGlobalStore();
  const [hovered, setHovered] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div 
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%', 
        minHeight: 280, 
        background: 'rgba(255,255,255,0.01)',
        borderRadius: 16,
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'crosshair',
        overflow: 'hidden'
      }}
      onMouseMove={handleMouseMove}
    >
      {/* ─── Grid Overlay (Technical Blueprint) ─── */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.5,
        pointerEvents: 'none'
      }} />

      <svg 
        viewBox="0 0 240 160" 
        style={{ width: '100%', height: 'auto', maxWidth: 450, filter: 'drop-shadow(0 0 30px rgba(0,0,0,0.5))' }}
      >
        {DISTRICT_DATA.map((d) => {
          const isActive = selectedDistrict === d.id;
          const isHovered = hovered?.id === d.id;
          const healthColor = d.health >= 80 ? '#2ED573' : d.health >= 50 ? '#FFA502' : '#FF4757';
          
          return (
            <motion.path
              key={d.id}
              d={d.path}
              initial={false}
              animate={{
                fill: isActive ? `${healthColor}30` : isHovered ? `${healthColor}20` : 'rgba(255,255,255,0.02)',
                stroke: isActive ? healthColor : isHovered ? healthColor : 'rgba(255,255,255,0.15)',
                strokeWidth: isActive || isHovered ? 1.5 : 1,
              }}
              transition={{ duration: 0.2 }}
              onMouseEnter={() => setHovered(d)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setDistrict(d.id)}
              style={{ cursor: 'pointer' }}
            />
          );
        })}
      </svg>

      {/* ─── Hover Toolkit ─── */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{
              position: 'absolute',
              left: mousePos.x + 15,
              top: mousePos.y + 15,
              background: 'rgba(10, 15, 10, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.5)',
              padding: '12px 14px',
              borderRadius: 12,
              zIndex: 100,
              pointerEvents: 'none',
              minWidth: 140
            }}
          >
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              District Spotlight
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF', marginBottom: 8 }}>
              {hovered.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${hovered.health}%` }}
                  style={{ height: '100%', background: hovered.health >= 80 ? '#2ED573' : hovered.health >= 50 ? '#FFA502' : '#FF4757' }}
                />
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 900, color: hovered.health >= 80 ? '#2ED573' : hovered.health >= 50 ? '#FFA502' : '#FF4757' }}>
                {hovered.health}%
              </span>
            </div>
            <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)', marginTop: 4, textTransform: 'uppercase' }}>
              Structural Health
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Legend (Static) ─── */}
      <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2ED573' }} />
          <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Optimized</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFA502' }} />
          <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nominal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF4757' }} />
          <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Degraded</span>
        </div>
      </div>
    </div>
  );
}
