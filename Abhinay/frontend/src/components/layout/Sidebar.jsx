import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '@/components/ui/Logo';

const NAV = [
  { path: '/dashboard',  label: 'Dashboard',  emoji: '⎈', color: '#FDCB6E' },
  { path: '/map',        label: 'Map',         emoji: '🗺', color: '#74B9FF' },
  { path: '/predictions',label: 'Predictions', emoji: '✦',  color: '#6C5CE7' },
  { path: '/alerts',     label: 'Alerts',      emoji: '⚡', color: '#FF6B6B' },
  { path: '/clusters',   label: 'Clusters',    emoji: '◉',  color: '#55EFC4' },
  { path: '/simulator',  label: 'Simulator',   emoji: '⚗',  color: '#A29BFE' },
  { path: '/chat',       label: 'AI Chat',     emoji: '◈',  color: '#74B9FF' },
  { path: '/livefeed',   label: 'Live Feed',   emoji: '◎',  color: '#FF6B6B' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate  = useNavigate();

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: 68,
      background: 'var(--sidebar-bg)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderRight: '1px solid var(--panel-border)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '16px 0', zIndex: 60, gap: 4,
    }}>
      {/* Brand icon — clicks go home */}
      <button
        onClick={() => navigate('/')}
        title="NagarMitra — Go Home"
        style={{
          width: 42, height: 42, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: 'transparent', display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: 8, flexShrink: 0,
        }}
      >
        <Logo size={30} />
      </button>

      <div style={{ width: 26, height: 1, background: 'var(--panel-border-heavy)', marginBottom: 4 }} />

      {/* Nav icons */}
      {NAV.map(item => {
        const isActive = location.pathname === item.path;
        return (
          <NavLinkIcon key={item.path} item={item} isActive={isActive} />
        );
      })}

      {/* Bottom spacer */}
      <div style={{ flex: 1 }} />
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'var(--panel-border)',
        border: '1px solid var(--panel-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.7rem', color: 'var(--text-main)', fontWeight: 700,
        cursor: 'default',
      }}>OP</div>
    </aside>
  );
}

function NavLinkIcon({ item, isActive }) {
  return (
    <NavLink to={item.path} style={{ textDecoration: 'none', position: 'relative' }}>
      <motion.div
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        title={item.label}
        style={{
          width: 42, height: 42, borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.15rem',
          background: isActive ? 'var(--accent-alpha-20)' : 'transparent',
          border: isActive ? '1px solid var(--brand-solid)' : '1px solid transparent',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {item.emoji}
        {isActive && (
          <motion.div
            layoutId="sidebar-pill"
            style={{
              position: 'absolute', left: -14, top: '50%', transform: 'translateY(-50%)',
              width: 3, height: 20, borderRadius: 2,
              background: item.color,
            }}
          />
        )}
        {/* Tooltip */}
        <div style={{
          position: 'absolute', left: '100%', marginLeft: 12,
          background: 'var(--panel-bg)', border: '1px solid var(--panel-border)',
          color: 'var(--text-main)', fontSize: '0.73rem', fontWeight: 600,
          padding: '5px 10px', borderRadius: 8,
          whiteSpace: 'nowrap', pointerEvents: 'none',
          opacity: 0, transition: 'opacity 0.15s',
          zIndex: 200,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}
        className="nav-tooltip"
        >{item.label}</div>
      </motion.div>
    </NavLink>
  );
}
