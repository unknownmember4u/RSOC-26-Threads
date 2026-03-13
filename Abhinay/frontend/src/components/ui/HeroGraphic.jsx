import { motion } from 'framer-motion';

export default function HeroGraphic({ className = '' }) {
  return (
    <div className={`relative w-full aspect-square max-w-[500px] mx-auto ${className}`}>
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible">
        {/* Background glow circle */}
        <motion.circle 
          cx="200" cy="200" r="160" 
          fill="url(#glow-gradient)" 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        {/* Rolling Hills (Back) */}
        <motion.path 
          d="M0 320 C 100 250, 250 280, 400 230 L 400 400 L 0 400 Z" 
          fill="#A4D65E" opacity="0.4"
          initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 0.4 }} transition={{ duration: 1, delay: 0.2 }}
        />
        
        {/* Rolling Hills (Front) */}
        <motion.path 
          d="M-50 400 C 150 280, 280 340, 450 260 L 450 400 L -50 400 Z" 
          fill="#84B179"
          initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, delay: 0.4 }}
        />

        {/* Main Tree Trunk */}
        <motion.path 
          d="M190 350 Q 195 240 200 150 Q 205 240 210 350 Z" 
          fill="#704C3E"
          initial={{ scaleY: 0, originY: "350px" }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
        />

        {/* Tree Canopy Circles */}
        <motion.g initial={{ scale: 0, originX: "200px", originY: "150px" }} animate={{ scale: 1 }} transition={{ duration: 0.8, delay: 1, type: "spring" }}>
          <circle cx="200" cy="130" r="70" fill="#96EA56" />
          <circle cx="150" cy="160" r="55" fill="#5E8A54" />
          <circle cx="250" cy="160" r="55" fill="#84B179" />
          <circle cx="200" cy="190" r="45" fill="#A4D65E" />
        </motion.g>

        {/* Smart Nodes (City Data Connection) */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.5 }}>
          <path d="M70 200 L 150 160" stroke="#EAF7D1" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M330 180 L 250 160" stroke="#EAF7D1" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M280 90 L 220 120" stroke="#EAF7D1" strokeWidth="2" strokeDasharray="4 4" />
          
          <circle cx="70" cy="200" r="8" fill="#FFFFFF" stroke="#84B179" strokeWidth="4" />
          <circle cx="330" cy="180" r="12" fill="#FFFFFF" stroke="#96EA56" strokeWidth="4" />
          <circle cx="280" cy="90" r="10" fill="#FFFFFF" stroke="#5E8A54" strokeWidth="4" />
        </motion.g>

        {/* Floating Leaves */}
        {[
          { x: 120, y: 100, delay: 2, scale: 0.6 },
          { x: 280, y: 220, delay: 2.5, scale: 0.8 },
          { x: 140, y: 260, delay: 2.2, scale: 0.5 },
          { x: 250, y: 70, delay: 2.8, scale: 0.7 }
        ].map((leaf, i) => (
          <motion.path
            key={i}
            d="M0 10 Q 10 0 20 10 Q 10 20 0 10 Z"
            fill="#96EA56"
            style={{ x: leaf.x, y: leaf.y, scale: leaf.scale }}
            initial={{ opacity: 0, rotate: -20 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              y: [leaf.y, leaf.y + 40],
              x: [leaf.x, leaf.x - 20],
              rotate: [-20, 20]
            }}
            transition={{
              duration: 4,
              delay: leaf.delay,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut"
            }}
          />
        ))}

        <defs>
          <radialGradient id="glow-gradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
            <stop offset="0%" stopColor="#EAF7D1" />
            <stop offset="100%" stopColor="#EAF7D1" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
