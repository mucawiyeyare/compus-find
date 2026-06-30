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
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#2563EB',
          600: '#1d4ed8',
          700: '#1e40af',
        },
        secondary: {
          500: '#7C3AED',
          600: '#6d28d9',
        },
        accent: {
          500: '#06B6D4',
        },
        success: {
          500: '#10B981',
        },
        darkbg: '#0F172A',
        darkcard: '#1E293B',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
