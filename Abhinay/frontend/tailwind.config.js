/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Brand greens ── */
        brand: {
          DEFAULT:  '#84B179',
          dark:     '#5E8A54',
          medium:   '#A3C99A',
          light:    '#C5DFC0',
          pale:     '#E8F0D8',
        },
        /* ── Dark surfaces ── */
        dark: {
          bg:      'var(--app-bg)',
          card:    'var(--panel-bg)',
          surface: 'var(--panel-glass)',
          border:  'var(--panel-border)',
        },
        /* ── Domain colors — updated to green-tonality ── */
        domain: {
          traffic:   '#FF6B6B',
          pollution: '#84B179',
          energy:    '#FDCB6E',
          transport: '#74B9FF',
          water:     '#55EFC4',
          waste:     '#A29BFE',
        },
        /* ── Status ── */
        status: {
          critical: '#FF4757',
          warning:  '#FFA502',
          normal:   '#84B179',
          info:     '#74B9FF',
        },
        /* ── Text ── */
        text: {
          primary:   'var(--text-main)',
          secondary: 'var(--text-muted)',
          muted:     'var(--text-muted)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up':    'fadeUp 0.5s ease forwards',
        'fade-in':    'fadeIn 0.6s ease forwards',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'float':      'float 5s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:    { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:    { from: { opacity: '0' },                                  to: { opacity: '1' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 0 0 rgba(132,177,121,0.2)' }, '50%': { boxShadow: '0 0 0 12px rgba(132,177,121,0)' } },
        float:     { '0%,100%': { transform: 'translateY(0)' },               '50%': { transform: 'translateY(-8px)' } },
      },
    },
  },
  plugins: [],
};
