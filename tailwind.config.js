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
        // Phosphor-black structure. Near-black with a faint green cast so the
        // whole surface reads as one material, not grey with green stuck on.
        ink: {
          950: '#050806', // page background
          900: '#0A0F0C', // panel
          850: '#0E1511', // nested panel / table header
          800: '#131C16', // hover row
          700: '#1A261E', // pressed / selected
        },
        line: {
          700: '#16221B', // hairline dividers
          600: '#22332A', // panel borders
          500: '#2F4639', // emphasised borders
        },
        paper: {
          100: '#E4F0E8', // primary text + all data values
          300: '#A8BCAF', // secondary text
          400: '#748A7C', // tertiary / placeholder
          600: '#49594F', // disabled
        },
        // Phosphor accent. Carries identity, active state, and "system healthy".
        phos: {
          200: '#A8F0C6', // peak emphasis, used sparingly
          300: '#6EE7A8', // active nav, live indicators
          400: '#34D178', // PRIMARY — focus rings, active borders, key accents
          500: '#1FA862', // hover / pressed
          600: '#14704A', // dim traces, idle sparklines
          700: '#0D4530', // grid lines, inactive strokes
          900: '#071A12', // accent wash backgrounds
        },
        // Severity is now WARM-ONLY. Green no longer means "clear" — the accent
        // ramp carries that. This widens the gap between normal and alarm.
        sev: {
          critical: '#FF4D4D',
          high: '#FF8F3F',
          medium: '#F0C235',
          low: '#5E89B5',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        // The ONE glow exception in the whole app — the live-connection
        // status dot. No bloom anywhere else (panels, cards, text, buttons,
        // borders, backgrounds).
        live: '0 0 6px rgba(52, 209, 120, 0.5)',
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
