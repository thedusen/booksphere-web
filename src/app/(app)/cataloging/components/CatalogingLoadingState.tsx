/**
 * Cataloging Loading State Component
 * 
 * Displays skeleton loading UI while cataloging jobs are being fetched.
 * Provides separate layouts for desktop (table) and mobile (card) views.
 * 
 * Features:
 * - Responsive skeleton layouts
 * - Proper accessibility with loading announcements
 * - Consistent with shadcn/ui skeleton component
 * - Reduces layout shift during loading
 */

'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface CatalogingLoadingStateProps {
  isMobile?: boolean;
}

export function CatalogingLoadingState({ isMobile = false }: CatalogingLoadingStateProps) {
  if (isMobile) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading cataloging jobs">
        {/* Mobile Card Skeletons */}
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16" /> {/* Status badge */}
                  <Skeleton className="h-4 w-20" /> {/* Time */}
                </div>
                <Skeleton className="h-8 w-8 rounded" /> {/* Menu button */}
              </div>
              
              <div className="flex gap-3 mb-3">
                <Skeleton className="h-16 w-12 rounded" /> {/* Book cover */}
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" /> {/* Title */}
                  <Skeleton className="h-3 w-3/4" /> {/* Author */}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-20" /> {/* Action button */}
                <Skeleton className="h-4 w-4 rounded" /> {/* Checkbox */}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Screen reader announcement */}
        <div className="sr-only">Loading cataloging jobs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4" role="status" aria-label="Loading cataloging jobs">
      {/* Desktop Table Header Skeleton */}
      <div className="border border-neutral-200/60 rounded-xl bg-gradient-to-br from-background/98 to-lavender-50/30 shadow-elevation-2">
        <div className="border-b p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-4" /> {/* Select all checkbox */}
            <Skeleton className="h-4 w-32" /> {/* Job header */}
            <Skeleton className="h-4 w-20" /> {/* Status header */}
            <Skeleton className="h-4 w-24" /> {/* Source header */}
            <Skeleton className="h-4 w-24" /> {/* Created header */}
            <Skeleton className="h-4 w-20" /> {/* Actions header */}
          </div>
        </div>
        
        {/* Desktop Table Row Skeletons */}
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="border-b last:border-b-0 p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-4" /> {/* Row checkbox */}
              
              {/* Job column */}
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-12 w-8 rounded" /> {/* Book cover */}
                <div className="space-y-1">
                  <Skeleton className="h-4 w-48" /> {/* Title */}
                  <Skeleton className="h-3 w-32" /> {/* Author */}
                </div>
              </div>
              
              {/* Status column */}
              <Skeleton className="h-6 w-20 rounded-full" /> {/* Status badge */}
              
              {/* Source column */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" /> {/* Source icon */}
                <Skeleton className="h-4 w-20" /> {/* Source text */}
              </div>
              
              {/* Created column */}
              <Skeleton className="h-4 w-24" /> {/* Time */}
              
              {/* Actions column */}
              <Skeleton className="h-8 w-8 rounded" /> {/* Menu button */}
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" /> {/* Results info */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" /> {/* Previous button */}
          <Skeleton className="h-8 w-8" /> {/* Page number */}
          <Skeleton className="h-8 w-8" /> {/* Next button */}
        </div>
      </div>
      
      {/* Screen reader announcement */}
      <div className="sr-only">Loading cataloging jobs...</div>
    </div>
  );
} 