import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-bg text-text-primary selection:bg-um-accent selection:text-white pb-32">
      {/* Navbar Minimal */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-dark-bg/80 backdrop-blur-md border-b border-dark-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-um-primary rounded-xl flex items-center justify-center text-white font-black tracking-tighter">
            UM
          </div>
          <span className="font-extrabold text-xl tracking-tight">UrbanMind</span>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-um-primary hover:bg-um-primary-dark text-white px-6 py-2.5 rounded-full font-bold transition-all hover:scale-105 shadow-[0_4px_14px_rgba(181,18,27,0.3)] animate-pulse-glow"
        >
          Command Center &rarr;
        </button>
      </nav>

      {/* Hero */}
      <header className="pt-40 px-8 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
              Precision Intelligence for <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-um-primary to-um-accent">Municipal Governance</span>
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed max-w-xl mb-10">
              A high-performance monitoring and predictive analytics framework for real-time urban oversight, rapid emergency response, and data-driven policy planning.
            </p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-white text-dark-bg px-8 py-4 rounded-xl font-bold text-lg transition-all hover:bg-gray-200 hover:scale-105 flex items-center gap-3"
            >
              Access Platform <span className="text-xl">→</span>
            </button>
          </motion.div>
        </div>

        {/* Hero Visual Block */}
        <motion.div 
          initial={{ opacity: 0, x: 40 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 relative w-full aspect-square md:aspect-auto md:h-[500px] animate-float"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-um-primary/20 to-um-accent/20 rounded-[40px] blur-3xl"></div>
          <div className="relative h-full w-full bg-dark-card border border-dark-border rounded-[32px] overflow-hidden shadow-2xl p-8 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-status-critical"></div>
                <div className="w-3 h-3 rounded-full bg-status-warning"></div>
                <div className="w-3 h-3 rounded-full bg-status-normal"></div>
              </div>
              <div className="bg-status-normal/10 text-status-normal px-3 py-1 rounded-full text-xs font-bold border border-status-normal/20 flex items-center gap-2">
                <span className="w-2 h-2 bg-status-normal rounded-full animate-pulse"></span>
                System Live
              </div>
            </div>
            
            <div className="space-y-4 relative z-10">
              <div className="bg-dark-surface p-4 rounded-2xl border border-dark-border flex justify-between items-center">
                <div className="text-text-secondary font-medium">City AQI</div>
                <div className="text-2xl font-black text-status-warning">142</div>
              </div>
              <div className="bg-dark-surface p-4 rounded-2xl border border-dark-border flex justify-between items-center">
                <div className="text-text-secondary font-medium">Traffic Grid</div>
                <div className="text-2xl font-black text-status-critical">87%</div>
              </div>
              <div className="bg-dark-surface p-4 rounded-2xl border border-dark-border flex justify-between items-center">
                <div className="text-text-secondary font-medium">Energy Load</div>
                <div className="text-2xl font-black text-status-info">3.2 GW</div>
              </div>
            </div>
            
            {/* Grid Pattern Background overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          </div>
        </motion.div>
      </header>
    </div>
  );
}
