/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        market: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          primary: '#3b82f6',
          gold: '#f59e0b',
          industrial: '#ef4444',
          commercial: '#3b82f6',
          financial: '#10b981',
          land: '#8b5cf6',
        },
      },
    },
  },
  plugins: [],
};

