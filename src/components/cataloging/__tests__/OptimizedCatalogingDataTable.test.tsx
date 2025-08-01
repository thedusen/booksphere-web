/**
 * Optimized Cataloging Data Table Test Suite
 * 
 * This test suite validates the performance optimizations and functionality
 * of the optimized cataloging components, ensuring:
 * 
 * 1. Performance improvements are measurable
 * 2. Functionality remains intact
 * 3. Error handling works correctly
 * 4. Accessibility is preserved
 * 5. Memory usage is optimized
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OptimizedCatalogingDataTable, CatalogingDataTableErrorBoundary } from '@/app/(app)/cataloging/components/OptimizedCatalogingDataTable';
import { SelectionManager, formatJobDate, getStatusBadgeConfig, clearDateFormatCache } from '@/lib/utilities/performance';
import { TypedCatalogingJob } from '@/lib/types/jobs';

// Mock data generators
const createMockJob = (id: string, overrides: Partial<TypedCatalogingJob> = {}): TypedCatalogingJob => ({
  job_id: id,
  organization_id: 'test-org',
  user_id: 'test-user',
  status: 'pending',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  extracted_data: {
    title: `Test Book ${id}`,
    primary_author: 'Test Author',
    isbn13: '1234567890123',
    extraction_source: 'ai_analysis',
  },
  image_urls: null,
  matched_edition_ids: null,
  error_message: null,
  ...overrides,
});

const createMockJobs = (count: number): TypedCatalogingJob[] => {
  return Array.from({ length: count }, (_, i) => createMockJob(`job-${i}`));
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Performance testing utilities
const measureRenderTime = (renderFn: () => void): number => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

const measureMemoryUsage = (): number => {
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
};

describe('OptimizedCatalogingDataTable', () => {
  const defaultProps = {
    jobs: createMockJobs(10),
    selectedJobIds: [],
    onSelectJob: vi.fn(),
    onSelectAll: vi.fn(),
    onDeleteJob: vi.fn(),
    onRetryJob: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearDateFormatCache();
  });

  describe('Performance Optimizations', () => {
    test('should render large datasets efficiently', async () => {
      const largeJobSet = createMockJobs(1000);
      const renderTime = measureRenderTime(() => {
        render(
          <TestWrapper>
            <OptimizedCatalogingDataTable
              {...defaultProps}
              jobs={largeJobSet}
              enablePerformanceMonitoring={true}
            />
          </TestWrapper>
        );
      });

      // Should render 1000 jobs in under 1500ms (adjusted for test environment)
      // Note: Test environment is slower than production due to React DevTools and testing overhead
      expect(renderTime).toBeLessThan(1500);
      
      // Should display all jobs
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('row')).toHaveLength(1001); // 1000 jobs + header
    });

    test('should minimize re-renders on selection changes', async () => {
      const renderSpy = vi.fn();
      const TestComponent = () => {
        renderSpy();
        return (
          <OptimizedCatalogingDataTable
            {...defaultProps}
            jobs={createMockJobs(100)}
          />
        );
      };

      const { rerender } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const initialRenderCount = renderSpy.mock.calls.length;

      // Select a job
      const checkbox = screen.getAllByRole('checkbox')[1]; // First job checkbox
      await userEvent.click(checkbox);

      // Rerender with updated selection
      rerender(
        <TestWrapper>
          <OptimizedCatalogingDataTable
            {...defaultProps}
            jobs={createMockJobs(100)}
            selectedJobIds={['job-0']}
          />
        </TestWrapper>
      );

      // Should have minimal additional renders
      const finalRenderCount = renderSpy.mock.calls.length;
      expect(finalRenderCount - initialRenderCount).toBeLessThan(3);
    });

    test('should cache date formatting efficiently', () => {
      const testDate = '2023-01-01T00:00:00.000Z';
      
      // First call should compute
      const start1 = performance.now();
      const result1 = formatJobDate(testDate);
      const end1 = performance.now();
      
      // Second call should use cache
      const start2 = performance.now();
      const result2 = formatJobDate(testDate);
      const end2 = performance.now();
      
      // Results should be identical
      expect(result1).toEqual(result2);
      
      // Second call should be significantly faster
      expect(end2 - start2).toBeLessThan(end1 - start1);
    });

    test('should handle memory cleanup properly', () => {
      const initialMemory = measureMemoryUsage();
      
      // Render and unmount multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <TestWrapper>
            <OptimizedCatalogingDataTable
              {...defaultProps}
              jobs={createMockJobs(100)}
            />
          </TestWrapper>
        );
        unmount();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = measureMemoryUsage();
      
      // Memory usage should not increase significantly
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
      }
    });
  });

  describe('Selection Management', () => {
    test('should use SelectionManager for O(1) lookups', () => {
      const jobs = createMockJobs(1000);
      const selectedIds = ['job-0', 'job-500', 'job-999'];
      
      const manager = new SelectionManager(selectedIds, jobs.map(j => j.job_id));
      
      // Test O(1) lookup performance
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        manager.isSelected(`job-${i}`);
      }
      const end = performance.now();
      
      // Should complete 1000 lookups very quickly
      expect(end - start).toBeLessThan(10);
    });

    test('should handle selection state changes efficiently', async () => {
      const onSelectJob = vi.fn();
      
      render(
        <TestWrapper>
          <OptimizedCatalogingDataTable
            {...defaultProps}
            jobs={createMockJobs(100)}
            onSelectJob={onSelectJob}
          />
        </TestWrapper>
      );

      // Select multiple jobs
      const checkboxes = screen.getAllByRole('checkbox');
      await userEvent.click(checkboxes[1]); // job-0
      await userEvent.click(checkboxes[2]); // job-1
      await userEvent.click(checkboxes[3]); // job-2

      expect(onSelectJob).toHaveBeenCalledTimes(3);
      expect(onSelectJob).toHaveBeenNthCalledWith(1, 'job-0', true);
      expect(onSelectJob).toHaveBeenNthCalledWith(2, 'job-1', true);
      expect(onSelectJob).toHaveBeenNthCalledWith(3, 'job-2', true);
    });

    test('should handle select all functionality', async () => {
      const onSelectAll = vi.fn();
      
      render(
        <TestWrapper>
          <OptimizedCatalogingDataTable
            {...defaultProps}
            jobs={createMockJobs(10)}
            onSelectAll={onSelectAll}
          />
        </TestWrapper>
      );

      // Click select all checkbox
      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      await userEvent.click(selectAllCheckbox);

      expect(onSelectAll).toHaveBeenCalledWith(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle component errors gracefully', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <CatalogingDataTableErrorBoundary>
          <ThrowError />
        </CatalogingDataTableErrorBoundary>
      );

      expect(screen.getByText('Table Error')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    test('should recover from errors when retry is clicked', async () => {
      let shouldThrow = true;
      const TestComponent = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Success</div>;
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <CatalogingDataTableErrorBoundary>
          <TestComponent />
        </CatalogingDataTableErrorBoundary>
      );

      expect(screen.getByText('Table Error')).toBeInTheDocument();

      // Fix the error condition
      shouldThrow = false;

      // Click retry
      const retryButton = screen.getByText('Try Again');
      await userEvent.click(retryButton);

      expect(screen.getByText('Success')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    test('should maintain proper ARIA labels', async () => {
      render(<TestWrapper><OptimizedCatalogingDataTable {...defaultProps} /></TestWrapper>);
      
      // Check select all checkbox
      const selectAllCheckbox = screen.getByLabelText('Select all rows');
      expect(selectAllCheckbox).toBeInTheDocument();
      
      // Check individual row checkboxes
      const jobCheckboxes = screen.getAllByLabelText(/Select job/);
      expect(jobCheckboxes).toHaveLength(10);
    });

    test('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <OptimizedCatalogingDataTable
            {...defaultProps}
            jobs={createMockJobs(2)}
          />
        </TestWrapper>
      );

      const checkboxes = screen.getAllByRole('checkbox');
      
      // Focus first checkbox
      checkboxes[1].focus(); // Skip header checkbox, focus first job checkbox
      expect(checkboxes[1]).toHaveFocus();

      // Verify checkbox has proper aria-label
      expect(checkboxes[1]).toHaveAttribute('aria-label', 'Select job Test Book job-0');
    });

    test('should provide screen reader friendly content', async () => {
      render(<TestWrapper><OptimizedCatalogingDataTable {...defaultProps} /></TestWrapper>);
      
      // Check for proper checkbox labels
      const selectAllCheckbox = screen.getByLabelText('Select all rows');
      expect(selectAllCheckbox).toBeInTheDocument();
    });
  });

  describe('Sorting and Filtering', () => {
    test('should handle sorting changes', async () => {
      const onSortChange = vi.fn();
      
      render(
        <TestWrapper>
          <OptimizedCatalogingDataTable
            {...defaultProps}
            jobs={createMockJobs(5)}
            onSortChange={onSortChange}
          />
        </TestWrapper>
      );

      // Click status column header
      const statusHeader = screen.getByText('Status');
      await userEvent.click(statusHeader);

      expect(onSortChange).toHaveBeenCalledWith('status', 'asc');
    });

    test('should display sort indicators correctly', () => {
      render(
        <TestWrapper>
          <OptimizedCatalogingDataTable
            {...defaultProps}
            jobs={createMockJobs(5)}
            sortBy="status"
            sortOrder="asc"
          />
        </TestWrapper>
      );

      // Should show sort indicator for status column
      const statusHeader = screen.getByText('Status').closest('button');
      expect(statusHeader).toBeInTheDocument();
    });
  });

  describe('Job Actions', () => {
    test('should handle job actions correctly', async () => {
      const onDeleteJob = vi.fn();
      const onRetryJob = vi.fn();
      
      const failedJob = createMockJob('failed-job', { status: 'failed' });
      
      render(
        <TestWrapper>
          <OptimizedCatalogingDataTable
            {...defaultProps}
            jobs={[failedJob]}
            onDeleteJob={onDeleteJob}
            onRetryJob={onRetryJob}
          />
        </TestWrapper>
      );

      // Open actions menu
      const actionsButton = screen.getByRole('button', { name: /open job actions menu/i });
      await userEvent.click(actionsButton);

      // Should show retry option for failed job
      const retryButton = screen.getByText('Retry Processing');
      expect(retryButton).toBeInTheDocument();

      await userEvent.click(retryButton);
      expect(onRetryJob).toHaveBeenCalledWith('failed-job');
    });

    test('should handle view details navigation', async () => {
      render(
        <TestWrapper>
          <OptimizedCatalogingDataTable
            {...defaultProps}
            jobs={createMockJobs(1)}
          />
        </TestWrapper>
      );

      // Click on job title link
      const jobLink = screen.getByText('Test Book job-0');
      expect(jobLink.closest('a')).toHaveAttribute('href', '/cataloging/jobs/job-0');
    });
  });

  describe('Empty States', () => {
    test('should display empty state when no jobs', () => {
      render(
        <TestWrapper>
          <OptimizedCatalogingDataTable
            {...defaultProps}
            jobs={[]}
          />
        </TestWrapper>
      );

      expect(screen.getByText('No cataloging jobs found')).toBeInTheDocument();
    });
  });

  describe('Performance Monitoring', () => {
    test('should track performance metrics when enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      render(
        <TestWrapper>
          <OptimizedCatalogingDataTable
            {...defaultProps}
            jobs={createMockJobs(100)}
            enablePerformanceMonitoring={true}
          />
        </TestWrapper>
      );

      // Should log performance metrics
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('OptimizedCatalogingDataTable render #1')
      );

      consoleSpy.mockRestore();
    });
  });
});

describe('Performance Utilities', () => {
  describe('SelectionManager', () => {
    test('should provide O(1) selection operations', () => {
      const jobIds = Array.from({ length: 1000 }, (_, i) => `job-${i}`);
      const manager = new SelectionManager([], jobIds);

      // Test selection performance
      const start = performance.now();
      
      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        manager.toggleSelection(`job-${i}`);
        manager.isSelected(`job-${i}`);
      }
      
      const end = performance.now();
      
      // Should complete quickly
      expect(end - start).toBeLessThan(50);
    });

    test('should handle selection state correctly', () => {
      const jobIds = ['job-1', 'job-2', 'job-3'];
      const manager = new SelectionManager(['job-1'], jobIds);

      expect(manager.isSelected('job-1')).toBe(true);
      expect(manager.isSelected('job-2')).toBe(false);

      const state = manager.getSelectionState();
      expect(state.selectedCount).toBe(1);
      expect(state.totalCount).toBe(3);
      expect(state.isAllSelected).toBe(false);
      expect(state.isPartiallySelected).toBe(true);
    });
  });

  describe('Date Formatting Cache', () => {
    test('should cache date formatting results', () => {
      const testDate = '2023-01-01T00:00:00.000Z';
      
      // Clear cache first
      clearDateFormatCache();
      
      // First call
      const result1 = formatJobDate(testDate);
      
      // Second call should return same result
      const result2 = formatJobDate(testDate);
      
      expect(result1).toEqual(result2);
      expect(result1.relative).toBeDefined();
      expect(result1.absolute).toBeDefined();
    });

    test('should handle cache size limits', () => {
      // Clear cache first
      clearDateFormatCache();
      
      // Add many entries to test LRU behavior
      const dates = Array.from({ length: 1500 }, (_, i) => 
        new Date(2023, 0, i + 1).toISOString()
      );
      
      dates.forEach(date => formatJobDate(date));
      
      // Should not throw errors and should handle cache size limits
      expect(() => formatJobDate(dates[0])).not.toThrow();
    });
  });

  describe('Badge Configuration', () => {
    test('should return consistent badge configurations', () => {
      const pendingConfig = getStatusBadgeConfig('pending');
      const completedConfig = getStatusBadgeConfig('completed');
      const failedConfig = getStatusBadgeConfig('failed');

      expect(pendingConfig.variant).toBe('secondary');
      expect(completedConfig.variant).toBe('default');
      expect(failedConfig.variant).toBe('destructive');

      expect(pendingConfig.icon).toBe('Clock');
      expect(completedConfig.icon).toBe('CheckCircle');
      expect(failedConfig.icon).toBe('XCircle');
    });
  });
}); 