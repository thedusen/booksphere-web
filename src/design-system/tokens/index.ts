/**
 * Design System Tokens - Centralized Export
 * 
 * This file provides a single point of access to all design tokens.
 * Import from here to maintain consistency across the application.
 */

// Core token exports
export * from './spacing';
export * from './typography';
export * from './colors';
export * from './breakpoints';
export * from './shadows';
export * from './gradients';

// Import tokens for re-export
import { spacing, spacingUtils, type SpacingToken } from './spacing';
import { typography, typographyUtils, type TypographyVariant } from './typography';  
import { colors, colorUtils, type SemanticColor } from './colors';
import { breakpoints, mediaQueries, responsiveUtils, type Breakpoint } from './breakpoints';
import { shadows, shadowUtils, type ElevationLevel } from './shadows';
import { gradients, gradientUtils } from './gradients';

// Re-export specific tokens for easier access
export { spacing, spacingUtils, type SpacingToken };
export { typography, typographyUtils, type TypographyVariant };  
export { colors, colorUtils, type SemanticColor };
export { breakpoints, mediaQueries, responsiveUtils, type Breakpoint };
export { shadows, shadowUtils, type ElevationLevel };
export { gradients, gradientUtils };

/**
 * Complete design system configuration
 * Use this for programmatic access to all tokens
 */
export const designSystem = {
  spacing,
  typography,
  colors,
  breakpoints,
  shadows,
  gradients,
  utils: {
    spacing: spacingUtils,
    typography: typographyUtils,
    colors: colorUtils,
    responsive: responsiveUtils,
    shadows: shadowUtils,
    gradients: gradientUtils,
  }
} as const;

/**
 * CSS custom properties generation
 * Useful for runtime theming and CSS-in-JS libraries
 */
export const generateCSSCustomProperties = () => {
  const properties: Record<string, string> = {};
  
  // Add color custom properties
  Object.assign(properties, colorUtils.createCSSCustomProperties());
  
  // Add spacing custom properties
  Object.entries(spacing).forEach(([key, value]) => {
    if (typeof value === 'string') {
      properties[`--spacing-${key}`] = value;
    }
  });
  
  // Add typography custom properties
  Object.entries(typography.fontSize).forEach(([key, config]) => {
    properties[`--font-size-${key}`] = config.size;
    properties[`--line-height-${key}`] = config.lineHeight;
  });
  
  // Add shadow custom properties
  Object.entries(shadows.elevation).forEach(([key, value]) => {
    properties[`--shadow-${key}`] = value;
  });
  
  return properties;
};

/**
 * Tailwind CSS configuration helper
 * Use this to extend your tailwind.config.js with design tokens
 */
export const getTailwindConfig = () => {
  return {
    spacing: {
      ...Object.fromEntries(
        Object.entries(spacing).map(([key, value]) => [
          key, 
          typeof value === 'string' ? value : value
        ])
      ),
    },
    fontSize: Object.fromEntries(
      Object.entries(typography.fontSize).map(([key, config]) => [
        key,
        [config.size, { lineHeight: config.lineHeight }]
      ])
    ),
    fontWeight: typography.fontWeight,
    screens: breakpoints.values,
    boxShadow: {
      ...Object.fromEntries(
        Object.entries(shadows.elevation).map(([key, value]) => [key, value])
      ),
      // Component shadows - simplified
      'button-focus': shadows.components.button,
      'input-focus': shadows.components.input,
      'dropdown': shadows.components.dropdown,
    },
  };
};