import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { api } from "../../api/urbanmindAPI"

const QUICK_CHIPS = [
  { label: "🏭 Highest pollution zone?", query: "Which district has the highest PM2.5 and AQI levels right now?" },
  { label: "🚦 Peak traffic time?", query: "When does traffic density peak in the city and which districts are most affected?" },
  { label: "⚡ Energy hotspot?", query: "Which district is consuming the most energy and what is the renewable percentage?" },
  { label: "📊 City health?", query: "Give me an overview of Pune's current sustainability and health score." }
]

export default function ChatAssistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am UrbanMind AI. How can I help you analyze Pune today?", backend: "system" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [backend, setBackend] = useState("ollama")
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const handleSend = async (text) => {
    const query = text || input
    if (!query.trim()) return

    setMessages(prev => [...prev, { role: "user", content: query }])
    setInput("")
    setLoading(true)

    try {
      const history = messages.slice(-5).map(m => ({ role: m.role, content: m.content }))
      const data = await api.chat(query, history, backend)
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: data.response, 
        backend: data.backend_used 
      }])
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I encountered an error connecting to the AI backend. Please check if the server is running.",
        backend: "error"
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)',
      background: 'var(--panel-bg)', borderRadius: 20, border: '1px solid var(--panel-border)',
      overflow: 'hidden', position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--panel-border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(132, 177, 121, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.4rem' }}>🤖</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>UrbanMind AI Assistant</div>
            <div style={{ fontSize: '0.65rem', color: '#84B179', fontWeight: 700, letterSpacing: '0.05em' }}>ONLINE • PUNE CENTRAL</div>
          </div>
        </div>

        {/* Backend Toggle */}
        <div style={{
          display: 'flex', background: 'var(--app-bg)', borderRadius: 10, padding: 3,
          border: '1px solid var(--panel-border)'
        }}>
          {['ollama', 'gemini'].map(b => (
            <button
              key={b}
              onClick={() => setBackend(b)}
              style={{
                padding: '6px 12px', border: 'none', borderRadius: 7, fontSize: '0.65rem',
                fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase',
                background: backend === b ? '#84B179' : 'transparent',
                color: backend === b ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
            >
              {b === 'ollama' ? '🖥️ Local' : '☁️ Cloud'}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            gap: 12, alignItems: 'flex-end'
          }}>
            {m.role === 'assistant' && (
              <div style={{
                width: 32, height: 32, borderRadius: 10, background: '#84B179',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                marginBottom: 4, flexShrink: 0
              }}>🤖</div>
            )}
            <div style={{
              maxWidth: '75%', padding: '12px 16px', borderRadius: 16,
              borderBottomLeftRadius: m.role === 'assistant' ? 4 : 16,
              borderBottomRightRadius: m.role === 'user' ? 4 : 16,
              background: m.role === 'user' ? 'linear-gradient(135deg, #84B179, #5e8a54)' : 'var(--panel-border)',
              color: m.role === 'user' ? '#fff' : 'var(--text-main)',
              fontSize: '0.88rem', lineHeight: 1.5, position: 'relative',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              {m.content}
              {m.backend && m.backend !== 'system' && (
                <div style={{
                  fontSize: '0.55rem', marginTop: 8, opacity: 0.6, fontWeight: 700,
                  textTransform: 'uppercase', textAlign: 'right'
                }}>
                  Powered by {m.backend}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🤖</div>
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '20px', background: 'rgba(132, 177, 121, 0.02)', borderTop: '1px solid var(--panel-border)' }}>
        {/* Quick Chips */}
        {!loading && messages.length < 3 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {QUICK_CHIPS.map(chip => (
              <button
                key={chip.label}
                onClick={() => handleSend(chip.query)}
                style={{
                  padding: '6px 12px', borderRadius: 50, border: '1px solid var(--panel-border)',
                  background: 'var(--panel-bg)', color: 'var(--text-muted)', fontSize: '0.7rem',
                  fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#84B179'; e.currentTarget.style.color = '#84B179'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--panel-border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); handleSend(); }} style={{ position: 'relative' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything about city data..."
            style={{
              width: '100%', padding: '14px 60px 14px 20px', background: 'var(--app-bg)',
              border: '1px solid var(--panel-border)', borderRadius: 14, outline: 'none',
              color: 'var(--text-main)', fontSize: '0.9rem', fontFamily: 'inherit'
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              position: 'absolute', right: 8, top: 8, bottom: 8, width: 44,
              background: '#84B179', border: 'none', borderRadius: 10, color: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ✈
          </button>
        </form>
      </div>

      <style>{`
        .typing-indicator { display: flex; gap: 4px; padding: 12px 16px; background: var(--panel-border); border-radius: 16px; border-bottom-left-radius: 4px; }
        .typing-indicator span { width: 6px; height: 6px; background: #84B179; border-radius: 50%; animation: pulse 1.2s infinite ease-in-out; }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse { 0%, 100% { transform: scale(0.8); opacity: 0.3; } 50% { transform: scale(1.2); opacity: 1; } }
      `}</style>
    </div>
  )
}
