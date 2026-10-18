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
        // Operations-console palette: a near-black/green graphite scale for
        // structure, a severity spectrum reserved exclusively for actual
        // threat/system state, and a separate neon-green accent reserved
        // for brand/interactive state (active nav, primary actions, focus
        // rings, live indicators) — never used to encode severity meaning.
        ink: {
          950: '#050805', // primary app background
          900: '#080C09', // sidebar background
          850: '#0A0F0B', // secondary background
          800: '#0D130F', // card / panel surface
          700: '#121A14', // elevated surface (popovers, modals, hovers)
        },
        line: {
          700: '#1B2B20',
          600: '#25392C',
          500: '#33503F',
        },
        paper: {
          100: '#E8F5E9',
          300: '#C3D6C6',
          400: '#91A395',
          600: '#5E7065',
        },
        sev: {
          critical: '#FF4545',
          high: '#FFB020',
          medium: '#E3B341',
          low: '#1F7A3F',
          clear: '#00E676',
        },
        accent: {
          DEFAULT: '#39FF14', // primary neon green — active nav, primary buttons, focus rings
          secondary: '#00E676',
          muted: '#1F7A3F',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        // Restrained accent glow — reserved for a genuinely selected/active/
        // focused element, never applied ambiently to whole panels.
        'glow-accent': '0 0 0 1px rgba(57, 255, 20, 0.4), 0 0 12px -2px rgba(57, 255, 20, 0.35)',
        'glow-critical': '0 0 0 1px rgba(255, 69, 69, 0.4), 0 0 12px -2px rgba(255, 69, 69, 0.3)',
      },
      keyframes: {
        flow: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
        sweep: {
          '0%': { opacity: '0', transform: 'scaleX(0)' },
          '100%': { opacity: '1', transform: 'scaleX(1)' },
        },
      },
      animation: {
        'flow-fast': 'flow 1s linear infinite',
        'sweep-in': 'sweep 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
}
