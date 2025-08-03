/**
 * Typography Design Tokens
 * 
 * Systematic typography scale based on minor third (1.2 ratio) with fluid responsive sizing.
 * Creates consistent text hierarchy and improves readability across devices.
 */

export const typography = {
  // Font families
  fontFamily: {
    sans: [
      'Inter',
      'ui-sans-serif', 
      'system-ui', 
      '-apple-system', 
      'BlinkMacSystemFont', 
      'Segoe UI', 
      'Roboto', 
      'Helvetica Neue', 
      'Arial', 
      'Noto Sans', 
      'sans-serif'
    ],
    mono: [
      'JetBrains Mono',
      'ui-monospace', 
      'SFMono-Regular', 
      'Menlo', 
      'Monaco', 
      'Consolas', 
      'Liberation Mono', 
      'Courier New', 
      'monospace'
    ],
  },

  // Type scale (minor third - 1.2 ratio)
  fontSize: {
    // Small text
    xs: {
      size: '12px',
      lineHeight: '16px',
    },
    sm: {
      size: '14px', 
      lineHeight: '20px',
    },
    
    // Body text
    base: {
      size: '16px',
      lineHeight: '24px',
    },
    
    // Headings
    lg: {
      size: '18px',
      lineHeight: '28px',
    },
    xl: {
      size: '20px',
      lineHeight: '28px',
    },
    '2xl': {
      size: '24px',
      lineHeight: '32px',
    },
    '3xl': {
      size: '30px',
      lineHeight: '36px',
    },
    '4xl': {
      size: '36px',
      lineHeight: '40px',
    },
    '5xl': {
      size: '48px',
      lineHeight: '52px',
    },
    '6xl': {
      size: '60px',
      lineHeight: '64px',
    },
  },

  // Font weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Semantic text variants
  variants: {
    // Page titles
    pageTitle: {
      fontSize: '30px',
      lineHeight: '36px',
      fontWeight: '700',
      letterSpacing: '-0.025em',
    },
    
    // Section headings
    sectionHeading: {
      fontSize: '24px',
      lineHeight: '32px',
      fontWeight: '600',
      letterSpacing: '-0.025em',
    },
    
    // Subsection headings
    subsectionHeading: {
      fontSize: '20px',
      lineHeight: '28px',
      fontWeight: '600',
    },
    
    // Body text
    body: {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: '400',
    },
    
    // Small text
    caption: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: '400',
    },
    
    // Labels
    label: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: '500',
    },
    
    // Code
    code: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: '400',
      fontFamily: 'mono',
    },
  },

  // Responsive typography utilities
  responsive: {
    // Mobile-first responsive text sizes
    pageTitle: {
      mobile: { fontSize: '24px', lineHeight: '32px' },
      desktop: { fontSize: '30px', lineHeight: '36px' },
    },
    sectionHeading: {
      mobile: { fontSize: '20px', lineHeight: '28px' },
      desktop: { fontSize: '24px', lineHeight: '32px' },
    },
  },
} as const;

/**
 * Typography utilities for programmatic access
 */
export const typographyUtils = {
  /**
   * Get font size configuration
   */
  getFontSize: (size: keyof typeof typography.fontSize) => {
    return typography.fontSize[size];
  },
  
  /**
   * Get semantic variant configuration  
   */
  getVariant: (variant: keyof typeof typography.variants) => {
    return typography.variants[variant];
  },
  
  /**
   * Create responsive typography classes
   */
  createResponsiveClasses: (variant: keyof typeof typography.responsive) => {
    const config = typography.responsive[variant];
    return {
      base: config.mobile,
      md: config.desktop,
    };
  },
};

/**
 * Type definitions
 */
export type FontSizeToken = keyof typeof typography.fontSize;
export type FontWeightToken = keyof typeof typography.fontWeight;
export type TypographyVariant = keyof typeof typography.variants;
export type ResponsiveTypographyVariant = keyof typeof typography.responsive;