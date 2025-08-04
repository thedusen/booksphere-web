/**
 * Shadow Design Tokens
 * 
 * Systematic elevation and shadow system for consistent layering and depth.
 * Extends the existing shadcn/ui shadow system with additional tokens.
 */

export const shadows = {
  // Base shadow values
  none: 'none',
  
  // Elevation system (0-5 levels)
  elevation: {
    0: 'none',
    1: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',                    // Subtle
    2: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', // Small
    3: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // Medium
    4: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // Large
    5: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',              // X-Large
  },
  
  // Component-specific shadows
  components: {
    // Buttons
    button: {
      default: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      hover: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      focus: '0 0 0 3px rgba(59, 130, 246, 0.15)', // Focus ring
      pressed: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.1)',
    },
    
    // Cards and surfaces
    card: {
      default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      hover: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
    
    // Modals and overlays
    modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    popover: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    
    // Navigation
    sidebar: 'none', // Sidebar typically doesn't need shadow
    mobileNav: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    
    // Tables
    tableHeader: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // Sticky header shadow
    tableRow: 'none',
    tableRowHover: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    
    // Form elements
    input: {
      default: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      focus: '0 0 0 3px rgba(59, 130, 246, 0.15), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      error: '0 0 0 3px rgba(239, 68, 68, 0.15), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
  },
  
  // Inner shadows
  inner: {
    sm: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    lg: 'inset 0 4px 6px 0 rgba(0, 0, 0, 0.07)',
  },
  
  // Colored shadows (for brand elements)
  colored: {
    primary: '0 4px 6px -1px rgba(59, 130, 246, 0.3), 0 2px 4px -1px rgba(59, 130, 246, 0.06)',
    success: '0 4px 6px -1px rgba(34, 197, 94, 0.3), 0 2px 4px -1px rgba(34, 197, 94, 0.06)',
    warning: '0 4px 6px -1px rgba(251, 146, 60, 0.3), 0 2px 4px -1px rgba(251, 146, 60, 0.06)',
    error: '0 4px 6px -1px rgba(239, 68, 68, 0.3), 0 2px 4px -1px rgba(239, 68, 68, 0.06)',
  },
} as const;

/**
 * Shadow utilities
 */
export const shadowUtils = {
  /**
   * Get elevation shadow by level
   */
  getElevation: (level: keyof typeof shadows.elevation) => {
    return shadows.elevation[level];
  },
  
  /**
   * Get component shadow
   */
  getComponentShadow: (
    component: keyof typeof shadows.components,
    variant?: string
  ) => {
    const componentShadows = shadows.components[component];
    if (typeof componentShadows === 'string') {
      return componentShadows;
    }
    return variant ? (componentShadows as any)[variant] : componentShadows.default;
  },
  
  /**
   * Create focus ring with custom color
   */
  createFocusRing: (color: string = 'rgba(59, 130, 246, 0.15)', width: string = '3px') => {
    return `0 0 0 ${width} ${color}`;
  },
  
  /**
   * Combine multiple shadows
   */
  combine: (...shadows: string[]) => {
    return shadows.filter(shadow => shadow !== 'none').join(', ');
  },
};

/**
 * Type definitions
 */
export type ElevationLevel = keyof typeof shadows.elevation;
export type ComponentShadow = keyof typeof shadows.components;
export type ColoredShadow = keyof typeof shadows.colored;