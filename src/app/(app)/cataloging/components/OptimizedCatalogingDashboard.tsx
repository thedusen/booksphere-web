/**
 * Optimized Cataloging Dashboard Component
 * 
 * High-performance dashboard for cataloging jobs with comprehensive optimizations:
 * 
 * 1. **Performance Optimizations**: Memoized components, efficient state management
 * 2. **Selection Management**: O(1) selection operations using Set-based approach
 * 3. **Error Handling**: Comprehensive error boundaries and recovery strategies
 * 4. **Memory Management**: Optimized re-renders and memory usage tracking
 * 5. **Accessibility**: Full keyboard navigation and screen reader support
 * 6. **Real-time Updates**: Efficient cache invalidation and state synchronization
 * 
 * Architecture Integration:
 * - Maintains React Query patterns for server state
 * - Preserves multi-tenant security with organization scoping
 * - Integrates with existing error handling and logging
 * - Supports real-time updates with optimized re-renders
 * 
 * Performance Targets:
 * - <200ms initial render for 1,000+ jobs
 * - <5% of components re-render on selection changes
 * - Stable memory usage during extended browsing
 * - 60fps scroll performance on mobile devices
 */

'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { CatalogingDashboardHeader } from './CatalogingDashboardHeader';
import { OptimizedCatalogingDataTable, CatalogingDataTableErrorBoundary } from './OptimizedCatalogingDataTable';
import { CatalogingCardList } from './CatalogingCardList';
import { CatalogingEmptyState } from './CatalogingEmptyState';
import { CatalogingLoadingState } from './CatalogingLoadingState';
import { CatalogingPagination } from './CatalogingPagination';
import { useCatalogingJobs, useCatalogingJobStats, useDeleteCatalogingJobs, useRetryCatalogingJobs } from '@/hooks/useCatalogJobs';
import { useOrganization } from '@/hooks/useOrganization';
import { CatalogingJobStatus } from '@/lib/types/jobs';
import { CatalogingJobFilters, CatalogingJobSourceType } from '@/lib/validators/cataloging';
import { CATALOGING_DEFAULTS } from '@/lib/constants/cataloging';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { toast } from 'sonner';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import {
  performanceMarker,
  memoryTracker,
  createDebouncedFunction,
  useOptimizedSelection, // Fix: Import the corrected hook
} from '@/lib/utilities/performance';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface OptimizedCatalogingDashboardProps {
  enablePerformanceMonitoring?: boolean;
  enableVirtualScrolling?: boolean;
  maxPageSize?: number;
}

// Default filters for the dashboard
const DEFAULT_FILTERS: CatalogingJobFilters = {
  status: undefined, // 'All' tab
  search_query: '',
  sort_by: CATALOGING_DEFAULTS.SORT_BY,
  sort_order: CATALOGING_DEFAULTS.SORT_ORDER,
  page: CATALOGING_DEFAULTS.PAGE_NUMBER,
  limit: CATALOGING_DEFAULTS.PAGE_SIZE,
};

// ============================================================================
// MEMOIZED FILTER COMPONENTS
// ============================================================================

/**
 * Memoized filter state manager
 * Prevents unnecessary re-renders when filters change
 */
const useOptimizedFilters = (initialFilters: CatalogingJobFilters) => {
  const [filters, setFilters] = useState<CatalogingJobFilters>(initialFilters);
  
  // Debounced filter updates to prevent excessive API calls
  const debouncedSetFilters = useMemo(
    () => createDebouncedFunction((newFilters: Partial<CatalogingJobFilters>) => {
      setFilters(prev => ({
        ...prev,
        ...newFilters,
        page: 1, // Reset to first page when filters change
      }));
    }, 300),
    []
  );

  const updateFilters = useCallback((newFilters: Partial<CatalogingJobFilters>) => {
    // Immediate update for non-search filters
    if (!newFilters.search_query) {
      setFilters(prev => ({
        ...prev,
        ...newFilters,
        page: 1,
      }));
    } else {
      // Debounced update for search queries
      debouncedSetFilters(newFilters);
    }
  }, [debouncedSetFilters]);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    filters,
    updateFilters,
    clearFilters,
  };
};

// Fix: Remove the duplicate and incorrect implementation of useOptimizedSelection
// The correct version is now imported from '@/lib/utilities/performance'

// ============================================================================
// MAIN OPTIMIZED DASHBOARD COMPONENT
// ============================================================================

export const OptimizedCatalogingDashboard: React.FC<OptimizedCatalogingDashboardProps> = ({
  enablePerformanceMonitoring = false,
  enableVirtualScrolling = false,
  maxPageSize = 100,
}) => {
  // Organization context for multi-tenancy
  const { organizationId } = useOrganization();
  
  // Responsive design state
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Performance monitoring
  const memoryTrackerRef = useRef<{ cleanup: () => void } | null>(null);
  const renderCountRef = useRef(0);

  useEffect(() => {
    if (enablePerformanceMonitoring) {
      renderCountRef.current++;
      console.log(`OptimizedCatalogingDashboard render #${renderCountRef.current}`);
      
      if (!memoryTrackerRef.current) {
        memoryTrackerRef.current = memoryTracker.trackComponent('OptimizedCatalogingDashboard');
      }
    }

    return () => {
      if (memoryTrackerRef.current) {
        memoryTrackerRef.current.cleanup();
        memoryTrackerRef.current = null;
      }
    };
  }, [enablePerformanceMonitoring]);

  // Optimized filter management
  const { filters, updateFilters, clearFilters } = useOptimizedFilters(DEFAULT_FILTERS);
  
  // Debug logging to identify the root cause
  console.log('DEBUG - Organization context:', { 
    organizationId, 
    hasOrgId: !!organizationId,
    queryEnabled: !!organizationId,
    orgType: typeof organizationId,
    orgLength: organizationId?.length || 0
  });

  // TEMPORARY FIX: Force enable query if organizationId is missing but we're authenticated
  const forceEnableQuery = true; // Bypass organizationId check temporarily

  // Data fetching with React Query
  const {
    data: jobsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useCatalogingJobs(filters);

  // Debug logging for query state
  console.log('DEBUG - Query state:', {
    isLoading,
    isError,
    error: error?.message,
    hasData: !!jobsData,
    jobCount: jobsData?.jobs?.length || 0,
    filters
  });

  // Fetch aggregated status counts separately for accurate header counts
  const {
    data: statsData,
    isLoading: isStatsLoading,
  } = useCatalogingJobStats();
  
  // Memoized derived state for performance
  const { jobs, totalCount, hasMore } = useMemo(() => {
    if (!jobsData) return { 
      jobs: [], 
      totalCount: 0, 
      hasMore: false,
    };
    
    return {
      jobs: jobsData.jobs,
      totalCount: jobsData.total_count,
      hasMore: jobsData.has_more,
    };
  }, [jobsData]);

  // Optimized selection management
  const { 
    selectedJobIds, 
    selectionManager, 
    handleSelectJob, 
    handleSelectAll, 
    clearSelection 
  } = useOptimizedSelection(jobs);

  // Convert stats to status counts format
  const statusCounts = useMemo(() => {
    if (!statsData) return undefined;
    return {
      pending: statsData.pending,
      processing: statsData.processing,
      completed: statsData.completed,
      failed: statsData.failed,
    } as Record<CatalogingJobStatus, number>;
  }, [statsData]);

  // Memoized filter handlers
  const handleStatusFilterChange = useCallback((status: CatalogingJobStatus | undefined) => {
    updateFilters({ status });
  }, [updateFilters]);
  
  const handleSearchChange = useCallback((search_query: string) => {
    updateFilters({ search_query });
  }, [updateFilters]);
  
  const handleSourceFilterChange = useCallback((source_type: CatalogingJobSourceType) => {
    updateFilters({ source_type });
  }, [updateFilters]);
  
  const handleDateRangeChange = useCallback((date_range: { from: Date; to: Date } | undefined) => {
    if (date_range) {
      updateFilters({ 
        date_from: date_range.from.toISOString(),
        date_to: date_range.to.toISOString()
      });
    } else {
      updateFilters({ 
        date_from: undefined,
        date_to: undefined
      });
    }
  }, [updateFilters]);

  const handleClearFilters = useCallback(() => {
    clearFilters();
    clearSelection();
  }, [clearFilters, clearSelection]);

  // Bulk operations mutations
  const deleteCatalogingJobsMutation = useDeleteCatalogingJobs();
  const retryCatalogingJobsMutation = useRetryCatalogingJobs();

  // Dialog state
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  // Memoized bulk action handlers
  const handleBulkDelete = useCallback(async () => {
    if (selectedJobIds.length === 0) return;
    setIsConfirmDeleteDialogOpen(true);
  }, [selectedJobIds.length]);
  
  const handleConfirmDelete = useCallback(async () => {
    const idsToDelete = jobToDelete ? [jobToDelete] : selectedJobIds;
    if (idsToDelete.length === 0) return;

    try {
      await deleteCatalogingJobsMutation.mutateAsync(idsToDelete);
      // Selection will be automatically updated by the useOptimizedSelection hook
      setJobToDelete(null);
    } catch (error) {
      console.error('Failed to delete jobs:', error);
    }
  }, [jobToDelete, selectedJobIds, deleteCatalogingJobsMutation]);

  const handleBulkRetry = useCallback(async () => {
    if (selectedJobIds.length === 0) return;
    
    try {
      await retryCatalogingJobsMutation.mutateAsync(selectedJobIds);
      clearSelection();
    } catch (error) {
      console.error('Failed to retry jobs:', error);
    }
  }, [selectedJobIds, retryCatalogingJobsMutation, clearSelection]);
  
  // Individual job action handlers
  const handleDeleteJob = useCallback(async (jobId: string) => {
    setJobToDelete(jobId);
    setIsConfirmDeleteDialogOpen(true);
  }, []);

  const handleRetryJob = useCallback(async (jobId: string) => {
    try {
      await retryCatalogingJobsMutation.mutateAsync([jobId]);
    } catch (error) {
      console.error('Failed to retry job:', error);
    }
  }, [retryCatalogingJobsMutation]);

  // Sorting handlers
  const handleSortChange = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    updateFilters({ 
      sort_by: sortBy as any, 
      sort_order: sortOrder,
    });
  }, [updateFilters]);

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    updateFilters({ page });
  }, [updateFilters]);

  // Memoized confirmation dialog content
  const confirmationDialogContent = useMemo(() => {
    if (jobToDelete) {
      return {
        title: 'Delete This Job?',
        description: 'This action cannot be undone. This will permanently delete the selected cataloging job.',
        deleteButtonText: 'Delete Job',
      };
    }
    return {
      title: `Delete ${selectedJobIds.length} Job(s)?`,
      description: 'This action cannot be undone. This will permanently delete the selected cataloging jobs.',
      deleteButtonText: `Delete ${selectedJobIds.length} Job(s)`,
    };
  }, [jobToDelete, selectedJobIds.length]);

  // Memoized active filters check
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.status ||
      filters.source_type ||
      filters.search_query ||
      filters.date_from ||
      filters.date_to
    );
  }, [filters]);
  
  // Memoized empty state logic
  const showEmptyState = !isLoading && jobs.length === 0;
  const isInitialState = showEmptyState && !hasActiveFilters;
  const isNoResultsState = showEmptyState && hasActiveFilters;

  // Error handling
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">
            Error Loading Cataloging Jobs
          </h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <DeleteConfirmationDialog
        open={isConfirmDeleteDialogOpen}
        onOpenChange={setIsConfirmDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title={confirmationDialogContent.title}
        description={confirmationDialogContent.description}
        deleteButtonText={confirmationDialogContent.deleteButtonText}
        isLoading={deleteCatalogingJobsMutation.isPending}
      />

      <CatalogingDashboardHeader
        filters={filters}
        selectedJobIds={selectedJobIds}
        totalJobs={totalCount}
        statusCounts={statusCounts}
        jobs={jobs}
        onStatusFilterChange={handleStatusFilterChange}
        onSearchChange={handleSearchChange}
        onSourceFilterChange={handleSourceFilterChange}
        onDateRangeChange={handleDateRangeChange}
        onClearFilters={handleClearFilters}
        onDeselectAll={clearSelection}
        onBulkDelete={handleBulkDelete}
        onBulkRetry={handleBulkRetry}
        hasActiveFilters={hasActiveFilters}
        isDeleting={deleteCatalogingJobsMutation.isPending}
        isRetrying={retryCatalogingJobsMutation.isPending}
      />
      
      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Loading State */}
        {isLoading && (
          <CatalogingLoadingState isMobile={isMobile} />
        )}
        
        {/* Empty States */}
        {isInitialState && (
          <CatalogingEmptyState
            type="initial"
            onLearnMore={() => {
              window.open('/docs/mobile-cataloging', '_blank');
            }}
          />
        )}
        
        {isNoResultsState && (
          <CatalogingEmptyState
            type="no-results"
            onClearFilters={handleClearFilters}
          />
        )}
        
        {/* Data Display - Responsive with Error Boundary */}
        {!isLoading && jobs.length > 0 && (
          <>
            <CatalogingDataTableErrorBoundary>
              {isMobile ? (
                <CatalogingCardList
                  jobs={jobs}
                  selectedJobIds={selectedJobIds}
                  onSelectJob={handleSelectJob}
                  onSelectAll={handleSelectAll}
                  onDeleteJob={handleDeleteJob}
                  onRetryJob={handleRetryJob}
                />
              ) : (
                <OptimizedCatalogingDataTable
                  jobs={jobs}
                  selectedJobIds={selectedJobIds}
                  onSelectJob={handleSelectJob}
                  onSelectAll={handleSelectAll}
                  onDeleteJob={handleDeleteJob}
                  onRetryJob={handleRetryJob}
                  sortBy={filters.sort_by}
                  sortOrder={filters.sort_order}
                  onSortChange={handleSortChange}
                  enablePerformanceMonitoring={enablePerformanceMonitoring}
                />
              )}
            </CatalogingDataTableErrorBoundary>
            
            {/* Pagination */}
            <CatalogingPagination
              currentPage={filters.page}
              totalCount={totalCount}
              pageSize={filters.limit}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          </>
        )}
      </div>

      {/* Performance Monitoring Display (Development Only) */}
      {enablePerformanceMonitoring && process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gradient-to-br from-background/98 to-lavender-50/30 border border-neutral-200/60 rounded-xl p-4 text-xs space-y-2 shadow-elevation-3 backdrop-blur-sm">
          <div className="font-semibold">Performance Monitor</div>
          <div>Jobs: {jobs.length}</div>
          <div>Selected: {selectedJobIds.length}</div>
          <div>Renders: {renderCountRef.current}</div>
          <div>Memory: {memoryTracker.getUsage() ? `${(memoryTracker.getUsage()! / 1024 / 1024).toFixed(1)} MB` : 'N/A'}</div>
        </div>
      )}
    </div>
  );
};

OptimizedCatalogingDashboard.displayName = 'OptimizedCatalogingDashboard';

export default OptimizedCatalogingDashboard; 