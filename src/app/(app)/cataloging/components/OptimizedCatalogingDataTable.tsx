/**
 * Optimized Cataloging Data Table Component
 * 
 * High-performance data table for cataloging jobs with comprehensive optimizations:
 * 
 * 1. **Render Optimization**: React.memo for components, memoized computations
 * 2. **Selection Performance**: O(1) selection lookups using Set operations
 * 3. **Memory Management**: Cached date formatting, optimized re-renders
 * 4. **Error Handling**: Comprehensive error boundaries and recovery
 * 5. **Accessibility**: Full keyboard navigation and screen reader support
 * 6. **Performance Monitoring**: Built-in performance tracking for large datasets
 * 
 * Architecture Integration:
 * - Maintains existing React Query patterns
 * - Preserves multi-tenant security
 * - Integrates with real-time updates
 * - Follows established error handling patterns
 * 
 * Performance Targets:
 * - Handle 1,000+ jobs with <200ms initial render
 * - O(1) selection operations
 * - <5% of rows re-render on selection changes
 * - Stable memory usage during extended use
 */

'use client';

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  MoreHorizontal, 
  Eye, 
  RotateCcw, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { TypedCatalogingJob } from '@/lib/types/jobs';
import { cn } from '@/lib/utils';
import { 
  formatJobDate, 
  SelectionManager, 
  getSourceTypeLabel,
  performanceMarker,
  memoryTracker,
} from '@/lib/utilities/performance';
import Link from 'next/link';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface OptimizedCatalogingDataTableProps {
  jobs: TypedCatalogingJob[];
  selectedJobIds: string[];
  onSelectJob: (jobId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onDeleteJob?: (jobId: string) => void;
  onRetryJob?: (jobId: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  enablePerformanceMonitoring?: boolean;
}

type SortField = 'created_at' | 'status' | 'updated_at';

interface JobRowProps {
  job: TypedCatalogingJob;
  isSelected: boolean;
  onSelect: (jobId: string, selected: boolean) => void;
  onDelete?: (jobId: string) => void;
  onRetry?: (jobId: string) => void;
}

// ============================================================================
// MEMOIZED BADGE COMPONENTS
// ============================================================================

/**
 * Memoized status badge component with color dots
 * Only re-renders when status changes
 */
const CatalogingStatusBadge = React.memo(({ status }: { status: TypedCatalogingJob['status'] }) => {
  return (
    <StatusBadge 
      status={status}
      className="text-xs"
    />
  );
});

CatalogingStatusBadge.displayName = 'CatalogingStatusBadge';

/**
 * Memoized source type badge component
 * Only re-renders when source type changes
 */
const SourceTypeBadge = React.memo(({ extractionSource }: { extractionSource: string | null }) => {
  const label = getSourceTypeLabel(extractionSource);
  
  if (label === '—') {
    return <span className="text-muted-foreground">{label}</span>;
  }

  return (
    <Badge variant="outline" className="text-xs">
      {label}
    </Badge>
  );
});

SourceTypeBadge.displayName = 'SourceTypeBadge';

/**
 * Memoized date display component
 * Only re-renders when date changes, uses cached formatting
 */
const DateDisplay = React.memo(({ dateString }: { dateString: string }) => {
  const formattedDate = useMemo(() => formatJobDate(dateString), [dateString]);

  return (
    <div className="space-y-1">
      <div className="text-sm">
        {formattedDate.relative}
      </div>
      <div className="text-xs text-muted-foreground">
        {formattedDate.absolute}
      </div>
    </div>
  );
});

DateDisplay.displayName = 'DateDisplay';

// ============================================================================
// OPTIMIZED JOB ACTIONS COMPONENT
// ============================================================================

/**
 * Memoized job actions dropdown
 * Only re-renders when job or callbacks change
 */
const JobActions = React.memo(({ 
  job, 
  onDelete, 
  onRetry 
}: { 
  job: TypedCatalogingJob;
  onDelete?: (jobId: string) => void;
  onRetry?: (jobId: string) => void;
}) => {
  const handleDelete = useCallback(() => {
    onDelete?.(job.job_id);
  }, [job.job_id, onDelete]);

  const handleRetry = useCallback(() => {
    onRetry?.(job.job_id);
  }, [job.job_id, onRetry]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">Open job actions menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/cataloging/jobs/${job.job_id}`}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Link>
        </DropdownMenuItem>
        {job.status === 'failed' && onRetry && (
          <DropdownMenuItem onClick={handleRetry}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry Processing
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {onDelete && (
          <DeleteConfirmationDialog
            trigger={
              <DropdownMenuItem 
                className="text-destructive"
                onSelect={(e) => e.preventDefault()}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Job
              </DropdownMenuItem>
            }
            title="Delete Cataloging Job"
            description={`Are you sure you want to delete the cataloging job "${job.extracted_data?.title || 'Untitled'}"? This action cannot be undone.`}
            deleteButtonText="Delete Job"
            onConfirm={handleDelete}
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

JobActions.displayName = 'JobActions';

// ============================================================================
// OPTIMIZED TABLE ROW COMPONENT
// ============================================================================

/**
 * Highly optimized table row component
 * Only re-renders when job data or selection state changes
 */
const OptimizedJobRow = React.memo(({ 
  job, 
  isSelected, 
  onSelect, 
  onDelete, 
  onRetry 
}: JobRowProps) => {
  const handleSelectionChange = useCallback((checked: boolean) => {
    onSelect(job.job_id, checked);
  }, [job.job_id, onSelect]);

  // Handle row click to navigate to job details
  const handleRowClick = useCallback((e: React.MouseEvent<HTMLTableRowElement>) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.closest('button, a, input, [role="button"], [role="checkbox"]');
    
    if (!isInteractiveElement) {
      // Navigate to job details page
      window.location.href = `/cataloging/jobs/${job.job_id}`;
    }
  }, [job.job_id]);

  return (
    <TableRow 
      className={cn(
        "cursor-pointer hover:bg-muted/50",
        isSelected && "bg-muted/50"
      )}
      onClick={handleRowClick}
    >
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleSelectionChange}
          aria-label={`Select job ${job.extracted_data?.title || job.job_id}`}
        />
      </TableCell>
      <TableCell>
        <Link 
          href={`/cataloging/jobs/${job.job_id}`}
          className="block hover:underline"
        >
          <div className="space-y-1">
            <div className="font-medium line-clamp-1">
              {job.extracted_data?.title || 'Processing...'}
            </div>
            {job.extracted_data?.primary_author && (
              <div className="text-sm text-muted-foreground line-clamp-1">
                by {job.extracted_data.primary_author}
              </div>
            )}
            {job.extracted_data?.isbn13 && (
              <div className="text-xs text-muted-foreground font-mono">
                ISBN: {job.extracted_data.isbn13}
              </div>
            )}
          </div>
        </Link>
      </TableCell>
      <TableCell>
        <CatalogingStatusBadge status={job.status} />
      </TableCell>
      <TableCell>
        <SourceTypeBadge extractionSource={job.extracted_data?.extraction_source || 'image_capture'} />
      </TableCell>
      <TableCell>
        <DateDisplay dateString={job.created_at} />
      </TableCell>
      <TableCell>
        <JobActions job={job} onDelete={onDelete} onRetry={onRetry} />
      </TableCell>
    </TableRow>
  );
});

OptimizedJobRow.displayName = 'OptimizedJobRow';

// ============================================================================
// OPTIMIZED SORT BUTTON COMPONENT
// ============================================================================

/**
 * Memoized sort button component
 * Only re-renders when sort state changes
 */
const SortButton = React.memo(({ 
  field, 
  children, 
  sortBy, 
  sortOrder, 
  onSortChange 
}: { 
  field: SortField; 
  children: React.ReactNode;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}) => {
  const handleSort = useCallback(() => {
    if (!onSortChange) return;
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(field, newOrder);
  }, [field, sortBy, sortOrder, onSortChange]);

  const isActive = sortBy === field;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={handleSort}
    >
      <span className="flex items-center gap-1">
        {children}
        {isActive && (
          sortOrder === 'asc' ? 
            <ChevronUp className="h-3 w-3" /> : 
            <ChevronDown className="h-3 w-3" />
        )}
      </span>
    </Button>
  );
});

SortButton.displayName = 'SortButton';

// ============================================================================
// MAIN OPTIMIZED DATA TABLE COMPONENT
// ============================================================================

export const OptimizedCatalogingDataTable = React.memo(({
  jobs,
  selectedJobIds,
  onSelectJob,
  onSelectAll,
  onDeleteJob,
  onRetryJob,
  sortBy,
  sortOrder,
  onSortChange,
  enablePerformanceMonitoring = false,
}: OptimizedCatalogingDataTableProps) => {
  // Performance monitoring
  const memoryTrackerRef = useRef<{ cleanup: () => void } | null>(null);
  const renderCountRef = useRef(0);

  useEffect(() => {
    if (enablePerformanceMonitoring) {
      renderCountRef.current++;
      console.log(`OptimizedCatalogingDataTable render #${renderCountRef.current}`);
      
      if (!memoryTrackerRef.current) {
        memoryTrackerRef.current = memoryTracker.trackComponent('OptimizedCatalogingDataTable');
      }
    }

    return () => {
      if (memoryTrackerRef.current) {
        memoryTrackerRef.current.cleanup();
        memoryTrackerRef.current = null;
      }
    };
  }, [enablePerformanceMonitoring]);

  // Efficient selection management
  const selectionManager = useMemo(() => {
    const jobIds = jobs.map(job => job.job_id);
    const manager = new SelectionManager(selectedJobIds, jobIds);
    return manager;
  }, [jobs, selectedJobIds]);

  const selectionState = useMemo(() => {
    return selectionManager.getSelectionState();
  }, [selectionManager]);

  // Memoized event handlers
  const handleSelectJob = useCallback((jobId: string, selected: boolean) => {
    onSelectJob(jobId, selected);
  }, [onSelectJob]);

  // Performance measurement
  useEffect(() => {
    if (enablePerformanceMonitoring) {
      performanceMarker.start('table-render');
    }
  }, [enablePerformanceMonitoring]);

  useEffect(() => {
    if (enablePerformanceMonitoring) {
      const duration = performanceMarker.end('table-render');
      if (duration) {
        console.log(`Table render took ${duration.toFixed(2)}ms for ${jobs.length} jobs`);
      }
    }
  }, [jobs.length, enablePerformanceMonitoring]);

  // Empty state
  if (jobs.length === 0) {
    return (
      <div className="border border-neutral-200/60 rounded-xl bg-gradient-to-br from-background/98 to-lavender-50/30 shadow-elevation-2">
        <div className="p-8 text-center text-muted-foreground">
          <p>No cataloging jobs found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-neutral-200/60 rounded-xl bg-gradient-to-br from-background/98 to-lavender-50/30 shadow-elevation-2 hover:shadow-elevation-3 animate-spring">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                aria-label="Select all rows"
                checked={selectionState.isAllSelected}
                ref={(el) => {
                  if (el) (el as HTMLInputElement).indeterminate = selectionState.isPartiallySelected;
                }}
                onCheckedChange={(checked) => onSelectAll(!!checked)}
              />
            </TableHead>
            <TableHead>
              Job
            </TableHead>
            <TableHead>
              <SortButton 
                field="status" 
                sortBy={sortBy} 
                sortOrder={sortOrder} 
                onSortChange={onSortChange}
              >
                Status
              </SortButton>
            </TableHead>
            <TableHead>
              Source
            </TableHead>
            <TableHead>
              <SortButton 
                field="created_at" 
                sortBy={sortBy} 
                sortOrder={sortOrder} 
                onSortChange={onSortChange}
              >
                Created
              </SortButton>
            </TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <OptimizedJobRow
              key={job.job_id}
              job={job}
              isSelected={selectionManager.isSelected(job.job_id)}
              onSelect={handleSelectJob}
              onDelete={onDeleteJob}
              onRetry={onRetryJob}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

OptimizedCatalogingDataTable.displayName = 'OptimizedCatalogingDataTable';

// ============================================================================
// ERROR BOUNDARY FOR TABLE COMPONENT
// ============================================================================

interface TableErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary specifically for the data table
 * Prevents table crashes from affecting the entire page
 */
export class CatalogingDataTableErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  TableErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): TableErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CatalogingDataTable Error:', error, errorInfo);
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="border border-neutral-200/60 rounded-xl bg-gradient-to-br from-background/98 to-lavender-50/30 shadow-elevation-2">
          <div className="p-8 text-center">
            <h3 className="text-lg font-semibold text-destructive mb-2">
              Table Error
            </h3>
            <p className="text-muted-foreground mb-4">
              Something went wrong while displaying the cataloging jobs.
            </p>
            <Button 
              onClick={() => this.setState({ hasError: false })}
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// PERFORMANCE TESTING UTILITIES
// ============================================================================

/**
 * Performance testing hook for development
 * Measures render performance and memory usage
 */
export const useTablePerformanceTesting = (enabled: boolean = false) => {
  const renderTimes = useRef<number[]>([]);
  const memoryUsage = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const measurePerformance = () => {
      const renderTime = performance.now();
      renderTimes.current.push(renderTime);

      const memory = memoryTracker.getUsage();
      if (memory) {
        memoryUsage.current.push(memory);
      }

      // Keep only last 100 measurements
      if (renderTimes.current.length > 100) {
        renderTimes.current = renderTimes.current.slice(-100);
      }
      if (memoryUsage.current.length > 100) {
        memoryUsage.current = memoryUsage.current.slice(-100);
      }
    };

    measurePerformance();
  });

  const getPerformanceStats = useCallback(() => {
    const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
    const avgMemory = memoryUsage.current.reduce((a, b) => a + b, 0) / memoryUsage.current.length;

    return {
      averageRenderTime: avgRenderTime,
      averageMemoryUsage: avgMemory / 1024 / 1024, // MB
      totalRenders: renderTimes.current.length,
      memoryTrend: memoryUsage.current.length > 1 ? 
        (memoryUsage.current[memoryUsage.current.length - 1] - memoryUsage.current[0]) / 1024 / 1024 : 0,
    };
  }, []);

  return { getPerformanceStats };
}; 