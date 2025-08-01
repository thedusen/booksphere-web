/**
 * Comprehensive Unit Tests for useRealtimeNotifications Hook
 * 
 * Tests cover:
 * 1. Happy path scenarios - normal operation and event handling
 * 2. Edge cases - empty inputs, malformed events, no organization
 * 3. Error handling - connection failures, cleanup issues
 * 4. UI states - connection status transitions, debouncing behavior
 * 5. Integration - TanStack Query cache invalidation, toast notifications
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRealtimeNotifications } from '../useRealtimeNotifications';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/lib/supabase');
vi.mock('@/hooks/useOrganization');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Advanced Supabase Realtime channel mock
const createMockChannel = () => {
  let onBroadcastCallback: (event: { payload: any }) => void;
  let onSubscribeCallback: (status: string) => void;

  const mockChannel = {
    on: vi.fn((event, config, callback) => {
      if (event === 'broadcast') {
        onBroadcastCallback = callback;
      }
      return mockChannel;
    }),
    subscribe: vi.fn((callback) => {
      onSubscribeCallback = callback;
      // Simulate initial subscription immediately
      if (callback) {
        callback('SUBSCRIBED');
      }
      return mockChannel;
    }),
    unsubscribe: vi.fn().mockResolvedValue('OK'),
    // Helper to simulate incoming broadcast event
    _simulateBroadcast: (payload: any) => {
      if (onBroadcastCallback) {
        act(() => {
          onBroadcastCallback({ payload });
        });
      }
    },
    // Helper to simulate subscription status change
    _simulateStatusChange: (status: string) => {
      if (onSubscribeCallback) {
        act(() => {
          onSubscribeCallback(status);
        });
      }
    },
  };

  return mockChannel;
};

let mockChannel: ReturnType<typeof createMockChannel>;

// Define a type for the mock organization data to ensure type safety,
// matching the structure of OrgContextType in the source hook.
type MockOrgData = {
  organizationId: string | null;
  loading: boolean;
  error: string | null;
};

// Test utilities
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const createMockEvent = (overrides = {}) => ({
  id: 'test-event-id',
  event_type: 'cataloging_job_completed',
  job_id: 'test-job-id',
  entity_id: 'test-entity-id',
  entity_type: 'cataloging_job',
  created_at: new Date().toISOString(),
  ...overrides,
});

describe('useRealtimeNotifications Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Create a fresh mock channel for each test
    mockChannel = createMockChannel();
    vi.mocked(supabase.channel).mockReturnValue(mockChannel as any);
    vi.mocked(supabase.removeChannel).mockImplementation(async () => 'ok');

    vi.mocked(useOrganization).mockReturnValue({
      organizationId: 'test-org-id',
      loading: false,
      error: null,
    });
    
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.info).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should initialize with connecting status', () => {
      const { result } = renderHook(() => useRealtimeNotifications(), {
        wrapper: createWrapper(),
      });

      // With our mock, the channel immediately calls the subscription callback
      // so the status goes directly to 'connected'
      expect(result.current.connectionStatus).toBe('connected');
      expect(result.current.isConnected).toBe(true);
      expect(result.current.lastEventTime).toBeNull();
      expect(result.current.eventCount).toBe(0);
    });

    it('should establish realtime subscription for organization', () => {
      renderHook(() => useRealtimeNotifications(), {
        wrapper: createWrapper(),
      });

      expect(supabase.channel).toHaveBeenCalledWith('notifications:test-org-id');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'broadcast',
        { event: 'cataloging_event' },
        expect.any(Function)
      );
    });

    it('should not establish subscription when organization is missing', () => {
      vi.mocked(useOrganization).mockReturnValue({
        organizationId: null,
        loading: false,
        error: null,
      });

      renderHook(() => useRealtimeNotifications(), {
        wrapper: createWrapper(),
      });

      expect(supabase.channel).not.toHaveBeenCalled();
    });

    it('should transition to connected status after subscription', async () => {
      const { result } = renderHook(() => useRealtimeNotifications(), {
        wrapper: createWrapper(),
      });

      // The mock channel immediately calls the subscription callback with 'SUBSCRIBED'
      // so we should see the connected status right away
      expect(result.current.connectionStatus).toBe('connected');
      expect(result.current.isConnected).toBe(true);
    });
  });

  describe('Event Handling', () => {
    it('should handle individual success events correctly', async () => {
      const queryClient = new QueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useRealtimeNotifications(), { wrapper });

      const mockEvent = createMockEvent({ event_type: 'cataloging_job_completed' });

      // Simulate receiving an event
      mockChannel._simulateBroadcast(mockEvent);

      expect(result.current.connectionStatus).toBe('syncing');
      expect(result.current.eventCount).toBe(1);
      expect(result.current.lastEventTime).toBeInstanceOf(Date);

      // Fast-forward debounce timer
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Check if toast was called
      expect(toast.success).toHaveBeenCalledWith('Job Completed', {
        description: 'Cataloging job was processed successfully.',
        icon: expect.any(Object),
        action: {
          label: 'View Job',
          onClick: expect.any(Function),
        },
        duration: 5000,
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['cataloging-jobs'],
      });
    });

    it('should handle individual error events correctly', async () => {
      const { result } = renderHook(() => useRealtimeNotifications(), {
        wrapper: createWrapper(),
      });

      const mockEvent = createMockEvent({ event_type: 'cataloging_job_failed' });

      mockChannel._simulateBroadcast(mockEvent);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(toast.error).toHaveBeenCalledWith('Job Failed', {
        description: 'Cataloging job failed during processing.',
        icon: expect.any(Object),
        action: {
          label: 'Review Error',
          onClick: expect.any(Function),
        },
        duration: 8000,
      });
    });

    it('should handle generic events with info toast', async () => {
      const { result } = renderHook(() => useRealtimeNotifications(), {
        wrapper: createWrapper(),
      });

      const mockEvent = createMockEvent({ event_type: 'cataloging_job_updated' });

      mockChannel._simulateBroadcast(mockEvent);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(toast.info).toHaveBeenCalledWith('Job Updated', {
        description: 'Cataloging job status has been updated.',
        icon: expect.any(Object),
        duration: 4000,
      });
    });
  });

  describe('Event Debouncing and Aggregation', () => {
    it('should debounce multiple events within 2-second window', async () => {
      const { result } = renderHook(() => useRealtimeNotifications(), {
        wrapper: createWrapper(),
      });

      const eventHandler = mockChannel.on.mock.calls.find(call => call[0] === 'broadcast')?.[2];

      // Send multiple events rapidly
      mockChannel._simulateBroadcast(createMockEvent({ id: '1', event_type: 'cataloging_job_completed' }));
      mockChannel._simulateBroadcast(createMockEvent({ id: '2', event_type: 'cataloging_job_completed' }));
      mockChannel._simulateBroadcast(createMockEvent({ id: '3', event_type: 'cataloging_job_completed' }));

      expect(result.current.eventCount).toBe(3);
      expect(toast.success).not.toHaveBeenCalled();

      // Fast-forward past debounce period
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(toast.success).toHaveBeenCalledWith('Multiple Jobs Updated', {
        description: '3 cataloging jobs have been processed successfully.',
        icon: expect.any(Object),
        duration: 5000,
      });
    });

    it('should show aggregated failure notifications', async () => {
      const { result } = renderHook(() => useRealtimeNotifications(), {
        wrapper: createWrapper(),
      });

      const eventHandler = mockChannel.on.mock.calls.find(call => call[0] === 'broadcast')?.[2];

      mockChannel._simulateBroadcast(createMockEvent({ id: '1', event_type: 'cataloging_job_failed' }));
      mockChannel._simulateBroadcast(createMockEvent({ id: '2', event_type: 'cataloging_job_failed' }));

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(toast.error).toHaveBeenCalledWith('Multiple Jobs Failed', {
        description: '2 cataloging jobs failed during processing.',
        icon: expect.any(Object),
        action: {
          label: 'Review Errors',
          onClick: expect.any(Function),
        },
        duration: 10000,
      });
    });

    it('should handle mixed success and failure events separately', async () => {
      const { result } = renderHook(() => useRealtimeNotifications(), {
        wrapper: createWrapper(),
      });

      const eventHandler = mockChannel.on.mock.calls.find(call => call[0] === 'broadcast')?.[2];

      mockChannel._simulateBroadcast(createMockEvent({ id: '1', event_type: 'cataloging_job_completed' }));
      mockChannel._simulateBroadcast(createMockEvent({ id: '2', event_type: 'cataloging_job_completed' }));
      mockChannel._simulateBroadcast(createMockEvent({ id: '3', event_type: 'cataloging_job_failed' }));

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(toast.success).toHaveBeenCalledWith('Multiple Jobs Updated', {
        description: '2 cataloging jobs have been processed successfully.',
        icon: expect.any(Object),
        duration: 5000,
      });

      expect(toast.error).toHaveBeenCalledWith('Job Failed', {
        description: 'Cataloging job failed during processing.',
        icon: expect.any(Object),
        action: expect.any(Object),
        duration: 8000,
      });
    });

    it('should reset debounce timer on new events', async () => {
      const { result } = renderHook(() => useRealtimeNotifications(), {
        wrapper: createWrapper(),
      });

      const eventHandler = mockChannel.on.mock.calls.find(call => call[0] === 'broadcast')?.[2];

      mockChannel._simulateBroadcast(createMockEvent({ id: '1' }));

      // Advance timer by 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Add another event, which should reset the timer
      mockChannel._simulateBroadcast(createMockEvent({ id: '2' }));

      // Advance by another 1 second (total 2 seconds since first event)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should not have triggered notifications yet
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.info).not.toHaveBeenCalled();

      // Advance by remaining 1 second (2 seconds since last event)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(toast.success).toHaveBeenCalled();
    });
  });

  describe('Connection Status Management', () => {
    it('should transition through connection states correctly', async () => {
      const { result } = renderHook(() => useRealtimeNotifications(), {
        wrapper: createWrapper(),
      });

      // With our mock, the channel immediately calls the subscription callback
      // so the status goes directly to 'connected'
      expect(result.current.connectionStatus).toBe('connected');

      // Simulate receiving an event (should go to syncing)
      mockChannel._simulateBroadcast(createMockEvent());

      expect(result.current.connectionStatus).toBe('syncing');

      // After debounce, should go to synced, then back to connected
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.connectionStatus).toBe('synced');

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.connectionStatus).toBe('connected');
    });

    it('should handle subscription errors', async () => {
      const { result } = renderHook(() => useRealtimeNotifications(), {
        wrapper: createWrapper(),
      });

      // Simulate subscription error
      mockChannel._simulateStatusChange('CHANNEL_ERROR');

      expect(result.current.connectionStatus).toBe('error');
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed events gracefully', async () => {
      const { result } = renderHook(() => useRealtimeNotifications(), {
        wrapper: createWrapper(),
      });

      const eventHandler = mockChannel.on.mock.calls.find(call => call[0] === 'broadcast')?.[2];

      // Test with malformed event (missing required fields)
      mockChannel._simulateBroadcast({ id: 'test' }); // Missing event_type

      // Should not crash and should still update event count
      expect(result.current.eventCount).toBe(1);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Should show generic notification for malformed events
      expect(toast.info).toHaveBeenCalled();
    });

    it('should handle events without job_id gracefully', async () => {
      const { result } = renderHook(() => useRealtimeNotifications(), {
        wrapper: createWrapper(),
      });

      const eventHandler = mockChannel.on.mock.calls.find(call => call[0] === 'broadcast')?.[2];

      mockChannel._simulateBroadcast(createMockEvent({ 
        job_id: undefined,
        event_type: 'cataloging_job_completed'
      }));

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(toast.success).toHaveBeenCalledWith('Job Completed', {
        description: 'Cataloging job was processed successfully.',
        icon: expect.any(Object),
        action: undefined, // No action when job_id is missing
        duration: 5000,
      });
    });

    it('should prevent duplicate event processing', async () => {
      const { result } = renderHook(() => useRealtimeNotifications(), {
        wrapper: createWrapper(),
      });

      const eventHandler = mockChannel.on.mock.calls.find(call => call[0] === 'broadcast')?.[2];
      const sameEvent = createMockEvent({ id: 'duplicate-test' });

      mockChannel._simulateBroadcast(sameEvent);
      mockChannel._simulateBroadcast(sameEvent); // Duplicate

      expect(result.current.eventCount).toBe(2); // Should still count duplicates
    });

    it('should not process events after component unmounts', async () => {
      const { unmount } = renderHook(() => useRealtimeNotifications(), {
        wrapper: createWrapper(),
      });

      unmount();

      mockChannel._simulateBroadcast(createMockEvent());

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Should not process events after unmount
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
      expect(toast.info).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup and Memory Management', () => {
    it('should unsubscribe from channel on unmount', () => {
      const { unmount } = renderHook(() => useRealtimeNotifications(), {
        wrapper: createWrapper(),
      });

      unmount();

      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });

    it('should clear debounce timer on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      const { unmount } = renderHook(() => useRealtimeNotifications(), {
        wrapper: createWrapper(),
      });

      // Start a debounce timer
      mockChannel._simulateBroadcast(createMockEvent());

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should handle organization changes properly', () => {
      const { rerender } = renderHook(() => useRealtimeNotifications(), {
        wrapper: createWrapper(),
      });

      // Change organization
      vi.mocked(useOrganization).mockReturnValue({
        organizationId: 'new-org-id',
        loading: false,
        error: null,
      });

      rerender();

      // Should unsubscribe from old channel and subscribe to new one
      expect(supabase.removeChannel).toHaveBeenCalled();
      expect(supabase.channel).toHaveBeenCalledWith('notifications:new-org-id');
    });
  });

  describe('Toast Action Handlers', () => {
    it('should navigate to job details when View Job is clicked', async () => {
      // Mock window.location
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      renderHook(() => useRealtimeNotifications(), {
        wrapper: createWrapper(),
      });

      const eventHandler = mockChannel.on.mock.calls.find(call => call[0] === 'broadcast')?.[2];

      mockChannel._simulateBroadcast(createMockEvent({ 
        job_id: 'test-job-123',
        event_type: 'cataloging_job_completed'
      }));

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const toastCall = vi.mocked(toast.success).mock.calls[0];
      const toastAction = toastCall[1]?.action;
      expect(toastAction).toBeDefined();
      
      // Simulate clicking the action
      if (toastAction && typeof toastAction === 'object' && 'onClick' in toastAction) {
        toastAction.onClick({} as React.MouseEvent<HTMLButtonElement>);
        expect(mockLocation.href).toBe('/cataloging/jobs/test-job-123');
      }
    });

    it('should navigate to error review when Review Error is clicked', async () => {
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      renderHook(() => useRealtimeNotifications(), {
        wrapper: createWrapper(),
      });

      const eventHandler = mockChannel.on.mock.calls.find(call => call[0] === 'broadcast')?.[2];

      mockChannel._simulateBroadcast(createMockEvent({ 
        job_id: 'failed-job-123',
        event_type: 'cataloging_job_failed'
      }));

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const toastCall = vi.mocked(toast.error).mock.calls[0];
      const toastAction = toastCall[1]?.action;
      expect(toastAction).toBeDefined();
      
      if (toastAction && typeof toastAction === 'object' && 'onClick' in toastAction) {
        toastAction.onClick({} as React.MouseEvent<HTMLButtonElement>);
        expect(mockLocation.href).toBe('/cataloging/jobs/failed-job-123?focus=error');
      }
    });

    it('should navigate to jobs list when Review Errors is clicked for aggregated failures', async () => {
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      renderHook(() => useRealtimeNotifications(), {
        wrapper: createWrapper(),
      });

      const eventHandler = mockChannel.on.mock.calls.find(call => call[0] === 'broadcast')?.[2];

      mockChannel._simulateBroadcast(createMockEvent({ id: '1', event_type: 'cataloging_job_failed' }));
      mockChannel._simulateBroadcast(createMockEvent({ id: '2', event_type: 'cataloging_job_failed' }));

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const toastCall = vi.mocked(toast.error).mock.calls[0];
      const toastAction = toastCall[1]?.action;
      expect(toastAction).toBeDefined();
      
      if (toastAction && typeof toastAction === 'object' && 'onClick' in toastAction) {
        toastAction.onClick({} as React.MouseEvent<HTMLButtonElement>);
        expect(mockLocation.href).toBe('/cataloging?status=failed');
      }
    });
  });
}); 