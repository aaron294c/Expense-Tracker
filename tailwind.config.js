/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Apple-grade neutral system
        gray: {
          25: '#fcfcfd',
          50: '#f8f9fb',
          75: '#f4f6f8',
          100: '#eef2f6',
          150: '#e3e8ef',
          200: '#d7dde4',
          300: '#b9c2cc',
          400: '#9aa3af',
          500: '#6c7683',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          850: '#1a202c',
          900: '#111827',
          950: '#0a0f1c',
        },
        // Premium glassmorphism surfaces
        surface: {
          DEFAULT: 'rgba(255, 255, 255, 0.7)',
          elevated: 'rgba(255, 255, 255, 0.85)',
          glass: 'rgba(255, 255, 255, 0.60)',
          overlay: 'rgba(255, 255, 255, 0.95)',
          dark: {
            DEFAULT: 'rgba(17, 24, 39, 0.7)',
            elevated: 'rgba(17, 24, 39, 0.85)',
            glass: 'rgba(17, 24, 39, 0.60)',
            overlay: 'rgba(17, 24, 39, 0.95)',
          }
        },
        // Refined text hierarchy
        text: {
          primary: '#0a0a0b',
          secondary: '#374151',
          tertiary: '#6b7280',
          subtle: '#9ca3af',
          placeholder: '#d1d5db',
          inverted: '#ffffff',
          brand: '#2563eb',
        },
        // Premium brand colors
        brand: {
          50: '#eff6ff',
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Primary brand
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Status colors with Apple-style subtlety
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Subtle border system
        border: {
          subtle: 'rgba(0, 0, 0, 0.06)',
          light: 'rgba(0, 0, 0, 0.08)',
          medium: 'rgba(0, 0, 0, 0.12)',
          strong: 'rgba(0, 0, 0, 0.16)',
        },
      },
      // Enhanced border radius scale
      borderRadius: {
        'xs': '0.25rem',
        'sm': '0.375rem', 
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2rem',
      },
      // Apple-grade shadow system
      boxShadow: {
        'xs': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'sm': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.03)',
        'lg': '0 10px 15px rgba(0, 0, 0, 0.04), 0 4px 6px rgba(0, 0, 0, 0.02)',
        'xl': '0 20px 25px rgba(0, 0, 0, 0.04), 0 10px 10px rgba(0, 0, 0, 0.02)',
        '2xl': '0 25px 50px rgba(0, 0, 0, 0.06)',
        'inner': 'inset 0 2px 4px rgba(0, 0, 0, 0.04)',
        // Special purpose shadows
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 0px rgba(255, 255, 255, 0.5) inset',
        'card': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'elevated': '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
        'floating': '0 8px 40px rgba(0, 0, 0, 0.12)',
        'brand': '0 4px 20px rgba(59, 130, 246, 0.15)',
        'brand-glow': '0 0 20px rgba(59, 130, 246, 0.25)',
      },
      // Enhanced backdrop blur
      backdropBlur: {
        'xs': '2px',
        'sm': '4px', 
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
      },
      // Apple-grade animation curves
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.8, 0.25, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'elastic': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      // Typography scale with Apple-grade spacing
      fontSize: {
        'xs': ['12px', { lineHeight: '16px', letterSpacing: '0.025em' }],
        'sm': ['14px', { lineHeight: '20px', letterSpacing: '0.016em' }],
        'base': ['16px', { lineHeight: '24px', letterSpacing: '0.011em' }],
        'lg': ['18px', { lineHeight: '28px', letterSpacing: '0.009em' }],
        'xl': ['20px', { lineHeight: '32px', letterSpacing: '0.006em' }],
        '2xl': ['24px', { lineHeight: '36px', letterSpacing: '0.002em' }],
        '3xl': ['28px', { lineHeight: '40px', letterSpacing: '-0.003em' }],
        '4xl': ['32px', { lineHeight: '44px', letterSpacing: '-0.008em' }],
        '5xl': ['36px', { lineHeight: '48px', letterSpacing: '-0.014em' }],
        // Special purpose sizes
        'display': ['28px', { lineHeight: '36px', letterSpacing: '-0.025em', fontWeight: '600' }],
        'headline': ['22px', { lineHeight: '28px', letterSpacing: '-0.019em', fontWeight: '600' }],
        'title': ['18px', { lineHeight: '24px', letterSpacing: '-0.014em', fontWeight: '500' }],
        'body': ['15px', { lineHeight: '22px', letterSpacing: '-0.008em' }],
        'caption': ['13px', { lineHeight: '18px', letterSpacing: '0.016em' }],
        'micro': ['11px', { lineHeight: '14px', letterSpacing: '0.066em', textTransform: 'uppercase' }],
      },
      // Enhanced spacing scale
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      // Animation durations
      transitionDuration: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
