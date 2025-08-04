/**
 * Cataloging Dashboard Header Component
 * 
 * Header implementation for the cataloging dashboard with proper status counts.
 * Provides filtering and bulk action capabilities with real data integration.
 */

'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/useDebounce';
import { CatalogingJobStatus, TypedCatalogingJob } from '@/lib/types/jobs';
import { CatalogingJobFilters, CatalogingJobSourceType } from '@/lib/validators/cataloging';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';

interface CatalogingDashboardHeaderProps {
  filters: CatalogingJobFilters;
  selectedJobIds: string[];
  totalJobs: number;
  statusCounts?: Record<CatalogingJobStatus, number>;
  jobs: TypedCatalogingJob[]; // Add jobs to determine retry eligibility
  onStatusFilterChange: (status: CatalogingJobStatus | undefined) => void;
  onSearchChange: (search: string) => void;
  onSourceFilterChange: (sourceType: CatalogingJobSourceType) => void;
  onDateRangeChange: (dateRange: { from: Date; to: Date } | undefined) => void;
  onClearFilters: () => void;
  onDeselectAll: () => void;
  onBulkDelete: () => void;
  onBulkRetry: () => void;
  hasActiveFilters: boolean;
  isDeleting?: boolean; // Add loading states
  isRetrying?: boolean;
}

// Status tab configuration
const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Ready' },
  { value: 'failed', label: 'Failed' },
] as const;

export function CatalogingDashboardHeader({
  filters,
  selectedJobIds,
  totalJobs,
  statusCounts,
  jobs: _jobs,
  onStatusFilterChange,
  onSearchChange,
  onSourceFilterChange,
  onDateRangeChange,
  onClearFilters,
  onDeselectAll,
  onBulkDelete,
  onBulkRetry,
  hasActiveFilters,
  isDeleting = false,
  isRetrying = false,
}: CatalogingDashboardHeaderProps) {
  const [searchInput, setSearchInput] = useState(filters.search_query || '');
  const debouncedSearch = useDebounce(searchInput, 300);
  
  // Effect to trigger search when debounced value changes
  React.useEffect(() => {
    if (debouncedSearch !== filters.search_query) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch, filters.search_query, onSearchChange]);

  const hasBulkSelection = selectedJobIds.length > 0;
  const selectedCount = selectedJobIds.length;

  // Note: Retry eligibility is now validated server-side
  // The button is enabled if any jobs are selected

  // Get count for status tab
  const getStatusCount = (status: string) => {
    if (!statusCounts) return 0;
    if (status === 'all') return totalJobs;
    return statusCounts[status as CatalogingJobStatus] || 0;
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    const status = value === 'all' ? undefined : (value as CatalogingJobStatus);
    onStatusFilterChange(status);
  };

  // Get current tab value
  const currentTab = filters.status || 'all';

  // Render bulk action bar
  if (hasBulkSelection) {
    return (
      <div className="sticky top-0 z-10 bg-gradient-to-r from-background/95 to-lavender-50/30 backdrop-blur-sm border-b border-neutral-200/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {selectedCount} selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeselectAll}
              className="text-muted-foreground hover:text-foreground"
            >
              Deselect all
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkRetry}
              disabled={selectedCount === 0 || isRetrying}
            >
              {isRetrying ? 'Retrying...' : `Retry Selected (${selectedCount})`}
            </Button>
            <DeleteConfirmationDialog
              trigger={
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={selectedCount === 0 || isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              }
              title={`Delete ${selectedCount} Job(s)`}
              description="Are you sure you want to delete the selected cataloging jobs? This action cannot be undone."
              onConfirm={onBulkDelete}
              isLoading={isDeleting}
            />
          </div>
        </div>
        
        <div className="sr-only" aria-live="polite">
          {selectedCount} jobs selected
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-10 bg-gradient-to-r from-background/95 to-lavender-50/30 backdrop-blur-sm border-b border-neutral-200/60">
      <div className="space-y-4 px-4 py-4">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Cataloging Jobs</h1>
        </div>

        {/* Status Tabs - Using Radix UI Tabs */}
        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-5">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 text-sm"
              >
                {tab.label}
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {getStatusCount(tab.value)}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Search and Filters - Single Row */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search Input */}
          <div className="flex-1 min-w-[280px] max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, author, or ISBN..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchInput('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Source Type Filter */}
          <Select
            value={filters.source_type || 'all'}
            onValueChange={(value) => onSourceFilterChange(value === 'all' ? undefined : value as CatalogingJobSourceType)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="isbn_scan">ISBN Scan</SelectItem>
              <SelectItem value="manual_isbn">Manual ISBN</SelectItem>
              <SelectItem value="image_capture">Image Capture</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Filter - Simplified */}
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={filters.date_from ? filters.date_from.split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value;
                if (date) {
                  const dateRange = {
                    from: new Date(date + 'T00:00:00'),
                    to: filters.date_to ? new Date(filters.date_to) : new Date(date + 'T23:59:59')
                  };
                  onDateRangeChange(dateRange);
                } else {
                  onDateRangeChange(undefined);
                }
              }}
              className="w-[130px]"
              placeholder="From date"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="date"
              value={filters.date_to ? filters.date_to.split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value;
                if (date) {
                  const dateRange = {
                    from: filters.date_from ? new Date(filters.date_from) : new Date(date + 'T00:00:00'),
                    to: new Date(date + 'T23:59:59')
                  };
                  onDateRangeChange(dateRange);
                } else if (!filters.date_from) {
                  onDateRangeChange(undefined);
                }
              }}
              className="w-[130px]"
              placeholder="To date"
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost" 
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 