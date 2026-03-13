export default function Logo({ size = 34, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background Shield/Leaf shape */}
      <path d="M20 2C10.0589 2 2 10.0589 2 20C2 29.9411 10.0589 38 20 38C26 38 38 38 38 38C38 38 38 26 38 20C38 10.0589 29.9411 2 20 2Z" fill="url(#paint0_linear)" />
      
      {/* City Buildings */}
      <rect x="12" y="16" width="6" height="14" rx="1" fill="#FFFFFF" fillOpacity="0.9" />
      <rect x="20" y="12" width="6" height="18" rx="1" fill="#FFFFFF" fillOpacity="0.95" />
      <rect x="28" y="18" width="5" height="12" rx="1" fill="#FFFFFF" fillOpacity="0.8" />
      
      {/* Windows */}
      <rect x="14" y="18" width="2" height="2" fill="#84B179" />
      <rect x="14" y="22" width="2" height="2" fill="#84B179" />
      <rect x="22" y="15" width="2" height="2" fill="#84B179" />
      <rect x="22" y="19" width="2" height="2" fill="#84B179" />
      
      {/* Protective sweeping leaf arc */}
      <path d="M4 22C4 22 14 34 26 34C32 34 36 28 36 28" stroke="#EAF7D1" strokeWidth="3" strokeLinecap="round" />
      
      <defs>
        <linearGradient id="paint0_linear" x1="2" y1="2" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#96EA56" />
          <stop offset="1" stopColor="#5E8A54" />
        </linearGradient>
      </defs>
    </svg>
  );
}
