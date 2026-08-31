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
          primary: '#0B0F14',
          secondary: '#11161D',
          panel: '#151B23',
          elevated: '#1A212B',
        },
        border: {
          DEFAULT: '#26303B',
          subtle: '#1A212B',
          hover: '#2D3947',
        },
        text: {
          primary: '#F1F5F9',
          secondary: '#94A3B8',
          muted: '#64748B',
          faint: '#3A4654',
        },
        status: {
          healthy: '#22C55E',
          warning: '#F59E0B',
          critical: '#EF4444',
          info: '#38BDF8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '10px',
        xl: '12px',
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 1.2s ease-out 1 forwards',
        'status-pulse': 'status-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-subtle': {
          '0%': { borderColor: '#38BDF8', boxShadow: '0 0 10px rgba(56, 189, 248, 0.25)' },
          '100%': { borderColor: '#26303B', boxShadow: 'none' },
        },
        'status-pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
    },
  },
  plugins: [],
}
