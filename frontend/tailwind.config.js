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
        trading: {
          bg: '#FCF9EA',
          card: '#fffef8',
          cardHover: '#e9eddf',
          border: '#d8dece',
          borderLight: '#b9c3a7',
          subtext: '#707866',
          win: '#586a43',
          winBg: 'rgba(151, 168, 122, 0.18)',
          loss: '#ef4444',       // Red for loss / sell
          lossBg: 'rgba(239, 68, 68, 0.12)',
          be: '#64748b',         // Gray for breakeven
          beBg: 'rgba(100, 116, 139, 0.15)',
          amber: '#f59e0b',      // Highlights / warnings
          amberBg: 'rgba(245, 158, 11, 0.12)',
          accent: '#97A87A',
          accentHover: '#87996a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace']
      }
    },
  },
  plugins: [],
}
