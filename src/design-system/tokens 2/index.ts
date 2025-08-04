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

// Re-export specific tokens for easier access
export { spacing, spacingUtils, type SpacingToken } from './spacing';
export { typography, typographyUtils, type TypographyVariant } from './typography';  
export { colors, colorUtils, type SemanticColor } from './colors';
export { breakpoints, mediaQueries, responsiveUtils, type Breakpoint } from './breakpoints';
export { shadows, shadowUtils, type ElevationLevel } from './shadows';

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
  utils: {
    spacing: spacingUtils,
    typography: typographyUtils,
    colors: colorUtils,
    responsive: responsiveUtils,
    shadows: shadowUtils,
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
      ...Object.fromEntries(
        Object.entries(shadows.components).map(([component, shadows]) => {
          if (typeof shadows === 'string') {
            return [component, shadows];
          }
          return Object.entries(shadows).map(([variant, shadow]) => [
            `${component}-${variant}`, shadow
          ]);
        }).flat()
      ),
    },
  };
};