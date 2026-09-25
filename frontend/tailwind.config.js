/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#4F46E5', light: '#EEF2FF', dark: '#3730A3' },
        accent: '#14B8A6',
        coral: '#F97362',
        ink: '#0F172A',
        muted: '#64748B',
        line: '#E2E8F0',
        surface: '#FFFFFF',
        canvas: '#F7F8FC',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '14px' },
      boxShadow: { card: '0 1px 2px rgba(15,23,42,.04), 0 4px 16px rgba(15,23,42,.05)' },
    },
  },
  plugins: [],
};