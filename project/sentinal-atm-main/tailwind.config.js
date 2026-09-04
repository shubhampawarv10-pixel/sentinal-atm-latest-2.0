/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sentinel: {
          bg: '#070b14',
          panel: '#0b1224',
          sidebar: '#0a0f1d',
          border: '#1e293b',
          accent: '#3b82f6',
        },
      },
    },
  },
  plugins: [],
}
