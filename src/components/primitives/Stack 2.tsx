/**
 * Stack Component - Vertical Layout Primitive
 * 
 * Provides consistent vertical spacing between child elements.
 * Replaces manual gap classes with systematic spacing tokens.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { spacing } from '@/design-system/tokens';

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Spacing between items using design token scale */
  gap?: keyof typeof spacing | 'none';
  /** Alignment of items */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** Distribution of items */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  /** Whether to wrap items */
  wrap?: boolean;
  /** HTML element to render */
  as?: keyof JSX.IntrinsicElements;
  /** Children elements */
  children: React.ReactNode;
}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ 
    gap = 'md',
    align = 'stretch', 
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
          'flex flex-col',
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

Stack.displayName = 'Stack';

export { Stack, type StackProps };