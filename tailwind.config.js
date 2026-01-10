/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/index.html',
    './src/renderer/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // VegucationStation color palette
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Main primary - fresh green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        secondary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Main secondary - warm orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        cream: '#fffbeb',
        earth: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          700: '#713f12',
          800: '#451a03', // Main text color - dark brown
          900: '#422006',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Touch-friendly font sizes
        'touch-sm': ['1.125rem', { lineHeight: '1.5' }],   // 18px
        'touch-base': ['1.25rem', { lineHeight: '1.5' }],  // 20px
        'touch-lg': ['1.5rem', { lineHeight: '1.4' }],     // 24px
        'touch-xl': ['1.75rem', { lineHeight: '1.3' }],    // 28px
        'touch-2xl': ['2rem', { lineHeight: '1.25' }],     // 32px
        'touch-3xl': ['2.5rem', { lineHeight: '1.2' }],    // 40px
      },
      spacing: {
        // Touch target minimum sizes
        'touch': '60px',
        'touch-min': '48px',
      },
      borderRadius: {
        'touch': '16px',
      },
    },
  },
  plugins: [],
}
