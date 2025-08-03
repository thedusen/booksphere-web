/**
 * Systematic Spacing Design Tokens
 * 
 * Based on 4px grid system with t-shirt sizing for intuitive usage.
 * These tokens create consistent spacing throughout the application.
 */

export const spacing = {
  // Base spacing units (4px grid system)
  px: '1px',
  0: '0px',
  
  // T-shirt sizing with 4px base increment
  xs: '4px',    // 4px
  sm: '8px',    // 8px
  md: '16px',   // 16px  
  lg: '24px',   // 24px
  xl: '32px',   // 32px
  '2xl': '48px', // 48px
  '3xl': '64px', // 64px
  '4xl': '96px', // 96px
  '5xl': '128px', // 128px
  
  // Component-specific spacing
  component: {
    // Touch targets and interactive elements
    touchTarget: '44px',        // Minimum touch target size
    buttonPadding: '12px 16px', // Standard button padding
    inputPadding: '8px 12px',   // Standard input padding
    
    // Layout spacing
    sectionGap: '32px',         // Gap between major sections
    cardPadding: '24px',        // Standard card interior padding
    modalPadding: '32px',       // Modal content padding
    
    // Navigation spacing
    sidebarWidth: '240px',      // Desktop sidebar width
    navItemHeight: '44px',      // Navigation item height
    navGap: '8px',             // Gap between nav items
    
    // Content spacing
    contentMaxWidth: '1200px',  // Maximum content width
    contentPadding: '24px',     // Content area padding
    headerHeight: '64px',       // Header height
  }
} as const;

/**
 * Spacing utilities for programmatic access
 */
export const spacingUtils = {
  /**
   * Get spacing value by key
   */
  getSpacing: (key: keyof typeof spacing) => {
    return spacing[key];
  },
  
  /**
   * Create responsive spacing classes
   */
  responsive: {
    xs: (value: keyof typeof spacing) => `xs:${spacing[value]}`,
    sm: (value: keyof typeof spacing) => `sm:${spacing[value]}`,
    md: (value: keyof typeof spacing) => `md:${spacing[value]}`,
    lg: (value: keyof typeof spacing) => `lg:${spacing[value]}`,
    xl: (value: keyof typeof spacing) => `xl:${spacing[value]}`,
  }
};

/**
 * Type definitions for spacing tokens
 */
export type SpacingToken = keyof typeof spacing;
export type ComponentSpacingToken = keyof typeof spacing.component;