/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Geologica', 'sans-serif'],
        body: ['Nunito', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0f7f4',
          100: '#dceee6',
          200: '#b9ddcd',
          300: '#8fc4ae',
          400: '#62a68d',
          500: '#3f8a71',
          600: '#2e6e59',
          700: '#255849',
          800: '#1e463a',
          900: '#193b31',
        },
        earth: {
          100: '#f5ede0',
          200: '#e8d5b7',
          300: '#d4b483',
          400: '#c09054',
          500: '#a67340',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
      }
    },
  },
  plugins: [],
}
