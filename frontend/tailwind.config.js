/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pine: {
          900: '#16302A',
          700: '#1F3B33',
          500: '#2E5449',
        },
        mist: {
          600: '#3E7268',
          500: '#4E8C82',
          200: '#CFE3DE',
          100: '#E4EDEA',
        },
        sunrise: {
          600: '#CB6B25',
          500: '#E8873A',
          200: '#F7D5B4',
          100: '#FBEADA',
        },
        paper: {
          50: '#F7F5F0',
          100: '#F1EEE6',
        },
        ink: {
          900: '#232823',
          600: '#5B655F',
          400: '#8B958E',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(22, 48, 42, 0.06), 0 4px 16px rgba(22, 48, 42, 0.06)',
      },
    },
  },
  plugins: [],
};
