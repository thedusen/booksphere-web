/**
 * Enhanced Color Design Tokens
 * 
 * Extends the existing OKLCH color system with semantic tokens and component-specific colors.
 * Maintains compatibility with existing shadcn/ui color system while adding systematic tokens.
 */

export const colors = {
  // Semantic color tokens (building on existing CSS custom properties)
  semantic: {
    // Primary colors
    primary: {
      50: 'oklch(0.97 0.01 240)',
      100: 'oklch(0.92 0.05 240)', 
      200: 'oklch(0.84 0.1 240)',
      300: 'oklch(0.74 0.15 240)',
      400: 'oklch(0.64 0.2 240)',
      500: 'oklch(0.54 0.25 240)', // Primary brand color
      600: 'oklch(0.44 0.2 240)',
      700: 'oklch(0.34 0.15 240)',
      800: 'oklch(0.24 0.1 240)',
      900: 'oklch(0.15 0.05 240)',
    },
    
    // Neutral grays
    neutral: {
      50: 'oklch(0.98 0.005 240)',
      100: 'oklch(0.95 0.01 240)',
      200: 'oklch(0.89 0.015 240)',
      300: 'oklch(0.83 0.02 240)',
      400: 'oklch(0.65 0.02 240)',
      500: 'oklch(0.55 0.015 240)',
      600: 'oklch(0.45 0.015 240)',
      700: 'oklch(0.35 0.015 240)',
      800: 'oklch(0.25 0.015 240)',
      900: 'oklch(0.15 0.015 240)',
    },
    
    // Status colors
    success: {
      50: 'oklch(0.96 0.04 145)',
      100: 'oklch(0.91 0.08 145)',
      200: 'oklch(0.82 0.16 145)',
      300: 'oklch(0.73 0.24 145)',
      400: 'oklch(0.64 0.32 145)',
      500: 'oklch(0.55 0.4 145)',  // Success green
      600: 'oklch(0.46 0.32 145)',
      700: 'oklch(0.37 0.24 145)',
      800: 'oklch(0.28 0.16 145)',
      900: 'oklch(0.19 0.08 145)',
    },
    
    warning: {
      50: 'oklch(0.97 0.04 85)',
      100: 'oklch(0.93 0.08 85)',
      200: 'oklch(0.86 0.16 85)',
      300: 'oklch(0.79 0.24 85)',
      400: 'oklch(0.72 0.32 85)',
      500: 'oklch(0.65 0.4 85)',   // Warning orange
      600: 'oklch(0.58 0.32 85)',
      700: 'oklch(0.51 0.24 85)',
      800: 'oklch(0.44 0.16 85)',
      900: 'oklch(0.37 0.08 85)',
    },
    
    error: {
      50: 'oklch(0.97 0.04 15)',
      100: 'oklch(0.92 0.08 15)',
      200: 'oklch(0.84 0.16 15)',
      300: 'oklch(0.76 0.24 15)',
      400: 'oklch(0.68 0.32 15)',
      500: 'oklch(0.6 0.4 15)',    // Error red
      600: 'oklch(0.52 0.32 15)',
      700: 'oklch(0.44 0.24 15)',
      800: 'oklch(0.36 0.16 15)',
      900: 'oklch(0.28 0.08 15)',
    },
  },
  
  // Component-specific colors
  components: {
    // Navigation
    sidebar: {
      background: 'var(--background)',
      backgroundDark: 'oklch(0.15 0.015 240)', // Replaces hardcoded bg-gray-900
      text: 'var(--foreground)',
      textMuted: 'var(--muted-foreground)',
      accent: 'var(--accent)',
      accentForeground: 'var(--accent-foreground)',
      border: 'var(--border)',
    },
    
    // Tables
    table: {
      header: 'var(--muted)',
      headerText: 'var(--muted-foreground)',
      row: 'var(--background)',
      rowHover: 'var(--muted)',
      border: 'var(--border)',
      selectedRow: 'var(--accent)',
    },
    
    // Buttons
    button: {
      primary: 'var(--primary)',
      primaryForeground: 'var(--primary-foreground)',
      secondary: 'var(--secondary)',
      secondaryForeground: 'var(--secondary-foreground)',
      ghost: 'transparent',
      ghostHover: 'var(--accent)',
      outline: 'var(--background)',
      outlineBorder: 'var(--border)',
    },
    
    // Cards and surfaces
    surface: {
      card: 'var(--card)',
      cardForeground: 'var(--card-foreground)',
      popover: 'var(--popover)',
      popoverForeground: 'var(--popover-foreground)',
    },
    
    // Interactive states
    interactive: {
      hover: 'var(--accent)',
      focus: 'var(--ring)',
      disabled: 'var(--muted)',
      disabledText: 'var(--muted-foreground)',
    },
  },
  
  // Context menu and dropdown backgrounds (fixes missing backgrounds issue)
  overlay: {
    backdrop: 'rgba(0, 0, 0, 0.8)',
    popover: 'var(--popover)',
    dropdown: 'var(--popover)',
    modal: 'var(--background)',
  },
} as const;

/**
 * Color utilities for programmatic access
 */
export const colorUtils = {
  /**
   * Get semantic color by name and shade
   */
  getSemanticColor: (
    color: keyof typeof colors.semantic,
    shade: keyof typeof colors.semantic.primary
  ) => {
    return colors.semantic[color][shade];
  },
  
  /**
   * Get component color by component and property
   */
  getComponentColor: (
    component: keyof typeof colors.components,
    property: string
  ) => {
    const componentColors = colors.components[component] as Record<string, string>;
    return componentColors[property];
  },
  
  /**
   * Create CSS custom properties from color tokens
   */
  createCSSCustomProperties: () => {
    const properties: Record<string, string> = {};
    
    // Add semantic colors
    Object.entries(colors.semantic).forEach(([colorName, shades]) => {
      Object.entries(shades).forEach(([shade, value]) => {
        properties[`--color-${colorName}-${shade}`] = value;
      });
    });
    
    // Add component colors
    Object.entries(colors.components).forEach(([componentName, colorMap]) => {
      Object.entries(colorMap).forEach(([property, value]) => {
        properties[`--color-${componentName}-${property}`] = value;
      });
    });
    
    return properties;
  },
};

/**
 * Type definitions
 */
export type SemanticColor = keyof typeof colors.semantic;
export type ColorShade = keyof typeof colors.semantic.primary;
export type ComponentColor = keyof typeof colors.components;