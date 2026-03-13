import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_PROMPTS = [
  'Which district has the worst AQI right now?',
  'Traffic congestion in D02 at 6 PM?',
  'Predicted energy load for D07 tonight?',
  'Summarize recent critical alerts.',
];

const INITIAL = [
  { id: 0, role: 'assistant', text: "Hello, Governor. I'm the UrbanMind AI core — connected to real-time telemetry across all 10 districts. Ask me about traffic, pollution, predictions, or policy recommendations." }
];

function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: 12, alignItems: 'flex-end', maxWidth: '80%', alignSelf: isUser ? 'flex-end' : 'flex-start' }}
    >
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem',
        background: isUser ? 'rgba(255,255,255,0.07)' : 'rgba(181,18,27,0.15)',
        border: isUser ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(181,18,27,0.3)',
      }}>
        {isUser ? '👤' : '🤖'}
      </div>
      {/* Bubble */}
      <div style={{
        padding: '12px 16px', borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser
          ? 'linear-gradient(135deg, #B5121B, #F07800)'
          : 'rgba(30,33,48,0.85)',
        border: isUser ? 'none' : '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        fontSize: '0.84rem', color: '#F1F5F9', lineHeight: 1.6,
        boxShadow: isUser ? '0 4px 20px rgba(181,18,27,0.25)' : 'none',
      }}>
        {msg.text}
      </div>
    </motion.div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState(INITIAL);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, typing]);

  const sendMsg = (text = input) => {
    if (!text.trim()) return;
    setMessages(p => [...p, { id: Date.now(), role: 'user', text }]);
    setInput(''); setTyping(true);
    setTimeout(() => {
      setMessages(p => [...p, {
        id: Date.now() + 1, role: 'assistant',
        text: `Analyzing query: "${text}". Based on real-time municipal data, I recommend reviewing the relevant dashboard panels. Shall I open predictive models for this domain?`
      }]);
      setTyping(false);
    }, 1400);
  };

  return (
    <div style={{
      display: 'flex', height: 'calc(100vh - 120px)',
      background: 'rgba(30,33,48,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden',
    }}>
      {/* Sidebar */}
      <div style={{ width: 240, borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', background: 'rgba(14,17,23,0.5)' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#F1F5F9' }}>History</span>
          <button onClick={() => setMessages(INITIAL)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>Clear</button>
        </div>
        <div style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
          {['AQI Analysis D03', 'Traffic re-routing plan', 'Water audit D07'].map((h, i) => (
            <div key={i} style={{
              padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
              background: i === 0 ? 'rgba(255,255,255,0.05)' : 'transparent',
              marginBottom: 4,
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h}</div>
              <div style={{ fontSize: '0.65rem', color: '#4B5563', marginTop: 2 }}>{i === 0 ? 'Today' : 'Yesterday'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0E1117' }}>
        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {messages.map(m => <Bubble key={m.id} msg={m} />)}
          <AnimatePresence>
            {typing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(181,18,27,0.15)', border: '1px solid rgba(181,18,27,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🤖</div>
                <div style={{ padding: '12px 20px', borderRadius: '16px 16px 16px 4px', background: 'rgba(30,33,48,0.85)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 6, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#64748B', animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite`, display: 'block' }} />)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input area */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(14,17,23,0.7)' }}>
          {messages.length === 1 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {QUICK_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMsg(p)} style={{
                  padding: '6px 14px', borderRadius: 50, fontSize: '0.75rem',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#94A3B8', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#F1F5F9'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94A3B8'; }}
                >{p}</button>
              ))}
            </div>
          )}
          <form onSubmit={e => { e.preventDefault(); sendMsg(); }} style={{ display: 'flex', gap: 12, alignItems: 'center', maxWidth: 800, margin: '0 auto' }}>
            <input
              value={input} onChange={e => setInput(e.target.value)}
              placeholder="Query the UrbanMind intelligence core..."
              style={{
                flex: 1, background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14,
                padding: '12px 18px', fontSize: '0.85rem', color: '#F1F5F9',
                outline: 'none', fontFamily: 'Inter, system-ui, sans-serif',
              }}
            />
            <motion.button
              type="submit" disabled={!input.trim() || typing}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{
                width: 44, height: 44, borderRadius: 12, border: 'none',
                background: input.trim() && !typing
                  ? 'linear-gradient(135deg, #B5121B, #F07800)'
                  : 'rgba(255,255,255,0.06)',
                cursor: input.trim() && !typing ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', flexShrink: 0,
              }}
            >↑</motion.button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: '0.62rem', color: '#4B5563', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            AI may make errors — verify critical municipal data
          </div>
        </div>
      </div>

      <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }`}</style>
    </div>
  );
}
