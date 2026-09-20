/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nids: {
          bg: '#080c14',
          surface: '#0d131f',
          card: '#121a2a',
          cardHover: '#162238',
          border: '#1b273d',
          borderLight: '#2a3b5c',
          accent: '#3b82f6',
          accentHover: '#2563eb',
          cyan: '#06b6d4',
          emerald: '#10b981',
          amber: '#f59e0b',
          orange: '#f97316',
          rose: '#ef4444',
          textMuted: '#64748b',
          textSecondary: '#94a3b8',
          textPrimary: '#f1f5f9',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow-fast': 'flow 1s linear infinite',
        'scan': 'scan 2.5s ease-in-out infinite',
      },
      keyframes: {
        flow: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
        scan: {
          '0%, 100%': { opacity: '0.2', transform: 'translateY(-100%)' },
          '50%': { opacity: '0.8', transform: 'translateY(100%)' },
        }
      }
    },
  },
  plugins: [],
}
