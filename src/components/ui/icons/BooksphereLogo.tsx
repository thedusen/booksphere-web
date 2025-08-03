/**
 * Booksphere Logo Component
 * 
 * Professional SVG logo to replace the emoji placeholder.
 * Scalable and accessible with proper ARIA attributes.
 */

import React from 'react';

interface BooksphereLogoProps {
  className?: string;
  size?: number | string;
  variant?: 'full' | 'icon';
}

export const BooksphereLogo: React.FC<BooksphereLogoProps> = ({
  className = '',
  size = 32,
  variant = 'icon'
}) => {
  const sizeValue = typeof size === 'number' ? `${size}px` : size;
  
  if (variant === 'icon') {
    return (
      <svg
        width={sizeValue}
        height={sizeValue}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label="Booksphere"
      >
        {/* Book icon with sphere/globe element */}
        <rect 
          x="6" 
          y="4" 
          width="20" 
          height="24" 
          rx="2" 
          fill="currentColor" 
          opacity="0.1"
        />
        <rect 
          x="6" 
          y="4" 
          width="20" 
          height="24" 
          rx="2" 
          stroke="currentColor" 
          strokeWidth="2"
        />
        
        {/* Book spine */}
        <line 
          x1="10" 
          y1="4" 
          x2="10" 
          y2="28" 
          stroke="currentColor" 
          strokeWidth="2"
        />
        
        {/* Globe/sphere element overlay */}
        <circle 
          cx="20" 
          cy="16" 
          r="6" 
          fill="currentColor" 
          opacity="0.9"
        />
        <circle 
          cx="20" 
          cy="16" 
          r="6" 
          fill="none" 
          stroke="white" 
          strokeWidth="1"
          opacity="0.3"
        />
        
        {/* Globe meridian lines */}
        <path 
          d="M20 10 C18 13, 18 19, 20 22" 
          stroke="white" 
          strokeWidth="1" 
          fill="none"
          opacity="0.5"
        />
        <path 
          d="M20 10 C22 13, 22 19, 20 22" 
          stroke="white" 
          strokeWidth="1" 
          fill="none"
          opacity="0.5"
        />
        <line 
          x1="14" 
          y1="16" 
          x2="26" 
          y2="16" 
          stroke="white" 
          strokeWidth="1"
          opacity="0.5"
        />
      </svg>
    );
  }
  
  // Full logo with text (for larger displays)
  return (
    <svg
      width="120"
      height={sizeValue}
      viewBox="0 0 120 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Booksphere"
    >
      {/* Icon part */}
      <rect 
        x="2" 
        y="4" 
        width="20" 
        height="24" 
        rx="2" 
        fill="currentColor" 
        opacity="0.1"
      />
      <rect 
        x="2" 
        y="4" 
        width="20" 
        height="24" 
        rx="2" 
        stroke="currentColor" 
        strokeWidth="2"
      />
      <line 
        x1="6" 
        y1="4" 
        x2="6" 
        y2="28" 
        stroke="currentColor" 
        strokeWidth="2"
      />
      <circle 
        cx="16" 
        cy="16" 
        r="6" 
        fill="currentColor" 
        opacity="0.9"
      />
      <circle 
        cx="16" 
        cy="16" 
        r="6" 
        fill="none" 
        stroke="white" 
        strokeWidth="1"
        opacity="0.3"
      />
      
      {/* Text part */}
      <text 
        x="28" 
        y="20" 
        fill="currentColor" 
        fontSize="16" 
        fontWeight="bold" 
        fontFamily="Inter, system-ui, sans-serif"
      >
        Booksphere
      </text>
    </svg>
  );
};

/**
 * Simple Book Icon Component
 * For use in smaller contexts or when you just need a book icon
 */
export const BookIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 20
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Book"
    >
      <rect 
        x="3" 
        y="4" 
        width="18" 
        height="16" 
        rx="2" 
        stroke="currentColor" 
        strokeWidth="2"
        fill="none"
      />
      <line 
        x1="7" 
        y1="4" 
        x2="7" 
        y2="20" 
        stroke="currentColor" 
        strokeWidth="2"
      />
      <line 
        x1="10" 
        y1="8" 
        x2="17" 
        y2="8" 
        stroke="currentColor" 
        strokeWidth="1"
        opacity="0.5"
      />
      <line 
        x1="10" 
        y1="12" 
        x2="15" 
        y2="12" 
        stroke="currentColor" 
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  );
};