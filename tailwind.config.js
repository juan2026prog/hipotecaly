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
          DEFAULT: '#071A35',
          dark: '#051326',
          surface: '#0B2246',
          light: '#0F2D5A',
          border: '#1B355A',
        },
        brand: {
          green: '#2DA674',
          'green-dark': '#228A5E',
          'green-light': '#E9F6F0',
          'green-hover': '#249163',
        },
        slate: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          text: '#07152E',
          muted: '#64748B',
          subtle: '#94A3B8',
          border: '#E2E8F0',
          input: '#F1F5F9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'btn': '10px',
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(7, 26, 53, 0.06), 0 2px 6px -1px rgba(7, 26, 53, 0.04)',
        'card-hover': '0 10px 25px -3px rgba(7, 26, 53, 0.1), 0 4px 10px -2px rgba(7, 26, 53, 0.05)',
        'floating': '0 20px 40px -10px rgba(7, 26, 53, 0.25)',
      }
    },
  },
  plugins: [],
}
