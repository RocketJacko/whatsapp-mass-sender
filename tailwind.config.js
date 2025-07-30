/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#2196f3',
          600: '#1e88e5',
          700: '#1976d2',
          800: '#1565c0',
          900: '#0d47a1',
          green: '#25D366',
          dark: '#128C7E',
          light: '#DCF8C6',
          gray: '#E8E8E8',
          darkgray: '#667781'
        }
      },
      fontFamily: {
        'whatsapp': ['Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif']
      }
    },
  },
  plugins: [],
} 