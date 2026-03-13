/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        um: {
          primary: '#B5121B',
          'primary-dark': '#8B0000',
          accent: '#F07800',
          'accent-warm': '#F5A623',
          'accent-muted': '#E8C442',
        },
        dark: {
          bg: '#0E1117',
          card: '#1E2130',
          surface: '#262B3D',
          border: '#2D3348',
        },
        domain: {
          traffic: '#FF6B6B',
          pollution: '#6C5CE7',
          energy: '#FDCB6E',
          transport: '#74B9FF',
          water: '#55EFC4',
          waste: '#A29BFE',
        },
        status: {
          critical: '#FF4757',
          warning: '#FFA502',
          normal: '#2ED573',
          info: '#1D4ED8',
        },
        text: {
          primary: '#F1F5F9',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.6s ease forwards',
        'slide-right': 'slideRight 0.5s ease forwards',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'float': 'float 5s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideRight: {
          from: { opacity: '0', transform: 'translateX(30px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(181,18,27,0.2)' },
          '50%': { boxShadow: '0 0 0 12px rgba(181,18,27,0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};
