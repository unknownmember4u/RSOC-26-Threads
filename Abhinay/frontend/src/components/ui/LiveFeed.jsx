import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { api } from "../../api/urbanmindAPI"

function MiniBar({ value, max, color }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div style={{ height: 4, background: 'var(--panel-border-heavy)', borderRadius: 2, overflow: 'hidden', marginTop: 3 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8 }}
        style={{ height: '100%', background: color, borderRadius: 2 }}
      />
    </div>
  )
}

export default function LiveFeed() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let sse;
    const connectSSE = () => {
      // Direct connection to the SSE streaming API
      sse = new EventSource("http://localhost:8000/api/stream/sse");
      
      sse.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (Array.isArray(parsed)) {
            setData(parsed);
          } else if (parsed.districts) {
            setData(parsed.districts);
          }
          setLoading(false);
        } catch (err) {
          console.error("Failed to parse SSE data stream:", err);
        }
      };

      sse.onerror = (err) => {
        console.error("SSE connection dropped, auto-reconnecting...", err);
        sse.close();
        setTimeout(connectSSE, 3000); // 3-second backoff
      };
    };

    connectSSE();

    return () => {
      if (sse) sse.close();
    };
  }, []);

  if (loading && data.length === 0) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        {[...Array(10)].map((_, i) => (
          <div key={i} style={{ height: 200, background: 'var(--panel-bg)', borderRadius: 18, border: '1px solid var(--panel-border)', opacity: 0.5 }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16 }}>
      {data.map((district, idx) => {
        const aqi = district.aqi || 0
        const traffic = district.traffic_density || 0
        const energy = district.energy_kwh || 0
        const isCritical = aqi > 200 || district.status === 'CRITICAL'
        const statusColor = aqi < 100 ? '#2ED573' : aqi < 200 ? '#FFA502' : '#FF4757'
        
        return (
          <motion.div
            key={district.district_id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              boxShadow: isCritical ? ['0 0 0px #FF475700', '0 0 20px #FF475744', '0 0 0px #FF475700'] : '0 4px 20px rgba(0,0,0,0.08)'
            }}
            transition={{
              y: { delay: idx * 0.05 },
              boxShadow: { repeat: Infinity, duration: 1.5 }
            }}
            style={{
              background: 'var(--panel-bg)',
              border: `1px solid ${isCritical ? '#FF4757' : 'var(--panel-border-heavy)'}`,
              borderRadius: 18,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* City Name (prominent) + Status dot */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                {district.name || `Zone ${district.district_id}`}
              </div>
              <div style={{ 
                width: 10, height: 10, borderRadius: '50%', background: statusColor,
                boxShadow: `0 0 10px ${statusColor}88`,
                animation: isCritical ? 'pulse 1.5s infinite' : 'none'
              }} />
            </div>

            {/* District ID badge */}
            <div style={{ 
              fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 800, 
              textTransform: 'uppercase', letterSpacing: '0.12em',
              background: 'var(--accent-alpha-10)', 
              padding: '2px 8px', borderRadius: 4, width: 'fit-content',
              border: '1px solid var(--panel-border)',
            }}>
              {district.district_id}
            </div>

            {/* Metrics with mini progress bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 2 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>🌫️ AQI</span>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: statusColor }}>{Math.round(aqi)}</span>
                </div>
                <MiniBar value={aqi} max={500} color={statusColor} />
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>🚦 Traffic</span>
                  <span style={{ fontWeight: 800, color: traffic > 0.85 ? '#FF4757' : traffic > 0.7 ? '#FFA502' : '#2ED573' }}>
                    {(traffic * 100).toFixed(0)}%
                  </span>
                </div>
                <MiniBar value={traffic} max={1} color={traffic > 0.85 ? '#FF4757' : traffic > 0.7 ? '#FFA502' : '#2ED573'} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>⚡ Energy</span>
                  <span style={{ fontWeight: 800, color: '#74B9FF' }}>
                    {energy >= 1000 ? (energy / 1000).toFixed(1) + ' MWh' : Math.round(energy) + ' kWh'}
                  </span>
                </div>
                <MiniBar value={energy} max={5000} color="#74B9FF" />
              </div>
            </div>

            {/* Status badge */}
            <div style={{
              marginTop: 4, padding: '5px 0', fontSize: '0.65rem', fontWeight: 900,
              textAlign: 'center', borderRadius: 8,
              background: isCritical ? 'rgba(255,71,87,0.15)' : 'var(--accent-alpha-10)',
              color: isCritical ? '#DC2626' : '#16A34A',
              textTransform: 'uppercase', letterSpacing: '0.12em',
              border: `1px solid ${isCritical ? '#DC262644' : '#16A34A44'}`,
            }}>
              {isCritical ? '⚠ CRITICAL ALERT' : '● Normal Status'}
            </div>
          </motion.div>
        )
      })}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}
