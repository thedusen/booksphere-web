/**
 * ResponsiveText Component - Typography Primitive
 * 
 * Provides consistent typography with responsive sizing.
 * Uses design token typography variants for systematic text hierarchy.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveTextProps extends React.HTMLAttributes<HTMLElement> {
  /** Typography variant from design tokens */
  variant?: 
    | 'page-title'
    | 'section-heading' 
    | 'subsection-heading'
    | 'body'
    | 'caption'
    | 'label'
    | 'code';
  /** Text weight */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  /** Text color variant */
  color?: 'default' | 'muted' | 'accent' | 'destructive' | 'success';
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** HTML element to render */
  as?: keyof JSX.IntrinsicElements;
  /** Children content */
  children: React.ReactNode;
}

const ResponsiveText = React.forwardRef<HTMLElement, ResponsiveTextProps>(
  ({ 
    variant = 'body',
    weight = 'normal',
    color = 'default',
    align = 'left',
    as,
    className,
    children,
    ...props 
  }, ref) => {
    // Determine the appropriate HTML element based on variant
    const defaultElement = (() => {
      switch (variant) {
        case 'page-title':
          return 'h1';
        case 'section-heading':
          return 'h2';
        case 'subsection-heading':
          return 'h3';
        case 'label':
          return 'label';
        case 'code':
          return 'code';
        default:
          return 'p';
      }
    })();
    
    const Component = as || defaultElement;
    
    // Typography variant classes
    const variantClass = {
      'page-title': 'text-2xl md:text-3xl font-bold tracking-tight',
      'section-heading': 'text-xl md:text-2xl font-semibold tracking-tight',
      'subsection-heading': 'text-lg md:text-xl font-semibold',
      'body': 'text-base',
      'caption': 'text-sm',
      'label': 'text-sm font-medium',
      'code': 'text-sm font-mono bg-muted px-1 py-0.5 rounded',
    }[variant];
    
    // Weight classes (override variant defaults)
    const weightClass = {
      normal: 'font-normal',
      medium: 'font-medium', 
      semibold: 'font-semibold',
      bold: 'font-bold',
    }[weight];
    
    // Color classes
    const colorClass = {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      accent: 'text-accent-foreground',
      destructive: 'text-destructive',
      success: 'text-green-600 dark:text-green-400',
    }[color];
    
    // Alignment classes
    const alignClass = {
      left: 'text-left',
      center: 'text-center', 
      right: 'text-right',
    }[align];
    
    return (
      <Component
        ref={ref as any}
        className={cn(
          variantClass,
          // Only override weight if explicitly specified and different from variant default
          weight !== 'normal' && weightClass,
          colorClass,
          alignClass,
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

ResponsiveText.displayName = 'ResponsiveText';

export { ResponsiveText, type ResponsiveTextProps };