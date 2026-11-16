/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0F2642',
          800: '#173B65', // Primary navy
          700: '#1F4B7F',
          600: '#2A61A0'
        },
        civic: {
          blue: '#4387C5',
          light: '#F5F8FC',
          card: '#FFFFFF',
          border: '#E2E8F0',
        },
        priority: {
          low: '#10B981',      // Green
          medium: '#F59E0B',   // Amber
          high: '#F97316',     // Orange
          critical: '#EF4444', // Red
        }
      }
    },
  },
  plugins: [],
}
