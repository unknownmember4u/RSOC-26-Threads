import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useGlobalStore from '@/state/globalStore';
import Logo from '@/components/ui/Logo';

export default function Login() {
  const navigate = useNavigate();
  const { theme, setAuthenticated } = useGlobalStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    // Hardcoded Government Admin Check
    if (username === 'admin' && password === 'admin123') {
      setError(false);
      setAuthenticated(true);
      navigate('/dashboard');
    } else {
      setError(true);
      setTimeout(() => setError(false), 800);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--app-bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-main)',
      fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative', overflow: 'hidden'
    }}>
      
      {/* Background decoration */}
      <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, background: '#84B179', opacity: 0.1, filter: 'blur(100px)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: -150, right: -50, width: 500, height: 500, background: '#2F1B5C', opacity: 0.05, filter: 'blur(120px)', borderRadius: '50%' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{
          background: 'var(--panel-bg)', padding: '50px 40px', borderRadius: 24,
          border: '1px solid var(--panel-border)',
          width: '100%', maxWidth: 420, position: 'relative', zIndex: 10,
          boxShadow: '0 24px 80px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
          <Logo size={56} className="mb-4" />
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '16px 0 8px', letterSpacing: '-0.5px' }}>
            GovOS Portal
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem', textAlign: 'center' }}>
            NagarMitra Secure Administrative Access
          </p>
        </div>

        <motion.form 
          onSubmit={handleLogin}
          animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter official ID"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 12,
                background: theme === 'dark' ? 'rgba(0,0,0,0.2)' : '#F8FAFC',
                border: `1px solid ${error ? '#FF4757' : 'var(--panel-border)'}`,
                color: 'var(--text-main)', fontSize: '0.95rem',
                outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Access Key</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 12,
                background: theme === 'dark' ? 'rgba(0,0,0,0.2)' : '#F8FAFC',
                border: `1px solid ${error ? '#FF4757' : 'var(--panel-border)'}`,
                color: 'var(--text-main)', fontSize: '0.95rem',
                outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              marginTop: 10,
              background: '#84B179', color: '#fff',
              padding: '16px', borderRadius: 12, border: 'none',
              fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(132, 177, 121, 0.4)',
              transition: 'transform 0.1s, opacity 0.2s'
            }}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            Authenticate
          </button>
        </motion.form>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#FF4757', fontSize: '0.85rem', textAlign: 'center', marginTop: 20, fontWeight: 500 }}>
            Unauthorized. Invalid credentials.
          </motion.p>
        )}
      </motion.div>
      
      <div style={{ position: 'absolute', bottom: 30, fontSize: '0.75rem', color: '#64748B', letterSpacing: '1px' }}>
        SECURE GOVT NETWORK • ENCRYPTED CONNECTION
      </div>
    </div>
  );
}
