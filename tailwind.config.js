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
        // Operations-console palette: a neutral graphite scale for
        // structure, and a severity spectrum reserved exclusively for
        // actual threat/system state (never used decoratively).
        ink: {
          950: '#0A0C0F',
          900: '#12151A',
          850: '#151920',
          800: '#181C22',
          700: '#20252C',
        },
        line: {
          700: '#242A32',
          600: '#333A44',
          500: '#454E59',
        },
        paper: {
          100: '#EDEFF2',
          300: '#B7BEC7',
          400: '#8C94A0',
          600: '#5B6472',
        },
        sev: {
          critical: '#E5484D',
          high: '#EF8D4C',
          medium: '#E3B341',
          low: '#5E89B5',
          clear: '#4FAE82',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
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
