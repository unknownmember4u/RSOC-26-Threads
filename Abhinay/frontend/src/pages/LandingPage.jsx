import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useGlobalStore from '@/state/globalStore';
import Logo from '@/components/ui/Logo';
import HeroGraphic from '@/components/ui/HeroGraphic';

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, setTheme, isAuthenticated } = useGlobalStore();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--app-bg)',
      color: 'var(--text-main)',
      transition: 'background 0.3s, color 0.3s',
      overflowX: 'hidden',
      position: 'relative',
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>

      {/* ── Soft wave background (mimics the reference curve) ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '70vh',
        background: theme === 'dark' ? '#081205' : '#EAF7D1',
        borderBottomRightRadius: '50% 15%',
        borderBottomLeftRadius: '20% 5%',
        zIndex: 0, pointerEvents: 'none',
        transition: 'background 0.3s'
      }} />

      {/* ── Background decoration shapes ── */}
      <div style={{
        position: 'absolute', top: '15%', right: '10%',
        width: 120, height: 120, borderRadius: '50%',
        background: theme === 'dark' ? '#11220B' : '#C7F187',
        zIndex: 0, opacity: 0.6
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', left: '5%',
        width: 250, height: 250, borderRadius: '50%',
        background: theme === 'dark' ? '#11220B' : '#EAF7D1',
        zIndex: 0, opacity: 0.5
      }} />

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'relative', zIndex: 50,
        height: 80, padding: '0 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'transparent'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={36} />
          <span style={{ fontWeight: 900, fontSize: '1.3rem', color: theme === 'dark' ? '#E8F0D8' : '#2F1B5C', letterSpacing: '-0.3px', transition: 'color 0.3s' }}>
            NagarMitra
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Theme Toggle mapped directly to useGlobalStore via UI */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: theme === 'dark' ? '#11220B' : '#fff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', transition: 'all 0.2s',
              color: theme === 'dark' ? '#84B179' : '#2F1B5C'
            }}
            title="Toggle Theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <main style={{
        position: 'relative', zIndex: 10,
        maxWidth: 1300, margin: '0 auto', padding: '40px 40px',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 40,
        minHeight: 'calc(100vh - 80px)'
      }}>

        {/* Text Column */}
        <div style={{ flex: '1 1 500px', maxWidth: 640 }}>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            style={{
              fontSize: 'clamp(3rem, 5.5vw, 4.5rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-1.5px',
              color: theme === 'dark' ? '#E8F0D8' : '#2F1B5C',
              marginBottom: 24,
              fontFamily: "'Inter', sans-serif"
            }}
          >
            NagarMitra<br/>
            Smart Governance<br/>
            For Sustainable<br/>
            Urban Growth.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
            style={{
              fontSize: '1rem', lineHeight: 1.7,
              color: theme === 'dark' ? '#A3C99A' : '#5C5870',
              marginBottom: 40, maxWidth: 540,
              fontWeight: 500
            }}
          >
            <strong style={{ color: theme === 'dark' ? '#E8F0D8' : '#2F1B5C' }}>Official Centralized Intelligence Portal for Municipal Authorities.</strong><br/>
            Monitor real-time city metrics, syndicate IoT datasets, and orchestrate actionable policies through a unified, high-security analytical dashboard.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            style={{ display: 'flex', gap: 16 }}
          >
            <button
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
              style={{
                background: '#84B179', // more solid, trusted green instead of neon
                color: '#fff',
                padding: '16px 36px', borderRadius: 12, // stiffer, structural corners instead of pill-shaped
                border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(132, 177, 121, 0.4)',
                display: 'flex', alignItems: 'center', gap: 10,
                transition: 'transform 0.2s', fontFamily: 'inherit',
                letterSpacing: '0.4px'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Secure Admin Login
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
            <button
              onClick={() => navigate(isAuthenticated ? '/map' : '/login')}
              style={{
                background: 'transparent',
                color: theme === 'dark' ? '#E8F0D8' : '#2F1B5C',
                padding: '16px 30px', borderRadius: 12,
                border: `2px solid ${theme === 'dark' ? 'rgba(232, 240, 216, 0.2)' : 'rgba(47, 27, 92, 0.15)'}`,
                fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                transition: 'all 0.2s', fontFamily: 'inherit',
                letterSpacing: '0.4px'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = theme === 'dark' ? 'rgba(232, 240, 216, 0.05)' : 'rgba(47, 27, 92, 0.04)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Explore Map
            </button>
          </motion.div>
        </div>

        {/* Image Column */}
        <motion.div
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
          style={{ flex: '1 1 450px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}
        >
            {/* Soft background blob */}
            <div className="absolute inset-0 bg-[#A6D491]/20 dark:bg-[#EFF6E8]/5 rounded-[4rem] transform rotate-3 scale-105" />
            
            <HeroGraphic className="relative z-10 drop-shadow-2xl" />
        </motion.div>
      </main>

    </div>
  );
}
