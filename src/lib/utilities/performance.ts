/**
 * Performance Utilities for Cataloging Dashboard
 * 
 * This module provides optimized utilities for handling large datasets
 * in the cataloging dashboard, focusing on:
 * 
 * 1. Memoized date formatting to prevent repeated computations
 * 2. Efficient selection state management using Set operations
 * 3. Cached badge computations for status and source types
 * 4. Performance monitoring utilities
 * 
 * Architecture Integration:
 * - Maintains type safety with proper TypeScript definitions
 * - Integrates with existing error handling patterns
 * - Preserves accessibility and internationalization
 * - Follows React performance best practices
 */

import { formatDistanceToNow } from 'date-fns';
import { TypedCatalogingJob } from '@/lib/types/jobs';
import { useState, useMemo, useCallback, useEffect } from 'react';

// ============================================================================
// MEMOIZED DATE FORMATTING
// ============================================================================

/**
 * Cache for formatted dates to prevent repeated computations
 * Uses LRU strategy to prevent memory leaks
 */
const dateFormatCache = new Map<string, { relative: string; absolute: string }>();
const MAX_CACHE_SIZE = 1000;

/**
 * Memoized date formatter with LRU cache
 * Prevents expensive date formatting on every render
 */
export const formatJobDate = (dateString: string): { relative: string; absolute: string } => {
  if (dateFormatCache.has(dateString)) {
    return dateFormatCache.get(dateString)!;
  }

  const date = new Date(dateString);

  // Fix: Add validation for invalid date strings
  if (isNaN(date.getTime())) {
    return { relative: 'Invalid date', absolute: 'Invalid date' };
  }

  const result = {
    relative: formatDistanceToNow(date, { addSuffix: true }),
    absolute: date.toLocaleDateString(),
  };

  // Implement LRU cache
  if (dateFormatCache.size >= MAX_CACHE_SIZE) {
    const firstKey = dateFormatCache.keys().next().value;
    if (firstKey !== undefined) {
      dateFormatCache.delete(firstKey);
    }
  }

  dateFormatCache.set(dateString, result);
  return result;
};

/**
 * Clear date format cache (useful for testing or memory management)
 */
export const clearDateFormatCache = (): void => {
  dateFormatCache.clear();
};

// ============================================================================
// PERFORMANCE MONITORING UTILITIES
// ============================================================================

/**
 * Performance marker for measuring render times and operations
 */
export const performanceMarker = {
  start: (name: string): void => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${name}-start`);
    }
  },
  
  end: (name: string): number => {
    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const entries = performance.getEntriesByName(name);
      if (entries.length > 0) {
        const lastEntry = entries[entries.length - 1];
        return lastEntry.duration;
      }
    }
    return 0;
  },
  
  clear: (name?: string): void => {
    if (typeof performance !== 'undefined') {
      if (name) {
        performance.clearMarks(`${name}-start`);
        performance.clearMarks(`${name}-end`);
        performance.clearMeasures(name);
      } else {
        performance.clearMarks();
        performance.clearMeasures();
      }
    }
  }
};

/**
 * Memory tracker for monitoring component memory usage
 */
export const memoryTracker = {
  getUsage: (): number | null => {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return null;
  },
  
  trackComponent: (componentName: string): { cleanup: () => void } => {
    const startMemory = memoryTracker.getUsage();
    const startTime = Date.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MemoryTracker] ${componentName} mounted - Memory: ${startMemory ? `${(startMemory / 1024 / 1024).toFixed(1)}MB` : 'N/A'}`);
    }
    
    return {
      cleanup: () => {
        const endMemory = memoryTracker.getUsage();
        const endTime = Date.now();
        
        if (process.env.NODE_ENV === 'development' && startMemory && endMemory) {
          const memoryDiff = (endMemory - startMemory) / 1024 / 1024;
          const timeDiff = endTime - startTime;
          console.log(`[MemoryTracker] ${componentName} unmounted - Memory diff: ${memoryDiff.toFixed(1)}MB, Time: ${timeDiff}ms`);
        }
      }
    };
  }
};

// ============================================================================
// EFFICIENT SELECTION STATE MANAGEMENT
// ============================================================================

/**
 * Selection state manager using Set for O(1) lookups
 * Significantly faster than Array.includes() for large datasets
 */
export class SelectionManager {
  private selectedIds: Set<string>;
  private allIds: Set<string>;

  constructor(initialSelected: string[] = [], allJobIds: string[] = []) {
    this.selectedIds = new Set(initialSelected);
    this.allIds = new Set(allJobIds);
  }

  /**
   * Check if a job is selected (O(1) operation)
   */
  isSelected(jobId: string): boolean {
    return this.selectedIds.has(jobId);
  }

  /**
   * Toggle selection for a job
   */
  toggleSelection(jobId: string): string[] {
    if (this.selectedIds.has(jobId)) {
      this.selectedIds.delete(jobId);
    } else {
      this.selectedIds.add(jobId);
    }
    return Array.from(this.selectedIds);
  }

  /**
   * Select all jobs
   */
  selectAll(): string[] {
    this.selectedIds = new Set(this.allIds);
    return Array.from(this.selectedIds);
  }

  /**
   * Clear all selections
   */
  clearAll(): string[] {
    this.selectedIds.clear();
    return [];
  }

  /**
   * Get current selection as array
   */
  getSelected(): string[] {
    return Array.from(this.selectedIds);
  }

  /**
   * Get selection state
   */
  getSelectionState(): {
    selectedCount: number;
    totalCount: number;
    isAllSelected: boolean;
    isPartiallySelected: boolean;
  } {
    const selectedCount = this.selectedIds.size;
    const totalCount = this.allIds.size;
    const isAllSelected = selectedCount > 0 && selectedCount === totalCount;
    const isPartiallySelected = selectedCount > 0 && selectedCount < totalCount;

    return {
      selectedCount,
      totalCount,
      isAllSelected,
      isPartiallySelected,
    };
  }

  /**
   * Update available job IDs (when data changes)
   */
  updateAvailableIds(jobIds: string[]): void {
    this.allIds = new Set(jobIds);
    // Remove selected IDs that are no longer available
    this.selectedIds = new Set(
      Array.from(this.selectedIds).filter(id => this.allIds.has(id))
    );
  }
}

// ============================================================================
// REACT HOOKS FOR OPTIMIZED SELECTION MANAGEMENT
// ============================================================================

/**
 * Optimized selection hook using SelectionManager for O(1) operations
 */
export const useOptimizedSelection = (jobs: TypedCatalogingJob[]) => {
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);

  // Fix: Correctly memoize the selection manager
  // - The dependency array for useMemo should only include `jobs` to initialize the manager
  // - The manager's internal state is updated via its methods, not by re-creating it
  const selectionManager = useMemo(() => {
    const jobIds = jobs.map(job => job.job_id);
    const manager = new SelectionManager([], jobIds); // Start with empty selection
    return manager;
  }, [jobs]);

  // Fix: Use SelectionManager's O(1) methods for state updates
  const handleSelectJob = useCallback((jobId: string, selected: boolean) => {
    // This logic is now redundant as toggleSelection handles it.
    // Let's rely on the manager to handle the toggling.
    selectionManager.toggleSelection(jobId);
    setSelectedJobIds([...selectionManager.getSelected()]);
  }, [selectionManager]);

  const handleSelectAll = useCallback((selectAll: boolean) => {
    if (selectAll) {
      selectionManager.selectAll();
    } else {
      selectionManager.clearAll();
    }
    setSelectedJobIds([...selectionManager.getSelected()]);
  }, [selectionManager]);

  const clearSelection = useCallback(() => {
    selectionManager.clearAll();
    setSelectedJobIds([]);
  }, [selectionManager]);

  // Fix: Ensure selection state is synchronized when job list changes
  useEffect(() => {
    const currentSelection = new Set(selectedJobIds);
    const availableJobIds = new Set(jobs.map(j => j.job_id));
    const newSelection = new Set<string>();

    for (const id of currentSelection) {
      if (availableJobIds.has(id)) {
        newSelection.add(id);
      }
    }

    if (newSelection.size !== currentSelection.size) {
      setSelectedJobIds(Array.from(newSelection));
    }
    selectionManager.updateAvailableIds(Array.from(availableJobIds));

  }, [jobs, selectedJobIds, selectionManager]);

  return {
    selectedJobIds,
    selectionManager,
    handleSelectJob,
    handleSelectAll,
    clearSelection,
  };
};

// ============================================================================
// CACHED BADGE COMPUTATIONS
// ============================================================================

/**
 * Status badge configuration with memoized computations
 */
const statusBadgeConfig = {
  pending: {
    variant: 'secondary' as const,
    icon: 'Clock',
    label: 'Pending',
  },
  processing: {
    variant: 'secondary' as const,
    icon: 'AlertCircle',
    label: 'Processing',
  },
  completed: {
    variant: 'default' as const,
    icon: 'CheckCircle',
    label: 'Ready',
  },
  failed: {
    variant: 'destructive' as const,
    icon: 'XCircle',
    label: 'Failed',
  },
} as const;

/**
 * Get cached status badge configuration
 */
export const getStatusBadgeConfig = (status: TypedCatalogingJob['status']) => {
  return statusBadgeConfig[status] || statusBadgeConfig.pending;
};

/**
 * Source type badge configuration with memoized computations
 */
const sourceTypeBadgeConfig = {
  ai_analysis: {
    variant: 'default' as const,
    label: 'AI Analysis',
  },
  manual_entry: {
    variant: 'secondary' as const,
    label: 'Manual Entry',
  },
  isbn_lookup: {
    variant: 'outline' as const,
    label: 'ISBN Lookup',
  },
} as const;

/**
 * Get cached source type badge configuration
 */
export const getSourceTypeBadgeConfig = (sourceType: string) => {
  return sourceTypeBadgeConfig[sourceType as keyof typeof sourceTypeBadgeConfig] || sourceTypeBadgeConfig.ai_analysis;
};

/**
 * Get human-readable source type label
 */
export const getSourceTypeLabel = (extractionSource: string | null): string => {
  if (!extractionSource) return 'Unknown';
  
  const config = getSourceTypeBadgeConfig(extractionSource);
  return config.label;
};

// ============================================================================
// PERFORMANCE MONITORING HOOKS
// ============================================================================

/**
 * Hook for performance monitoring in development
 */
export const usePerformanceMonitoring = (componentName: string) => {
  const measureRender = (fn: () => void) => {
    performanceMarker.start(`${componentName}-render`);
    fn();
    return performanceMarker.end(`${componentName}-render`);
  };

  const logSlowRender = (threshold: number = 16) => {
    const renderTime = performanceMarker.end(`${componentName}-render`);
    if (renderTime > threshold && process.env.NODE_ENV === 'development') {
      console.warn(`[Performance] Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  };

  return { measureRender, logSlowRender };
};

// ============================================================================
// DEBOUNCED FUNCTION UTILITIES
// ============================================================================

/**
 * Create a debounced function with cancellation support
 */
export const createDebouncedFunction = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T & { cancel: () => void } => {
  let timeoutId: NodeJS.Timeout | null = null;

  const debouncedFn = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  }) as T & { cancel: () => void };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  debouncedFn.cancel = cancel;
  return debouncedFn;
}; 