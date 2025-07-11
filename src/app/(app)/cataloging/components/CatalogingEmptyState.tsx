/**
 * Cataloging Empty State Component
 * 
 * Displays helpful empty states for the cataloging dashboard:
 * 1. Initial state when no jobs exist yet
 * 2. No results state when filters return no matches
 * 
 * Features:
 * - Clear visual hierarchy with icons and messaging
 * - Actionable buttons to guide user next steps
 * - Accessibility compliant with proper heading structure
 * - Responsive design for mobile and desktop
 */

'use client';

import React from 'react';
import { FileX, Search, BookOpen, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface CatalogingEmptyStateProps {
  type: 'initial' | 'no-results';
  onLearnMore?: () => void;
  onClearFilters?: () => void;
}

export function CatalogingEmptyState({
  type,
  onLearnMore,
  onClearFilters,
}: CatalogingEmptyStateProps) {
  if (type === 'initial') {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="relative mb-6">
            <BookOpen className="h-16 w-16 text-muted-foreground/50" />
            <Smartphone className="absolute -bottom-2 -right-2 h-8 w-8 text-primary" />
          </div>
          
          <h2 className="text-xl font-semibold mb-3">
            Your cataloging queue is empty
          </h2>
          
          <p className="text-muted-foreground mb-6 max-w-md">
            Jobs created from the Booksphere mobile app will appear here, 
            ready for your review and finalization.
          </p>
          
          <div className="space-y-3">
            <Button onClick={onLearnMore} variant="default">
              Learn How to Catalog on Mobile
            </Button>
            <p className="text-sm text-muted-foreground">
              Start by scanning book ISBNs or capturing images with the mobile app
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <Search className="h-16 w-16 text-muted-foreground/50 mb-6" />
        
        <h2 className="text-xl font-semibold mb-3">
          No jobs found
        </h2>
        
        <p className="text-muted-foreground mb-6 max-w-md">
          Your search and filter combination returned no results. 
          Try adjusting your criteria or clearing filters.
        </p>
        
        <Button onClick={onClearFilters} variant="outline">
          Clear All Filters
        </Button>
      </CardContent>
    </Card>
  );
} 