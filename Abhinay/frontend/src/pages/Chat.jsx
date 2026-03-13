import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User } from 'lucide-react';

export default function Chat() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: 'Hello Governor. I am the UrbanMind AI. I have access to real-time telemetry across all municipal districts. How can I assist your planning today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  const quickPrompts = [
    'Which district has the worst AQI right now?',
    'Show me the traffic congestion map for Downtown.',
    'What is the predicted energy load for D04 at 5 PM?',
    'Summarize recent critical alerts.',
  ];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSend = (text = input) => {
    if (!text.trim()) return;
    
    const userMsg = { id: Date.now(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: `Based on the latest data for your query "${text}", I recommend reviewing the real-time Dashboard. Would you like me to open the relevant predictive models?`
      }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-lg">
      
      {/* Sidebar History */}
      <div className="w-72 bg-dark-surface border-r border-dark-border flex flex-col hidden md:flex">
        <div className="p-4 border-b border-dark-border flex justify-between items-center">
          <h3 className="font-bold text-sm text-text-primary">Chat History</h3>
          <button onClick={() => setMessages([messages[0]])} className="text-xs font-bold text-text-muted hover:text-status-critical transition-colors">Clear</button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="p-3 bg-dark-card rounded-xl border border-dark-border mb-2 cursor-pointer hover:border-um-primary/50 transition-colors">
            <div className="text-xs font-bold text-text-primary truncate mb-1">AQI Analysis D03...</div>
            <div className="text-[0.65rem] text-text-muted">Today, 09:41 AM</div>
          </div>
          <div className="p-3 bg-transparent rounded-xl border border-transparent hover:bg-dark-card cursor-pointer transition-colors">
            <div className="text-xs font-medium text-text-secondary truncate mb-1">Traffic re-routing plan...</div>
            <div className="text-[0.65rem] text-text-muted">Yesterday</div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-dark-bg">
        
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id} 
              className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-dark-surface border-dark-border' : 'bg-um-primary/10 border-um-primary/30 text-um-primary'}`}>
                {msg.role === 'user' ? <User size={20} className="text-text-muted"/> : <Bot size={22} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-um-primary text-white rounded-tr-sm shadow-lg' : 'bg-dark-surface border border-dark-border rounded-tl-sm text-text-primary'}`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-um-primary/10 border border-um-primary/30 text-um-primary flex items-center justify-center shrink-0">
                <Bot size={22} />
              </div>
              <div className="bg-dark-surface border border-dark-border rounded-2xl rounded-tl-sm p-4 flex gap-1.5 items-center">
                <span className="w-2 h-2 rounded-full bg-text-muted animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-text-muted animate-bounce delay-100"></span>
                <span className="w-2 h-2 rounded-full bg-text-muted animate-bounce delay-200"></span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-dark-border bg-dark-card relative">
          
          {/* Quick Prompts */}
          {messages.length === 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-full left-0 right-0 p-4 flex gap-2 overflow-x-auto bg-gradient-to-t from-dark-card to-transparent pointer-events-none pb-6">
              <div className="flex gap-2 mx-auto pointer-events-auto">
                {quickPrompts.map((p, i) => (
                  <button key={i} onClick={() => handleSend(p)} className="text-xs font-medium text-text-secondary bg-dark-surface border border-dark-border px-4 py-2 rounded-full whitespace-nowrap hover:text-text-primary hover:border-um-primary/50 transition-colors shadow-sm">
                    {p}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center max-w-4xl mx-auto">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Query the UrbanMind intelligence core..."
              className="w-full bg-dark-surface border border-dark-border rounded-2xl pl-6 pr-14 py-4 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-um-primary/50 shadow-inner transition-colors"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-um-primary hover:bg-um-primary-dark disabled:bg-dark-border disabled:text-text-muted rounded-xl flex items-center justify-center text-white transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="text-center mt-3 text-[0.65rem] font-medium text-text-muted uppercase tracking-widest">
            AI can make mistakes. Verify critical municipal data.
          </div>
        </div>

      </div>

    </div>
  );
}
