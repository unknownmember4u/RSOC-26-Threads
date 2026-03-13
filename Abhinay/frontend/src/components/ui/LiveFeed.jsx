import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { api } from "../../api/urbanmindAPI"

export default function LiveFeed() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const stream = await api.getLiveData()
        // The endpoint should return a list of 10 districts
        if (Array.isArray(stream)) {
          setData(stream)
        } else if (stream.districts) {
          setData(stream.districts)
        }
        setLoading(false)
      } catch (err) {
        console.error("Live feed failed:", err)
      }
    }

    fetchLiveData()
    const interval = setInterval(fetchLiveData, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading && data.length === 0) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        {[...Array(10)].map((_, i) => (
          <div key={i} style={{ height: 160, background: 'var(--panel-bg)', borderRadius: 16, border: '1px solid var(--panel-border)', opacity: 0.5 }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
      {data.map((district) => {
        const aqi = district.aqi || 0
        const isCritical = aqi > 200 || district.status === 'CRITICAL'
        const statusColor = aqi < 100 ? '#2ED573' : aqi < 200 ? '#FFA502' : '#FF4757'
        
        return (
          <motion.div
            key={district.district_id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              boxShadow: isCritical ? ['0 0 0px #FF475700', '0 0 15px #FF475744', '0 0 0px #FF475700'] : 'none'
            }}
            transition={{
              boxShadow: { repeat: Infinity, duration: 1.5 }
            }}
            style={{
              background: 'var(--panel-bg)',
              border: `1px solid ${isCritical ? '#FF475788' : 'var(--panel-border)'}`,
              borderRadius: 18,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Status Indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-main)' }}>{district.district_id}</div>
              <div style={{ 
                width: 8, height: 8, borderRadius: '50%', background: statusColor,
                boxShadow: `0 0 8px ${statusColor}`
              }} />
            </div>

            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              {district.name || `Zone ${district.district_id}`}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>🌫️ AQI</span>
                <span style={{ fontWeight: 800, color: statusColor }}>{Math.round(aqi)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>🚦 Traffic</span>
                <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{Math.round(district.traffic_density * 100)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>⚡ Energy</span>
                <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{Math.round(district.energy_kwh || 0)}</span>
              </div>
            </div>

            <div style={{
              marginTop: 4, padding: '4px 0', fontSize: '0.6rem', fontWeight: 800,
              textAlign: 'center', borderRadius: 6,
              background: isCritical ? '#FF475715' : 'rgba(132, 177, 121, 0.08)',
              color: isCritical ? '#FF4757' : '#84B179',
              textTransform: 'uppercase', letterSpacing: '0.1em'
            }}>
              {isCritical ? 'CRITICAL ALERT' : 'Normal Status'}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
