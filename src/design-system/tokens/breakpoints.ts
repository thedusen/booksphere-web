/**
 * Responsive Breakpoint Design Tokens
 * 
 * Mobile-first breakpoint system optimized for modern devices.
 * Provides systematic responsive design patterns.
 */

export const breakpoints = {
  // Base breakpoint values (mobile-first)
  values: {
    xs: '475px',   // Large phones
    sm: '640px',   // Small tablets
    md: '768px',   // Tablets
    lg: '1024px',  // Small laptops
    xl: '1280px',  // Large laptops/desktop
    '2xl': '1536px', // Large desktop
  },
  
  // Device-specific breakpoints for better semantic naming
  devices: {
    mobile: '0px',     // Default mobile-first
    mobileLg: '475px', // Large phones
    tablet: '768px',   // Tablets
    laptop: '1024px',  // Laptops
    desktop: '1280px', // Desktop
    wide: '1536px',    // Wide screens
  },
  
  // Component-specific breakpoints
  components: {
    // Navigation breakpoints
    sidebarCollapse: '768px',    // When sidebar becomes collapsible
    mobileNav: '768px',          // When to show mobile navigation
    
    // Table breakpoints
    tableResponsive: '768px',    // When tables become horizontally scrollable
    tableStack: '640px',         // When to stack table as cards
    
    // Layout breakpoints
    containerMax: '1200px',      // Maximum container width
    contentSidebar: '1024px',    // When to show content + sidebar layout
  },
} as const;

/**
 * Media query utilities
 */
export const mediaQueries = {
  // Mobile-first media queries
  up: {
    xs: `@media (min-width: ${breakpoints.values.xs})`,
    sm: `@media (min-width: ${breakpoints.values.sm})`,
    md: `@media (min-width: ${breakpoints.values.md})`,
    lg: `@media (min-width: ${breakpoints.values.lg})`,
    xl: `@media (min-width: ${breakpoints.values.xl})`,
    '2xl': `@media (min-width: ${breakpoints.values['2xl']})`,
  },
  
  // Max-width media queries (desktop-first, use sparingly)
  down: {
    xs: `@media (max-width: ${parseInt(breakpoints.values.xs) - 1}px)`,
    sm: `@media (max-width: ${parseInt(breakpoints.values.sm) - 1}px)`,
    md: `@media (max-width: ${parseInt(breakpoints.values.md) - 1}px)`,
    lg: `@media (max-width: ${parseInt(breakpoints.values.lg) - 1}px)`,
    xl: `@media (max-width: ${parseInt(breakpoints.values.xl) - 1}px)`,
    '2xl': `@media (max-width: ${parseInt(breakpoints.values['2xl']) - 1}px)`,
  },
  
  // Range media queries
  between: (min: keyof typeof breakpoints.values, max: keyof typeof breakpoints.values) => {
    return `@media (min-width: ${breakpoints.values[min]}) and (max-width: ${parseInt(breakpoints.values[max]) - 1}px)`;
  },
  
  // Device-specific queries
  mobile: `@media (max-width: ${parseInt(breakpoints.devices.tablet) - 1}px)`,
  tablet: `@media (min-width: ${breakpoints.devices.tablet}) and (max-width: ${parseInt(breakpoints.devices.laptop) - 1}px)`,
  laptop: `@media (min-width: ${breakpoints.devices.laptop}) and (max-width: ${parseInt(breakpoints.devices.desktop) - 1}px)`,
  desktop: `@media (min-width: ${breakpoints.devices.desktop})`,
  
  // Touch vs hover capabilities
  touch: '@media (hover: none) and (pointer: coarse)',
  hover: '@media (hover: hover) and (pointer: fine)',
  
  // Reduced motion preference
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
  
  // High contrast preference
  highContrast: '@media (prefers-contrast: high)',
  
  // Dark mode preference
  darkMode: '@media (prefers-color-scheme: dark)',
  lightMode: '@media (prefers-color-scheme: light)',
};

/**
 * Responsive utilities
 */
export const responsiveUtils = {
  /**
   * Get breakpoint value
   */
  getBreakpoint: (breakpoint: keyof typeof breakpoints.values) => {
    return breakpoints.values[breakpoint];
  },
  
  /**
   * Check if current screen matches breakpoint (client-side only)
   */
  matchesBreakpoint: (breakpoint: keyof typeof breakpoints.values) => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(min-width: ${breakpoints.values[breakpoint]})`).matches;
  },
  
  /**
   * Create responsive class names for Tailwind
   */
  createResponsiveClasses: (
    base: string,
    responsive: Partial<Record<keyof typeof breakpoints.values, string>>
  ) => {
    let classes = base;
    
    Object.entries(responsive).forEach(([breakpoint, value]) => {
      if (value) {
        classes += ` ${breakpoint}:${value}`;
      }
    });
    
    return classes;
  },
  
  /**
   * Container queries for modern browsers
   */
  container: {
    sm: '@container (min-width: 320px)',
    md: '@container (min-width: 768px)',
    lg: '@container (min-width: 1024px)',
    xl: '@container (min-width: 1280px)',
  },
};

/**
 * Type definitions
 */
export type Breakpoint = keyof typeof breakpoints.values;
export type DeviceBreakpoint = keyof typeof breakpoints.devices;
export type ComponentBreakpoint = keyof typeof breakpoints.components;