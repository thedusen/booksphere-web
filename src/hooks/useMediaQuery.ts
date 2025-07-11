/**
 * useMediaQuery Hook
 * 
 * A React hook that tracks media query matches for responsive design.
 * Provides SSR-safe media query matching with proper hydration handling.
 * 
 * Features:
 * - SSR-safe (returns false on server, correct value after hydration)
 * - Automatic cleanup of event listeners
 * - TypeScript support
 * - Optimized for performance with proper dependency management
 * 
 * Usage:
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 * ```
 */

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  // Initialize with false to avoid hydration mismatches
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Define the event listener
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add event listener
    // Use the modern addEventListener method, with fallback for older browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    // Cleanup function
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

// Common media query breakpoints for convenience
export const BREAKPOINTS = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
  
  // Max-width queries
  'max-sm': '(max-width: 639px)',
  'max-md': '(max-width: 767px)',
  'max-lg': '(max-width: 1023px)',
  'max-xl': '(max-width: 1279px)',
  'max-2xl': '(max-width: 1535px)',
  
  // Common device queries
  mobile: '(max-width: 768px)',
  tablet: '(min-width: 769px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  
  // Orientation queries
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  
  // Accessibility queries
  'prefers-reduced-motion': '(prefers-reduced-motion: reduce)',
  'prefers-dark': '(prefers-color-scheme: dark)',
  'prefers-light': '(prefers-color-scheme: light)',
} as const;

// Type for breakpoint keys
export type BreakpointKey = keyof typeof BREAKPOINTS;

// Convenience hook for common breakpoints
export function useBreakpoint(breakpoint: BreakpointKey): boolean {
  return useMediaQuery(BREAKPOINTS[breakpoint]);
}

// Hook for multiple breakpoints
export function useBreakpoints(breakpoints: BreakpointKey[]): Record<BreakpointKey, boolean> {
  const results: Record<string, boolean> = {};
  
  breakpoints.forEach(breakpoint => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[breakpoint] = useMediaQuery(BREAKPOINTS[breakpoint]);
  });
  
  return results as Record<BreakpointKey, boolean>;
}

export default useMediaQuery; 