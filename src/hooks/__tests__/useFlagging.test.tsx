/**
 * Unit tests for useFlagging hook
 * 
 * Tests cover:
 * 1. Happy path scenarios
 * 2. Edge cases (empty inputs, null values)
 * 3. Error handling and recovery
 * 4. Data validation
 * 5. Query invalidation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { 
  useCreateFlag, 
  useUpdateFlagStatus, 
  useFlagsForRecord, 
  usePaginatedFlags 
} from '../useFlagging'
import { supabase } from '@/lib/supabase'
import { FlagType, FlagSeverity, FlagStatus } from '@/lib/types/flags'
import { createMockFlagFormData, createMockFlag } from '../../test/utils/test-utils'

// Mock Supabase
vi.mock('@/lib/supabase')

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useFlagging Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('useCreateFlag', () => {
    it('should create a flag successfully with valid data', async () => {
      const mockResponse = { data: { id: 'new-flag-id' }, error: null }
      vi.mocked(supabase.rpc).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useCreateFlag(), {
        wrapper: createWrapper(),
      })

      const flagData = createMockFlagFormData()
      
      await waitFor(() => {
        result.current.mutate(flagData)
      })

      expect(supabase.rpc).toHaveBeenCalledWith('create_data_quality_flag', {
        p_table_name: flagData.table_name,
        p_record_id: flagData.record_id,
        p_flag_type: flagData.flag_type,
        p_severity: flagData.severity,
        p_field_name: flagData.field_name,
        p_status: 'open',
        p_description: flagData.description,
        p_suggested_value: flagData.suggested_value,
        p_details: flagData.details,
      })
    })

    it('should handle validation errors for invalid input', async () => {
      const { result } = renderHook(() => useCreateFlag(), {
        wrapper: createWrapper(),
      })

      const invalidData = {
        table_name: '', // Invalid: empty string
        record_id: 'test-id',
        flag_type: 'invalid_type' as FlagType, // Invalid enum value
        severity: FlagSeverity.MEDIUM,
      }

      await waitFor(() => {
        result.current.mutate(invalidData)
      })

      expect(result.current.error).toBeDefined()
      expect(supabase.rpc).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database connection failed')
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: mockError })

      const { result } = renderHook(() => useCreateFlag(), {
        wrapper: createWrapper(),
      })

      const flagData = createMockFlagFormData()

      await waitFor(() => {
        result.current.mutate(flagData)
      })

      expect(result.current.error).toBe(mockError)
    })

    it('should handle null/undefined optional fields correctly', async () => {
      const mockResponse = { data: { id: 'new-flag-id' }, error: null }
      vi.mocked(supabase.rpc).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useCreateFlag(), {
        wrapper: createWrapper(),
      })

      const minimalFlagData = {
        table_name: 'books',
        record_id: 'test-record-id',
        flag_type: FlagType.INCORRECT_DATA,
        severity: FlagSeverity.MEDIUM,
        // No optional fields
      }

      await waitFor(() => {
        result.current.mutate(minimalFlagData)
      })

      expect(supabase.rpc).toHaveBeenCalledWith('create_data_quality_flag', {
        p_table_name: 'books',
        p_record_id: 'test-record-id',
        p_flag_type: FlagType.INCORRECT_DATA,
        p_severity: FlagSeverity.MEDIUM,
        p_field_name: null,
        p_status: 'open',
        p_description: null,
        p_suggested_value: null,
        p_details: null,
      })
    })

    it('should invalidate relevant queries after successful creation', async () => {
      const mockResponse = { data: { id: 'new-flag-id' }, error: null }
      vi.mocked(supabase.rpc).mockResolvedValue(mockResponse)
      
      const queryClient = new QueryClient()
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )

      const { result } = renderHook(() => useCreateFlag(), { wrapper })

      const flagData = createMockFlagFormData()

      await waitFor(() => {
        result.current.mutate(flagData)
      })

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['flags', flagData.table_name, flagData.record_id]
      })
    })
  })

  describe('useUpdateFlagStatus', () => {
    it('should update flag status successfully', async () => {
      const mockResponse = { data: { success: true }, error: null }
      vi.mocked(supabase.rpc).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useUpdateFlagStatus(), {
        wrapper: createWrapper(),
      })

      const updateData = {
        flag_id: 'test-flag-id',
        status: FlagStatus.RESOLVED,
        resolution_notes: 'Issue resolved',
        reviewed_by: 'admin-user-id',
      }

      await waitFor(() => {
        result.current.mutate(updateData)
      })

      expect(supabase.rpc).toHaveBeenCalledWith('update_flag_status', {
        p_flag_id: updateData.flag_id,
        p_status: updateData.status,
        p_resolution_notes: updateData.resolution_notes,
        p_reviewed_by: updateData.reviewed_by,
      })
    })

    it('should validate UUID format for flag_id', async () => {
      const { result } = renderHook(() => useUpdateFlagStatus(), {
        wrapper: createWrapper(),
      })

      const invalidUpdateData = {
        flag_id: 'invalid-uuid', // Invalid UUID format
        status: FlagStatus.RESOLVED,
      }

      await waitFor(() => {
        result.current.mutate(invalidUpdateData)
      })

      expect(result.current.error).toBeDefined()
      expect(supabase.rpc).not.toHaveBeenCalled()
    })

    it('should handle optional fields correctly', async () => {
      const mockResponse = { data: { success: true }, error: null }
      vi.mocked(supabase.rpc).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useUpdateFlagStatus(), {
        wrapper: createWrapper(),
      })

      const minimalUpdateData = {
        flag_id: '123e4567-e89b-12d3-a456-426614174000',
        status: FlagStatus.REJECTED,
        // No optional fields
      }

      await waitFor(() => {
        result.current.mutate(minimalUpdateData)
      })

      expect(supabase.rpc).toHaveBeenCalledWith('update_flag_status', {
        p_flag_id: minimalUpdateData.flag_id,
        p_status: minimalUpdateData.status,
        p_resolution_notes: null,
        p_reviewed_by: null,
      })
    })
  })

  describe('useFlagsForRecord', () => {
    it('should fetch flags for a specific record', async () => {
      const mockFlags = [
        createMockFlag({ record_id: 'target-record-id' }),
        createMockFlag({ record_id: 'other-record-id' }),
        createMockFlag({ record_id: 'target-record-id', field_name: 'author' }),
      ]
      
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockFlags, error: null })

      const { result } = renderHook(
        () => useFlagsForRecord('books', 'target-record-id'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Should filter to only flags for the target record
      expect(result.current.data).toHaveLength(2)
      expect(result.current.data?.every(flag => flag.record_id === 'target-record-id')).toBe(true)
    })

    it('should be disabled when enabled=false', () => {
      const { result } = renderHook(
        () => useFlagsForRecord('books', 'test-record-id', false),
        { wrapper: createWrapper() }
      )

      expect(result.current.isFetching).toBe(false)
      expect(supabase.rpc).not.toHaveBeenCalled()
    })

    it('should handle empty results', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null })

      const { result } = renderHook(
        () => useFlagsForRecord('books', 'nonexistent-record'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual([])
    })

    it('should handle null data from RPC', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null })

      const { result } = renderHook(
        () => useFlagsForRecord('books', 'test-record-id'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual([])
    })
  })

  describe('usePaginatedFlags', () => {
    it('should fetch paginated flags with default parameters', async () => {
      const mockFlags = [createMockFlag(), createMockFlag()]
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockFlags, error: null })

      const { result } = renderHook(() => usePaginatedFlags({}), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(supabase.rpc).toHaveBeenCalledWith('get_paginated_flags', {
        p_limit: 20,
        p_offset: 0,
        p_status: null,
        p_table_name: null,
        p_severity: null,
        p_search: null,
        p_sort_by: 'created_at',
        p_sort_dir: 'desc',
      })

      expect(result.current.data).toEqual(mockFlags)
    })

    it('should handle custom pagination parameters', async () => {
      const mockFlags = [createMockFlag()]
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockFlags, error: null })

      const { result } = renderHook(
        () => usePaginatedFlags({
          limit: 50,
          offset: 100,
          status: 'open',
          table_name: 'books',
          severity: 'high',
          search: 'test search',
          sort_by: 'severity',
          sort_dir: 'asc',
        }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(supabase.rpc).toHaveBeenCalledWith('get_paginated_flags', {
        p_limit: 50,
        p_offset: 100,
        p_status: 'open',
        p_table_name: 'books',
        p_severity: 'high',
        p_search: 'test search',
        p_sort_by: 'severity',
        p_sort_dir: 'asc',
      })
    })

    it('should handle boundary conditions for pagination', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null })

      const { result } = renderHook(
        () => usePaginatedFlags({ limit: 0, offset: -1 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(supabase.rpc).toHaveBeenCalledWith('get_paginated_flags', {
        p_limit: 0,
        p_offset: -1,
        p_status: null,
        p_table_name: null,
        p_severity: null,
        p_search: null,
        p_sort_by: 'created_at',
        p_sort_dir: 'desc',
      })
    })

    it('should handle RPC errors', async () => {
      const mockError = new Error('RPC failed')
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: mockError })

      const { result } = renderHook(() => usePaginatedFlags({}), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(mockError)
    })

    it('should handle null data gracefully', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null })

      const { result } = renderHook(() => usePaginatedFlags({}), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual([])
    })
  })

  describe('Error Recovery Scenarios', () => {
    it('should allow retry after failed mutation', async () => {
      // First call fails
      vi.mocked(supabase.rpc)
        .mockResolvedValueOnce({ data: null, error: new Error('Network error') })
        .mockResolvedValueOnce({ data: { id: 'success' }, error: null })

      const { result } = renderHook(() => useCreateFlag(), {
        wrapper: createWrapper(),
      })

      const flagData = createMockFlagFormData()

      // First attempt fails
      await waitFor(() => {
        result.current.mutate(flagData)
      })
      expect(result.current.error).toBeDefined()

      // Retry succeeds
      await waitFor(() => {
        result.current.mutate(flagData)
      })
      expect(result.current.isSuccess).toBe(true)
    })

    it('should handle network timeout gracefully', async () => {
      vi.mocked(supabase.rpc).mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )

      const { result } = renderHook(() => useCreateFlag(), {
        wrapper: createWrapper(),
      })

      const flagData = createMockFlagFormData()

      await waitFor(() => {
        result.current.mutate(flagData)
      })

      expect(result.current.error?.message).toBe('Timeout')
    })
  })
}) 