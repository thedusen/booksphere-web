/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Ensure gradient classes are always included
    'bg-gradient-to-r',
    'bg-gradient-to-br',
    'from-background',
    'via-primary/5',
    'to-secondary/10',
    'from-card',
    'via-card',
    'to-lavender-50',
    'from-primary',
    'to-secondary',
    'from-primary/10',
    'to-secondary/10',
    'from-accent/10',
    'to-primary/10',
    'from-primary/5',
    'to-secondary/5',
    // Custom color classes
    'bg-lavender-50',
    'bg-neutral-50',
    'bg-coral-50',
    'bg-mint-50',
    // Gradient text
    'gradient-text',
    // Custom shadows
    'shadow-elevation-1',
    'shadow-elevation-2',
    'shadow-elevation-3',
    'shadow-elevation-4',
    'shadow-elevation-5',
    // Animation classes
    'hover-scale-sm',
    'animate-spring',
    // Dropdown menu text classes
    'text-foreground',
    'hover:text-primary',
    'focus:text-primary',
    // Background opacity classes
    'from-background/95',
    'to-lavender-50/30',
    'to-lavender-50/40',
    'backdrop-blur-sm',
    // Checkbox styling
    'border-primary/30',
    'hover:border-primary/50',
    'focus:ring-primary/50',
    'focus:ring-2',
  ],
  theme: {
    extend: {
      // Enhanced spacing system with design tokens
      spacing: {
        xs: '4px',
        sm: '8px', 
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
        '4xl': '96px',
        '5xl': '128px',
        // Component-specific spacing
        'touch-target': '44px',
        'sidebar-width': '240px',
        'nav-item': '44px',
        'content-max': '1200px',
      },
      
      // Enhanced font size system with line heights
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
        '5xl': ['48px', { lineHeight: '52px' }],
        '6xl': ['60px', { lineHeight: '64px' }],
      },
      
      // Enhanced breakpoints
      screens: {
        xs: '475px',
        sm: '640px',
        md: '768px', 
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      
      // Enhanced shadow system
      boxShadow: {
        'elevation-0': 'none',
        'elevation-1': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'elevation-2': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'elevation-3': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'elevation-4': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'elevation-5': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        // Component shadows
        'button-focus': '0 0 0 3px rgba(59, 130, 246, 0.15)',
        'input-focus': '0 0 0 3px rgba(59, 130, 246, 0.15), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      
      // Maintain existing colors from shadcn/ui
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))"
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))"
        },
        // Quirky color additions - browser-compatible hex values
        neutral: {
          50: '#fdfcff',
          100: '#f4f3f7',
          200: '#e6e4ec',
          300: '#d5d1dc',
          400: '#a89fb1',
          500: '#8b8092',
          600: '#726873',
          700: '#5a5059',
          800: '#423b44',
          900: '#2a252e',
          950: '#1a1520',
        },
        coral: {
          50: '#fef7f4',
          100: '#fdeee6',
          200: '#f9d6c2',
          300: '#f4ba96',
          400: '#f1a47a',
          500: '#ee8e5f',
          600: '#d7744a',
          700: '#b85c36',
          800: '#934624',
          900: '#6d3115',
        },
        mint: {
          50: '#f4fefd',
          100: '#e2fcf8',
          200: '#bbf7ef',
          300: '#94f1e5',
          400: '#7aeddd',
          500: '#61e9d5',
          600: '#4fd0b8',
          700: '#3eb599',
          800: '#2f9278',
          900: '#226d59',
        },
        lavender: {
          50: '#faf9fe',
          100: '#f1eefc',
          200: '#e6dff9',
          300: '#ddd2f7',
          400: '#d7c9f6',
          500: '#d1c0f5',
          600: '#b5a3de',
          700: '#9887c5',
          800: '#7a6ca9',
          900: '#5d528a',
        }
      },
      
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      
      // Enhanced animation and transitions
      transitionDuration: {
        250: '250ms',
        300: '300ms',
      },
      
      // Typography enhancements
      fontWeight: {
        medium: '500',
        semibold: '600',
      },
      
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em', 
        wide: '0.025em',
        wider: '0.05em',
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
} 