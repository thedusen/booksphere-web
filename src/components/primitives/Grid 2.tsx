/**
 * Grid Component - Responsive Grid Layout Primitive
 * 
 * Provides systematic CSS Grid layouts with responsive column counts.
 * Ideal for card grids, form layouts, and dashboard widgets.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { spacing } from '@/design-system/tokens';

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns - can be responsive object */
  columns?: number | {
    xs?: number;
    sm?: number; 
    md?: number;
    lg?: number;
    xl?: number;
  };
  /** Gap between grid items */
  gap?: keyof typeof spacing | 'none';
  /** Minimum column width (for auto-fit grids) */
  minColumnWidth?: string;
  /** HTML element to render */
  as?: keyof JSX.IntrinsicElements;
  /** Children elements */
  children: React.ReactNode;
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ 
    columns = 1,
    gap = 'md',
    minColumnWidth,
    as: Component = 'div',
    className,
    children,
    ...props 
  }, ref) => {
    const gapClass = gap === 'none' ? '' : `gap-${gap}`;
    
    // Handle responsive columns
    let columnsClass = '';
    if (typeof columns === 'number') {
      columnsClass = `grid-cols-${columns}`;
    } else {
      // Build responsive column classes
      const responsiveClasses = [];
      if (columns.xs) responsiveClasses.push(`grid-cols-${columns.xs}`);
      if (columns.sm) responsiveClasses.push(`sm:grid-cols-${columns.sm}`);
      if (columns.md) responsiveClasses.push(`md:grid-cols-${columns.md}`);
      if (columns.lg) responsiveClasses.push(`lg:grid-cols-${columns.lg}`);
      if (columns.xl) responsiveClasses.push(`xl:grid-cols-${columns.xl}`);
      columnsClass = responsiveClasses.join(' ');
    }
    
    // Handle auto-fit grid with minimum column width
    const autoFitClass = minColumnWidth 
      ? `grid-cols-[repeat(auto-fit,minmax(${minColumnWidth},1fr))]`
      : '';
    
    return (
      <Component
        ref={ref}
        className={cn(
          'grid',
          minColumnWidth ? autoFitClass : columnsClass,
          gapClass,
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Grid.displayName = 'Grid';

export { Grid, type GridProps };