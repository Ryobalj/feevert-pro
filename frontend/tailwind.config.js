/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ----- Galileo Design Colors -----
      colors: {
        primary: {
          DEFAULT: '#2d6a4f',
          light: '#3a8b67',
          dark: '#1b4332',
          mint: '#d8f3dc',
          glow: 'rgba(45, 106, 79, 0.25)',
        },
        surface: {
          base: 'var(--g-surface-base)',
          elevated: 'var(--g-surface-elevated)',
          glass: 'var(--g-surface-glass)',
          liquid: 'var(--g-surface-liquid)',
        },
        text: {
          primary: 'var(--g-text-primary)',
          secondary: 'var(--g-text-secondary)',
          tertiary: 'var(--g-text-tertiary)',
          inverse: 'var(--g-text-inverse)',
        },
        border: {
          subtle: 'var(--g-border-subtle)',
          medium: 'var(--g-border-medium)',
          strong: 'var(--g-border-strong)',
          glass: 'var(--g-border-glass)',
        },
        liquid: {
          primary: 'var(--g-liquid-primary)',
          secondary: 'var(--g-liquid-secondary)',
          accent: 'var(--g-liquid-accent)',
        },
      },

      // ----- Font Families -----
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['SF Mono', 'Menlo', 'Monaco', 'Cascadia Code', 'Consolas', 'Courier New', 'monospace'],
      },

      // ----- Galileo Spacing Tokens -----
      spacing: {
        '1g': 'var(--g-space-1)',   // 4px
        '2g': 'var(--g-space-2)',   // 8px
        '3g': 'var(--g-space-3)',   // 12px
        '4g': 'var(--g-space-4)',   // 16px
        '5g': 'var(--g-space-5)',   // 20px
        '6g': 'var(--g-space-6)',   // 24px
        '8g': 'var(--g-space-8)',   // 32px
        '10g': 'var(--g-space-10)', // 40px
        '12g': 'var(--g-space-12)', // 48px
        '16g': 'var(--g-space-16)', // 64px
      },

      // ----- Border Radius -----
      borderRadius: {
        'xs-g': 'var(--g-radius-xs)',
        'sm-g': 'var(--g-radius-sm)',
        'md-g': 'var(--g-radius-md)',
        'lg-g': 'var(--g-radius-lg)',
        'xl-g': 'var(--g-radius-xl)',
        '2xl-g': 'var(--g-radius-2xl)',
        'full-g': 'var(--g-radius-full)',
      },

      // ----- Galileo Shadows -----
      boxShadow: {
        'xs-g': 'var(--g-shadow-xs)',
        'sm-g': 'var(--g-shadow-sm)',
        'md-g': 'var(--g-shadow-md)',
        'lg-g': 'var(--g-shadow-lg)',
        'xl-g': 'var(--g-shadow-xl)',
        'glass-g': 'var(--g-shadow-glass)',
        'liquid-g': 'var(--g-shadow-liquid)',
      },

      // ----- Backdrop Blur -----
      backdropBlur: {
        'xs-g': 'var(--g-blur-xs)',
        'sm-g': 'var(--g-blur-sm)',
        'md-g': 'var(--g-blur-md)',
        'lg-g': 'var(--g-blur-lg)',
        'xl-g': 'var(--g-blur-xl)',
      },

      // ----- Z-Index -----
      zIndex: {
        'base': 'var(--g-z-base)',
        'elevated': 'var(--g-z-elevated)',
        'dropdown': 'var(--g-z-dropdown)',
        'sticky': 'var(--g-z-sticky)',
        'overlay': 'var(--g-z-overlay)',
        'modal': 'var(--g-z-modal)',
        'popover': 'var(--g-z-popover)',
        'toast': 'var(--g-z-toast)',
        'tooltip': 'var(--g-z-tooltip)',
      },

      // ----- Galileo Animations -----
      animation: {
        // Fade
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-out': 'fadeOut 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'fade-in-down': 'fadeInDown 0.4s ease-out',
        'fade-in-left': 'fadeInLeft 0.4s ease-out',
        'fade-in-right': 'fadeInRight 0.4s ease-out',
        
        // Scale
        'scale-in': 'scaleIn 0.3s ease-bounce',
        'scale-out': 'scaleOut 0.3s ease-out',
        'scale-pulse': 'scalePulse 2s ease-in-out infinite',
        'scale-bounce': 'scaleBounce 0.5s ease-bounce',
        
        // Float
        'float-slow': 'floatSlow 8s ease-in-out infinite',
        'float-medium': 'floatMedium 6s ease-in-out infinite',
        'float-fast': 'floatFast 4s ease-in-out infinite',
        
        // Glow
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'glow-breath': 'glowBreath 3s ease-in-out infinite',
        'border-glow': 'borderGlow 2s ease-in-out infinite',
        
        // Slide
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        
        // Rotate
        'rotate': 'rotate 2s linear infinite',
        'rotate-reverse': 'rotateReverse 2s linear infinite',
        'rotate-pulse': 'rotatePulse 3s ease-in-out infinite',
        
        // Special
        'shimmer': 'shimmer 2s infinite',
        'liquid-wave': 'liquidWave 2s ease-in-out infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
        'jelly': 'jelly 0.5s ease-out',
        'wiggle': 'wiggle 0.5s ease-in-out infinite',
        'shake': 'shake 0.5s ease-out',
        'bounce-light': 'bounceLight 2s ease-in-out infinite',
        'swing': 'swing 1s ease-out',
        'zoom-in': 'zoomIn 0.3s ease-out',
        'zoom-out': 'zoomOut 0.3s ease-out',
        'text-focus': 'textFocusIn 0.5s ease-out',
      },

      // ----- Animation Keyframes -----
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.9)' },
        },
        scalePulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        scaleBounce: {
          '0%': { transform: 'scale(0)' },
          '50%': { transform: 'scale(1.1)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-12px) rotate(-2deg)' },
          '75%': { transform: 'translateY(6px) rotate(2deg)' },
        },
        floatMedium: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-8px) rotate(-1deg)' },
          '75%': { transform: 'translateY(4px) rotate(1deg)' },
        },
        floatFast: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px var(--g-color-primary-glow)' },
          '50%': { boxShadow: '0 0 50px var(--g-color-primary-glow), 0 0 80px var(--g-liquid-primary)' },
        },
        glowBreath: {
          '0%, 100%': { textShadow: '0 0 10px var(--g-color-primary-glow)' },
          '50%': { textShadow: '0 0 30px var(--g-color-primary-glow), 0 0 60px var(--g-liquid-primary)' },
        },
        borderGlow: {
          '0%, 100%': { borderColor: 'var(--g-border-subtle)' },
          '50%': { borderColor: 'var(--g-color-primary)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        rotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        rotateReverse: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg)' },
        },
        rotatePulse: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.1)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        liquidWave: {
          '0%': { transform: 'translateX(-100%) skewX(-15deg)' },
          '100%': { transform: 'translateX(100%) skewX(-15deg)' },
        },
        heartbeat: {
          '0%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.1)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.2)' },
          '70%': { transform: 'scale(1)' },
        },
        jelly: {
          '0%, 100%': { transform: 'scale(1, 1)' },
          '25%': { transform: 'scale(0.9, 1.1)' },
          '50%': { transform: 'scale(1.1, 0.9)' },
          '75%': { transform: 'scale(0.95, 1.05)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(2deg)' },
          '75%': { transform: 'rotate(-2deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
        },
        bounceLight: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        swing: {
          '20%': { transform: 'rotate(15deg)' },
          '40%': { transform: 'rotate(-10deg)' },
          '60%': { transform: 'rotate(5deg)' },
          '80%': { transform: 'rotate(-5deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        zoomIn: {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        zoomOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.5)' },
        },
        textFocusIn: {
          '0%': { filter: 'blur(12px)', opacity: '0' },
          '100%': { filter: 'blur(0)', opacity: '1' },
        },
      },

      // ----- Transition Timing -----
      transitionTimingFunction: {
        'ease-default': 'var(--g-ease-default)',
        'ease-bounce': 'var(--g-ease-bounce)',
        'ease-liquid': 'var(--g-ease-liquid)',
        'ease-spring': 'var(--g-ease-spring)',
      },

      // ----- Transition Duration -----
      transitionDuration: {
        'instant': 'var(--g-duration-instant)',
        'fast': 'var(--g-duration-fast)',
        'base': 'var(--g-duration-base)',
        'slow': 'var(--g-duration-slow)',
        'liquid': 'var(--g-duration-liquid)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
  darkMode: 'class',
}