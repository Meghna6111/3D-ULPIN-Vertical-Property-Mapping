/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep charcoal/navy base — the full ramp
        base: {
          950: '#060a10',
          900: '#0a0f18',
          850: '#0e1520',
          800: '#131b28',
          750: '#182130',
          700: '#1e2838',
          650: '#243042',
          600: '#2d384a',
          550: '#364254',
        },
        // Electric cyan / blue accent
        accent: {
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
        },
        signal: {
          blue: '#3b82f6',
          cyan: '#22d3ee',
        },
        success: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        warn: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        panel:
          '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 32px -12px rgba(0,0,0,0.7)',
        'panel-lg':
          '0 1px 0 0 rgba(255,255,255,0.06) inset, 0 12px 48px -16px rgba(0,0,0,0.8)',
        glow:
          '0 0 0 1px rgba(34,211,238,0.2), 0 0 24px -4px rgba(34,211,238,0.3)',
        'glow-strong':
          '0 0 0 1px rgba(34,211,238,0.35), 0 0 32px -4px rgba(34,211,238,0.45), 0 0 8px 0px rgba(34,211,238,0.15)',
        'glow-success':
          '0 0 0 1px rgba(16,185,129,0.3), 0 0 20px -4px rgba(16,185,129,0.35)',
        'glow-danger':
          '0 0 0 1px rgba(239,68,68,0.3), 0 0 20px -4px rgba(239,68,68,0.4)',
        'glow-warn':
          '0 0 0 1px rgba(245,158,11,0.3), 0 0 20px -4px rgba(245,158,11,0.35)',
        inner: 'inset 0 1px 2px 0 rgba(0,0,0,0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.35s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'glow-border': 'glowBorder 3s ease-in-out infinite',
        'scan-line': 'scanLine 4s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(34,211,238,0)' },
          '50%': { boxShadow: '0 0 12px 2px rgba(34,211,238,0.25)' },
        },
        glowBorder: {
          '0%, 100%': { borderColor: 'rgba(34,211,238,0.2)' },
          '50%': { borderColor: 'rgba(34,211,238,0.5)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
};
