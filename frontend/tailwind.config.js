/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#07111F',
          secondary: '#0B1728',
          surface: '#101D2E',
          elevated: '#142337',
          sidebar: '#091525',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          glass: 'rgba(255, 255, 255, 0.08)',
          highlight: 'rgba(255, 255, 255, 0.14)',
          subtle: 'rgba(255, 255, 255, 0.05)',
        },
        accent: {
          blue: '#60A5FA',
          cyan: '#38BDF8',
          temp: '#FBBF24',
          good: '#34D399',
          warning: '#F59E0B',
          critical: '#F87171',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
          faint: '#475569',
        },
        status: {
          healthy: '#34D399',
          warning: '#F59E0B',
          critical: '#F87171',
          info: '#38BDF8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '20px',
      },
      backdropBlur: {
        xs: '2px',
        glass: '20px',
        heavy: '28px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        glow: '0 0 20px rgba(56, 189, 248, 0.15)',
        'glow-temp': '0 0 20px rgba(251, 191, 36, 0.15)',
        'glow-green': '0 0 15px rgba(52, 211, 153, 0.2)',
        'glow-alert': '0 0 25px rgba(248, 113, 113, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
