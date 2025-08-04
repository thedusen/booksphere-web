/**
 * Enhanced Color Design Tokens
 * 
 * Extends the existing OKLCH color system with semantic tokens and component-specific colors.
 * Maintains compatibility with existing shadcn/ui color system while adding systematic tokens.
 */

export const colors = {
  // Semantic color tokens (building on existing CSS custom properties)
  semantic: {
    // Primary colors - Playful Purple
    primary: {
      50: 'oklch(0.98 0.02 280)',
      100: 'oklch(0.94 0.06 280)', 
      200: 'oklch(0.86 0.12 280)',
      300: 'oklch(0.76 0.18 280)',
      400: 'oklch(0.66 0.24 280)',
      500: 'oklch(0.58 0.25 280)', // Primary brand color - Rich Purple
      600: 'oklch(0.48 0.22 280)',
      700: 'oklch(0.38 0.18 280)',
      800: 'oklch(0.28 0.12 280)',
      900: 'oklch(0.18 0.06 280)',
    },
    
    // Secondary colors - Fresh Aqua
    secondary: {
      50: 'oklch(0.98 0.02 200)',
      100: 'oklch(0.93 0.05 200)',
      200: 'oklch(0.85 0.10 200)',
      300: 'oklch(0.75 0.15 200)',
      400: 'oklch(0.70 0.17 200)',
      500: 'oklch(0.65 0.18 200)', // Secondary brand color - Aqua
      600: 'oklch(0.55 0.16 200)',
      700: 'oklch(0.45 0.14 200)',
      800: 'oklch(0.35 0.10 200)',
      900: 'oklch(0.25 0.05 200)',
    },
    
    // Accent colors - Deep Violet
    accent: {
      50: 'oklch(0.97 0.03 295)',
      100: 'oklch(0.91 0.08 295)',
      200: 'oklch(0.81 0.15 295)',
      300: 'oklch(0.71 0.22 295)',
      400: 'oklch(0.61 0.28 295)',
      500: 'oklch(0.52 0.30 295)', // Accent color - Deep Violet
      600: 'oklch(0.42 0.26 295)',
      700: 'oklch(0.32 0.20 295)',
      800: 'oklch(0.22 0.14 295)',
      900: 'oklch(0.15 0.08 295)',
    },
    
    // Neutral grays with cool purple undertones
    neutral: {
      50: 'oklch(0.98 0.005 270)',
      100: 'oklch(0.95 0.008 270)',
      200: 'oklch(0.89 0.012 270)',
      300: 'oklch(0.83 0.015 270)',
      400: 'oklch(0.65 0.015 270)',
      500: 'oklch(0.55 0.012 270)',
      600: 'oklch(0.45 0.012 270)',
      700: 'oklch(0.35 0.015 270)',
      800: 'oklch(0.25 0.015 270)',
      900: 'oklch(0.14 0.015 270)',
      950: 'oklch(0.10 0.020 280)', // Deep purple-black
    },
    
    // Playful accent colors
    coral: {
      50: 'oklch(0.97 0.03 25)',
      100: 'oklch(0.92 0.06 25)',
      200: 'oklch(0.84 0.12 25)',
      300: 'oklch(0.76 0.16 25)',
      400: 'oklch(0.72 0.18 25)',
      500: 'oklch(0.68 0.20 25)', // Coral accent
      600: 'oklch(0.58 0.18 25)',
      700: 'oklch(0.48 0.14 25)',
      800: 'oklch(0.38 0.10 25)',
      900: 'oklch(0.28 0.06 25)',
    },
    
    mint: {
      50: 'oklch(0.98 0.02 165)',
      100: 'oklch(0.94 0.05 165)',
      200: 'oklch(0.88 0.10 165)',
      300: 'oklch(0.82 0.13 165)',
      400: 'oklch(0.78 0.14 165)',
      500: 'oklch(0.75 0.15 165)', // Fresh mint
      600: 'oklch(0.65 0.13 165)',
      700: 'oklch(0.55 0.11 165)',
      800: 'oklch(0.45 0.08 165)',
      900: 'oklch(0.35 0.05 165)',
    },
    
    lavender: {
      50: 'oklch(0.97 0.02 290)',
      100: 'oklch(0.93 0.04 290)',
      200: 'oklch(0.89 0.06 290)',
      300: 'oklch(0.87 0.08 290)',
      400: 'oklch(0.86 0.09 290)',
      500: 'oklch(0.85 0.10 290)', // Soft lavender
      600: 'oklch(0.75 0.09 290)',
      700: 'oklch(0.65 0.08 290)',
      800: 'oklch(0.55 0.06 290)',
      900: 'oklch(0.45 0.04 290)',
    },
    
    // Status colors with quirky twist
    success: {
      50: 'oklch(0.98 0.02 165)',
      100: 'oklch(0.94 0.05 165)',
      200: 'oklch(0.88 0.10 165)',
      300: 'oklch(0.82 0.13 165)',
      400: 'oklch(0.78 0.14 165)',
      500: 'oklch(0.75 0.15 165)',  // Success - Mint
      600: 'oklch(0.65 0.13 165)',
      700: 'oklch(0.55 0.11 165)',
      800: 'oklch(0.45 0.08 165)',
      900: 'oklch(0.35 0.05 165)',
    },
    
    warning: {
      50: 'oklch(0.97 0.03 25)',
      100: 'oklch(0.92 0.06 25)',
      200: 'oklch(0.84 0.12 25)',
      300: 'oklch(0.76 0.16 25)',
      400: 'oklch(0.72 0.18 25)',
      500: 'oklch(0.68 0.20 25)',   // Warning - Coral
      600: 'oklch(0.58 0.18 25)',
      700: 'oklch(0.48 0.14 25)',
      800: 'oklch(0.38 0.10 25)',
      900: 'oklch(0.28 0.06 25)',
    },
    
    error: {
      50: 'oklch(0.97 0.04 350)',
      100: 'oklch(0.92 0.08 350)',
      200: 'oklch(0.84 0.16 350)',
      300: 'oklch(0.76 0.24 350)',
      400: 'oklch(0.68 0.28 350)',
      500: 'oklch(0.60 0.30 350)',    // Error - Rose-violet
      600: 'oklch(0.52 0.26 350)',
      700: 'oklch(0.44 0.20 350)',
      800: 'oklch(0.36 0.14 350)',
      900: 'oklch(0.28 0.08 350)',
    },
    
    info: {
      50: 'oklch(0.98 0.02 200)',
      100: 'oklch(0.93 0.05 200)',
      200: 'oklch(0.85 0.10 200)',
      300: 'oklch(0.75 0.15 200)',
      400: 'oklch(0.70 0.17 200)',
      500: 'oklch(0.65 0.18 200)', // Info - Aqua
      600: 'oklch(0.55 0.16 200)',
      700: 'oklch(0.45 0.14 200)',
      800: 'oklch(0.35 0.10 200)',
      900: 'oklch(0.25 0.05 200)',
    },
  },
  
  // Component-specific colors
  components: {
    // Navigation
    sidebar: {
      background: 'var(--background)',
      backgroundDark: 'oklch(0.10 0.020 280)', // Deep purple-black
      backgroundGradient: 'linear-gradient(180deg, oklch(0.12 0.025 280), oklch(0.10 0.020 280))',
      text: 'var(--foreground)',
      textMuted: 'var(--muted-foreground)',
      accent: 'var(--accent)',
      accentForeground: 'var(--accent-foreground)',
      border: 'var(--border)',
      hoverGlow: 'oklch(0.65 0.18 200 / 0.1)', // Aqua glow
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