/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        feevert: {
          green: '#2d6a4f',
          light: '#d8f3dc',
          dark: '#1b4332',
        },
        // GitHub-style colors
        github: {
          canvas: '#ffffff',
          secondary: '#f6f8fa',
          border: '#d0d7de',
          text: '#1f2328',
          'text-secondary': '#656d76',
          accent: '#0969da',
          success: '#1a7f37',
          warning: '#9a6700',
          danger: '#d1242f',
        }
      },
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['SF Mono', 'Menlo', 'Monaco', 'Cascadia Code', 'Consolas', 'Courier New', 'monospace'],
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(to right, #80808012 1px, transparent 1px), linear-gradient(to bottom, #80808012 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '24px 24px',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
  darkMode: 'class',
}
