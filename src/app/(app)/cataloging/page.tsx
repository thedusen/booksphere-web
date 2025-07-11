/**
 * Cataloging Jobs Dashboard
 * 
 * This page implements the comprehensive cataloging dashboard following the UX design
 * specifications. It provides:
 * 
 * 1. **Information Architecture**: Prioritizes job status, metadata, and actions
 * 2. **Filtering System**: Status tabs, search, source type, and date range filters
 * 3. **Bulk Operations**: Multi-select with retry/delete actions
 * 4. **Responsive Design**: DataTable on desktop, Card list on mobile
 * 5. **Accessibility**: Full keyboard navigation, ARIA labels, screen reader support
 * 6. **Empty States**: Helpful guidance for new users and filtered results
 * 
 * Architecture Integration:
 * - Uses React Query hooks for data management
 * - Implements real-time updates via Supabase subscriptions
 * - Follows multi-tenant security patterns
 * - Provides comprehensive error handling
 * 
 * UX Design Compliance:
 * - Persistent header with contextual bulk actions
 * - Status-based primary navigation via tabs
 * - Debounced search to prevent excessive API calls
 * - Optimistic updates for immediate user feedback
 * - Proper loading states and skeleton UI
 */

'use client';

import React, { useState, useMemo } from 'react';
import { CatalogingDashboardHeader } from './components/CatalogingDashboardHeader';
import { CatalogingDataTable } from './components/CatalogingDataTable';
import { CatalogingCardList } from './components/CatalogingCardList';
import { CatalogingEmptyState } from './components/CatalogingEmptyState';
import { CatalogingLoadingState } from './components/CatalogingLoadingState';
import { CatalogingPagination } from './components/CatalogingPagination';
import { useCatalogingJobs, useCatalogingJobStats, useDeleteCatalogingJobs, useRetryCatalogingJobs } from '@/hooks/useCatalogJobs';
import { useOrganization } from '@/hooks/useOrganization';
import { CatalogingJobStatus } from '@/lib/types/jobs';
import { CatalogingJobFilters, CatalogingJobSourceType } from '@/lib/validators/cataloging';
import { CATALOGING_DEFAULTS } from '@/lib/constants/cataloging';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { toast } from 'sonner';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';

// Default filters for the dashboard
const DEFAULT_FILTERS: CatalogingJobFilters = {
  status: undefined, // 'All' tab
  search_query: '',
  sort_by: CATALOGING_DEFAULTS.SORT_BY,
  sort_order: CATALOGING_DEFAULTS.SORT_ORDER,
  page: CATALOGING_DEFAULTS.PAGE_NUMBER,
  limit: CATALOGING_DEFAULTS.PAGE_SIZE,
};

export default function CatalogingDashboard() {
  // Organization context for multi-tenancy
  const { organizationId } = useOrganization();
  
  // Responsive design state
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Filter state management
  const [filters, setFilters] = useState<CatalogingJobFilters>(DEFAULT_FILTERS);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  
  // Data fetching with React Query
  const {
    data: jobsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useCatalogingJobs(filters);

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
  
  // Filter update handlers
  const handleFilterChange = (newFilters: Partial<CatalogingJobFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
    setSelectedJobIds([]); // Clear selection when filters change
  };
  
  const handleStatusFilterChange = (status: CatalogingJobStatus | undefined) => {
    handleFilterChange({ status });
  };
  
  const handleSearchChange = (search_query: string) => {
    handleFilterChange({ search_query });
  };
  
  const handleSourceFilterChange = (source_type: CatalogingJobSourceType) => {
    handleFilterChange({ source_type });
  };
  
  const handleDateRangeChange = (date_range: { from: Date; to: Date } | undefined) => {
    if (date_range) {
      handleFilterChange({ 
        date_from: date_range.from.toISOString(),
        date_to: date_range.to.toISOString()
      });
    } else {
      handleFilterChange({ 
        date_from: undefined,
        date_to: undefined
      });
    }
  };
  
  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSelectedJobIds([]);
  };
  
  // Selection handlers
  const handleSelectJob = (jobId: string, selected: boolean) => {
    setSelectedJobIds(prev => 
      selected 
        ? [...prev, jobId]
        : prev.filter(id => id !== jobId)
    );
  };
  
  const handleSelectAll = (selected: boolean) => {
    setSelectedJobIds(selected ? jobs.map(job => job.job_id) : []);
  };
  
  const handleDeselectAll = () => {
    setSelectedJobIds([]);
  };
  
  // Bulk operations mutations
  const deleteCatalogingJobsMutation = useDeleteCatalogingJobs();
  const retryCatalogingJobsMutation = useRetryCatalogingJobs();

  // Bulk action handlers
  const handleBulkDelete = async () => {
    if (selectedJobIds.length === 0) return;
    setIsConfirmDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    const idsToDelete = jobToDelete ? [jobToDelete] : selectedJobIds;
    if (idsToDelete.length === 0) return;

    try {
      await deleteCatalogingJobsMutation.mutateAsync(idsToDelete);
      setSelectedJobIds(prev => prev.filter(id => !idsToDelete.includes(id)));
      setJobToDelete(null);
    } catch (error) {
      // The mutation hook's onError handles the toast
      console.error('Failed to delete jobs:', error);
    }
  };

  const handleBulkRetry = async () => {
    if (selectedJobIds.length === 0) return;
    
    try {
      await retryCatalogingJobsMutation.mutateAsync(selectedJobIds);
      setSelectedJobIds([]);
      // The mutation will handle the success toast and cache invalidation
    } catch (error) {
      // The mutation will handle the error toast
      console.error('Failed to retry jobs:', error);
    }
  };
  
  // Individual job action handlers
  const handleDeleteJob = async (jobId: string) => {
    setJobToDelete(jobId);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await retryCatalogingJobsMutation.mutateAsync([jobId]);
    } catch (error) {
      console.error('Failed to retry job:', error);
    }
  };

  // Sorting handlers
  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters(prev => ({ 
      ...prev, 
      sort_by: sortBy as any, 
      sort_order: sortOrder,
      page: 1 // Reset to first page when sorting changes
    }));
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };
  
  const getConfirmationDialogContent = () => {
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
  };

  const dialogContent = getConfirmationDialogContent();

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
  
  // Calculate if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.status ||
      filters.source_type ||
      filters.search_query ||
      filters.date_from ||
      filters.date_to
    );
  }, [filters]);
  
  // Determine which empty state to show
  const showEmptyState = !isLoading && jobs.length === 0;
  const isInitialState = showEmptyState && !hasActiveFilters;
  const isNoResultsState = showEmptyState && hasActiveFilters;
  
  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <DeleteConfirmationDialog
        open={isConfirmDeleteDialogOpen}
        onOpenChange={setIsConfirmDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title={dialogContent.title}
        description={dialogContent.description}
        deleteButtonText={dialogContent.deleteButtonText}
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
        onDeselectAll={handleDeselectAll}
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
              // Navigate to help documentation
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
        
        {/* Data Display - Responsive */}
        {!isLoading && jobs.length > 0 && (
          <>
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
              <CatalogingDataTable
                jobs={jobs}
                selectedJobIds={selectedJobIds}
                onSelectJob={handleSelectJob}
                onSelectAll={handleSelectAll}
                onDeleteJob={handleDeleteJob}
                onRetryJob={handleRetryJob}
                sortBy={filters.sort_by}
                sortOrder={filters.sort_order}
                onSortChange={handleSortChange}
              />
            )}
            
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
    </div>
  );
} 