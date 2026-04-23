/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: 'rgba(15, 23, 42, 0.85)',
          light: 'rgba(30, 41, 59, 0.9)',
          card: 'rgba(30, 41, 59, 0.95)',
        },
        accent: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          glow: 'rgba(59, 130, 246, 0.25)',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        border: {
          DEFAULT: 'rgba(99, 102, 241, 0.2)',
          light: 'rgba(148, 163, 184, 0.15)',
        },
      },
      backdropBlur: {
        xs: '4px',
        glass: '20px',
      },
      boxShadow: {
        panel: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        glow: '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-sm': '0 0 10px rgba(59, 130, 246, 0.2)',
        card: '0 4px 16px rgba(0,0,0,0.3)',
      },
      animation: {
        'slide-in': 'slideIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'fade-in': 'fadeIn 0.2s ease',
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateX(110%)', opacity: 0 },
          to: { transform: 'translateX(0)', opacity: 1 },
        },
        fadeIn: {
          from: { opacity: 0, transform: 'scale(0.96)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        pulseRing: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
};
