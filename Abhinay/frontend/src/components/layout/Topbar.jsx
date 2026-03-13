import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useGlobalStore from '@/state/globalStore';
import { INDIAN_CITIES } from '@/config/constants';

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.77rem', color: '#64748B', fontWeight: 500 }}>
      {t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

const PAGE_TITLES = {
  '/dashboard':   'City Intelligence',
  '/map':         'Geospatial Map',
  '/predictions': 'AI Predictions',
  '/alerts':      'Smart Alerts',
  '/clusters':    'Urban Clusters',
  '/simulator':   'Policy Simulator',
  '/chat':        'AI Chat',
  '/livefeed':    'Live IoT Feed',
};

export default function Topbar() {
  const { selectedDistrict, setDistrict } = useGlobalStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const title    = PAGE_TITLES[location.pathname] || 'NagarMitra';
  const cityName = selectedDistrict === 'All' || selectedDistrict === 'All Cities'
    ? 'All Cities' : selectedDistrict;

  const filtered = INDIAN_CITIES.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <header style={{
      height: 56, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 24px',
      background: 'var(--topbar-bg)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--panel-border)',
      position: 'sticky', top: 0, zIndex: 50,
      transition: 'background 0.25s, border-color 0.25s',
    }}>
      {/* Left: page title + clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)', letterSpacing: '-0.2px' }}>{title}</span>
        <span style={{ width: 1, height: 14, background: 'var(--panel-border)' }} />
        <Clock />
      </div>

      {/* Right: live dot + city dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Theme Toggle */}
        <button
          onClick={() => useGlobalStore.getState().setTheme(useGlobalStore.getState().theme === 'dark' ? 'light' : 'dark')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(132,177,121,0.18)',
            color: '#84B179', cursor: 'pointer', transition: 'background 0.2s',
          }}
          title="Toggle Light/Dark Theme"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(132,177,121,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
        >
          {useGlobalStore.getState().theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Logout Button */}
        <button
          onClick={() => {
            useGlobalStore.getState().setAuthenticated(false);
            navigate('/');
          }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 32, padding: '0 12px', borderRadius: 8,
            background: 'rgba(255, 71, 87, 0.1)',
            border: '1px solid rgba(255, 71, 87, 0.2)',
            color: '#FF4757', cursor: 'pointer', transition: 'background 0.2s',
            fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.5px'
          }}
          title="End Secure Session"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.1)'}
        >
          LOGOUT
        </button>

        {/* LIVE badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(132,177,121,0.10)',
          border: '1px solid rgba(132,177,121,0.22)',
          borderRadius: 50, padding: '4px 11px',
        }}>

          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#84B179', boxShadow: '0 0 6px rgba(132,177,121,0.7)', display: 'block', animation: 'pulse 2s ease-in-out infinite' }} />
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#84B179', letterSpacing: '0.08em' }}>LIVE</span>
        </div>

        {/* City selector */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => { setOpen(o => !o); setSearch(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(132,177,121,0.18)',
              borderRadius: 9, padding: '6px 12px',
              color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 600,
              cursor: 'pointer', transition: 'background 0.2s',
              fontFamily: 'inherit', maxWidth: 200,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(132,177,121,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          >
            {/* Map pin */}
            <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
              <path d="M5.5 0C2.46 0 0 2.46 0 5.5c0 3.85 5.5 7.5 5.5 7.5S11 9.35 11 5.5C11 2.46 8.54 0 5.5 0zm0 7.5a2 2 0 110-4 2 2 0 010 4z" fill="#84B179"/>
            </svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{cityName}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <AnimatePresence>
            {open && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    background: '#111A0F',
                    border: '1px solid rgba(132,177,121,0.15)',
                    borderRadius: 14, overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                    zIndex: 99, width: 240,
                  }}
                >
                  {/* Search */}
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <input
                      autoFocus
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search city…"
                      style={{
                        width: '100%', background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(132,177,121,0.18)', borderRadius: 8,
                        padding: '7px 10px', fontSize: '0.8rem', color: '#F1F5F9',
                        outline: 'none', fontFamily: 'inherit',
                      }}
                    />
                  </div>
                  {/* List */}
                  <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                    {filtered.map(city => (
                      <button key={city}
                        onClick={() => { setDistrict(city); setOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          width: '100%', padding: '8px 14px',
                          background: city === selectedDistrict ? 'rgba(132,177,121,0.10)' : 'transparent',
                          border: 'none', cursor: 'pointer',
                          color: city === selectedDistrict ? '#84B179' : '#94A3B8',
                          fontSize: '0.8rem', fontWeight: city === selectedDistrict ? 700 : 500,
                          textAlign: 'left', transition: 'background 0.15s', fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => { if (city !== selectedDistrict) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={e => { if (city !== selectedDistrict) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {city === 'All Cities'
                          ? <span style={{ fontSize: '0.8rem' }}>🌐</span>
                          : <span style={{ width: 7, height: 7, borderRadius: '50%', background: city === selectedDistrict ? '#84B179' : '#243320', display: 'block', flexShrink: 0 }} />
                        }
                        {city}
                        {city === selectedDistrict && <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#84B179' }}>✓</span>}
                      </button>
                    ))}
                    {filtered.length === 0 && (
                      <div style={{ padding: '16px 14px', fontSize: '0.78rem', color: '#64748B', textAlign: 'center' }}>No cities found</div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
