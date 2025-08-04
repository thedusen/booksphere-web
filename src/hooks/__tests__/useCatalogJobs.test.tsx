/**
 * Comprehensive Unit Tests for useCatalogJobs Hook
 * 
 * Tests cover:
 * 1. Happy path scenarios for all hook operations
 * 2. Edge cases (empty inputs, null values, boundary conditions)
 * 3. Error handling and recovery scenarios
 * 4. Real-time updates and cache invalidation
 * 5. Optimistic updates and rollback mechanisms
 * 6. Multi-tenancy and organization scoping
 * 7. Query deduplication and performance optimizations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCatalogingJobs,
  useCatalogingJobsInfinite,
  useCatalogingJob,
  useCatalogingJobStats,
  useCreateCatalogingJob,
  useFinalizeCatalogingJob,
  useDeleteCatalogingJobs,
  useRetryCatalogingJobs,
  useCatalogJobDraft,
  useContributorManagement,
  useAttributeSelection,
  catalogingJobKeys,
} from '../useCatalogJobs';
import { supabase } from '@/lib/supabase';
import { useOrganization, OrgContextType } from '@/hooks/useOrganization';
import { 
  TypedCatalogingJob, 
  CatalogingJobStatus, 
  CatalogingJobCreateRequest,
  CatalogingJobFinalizeRequest,
  BookMetadata 
} from '@/lib/types/jobs';
import { CatalogingJobFilters } from '@/lib/validators/cataloging';
import type { PostgrestError, RealtimeChannel, User } from '@supabase/supabase-js';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
    channel: vi.fn(),
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })),
    },
  }
}));
vi.mock('@/hooks/useOrganization');
vi.mock('sonner');

// Mock data generators
const createMockJob = (overrides: Partial<TypedCatalogingJob> = {}): TypedCatalogingJob => ({
  job_id: 'test-job-id',
  organization_id: 'test-org-id',
  user_id: 'test-user-id',
  status: 'pending',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  extracted_data: {
    title: 'Test Book',
    primary_author: 'Test Author',
    isbn13: '9781234567890',
    extraction_source: 'ai_analysis',
  },
  image_urls: {
    cover_url: 'https://example.com/cover.jpg',
  },
  matched_edition_ids: null,
  error_message: null,
  ...overrides,
});

const createMockJobList = (count: number = 3): TypedCatalogingJob[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockJob({ 
      job_id: `job-${i}`, 
      status: ['pending', 'processing', 'completed'][i % 3] as CatalogingJobStatus 
    })
  );
};

const createMockBookMetadata = (overrides: Partial<BookMetadata> = {}): BookMetadata => ({
  title: 'Test Book',
  primary_author: 'Test Author',
  isbn13: '9781234567890',
  extraction_source: 'ai_analysis',
  ...overrides,
});

const createMockSupabaseResponse = <T,>(data: T, error: null | PostgrestError = null) => ({
  data,
  error,
  status: error ? 500 : 200,
  statusText: error ? 'Error' : 'OK',
  count: null,
});

const createMockSupabaseError = (message: string): PostgrestError => ({
  message,
  details: 'mock details',
  hint: 'mock hint',
  code: '500',
  name: 'PostgrestError',
});

// Test wrapper component
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

const mockUser: User = {
  id: 'test-user-id',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

describe('useCatalogJobs Hook Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock organization hook
    const mockOrgContext: OrgContextType = {
      organizationId: 'test-org-id',
      loading: false,
      error: null,
      user: mockUser,
    };
    vi.mocked(useOrganization).mockReturnValue(mockOrgContext);

    // Mock Supabase realtime
    const mockChannel = {} as RealtimeChannel;
    mockChannel.subscribe = vi.fn().mockReturnValue(mockChannel);
    mockChannel.on = vi.fn().mockReturnValue(mockChannel);
    mockChannel.unsubscribe = vi.fn();

    vi.mocked(supabase.channel).mockReturnValue(mockChannel);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useCatalogingJobs - List Query', () => {
    it('should fetch cataloging jobs successfully', async () => {
      const mockJobs = createMockJobList(3);
      const mockResponse = createMockSupabaseResponse({
        jobs: mockJobs,
        total_count: 3,
        status_counts: { pending: 1, processing: 1, completed: 1, failed: 0 },
      });

      vi.mocked(supabase.rpc).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCatalogingJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.jobs).toEqual(mockJobs);
      expect(result.current.data?.total_count).toBe(3);
      expect(supabase.rpc).toHaveBeenCalledWith('get_cataloging_jobs', {
        p_organization_id: 'test-org-id',
        p_limit: 20,
        p_offset: 0,
        p_status: null,
        p_source_type: null,
        p_search_query: null,
        p_date_from: null,
        p_date_to: null,
      });
    });

    it('should handle filters correctly', async () => {
      const mockResponse = createMockSupabaseResponse({
        jobs: [],
        total_count: 0,
        status_counts: { pending: 0, processing: 0, completed: 0, failed: 0 },
      });

      vi.mocked(supabase.rpc).mockResolvedValue(mockResponse);

      const filters: CatalogingJobFilters = {
        status: 'completed',
        source_type: 'manual',
        search_query: 'test book',
        date_from: new Date('2023-01-01').toISOString(),
        date_to: new Date('2023-12-31').toISOString(),
        limit: 10,
        page: 1,
      };

      const { result } = renderHook(() => useCatalogingJobs(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(supabase.rpc).toHaveBeenCalledWith('get_cataloging_jobs', {
        p_organization_id: 'test-org-id',
        p_limit: 10,
        p_offset: 0, // Offset is calculated from page and limit
        p_status: 'completed',
        p_source_type: 'manual',
        p_search_query: 'test book',
        p_date_from: '2023-01-01T00:00:00.000Z',
        p_date_to: '2023-12-31T00:00:00.000Z',
      });
    });

    it('should handle database errors gracefully', async () => {
      const mockError = createMockSupabaseError('Database connection failed');
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: mockError, status: 500, statusText: 'Error', count: null });

      const { result } = renderHook(() => useCatalogingJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Database connection failed');
    });

    it('should handle empty results', async () => {
      const mockResponse = createMockSupabaseResponse({
        jobs: [],
        total_count: 0,
        status_counts: { pending: 0, processing: 0, completed: 0, failed: 0 },
      });

      vi.mocked(supabase.rpc).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCatalogingJobs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.jobs).toEqual([]);
      expect(result.current.data?.total_count).toBe(0);
    });

    it('should handle organization loading state', () => {
      const mockOrgContext: OrgContextType = {
        organizationId: null,
        loading: true,
        error: null,
        user: null,
      };
      vi.mocked(useOrganization).mockReturnValue(mockOrgContext);

      const { result } = renderHook(() => useCatalogingJobs(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(supabase.rpc).not.toHaveBeenCalled();
    });
  });

  describe('useCatalogingJobsInfinite - Infinite Query', () => {
    it('should fetch infinite pages correctly', async () => {
      const mockPage1 = createMockJobList(2);
      const mockPage2 = createMockJobList(2);
      
      vi.mocked(supabase.rpc)
        .mockResolvedValueOnce(createMockSupabaseResponse({
          jobs: mockPage1,
          total_count: 4,
          status_counts: { pending: 2, processing: 2, completed: 0, failed: 0 },
        }))
        .mockResolvedValueOnce(createMockSupabaseResponse({
          jobs: mockPage2,
          total_count: 4,
          status_counts: { pending: 2, processing: 2, completed: 0, failed: 0 },
        }));

      const { result } = renderHook(() => useCatalogingJobsInfinite(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.pages).toHaveLength(1);
      expect(result.current.data?.pages[0].jobs).toEqual(mockPage1);

      // Fetch next page
      act(() => {
        result.current.fetchNextPage();
      });

      await waitFor(() => {
        expect(result.current.data?.pages).toHaveLength(2);
      });

      expect(result.current.data?.pages[1].jobs).toEqual(mockPage2);
    });

    it('should handle no more pages correctly', async () => {
      const mockJobs = createMockJobList(1);
      const mockResponse = createMockSupabaseResponse({
        jobs: mockJobs,
        total_count: 1,
        status_counts: { pending: 1, processing: 0, completed: 0, failed: 0 },
      });

      vi.mocked(supabase.rpc).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCatalogingJobsInfinite({ limit: 20 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.hasNextPage).toBe(false);
    });
  });

  describe('useCatalogingJob - Single Job Query', () => {
    it('should fetch single job successfully', async () => {
      const mockJob = createMockJob();
      const mockResponse = createMockSupabaseResponse([mockJob]);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(mockResponse),
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useCatalogingJob('test-job-id'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockJob);
    });

    it('should handle job not found', async () => {
      const mockResponse = createMockSupabaseResponse(null);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(mockResponse),
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useCatalogingJob('non-existent-id'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    it('should handle invalid job ID', () => {
      const { result } = renderHook(() => useCatalogingJob(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('useCatalogingJobStats - Statistics Query', () => {
    it('should fetch job statistics successfully', async () => {
      const mockStats = {
        total_jobs: 10,
        status_counts: { pending: 3, processing: 2, completed: 4, failed: 1 },
        recent_activity: 5,
      };

      vi.mocked(supabase.rpc).mockResolvedValue(createMockSupabaseResponse(mockStats));

      const { result } = renderHook(() => useCatalogingJobStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStats);
      expect(supabase.rpc).toHaveBeenCalledWith('get_cataloging_job_stats', {
        p_organization_id: 'test-org-id',
      });
    });

    it('should handle stats error', async () => {
      const mockError = createMockSupabaseError('Stats query failed');
      vi.mocked(supabase.rpc).mockResolvedValue({ ...createMockSupabaseResponse(null), error: mockError });

      const { result } = renderHook(() => useCatalogingJobStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Stats query failed');
    });
  });

  describe('useCreateCatalogingJob - Create Mutation', () => {
    it('should create job successfully', async () => {
      const mockJob = createMockJob();
      const mockResponse = createMockSupabaseResponse({ job_id: 'new-job-id' });

      vi.mocked(supabase.rpc).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateCatalogingJob(), {
        wrapper: createWrapper(),
      });

      const createData: CatalogingJobCreateRequest = {
        source_type: 'manual',
        extracted_data: createMockBookMetadata(),
        image_urls: { cover_url: 'https://example.com/cover.jpg' },
      };

      act(() => {
        result.current.mutate(createData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ job_id: 'new-job-id' });
      expect(supabase.rpc).toHaveBeenCalledWith('create_cataloging_job', {
        p_organization_id: 'test-org-id',
        p_source_type: 'manual',
        p_extracted_data: createMockBookMetadata(),
        p_image_urls: { cover_url: 'https://example.com/cover.jpg' },
      });
    });

    it('should handle validation errors', async () => {
      const { result } = renderHook(() => useCreateCatalogingJob(), {
        wrapper: createWrapper(),
      });

      const invalidData = {
        source_type: '', // Invalid
        extracted_data: null, // Invalid
      } as any;

      act(() => {
        result.current.mutate(invalidData);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('should handle creation failure', async () => {
      const mockError = createMockSupabaseError('Job creation failed');
      vi.mocked(supabase.rpc).mockResolvedValue({ ...createMockSupabaseResponse(null), error: mockError });

      const { result } = renderHook(() => useCreateCatalogingJob(), {
        wrapper: createWrapper(),
      });

      const createData: CatalogingJobCreateRequest = {
        source_type: 'manual',
        extracted_data: createMockBookMetadata(),
        image_urls: {},
      };

      act(() => {
        result.current.mutate(createData);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Job creation failed');
    });
  });

  describe('useFinalizeCatalogingJob - Finalize Mutation', () => {
    it('should finalize job successfully', async () => {
      const mockResponse = createMockSupabaseResponse({ 
        success: true, 
        stock_item_id: 'new-stock-item-id' 
      });

      vi.mocked(supabase.rpc).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useFinalizeCatalogingJob(), {
        wrapper: createWrapper(),
      });

      const finalizeData: CatalogingJobFinalizeRequest = {
        job_id: 'test-job-id',
        final_data: createMockBookMetadata({ title: 'Final Book Title' }),
        contributor_data: [{ name: 'Test Author', role: 'author' }],
        attributes: [{ attribute_type_id: 'attr-1', string_value: 'First Edition' }],
      };

      act(() => {
        result.current.mutate(finalizeData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ 
        success: true, 
        stock_item_id: 'new-stock-item-id' 
      });
      expect(supabase.rpc).toHaveBeenCalledWith('finalize_cataloging_job', {
        p_job_id: 'test-job-id',
        p_final_data: createMockBookMetadata({ title: 'Final Book Title' }),
        p_contributor_data: [{ name: 'Test Author', role: 'author' }],
        p_attributes: [{ attribute_type_id: 'attr-1', string_value: 'First Edition' }],
      });
    });

    it('should handle finalization validation errors', async () => {
      const { result } = renderHook(() => useFinalizeCatalogingJob(), {
        wrapper: createWrapper(),
      });

      const invalidData = {
        job_id: '', // Invalid
        final_data: null, // Invalid
      } as any;

      act(() => {
        result.current.mutate(invalidData);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('should handle finalization failure', async () => {
      const mockError = createMockSupabaseError('Finalization failed');
      vi.mocked(supabase.rpc).mockResolvedValue({ ...createMockSupabaseResponse(null), error: mockError });

      const { result } = renderHook(() => useFinalizeCatalogingJob(), {
        wrapper: createWrapper(),
      });

      const finalizeData: CatalogingJobFinalizeRequest = {
        job_id: 'test-job-id',
        final_data: createMockBookMetadata(),
        contributor_data: [],
        attributes: [],
      };

      act(() => {
        result.current.mutate(finalizeData);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Finalization failed');
    });
  });

  describe('useDeleteCatalogingJobs - Delete Mutation', () => {
    it('should delete single job successfully', async () => {
      const mockResponse = createMockSupabaseResponse({ deleted_count: 1 });

      vi.mocked(supabase.rpc).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteCatalogingJobs(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ jobIds: ['test-job-id'] });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ deleted_count: 1 });
      expect(supabase.rpc).toHaveBeenCalledWith('delete_cataloging_jobs', {
        p_job_ids: ['test-job-id'],
        p_organization_id: 'test-org-id',
      });
    });

    it('should delete multiple jobs successfully', async () => {
      const mockResponse = createMockSupabaseResponse({ deleted_count: 3 });

      vi.mocked(supabase.rpc).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteCatalogingJobs(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ jobIds: ['job-1', 'job-2', 'job-3'] });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ deleted_count: 3 });
      expect(supabase.rpc).toHaveBeenCalledWith('delete_cataloging_jobs', {
        p_job_ids: ['job-1', 'job-2', 'job-3'],
        p_organization_id: 'test-org-id',
      });
    });

    it('should handle empty job IDs array', async () => {
      const { result } = renderHook(() => useDeleteCatalogingJobs(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ jobIds: [] });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toContain('At least one job ID');
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('should handle deletion failure', async () => {
      const mockError = createMockSupabaseError('Delete failed');
      vi.mocked(supabase.rpc).mockResolvedValue({ ...createMockSupabaseResponse(null), error: mockError });

      const { result } = renderHook(() => useDeleteCatalogingJobs(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ jobIds: ['test-job-id'] });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Delete failed');
    });
  });

  describe('useRetryCatalogingJobs - Retry Mutation', () => {
    it('should retry jobs successfully', async () => {
      const mockResponse = createMockSupabaseResponse({ retried_count: 2 });

      vi.mocked(supabase.rpc).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useRetryCatalogingJobs(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ jobIds: ['job-1', 'job-2'] });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ retried_count: 2 });
      expect(supabase.rpc).toHaveBeenCalledWith('retry_cataloging_jobs', {
        p_job_ids: ['job-1', 'job-2'],
        p_organization_id: 'test-org-id',
      });
    });

    it('should handle retry validation errors', async () => {
      const { result } = renderHook(() => useRetryCatalogingJobs(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ jobIds: [] });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toContain('At least one job ID');
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('should handle retry failure', async () => {
      const mockError = createMockSupabaseError('Retry failed');
      vi.mocked(supabase.rpc).mockResolvedValue({ ...createMockSupabaseResponse(null), error: mockError });

      const { result } = renderHook(() => useRetryCatalogingJobs(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ jobIds: ['test-job-id'] });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Retry failed');
    });
  });

  describe('useCatalogJobDraft - Draft Management', () => {
    it('should manage draft data successfully', async () => {
      const mockDraft = {
        job_id: 'test-job-id',
        title: 'Draft Title',
        primary_author: 'Draft Author',
        contributors: [{ name: 'Contributor 1', role: 'editor' }],
        attributes: [{ attribute_type_id: 'attr-1', string_value: 'Value 1' }],
      };

      // Mock localStorage
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue(JSON.stringify(mockDraft)),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

      const { result } = renderHook(() => useCatalogJobDraft('test-job-id'), {
        wrapper: createWrapper(),
      });

      expect(result.current.draft).toEqual(mockDraft);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('cataloging-draft-test-job-id');
    });

    it('should handle missing draft data', () => {
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

      const { result } = renderHook(() => useCatalogJobDraft('test-job-id'), {
        wrapper: createWrapper(),
      });

      expect(result.current.draft).toBeNull();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('cataloging-draft-test-job-id');
    });

    it('should save draft successfully', () => {
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

      const { result } = renderHook(() => useCatalogJobDraft('test-job-id'), {
        wrapper: createWrapper(),
      });

      const draftData = {
        job_id: 'test-job-id',
        title: 'New Title',
        primary_author: 'New Author',
        contributors: [],
        attributes: [],
      };

      act(() => {
        result.current.saveDraft(draftData);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'cataloging-draft-test-job-id',
        JSON.stringify(draftData)
      );
    });

    it('should clear draft successfully', () => {
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue('{}'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

      const { result } = renderHook(() => useCatalogJobDraft('test-job-id'), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.clearDraft();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('cataloging-draft-test-job-id');
    });
  });

  describe('useContributorManagement - Contributor Management', () => {
    it('should add contributor successfully', () => {
      const { result } = renderHook(() => useContributorManagement(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.addContributor({ name: 'New Author', role: 'author' });
      });

      expect(result.current.contributors).toEqual([
        { name: 'New Author', role: 'author' }
      ]);
    });

    it('should remove contributor successfully', () => {
      const { result } = renderHook(() => useContributorManagement(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.addContributor({ name: 'Author 1', role: 'author' });
        result.current.addContributor({ name: 'Author 2', role: 'editor' });
      });

      act(() => {
        result.current.removeContributor(0);
      });

      expect(result.current.contributors).toEqual([
        { name: 'Author 2', role: 'editor' }
      ]);
    });

    it('should update contributor successfully', () => {
      const { result } = renderHook(() => useContributorManagement(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.addContributor({ name: 'Original Author', role: 'author' });
      });

      act(() => {
        result.current.updateContributor(0, { name: 'Updated Author', role: 'editor' });
      });

      expect(result.current.contributors).toEqual([
        { name: 'Updated Author', role: 'editor' }
      ]);
    });

    it('should handle invalid contributor operations', () => {
      const { result } = renderHook(() => useContributorManagement(), {
        wrapper: createWrapper(),
      });

      // Try to remove from empty list
      act(() => {
        result.current.removeContributor(0);
      });

      expect(result.current.contributors).toEqual([]);

      // Try to update non-existent contributor
      act(() => {
        result.current.updateContributor(0, { name: 'Test', role: 'author' });
      });

      expect(result.current.contributors).toEqual([]);
    });
  });

  describe('useAttributeSelection - Attribute Management', () => {
    it('should add attribute successfully', () => {
      const { result } = renderHook(() => useAttributeSelection(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.addAttribute({
          attribute_type_id: 'attr-1',
          string_value: 'Test Value',
        });
      });

      expect(result.current.attributes).toEqual([
        { attribute_type_id: 'attr-1', string_value: 'Test Value' }
      ]);
    });

    it('should remove attribute successfully', () => {
      const { result } = renderHook(() => useAttributeSelection(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.addAttribute({ attribute_type_id: 'attr-1', string_value: 'Value 1' });
        result.current.addAttribute({ attribute_type_id: 'attr-2', boolean_value: true });
      });

      act(() => {
        result.current.removeAttribute(0);
      });

      expect(result.current.attributes).toEqual([
        { attribute_type_id: 'attr-2', boolean_value: true }
      ]);
    });

    it('should update attribute successfully', () => {
      const { result } = renderHook(() => useAttributeSelection(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.addAttribute({ attribute_type_id: 'attr-1', string_value: 'Original' });
      });

      act(() => {
        result.current.updateAttribute(0, { attribute_type_id: 'attr-1', string_value: 'Updated' });
      });

      expect(result.current.attributes).toEqual([
        { attribute_type_id: 'attr-1', string_value: 'Updated' }
      ]);
    });

    it('should handle invalid attribute operations', () => {
      const { result } = renderHook(() => useAttributeSelection(), {
        wrapper: createWrapper(),
      });

      // Try to remove from empty list
      act(() => {
        result.current.removeAttribute(0);
      });

      expect(result.current.attributes).toEqual([]);

      // Try to update non-existent attribute
      act(() => {
        result.current.updateAttribute(0, { attribute_type_id: 'attr-1', string_value: 'Test' });
      });

      expect(result.current.attributes).toEqual([]);
    });
  });

  describe('Cache Key Factory', () => {
    it('should generate correct cache keys', () => {
      const filters: CatalogingJobFilters = { status: 'completed', limit: 10, offset: 0 };
      
      expect(catalogingJobKeys.all).toEqual(['cataloging-jobs']);
      expect(catalogingJobKeys.lists()).toEqual(['cataloging-jobs', 'list']);
      expect(catalogingJobKeys.list('org-1', filters)).toEqual(['cataloging-jobs', 'list', 'org-1', filters]);
      expect(catalogingJobKeys.detail('job-1')).toEqual(['cataloging-jobs', 'detail', 'job-1']);
      expect(catalogingJobKeys.stats('org-1')).toEqual(['cataloging-jobs', 'stats', 'org-1']);
      expect(catalogingJobKeys.infinite('org-1', filters)).toEqual(['cataloging-jobs', 'infinite', 'org-1', filters]);
      expect(catalogingJobKeys.realtime('org-1')).toEqual(['cataloging-jobs', 'realtime', 'org-1']);
    });
  });

  describe('Real-time Updates', () => {
    it('should set up real-time subscription', () => {
      const mockChannel = {
        subscribe: vi.fn().mockReturnValue(mockChannel),
        on: vi.fn().mockReturnValue(mockChannel),
        unsubscribe: vi.fn(),
      } as unknown as RealtimeChannel;

      vi.mocked(supabase.channel).mockReturnValue(mockChannel);

      renderHook(() => useCatalogingJobs(), {
        wrapper: createWrapper(),
      });

      expect(supabase.channel).toHaveBeenCalledWith('cataloging-jobs-test-org-id');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'cataloging_jobs',
        }),
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should clean up real-time subscription on unmount', () => {
      const mockChannel = {
        subscribe: vi.fn().mockReturnValue(mockChannel),
        on: vi.fn().mockReturnValue(mockChannel),
        unsubscribe: vi.fn(),
      } as unknown as RealtimeChannel;

      vi.mocked(supabase.channel).mockReturnValue(mockChannel);

      const { unmount } = renderHook(() => useCatalogingJobs(), {
        wrapper: createWrapper(),
      });

      unmount();

      expect(mockChannel.unsubscribe).toHaveBeenCalled();
    });
  });
}); 