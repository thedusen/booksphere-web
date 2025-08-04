/**
 * Inline Component - Horizontal Layout Primitive
 * 
 * Provides consistent horizontal spacing between child elements.
 * Ideal for button groups, breadcrumbs, and inline content.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { spacing } from '@/design-system/tokens';

interface InlineProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Spacing between items using design token scale */
  gap?: keyof typeof spacing | 'none';
  /** Vertical alignment of items */
  align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch';
  /** Horizontal distribution of items */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  /** Whether to wrap items */
  wrap?: boolean;
  /** HTML element to render */
  as?: React.ElementType;
  /** Children elements */
  children: React.ReactNode;
}

const Inline = React.forwardRef<HTMLDivElement, InlineProps>(
  ({ 
    gap = 'md',
    align = 'center', 
    justify = 'start',
    wrap = false,
    as: Component = 'div',
    className,
    children,
    ...props 
  }, ref) => {
    const gapClass = gap === 'none' ? '' : `gap-${gap}`;
    
    const alignClass = {
      start: 'items-start',
      center: 'items-center', 
      end: 'items-end',
      baseline: 'items-baseline',
      stretch: 'items-stretch',
    }[align];
    
    const justifyClass = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end', 
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    }[justify];
    
    const wrapClass = wrap ? 'flex-wrap' : '';
    
    return (
      <Component
        ref={ref}
        className={cn(
          'flex flex-row',
          gapClass,
          alignClass,
          justifyClass, 
          wrapClass,
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Inline.displayName = 'Inline';

export { Inline, type InlineProps };