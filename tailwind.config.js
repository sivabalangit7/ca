/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10B981', // Emerald primary
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          lime: '#A3E635', // Fresh lime accent
        },
        lime: {
          accent: '#A3E635',
          300: '#bef264',
          400: '#A3E635',
          500: '#84cc16',
        },
        slate: {
          50: '#f8fafc',
          100: '#F8FAFC',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94A3B8', // Secondary text
          500: '#64748b',
          600: '#475569',
          700: '#263247', // Borders
          800: '#172033', // Secondary card
          900: '#111827', // Card background
          950: '#080D1B', // Deep navy background
        },
        app: {
          bg: '#080D1B',
          card: '#111827',
          card2: '#172033',
          border: '#263247',
          text: '#F8FAFC',
          muted: '#94A3B8',
          primary: '#10B981',
          lime: '#A3E635',
        },
        spice: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Warm Amber
          600: '#d97706',
          700: '#b45309',
        },
        saffron: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Orange
          600: '#ea580c',
          700: '#c2410c',
        }
      },
      screens: {
        xs: '480px',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
