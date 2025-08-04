/**
 * Container Component - Responsive Container Primitive
 * 
 * Provides consistent content width constraints and responsive padding.
 * Replaces manual max-width and padding management.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum width variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Responsive padding */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Center the container */
  center?: boolean;
  /** HTML element to render */
  as?: React.ElementType;
  /** Children elements */
  children: React.ReactNode;
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ 
    size = 'lg',
    padding = 'md',
    center = true,
    as: Component = 'div',
    className,
    children,
    ...props 
  }, ref) => {
    const sizeClass = {
      sm: 'max-w-2xl',      // ~672px
      md: 'max-w-4xl',      // ~896px  
      lg: 'max-w-content-max', // 1200px (from design tokens)
      xl: 'max-w-7xl',      // ~1280px
      full: 'max-w-full',
    }[size];
    
    const paddingClass = {
      none: '',
      sm: 'px-sm sm:px-md',           // 8px mobile, 16px desktop
      md: 'px-md sm:px-lg',           // 16px mobile, 24px desktop  
      lg: 'px-lg sm:px-xl',           // 24px mobile, 32px desktop
    }[padding];
    
    const centerClass = center ? 'mx-auto' : '';
    
    return (
      <Component
        ref={ref}
        className={cn(
          sizeClass,
          paddingClass,
          centerClass,
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Container.displayName = 'Container';

export { Container, type ContainerProps };