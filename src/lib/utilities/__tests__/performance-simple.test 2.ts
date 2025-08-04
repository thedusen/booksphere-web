/**
 * Basic Unit Tests for Performance Utilities
 * 
 * Tests focus on core functionality that actually exists:
 * - Date formatting and caching
 * - Selection manager functionality
 * - Basic utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  formatJobDate, 
  clearDateFormatCache,
  SelectionManager,
  createDebouncedFunction
} from '../performance';

// Mock date-fns for consistent testing
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn((date, options) => {
    if (options?.addSuffix) {
      return '2 hours ago';
    }
    return '2 hours';
  })
}));

describe('Performance Utilities - Core Functions', () => {
  beforeEach(() => {
    clearDateFormatCache();
    vi.clearAllMocks();
  });

  describe('formatJobDate', () => {
    it('should format valid date string', () => {
      const result = formatJobDate('2023-01-01T00:00:00Z');
      
      expect(result).toEqual({
        relative: '2 hours ago',
        absolute: expect.any(String)
      });
    });

    it('should handle invalid date string', () => {
      const result = formatJobDate('invalid-date');
      
      expect(result).toEqual({
        relative: 'Invalid date',
        absolute: 'Invalid date'
      });
    });

    it('should cache date formatting results', () => {
      const dateString = '2023-01-01T00:00:00Z';
      
      // Call twice with same date
      const result1 = formatJobDate(dateString);
      const result2 = formatJobDate(dateString);
      
      expect(result1).toEqual(result2);
      expect(result1).toBe(result2); // Should be same object from cache
    });

    it('should clear cache when requested', () => {
      const dateString = '2023-01-01T00:00:00Z';
      formatJobDate(dateString);
      
      clearDateFormatCache();
      
      // After clearing, should format again (not from cache)
      const result = formatJobDate(dateString);
      expect(result).toBeTruthy();
    });
  });

  describe('SelectionManager', () => {
    let manager: SelectionManager;
    const jobIds = ['job1', 'job2', 'job3', 'job4', 'job5'];

    beforeEach(() => {
      manager = new SelectionManager([], jobIds);
    });

    it('should initialize with empty selection', () => {
      expect(manager.getSelected()).toEqual([]);
      expect(manager.isSelected('job1')).toBe(false);
    });

    it('should initialize with provided selection', () => {
      const selected = ['job1', 'job3'];
      manager = new SelectionManager(selected, jobIds);
      
      expect(manager.getSelected()).toEqual(selected);
      expect(manager.isSelected('job1')).toBe(true);
      expect(manager.isSelected('job2')).toBe(false);
    });

    it('should toggle selection correctly', () => {
      expect(manager.isSelected('job1')).toBe(false);
      
      manager.toggleSelection('job1');
      expect(manager.isSelected('job1')).toBe(true);
      
      manager.toggleSelection('job1');
      expect(manager.isSelected('job1')).toBe(false);
    });

    it('should select all jobs', () => {
      const selected = manager.selectAll();
      
      expect(selected).toHaveLength(jobIds.length);
      expect(selected.every(id => jobIds.includes(id))).toBe(true);
      
      jobIds.forEach(id => {
        expect(manager.isSelected(id)).toBe(true);
      });
    });

    it('should clear all selections', () => {
      manager.selectAll();
      expect(manager.getSelected()).toHaveLength(jobIds.length);
      
      const cleared = manager.clearAll();
      expect(cleared).toEqual([]);
      expect(manager.getSelected()).toEqual([]);
    });

    it('should provide correct selection state', () => {
      // No selection
      let state = manager.getSelectionState();
      expect(state.selectedCount).toBe(0);
      expect(state.totalCount).toBe(jobIds.length);
      expect(state.isAllSelected).toBe(false);
      expect(state.isPartiallySelected).toBe(false);

      // Partial selection
      manager.toggleSelection('job1');
      state = manager.getSelectionState();
      expect(state.selectedCount).toBe(1);
      expect(state.isPartiallySelected).toBe(true);

      // Full selection
      manager.selectAll();
      state = manager.getSelectionState();
      expect(state.isAllSelected).toBe(true);
      expect(state.isPartiallySelected).toBe(false);
    });

    it('should update available IDs and clean up selection', () => {
      manager.selectAll();
      expect(manager.getSelected()).toHaveLength(5);
      
      // Update with fewer IDs
      const newIds = ['job1', 'job2'];
      manager.updateAvailableIds(newIds);
      
      const selected = manager.getSelected();
      expect(selected).toHaveLength(2);
      expect(selected.every(id => newIds.includes(id))).toBe(true);
    });
  });

  describe('createDebouncedFunction', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce function calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = createDebouncedFunction(mockFn, 100);
      
      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');
      
      expect(mockFn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(100);
      
      expect(mockFn).toHaveBeenCalledOnce();
      expect(mockFn).toHaveBeenCalledWith('arg3'); // Should use last arguments
    });

    it('should cancel debounced function', () => {
      const mockFn = vi.fn();
      const debouncedFn = createDebouncedFunction(mockFn, 100);
      
      debouncedFn('test');
      debouncedFn.cancel();
      
      vi.advanceTimersByTime(100);
      
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should handle multiple rapid calls correctly', () => {
      const mockFn = vi.fn();
      const debouncedFn = createDebouncedFunction(mockFn, 100);
      
      // Rapid calls
      for (let i = 0; i < 10; i++) {
        debouncedFn(i);
        vi.advanceTimersByTime(50); // Less than debounce delay
      }
      
      // Only the last call should execute after full delay
      vi.advanceTimersByTime(100);
      
      expect(mockFn).toHaveBeenCalledOnce();
      expect(mockFn).toHaveBeenCalledWith(9);
    });
  });
}); 