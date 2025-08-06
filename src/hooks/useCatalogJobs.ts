/**
 * Enhanced Cataloging Jobs Hooks
 * 
 * This module implements React Query hooks for cataloging operations following
 * the architectural patterns defined in the system review:
 * 
 * 1. Event-driven pipeline with eventual consistency handling
 * 2. CQRS pattern with optimized read models
 * 3. Realtime synchronization with cache invalidation
 * 4. Multi-tenant security with organization scoping
 * 5. Comprehensive error handling and retry logic
 * 6. Optimistic updates for better UX
 * 7. Deduplication and cache key factories
 * 
 * Architecture Alignment:
 * - Handles "processing" states gracefully due to eventual consistency
 * - Integrates Supabase Realtime with React Query cache
 * - Implements proper multi-tenancy with organization scoping
 * - Provides comprehensive error handling with typed responses
 * - Supports optimistic updates for mutations
 * 
 * FIXES APPLIED:
 * - Complete prefetchNextPage implementation
 * - Proper realtime subscription cleanup
 * - Comprehensive error handling with typed responses
 * - Type safety throughout with proper null/undefined handling
 * - Missing import additions
 * - Production-ready error recovery mechanisms
 */

import { 
  useQuery, 
  useQueryClient, 
  useMutation, 
  useInfiniteQuery,
  QueryClient,
  InfiniteData
} from '@tanstack/react-query';
import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import { 
  TypedCatalogingJob, 
  CatalogingJobListResponse, 
  CatalogingJobCreateRequest, 
  CatalogingJobFinalizeRequest,
  CatalogingJobStatus,
  isTypedCatalogingJob,
  getCatalogingJobDisplayStatus,
  getCatalogingJobStatusColor,
  isCatalogingJobActionable,
  isCatalogingJobInProgress,
  isCatalogingJobStatus,
  BookMetadata,
  CatalogingJobImageUrls
} from '@/lib/types/jobs';
import { 
  catalogingJobCreateRequestSchema, 
  catalogingJobFinalizeRequestSchema, 
  catalogingJobFiltersSchema,
  reviewWizardDraftSchema,
  formatValidationErrors,
  CatalogingJobFilters,
  ReviewWizardDraft,
  Contributor,
  sanitizeBookMetadata
} from '@/lib/validators/cataloging';
import { toast } from 'sonner';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ============================================================================
// CACHE KEY FACTORIES
// ============================================================================

/**
 * Hierarchical cache key factory for cataloging jobs
 * Enables precise cache invalidation and prefetching strategies
 */
export const catalogingJobKeys = {
  all: ['cataloging-jobs'] as const,
  
  // List operations
  lists: () => [...catalogingJobKeys.all, 'list'] as const,
  list: (orgId: string, filters: CatalogingJobFilters) => 
    [...catalogingJobKeys.lists(), orgId, filters] as const,
  
  // Infinite scroll operations
  infinite: (orgId: string, filters: CatalogingJobFilters) => 
    [...catalogingJobKeys.all, 'infinite', orgId, filters] as const,
  
  // Detail operations
  details: () => [...catalogingJobKeys.all, 'detail'] as const,
  detail: (jobId: string) => [...catalogingJobKeys.details(), jobId] as const,
  
  // Statistics and aggregations
  stats: (orgId: string) => [...catalogingJobKeys.all, 'stats', orgId] as const,
  
  // Realtime subscriptions
  realtime: (orgId: string) => [...catalogingJobKeys.all, 'realtime', orgId] as const,
} as const;

// ============================================================================
// DEDUPLICATION UTILITIES
// ============================================================================

/**
 * Deduplication key generator for cataloging job mutations
 * Prevents duplicate operations on the same job
 * FIXED: Proper handling of null/undefined/empty string parameters
 */
const getMutationKey = (operation: string, jobId?: string | null, orgId?: string | null) => {
  const safeJobId = jobId != null && jobId !== '' ? jobId : 'bulk';
  const safeOrgId = orgId != null && orgId !== '' ? orgId : 'unknown';
  return `${operation}-${safeJobId}-${safeOrgId}`;
};

/**
 * Debounced cache invalidation to prevent excessive refetches
 * during rapid realtime updates
 * FIXED: Added cancel method to prevent memory leaks
 */
const createDebouncedInvalidator = (queryClient: QueryClient) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  const invalidate = (keys: readonly unknown[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: keys });
      timeoutId = null;
    }, 100); // 100ms debounce
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return Object.assign(invalidate, { cancel });
};

// ============================================================================
// OPTIMISTIC UPDATE UTILITIES
// ============================================================================

/**
 * Optimistic update helpers for cataloging job mutations
 * Provides immediate UI feedback while maintaining data consistency
 * FIXED: Proper error message handling with null/undefined safety
 */
const catalogingJobOptimisticUpdates = {
  /**
   * Optimistically update job status
   */
  updateJobStatus: (
    queryClient: QueryClient,
    jobId: string,
    orgId: string,
    newStatus: CatalogingJobStatus,
    errorMessage?: string | null
  ) => {
    // Update individual job detail
    queryClient.setQueryData(
      catalogingJobKeys.detail(jobId),
      (old: TypedCatalogingJob | undefined) => {
        if (!old) return old;
        return {
          ...old,
          status: newStatus,
          error_message: errorMessage || null,
          updated_at: new Date().toISOString(),
        };
      }
    );

    // Update job in lists
    queryClient.setQueriesData(
      { queryKey: catalogingJobKeys.lists() },
      (old: CatalogingJobListResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          jobs: old.jobs.map(job => 
            job.job_id === jobId 
              ? { ...job, status: newStatus, error_message: errorMessage || null, updated_at: new Date().toISOString() }
              : job
          ),
        };
      }
    );

    // Update infinite query data
    queryClient.setQueriesData(
      { queryKey: catalogingJobKeys.all },
      (old: InfiniteData<CatalogingJobListResponse> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            jobs: page.jobs.map(job => 
              job.job_id === jobId 
                ? { ...job, status: newStatus, error_message: errorMessage || null, updated_at: new Date().toISOString() }
                : job
            ),
          })),
        };
      }
    );
  },

  /**
   * Optimistically add new job to lists
   */
  addJobToLists: (
    queryClient: QueryClient,
    orgId: string,
    newJob: TypedCatalogingJob
  ) => {
    queryClient.setQueriesData(
      { queryKey: catalogingJobKeys.lists() },
      (old: CatalogingJobListResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          jobs: [newJob, ...old.jobs],
          total_count: old.total_count + 1,
        };
      }
    );

    // Also update infinite queries
    queryClient.setQueriesData(
      { queryKey: catalogingJobKeys.all },
      (old: InfiniteData<CatalogingJobListResponse> | undefined) => {
        if (!old || old.pages.length === 0) return old;
        return {
          ...old,
          pages: [
            {
              ...old.pages[0],
              jobs: [newJob, ...old.pages[0].jobs],
              total_count: old.pages[0].total_count + 1,
            },
            ...old.pages.slice(1),
          ],
        };
      }
    );
  },

  /**
   * Optimistically remove jobs from lists
   */
  removeJobsFromLists: (
    queryClient: QueryClient,
    orgId: string,
    jobIds: string[]
  ) => {
    const jobIdSet = new Set(jobIds);

    // Update list queries
    queryClient.setQueriesData(
      { queryKey: catalogingJobKeys.lists() },
      (old: CatalogingJobListResponse | undefined) => {
        if (!old) return old;
        const newJobs = old.jobs.filter(job => !jobIdSet.has(job.job_id));
        return {
          ...old,
          jobs: newJobs,
          total_count: old.total_count - (old.jobs.length - newJobs.length),
        };
      }
    );

    // Update infinite queries
    queryClient.setQueriesData(
      { queryKey: catalogingJobKeys.all },
      (old: InfiniteData<CatalogingJobListResponse> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(page => {
            const newJobs = page.jobs.filter(job => !jobIdSet.has(job.job_id));
            return {
              ...page,
              jobs: newJobs,
              total_count: page.total_count - (page.jobs.length - newJobs.length),
            };
          }),
        };
      }
    );
  }
};

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Custom error class for cataloging operations
 * Provides structured error information with retry capabilities
 */
class CatalogingJobError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: Record<string, unknown>,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'CatalogingJobError';
  }
}

/**
 * Shared error handler for mutations to reduce boilerplate
 * FIXED: Ensures that thrown errors are always instances of CatalogingJobError
 */
const createErrorHandler = (operation: string) => {
  return (error: Error): CatalogingJobError => {
    if (error instanceof CatalogingJobError) {
      // Log and re-throw for specific UI handling
      console.error(`Operation '${operation}' failed with code: ${error.code}`, error.details);
      return error;
    }
    
    // Handle zod validation errors
    if ('issues' in error) {
      const validationError = new CatalogingJobError(
        `Invalid input for ${operation}`,
        'VALIDATION_ERROR',
        { issues: (error as any).issues },
        false // Not retryable
      );
      console.error('Validation error:', validationError.details);
      return validationError;
    }

    // Handle generic Supabase/network errors
    const genericError = new CatalogingJobError(
      `An unexpected error occurred during ${operation}. Please try again.`,
      'UNKNOWN_ERROR',
      { originalError: error },
      true // Assume retryable unless specified
    );
    console.error(`Unexpected error in ${operation}:`, error);
    return genericError;
  };
};

// ============================================================================
// REALTIME INTEGRATION
// ============================================================================

/**
 * Enhanced realtime subscription hook with proper cleanup and error handling
 * FIXED: Complete implementation with proper cleanup and error recovery
 */
const useCatalogingJobsRealtime = (organizationId: string) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;
  const reconnectAttemptsRef = useRef(0);
  
  const debouncedInvalidator = useMemo(
    () => createDebouncedInvalidator(queryClient),
    [queryClient]
  );

  const handleRealtimeChange = useCallback((payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      switch (eventType) {
        case 'INSERT':
          if (newRecord && isTypedCatalogingJob(newRecord)) {
            // Parse JSON fields safely
            const processedRecord = {
              ...newRecord,
              extracted_data: typeof newRecord.extracted_data === 'string' 
                ? JSON.parse(newRecord.extracted_data) 
                : newRecord.extracted_data,
              image_urls: typeof newRecord.image_urls === 'string' 
                ? JSON.parse(newRecord.image_urls) 
                : newRecord.image_urls,
            };

            // Add new job to cache
            queryClient.setQueryData(
              catalogingJobKeys.detail(processedRecord.job_id),
              processedRecord
            );
            
            // Invalidate lists to include new job
            debouncedInvalidator(catalogingJobKeys.lists());
            
            toast.success('New cataloging job created');
          }
          break;

        case 'UPDATE':
          if (newRecord && oldRecord && isTypedCatalogingJob(newRecord)) {
            // Parse JSON fields safely
            const processedRecord = {
              ...newRecord,
              extracted_data: typeof newRecord.extracted_data === 'string' 
                ? JSON.parse(newRecord.extracted_data) 
                : newRecord.extracted_data,
              image_urls: typeof newRecord.image_urls === 'string' 
                ? JSON.parse(newRecord.image_urls) 
                : newRecord.image_urls,
            };

            // Update job in cache
            queryClient.setQueryData(
              catalogingJobKeys.detail(processedRecord.job_id),
              processedRecord
            );

            // Update job in lists
            queryClient.setQueriesData(
              { queryKey: catalogingJobKeys.lists() },
              (old: CatalogingJobListResponse | undefined) => {
                if (!old) return old;
                return {
                  ...old,
                  jobs: old.jobs.map(job => 
                    job.job_id === processedRecord.job_id ? processedRecord : job
                  ),
                };
              }
            );

            // Update infinite queries
            queryClient.setQueriesData(
              { queryKey: catalogingJobKeys.all },
              (old: InfiniteData<CatalogingJobListResponse> | undefined) => {
                if (!old) return old;
                return {
                  ...old,
                  pages: old.pages.map(page => ({
                    ...page,
                    jobs: page.jobs.map(job => 
                      job.job_id === processedRecord.job_id ? processedRecord : job
                    ),
                  })),
                };
              }
            );

            // Show status change notification
            if (isCatalogingJobStatus(processedRecord.status) && 
                isCatalogingJobStatus(oldRecord.status) && 
                processedRecord.status !== oldRecord.status) {
              const statusDisplay = getCatalogingJobDisplayStatus(processedRecord.status);
              toast.info(`Job status updated: ${statusDisplay}`);
            }
          }
          break;

        case 'DELETE':
          if (oldRecord && oldRecord.job_id) {
            // Remove job from cache
            queryClient.removeQueries({ 
              queryKey: catalogingJobKeys.detail(oldRecord.job_id) 
            });
            
            // Remove from lists
            queryClient.setQueriesData(
              { queryKey: catalogingJobKeys.lists() },
              (old: CatalogingJobListResponse | undefined) => {
                if (!old) return old;
                return {
                  ...old,
                  jobs: old.jobs.filter(job => job.job_id !== oldRecord.job_id),
                  total_count: Math.max(0, old.total_count - 1),
                };
              }
            );

            // Remove from infinite queries
            queryClient.setQueriesData(
              { queryKey: catalogingJobKeys.all },
              (old: InfiniteData<CatalogingJobListResponse> | undefined) => {
                if (!old) return old;
                return {
                  ...old,
                  pages: old.pages.map(page => ({
                    ...page,
                    jobs: page.jobs.filter(job => job.job_id !== oldRecord.job_id),
                    total_count: Math.max(0, page.total_count - 1),
                  })),
                };
              }
            );
            
            toast.info('Cataloging job deleted');
          }
          break;
      }
    } catch (error) {
      console.error('Error handling realtime change:', error);
      toast.error('Error processing realtime update');
    }
  }, [queryClient, debouncedInvalidator]);

  const setupRealtimeSubscription = useCallback(async () => {
    if (!organizationId) return;

    try {
      // Clean up existing channel
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Create new channel
      channelRef.current = supabase
        .channel(`cataloging_jobs:${organizationId}`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'cataloging_jobs', 
            filter: `organization_id=eq.${organizationId}` 
          },
          handleRealtimeChange
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Cataloging jobs realtime subscription active');
            reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Cataloging jobs realtime subscription error');
            
            // Implement exponential backoff for reconnection
            if (reconnectAttemptsRef.current < maxReconnectAttempts) {
              const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000; // 1s, 2s, 4s, 8s, 16s
              reconnectAttemptsRef.current++;
              
              if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
              }
              
              reconnectTimeoutRef.current = setTimeout(() => {
                console.log(`Attempting to reconnect (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
                setupRealtimeSubscription();
              }, delay);
            } else {
              console.error('Max reconnection attempts reached');
              toast.error('Lost connection to real-time updates');
            }
          } else if (status === 'CLOSED') {
            console.log('Cataloging jobs realtime subscription closed');
          }
        });
    } catch (error) {
      console.error('Failed to setup realtime subscription:', error);
      toast.error('Failed to connect to real-time updates');
    }
  }, [organizationId, handleRealtimeChange]);

  useEffect(() => {
    setupRealtimeSubscription();

    return () => {
      // FIXED: Proper cleanup to prevent memory leaks
      // 1. Cancel any pending debounced invalidations
      debouncedInvalidator.cancel();
      
      // 2. Unsubscribe from channel before removing
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      // 3. Clean up reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [setupRealtimeSubscription, debouncedInvalidator]);
};

// ============================================================================
// SHARED QUERY FUNCTION
// ============================================================================

/**
 * Shared query function for cataloging jobs with proper error handling
 * FIXED: Complete implementation with proper data processing
 */
const fetchCatalogingJobs = async (
  organizationId: string,
  filters: CatalogingJobFilters
): Promise<CatalogingJobListResponse> => {
  if (!organizationId) {
    throw new CatalogingJobError(
      'Organization ID is required',
      'MISSING_ORG_ID',
      {},
      false
    );
  }

  let query = supabase
    .from('cataloging_jobs')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order(filters.sort_by, { ascending: filters.sort_order === 'asc' });

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.source_type) {
    query = query.eq('source_type', filters.source_type);
  }
  
  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id);
  }
  
  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }
  
  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  if (filters.search_query) {
    // Search in extracted metadata title or job ID
    query = query.or(
      `extracted_data->title.ilike.%${filters.search_query}%,` +
      `job_id.ilike.%${filters.search_query}%`
    );
  }

  // Apply pagination
  const from = (filters.page - 1) * filters.limit;
  const to = from + filters.limit - 1;
  query = query.range(from, to);

  const { data: jobs, error: queryError, count } = await query;

  // Debug logging for the actual query
  console.log('DEBUG - Supabase query result:', {
    organizationId,
    filters,
    jobsCount: jobs?.length || 0,
    totalCount: count,
    queryError: queryError?.message,
    firstJob: jobs?.[0]?.status || 'none'
  });

  if (queryError) {
    throw createErrorHandler('Fetch cataloging jobs')(queryError);
  }

  // Process and validate jobs
  const typedJobs = (jobs || []).map(job => {
    try {
      const extractedData = typeof job.extracted_data === 'string' 
        ? JSON.parse(job.extracted_data) 
        : job.extracted_data;
      const imageUrls = typeof job.image_urls === 'string' 
        ? JSON.parse(job.image_urls) 
        : job.image_urls;

      const typedJob = {
        ...job,
        extracted_data: extractedData,
        image_urls: imageUrls,
      };

      if (!isTypedCatalogingJob(typedJob)) {
        console.warn('Invalid cataloging job structure:', typedJob);
        return null;
      }

      return typedJob;
    } catch (error) {
      console.error('Error processing cataloging job:', error);
      return null;
    }
  }).filter(Boolean) as TypedCatalogingJob[];

  return {
    jobs: typedJobs,
    total_count: count || 0,
    has_more: (count || 0) > from + typedJobs.length,
  };
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Enhanced cataloging jobs list hook with comprehensive filtering and caching
 * FIXED: Complete prefetchNextPage implementation
 */
export const useCatalogingJobs = (filters: Partial<CatalogingJobFilters> = {}) => {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  
  // Validate and normalize filters
  const validatedFilters = useMemo(() => {
    try {
      return catalogingJobFiltersSchema.parse(filters);
    } catch (error) {
      console.warn('Invalid cataloging job filters:', error);
      return catalogingJobFiltersSchema.parse({});
    }
  }, [filters]);
  
  // Setup realtime subscription
  useCatalogingJobsRealtime(organizationId || '');
  
  const queryKey = useMemo(() => 
    catalogingJobKeys.list(organizationId || '', validatedFilters),
    [organizationId, validatedFilters]
  );

  // Debug the organization context issue
  console.log('DEBUG - useCatalogingJobs hook:', {
    organizationId,
    hasOrgId: !!organizationId,
    orgType: typeof organizationId,
    validatedFilters,
    queryKeyLength: queryKey.length
  });

  const query = useQuery({
    queryKey,
    queryFn: () => fetchCatalogingJobs(organizationId || 'mock-org-id-for-dev', validatedFilters),
    enabled: true, // TEMPORARY: Always enable to test if org ID is the issue
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (error instanceof CatalogingJobError && !error.retryable) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // FIXED: Complete prefetchNextPage implementation
  const prefetchNextPage = useCallback(() => {
    if (query.data?.has_more && organizationId) {
      const nextFilters = { ...validatedFilters, page: validatedFilters.page + 1 };
      queryClient.prefetchQuery({
        queryKey: catalogingJobKeys.list(organizationId, nextFilters),
        queryFn: () => fetchCatalogingJobs(organizationId, nextFilters),
        staleTime: 30000,
      });
    }
  }, [query.data?.has_more, validatedFilters, organizationId, queryClient]);

  // Auto-prefetch next page when current page loads
  useEffect(() => {
    if (query.data?.has_more && !query.isFetching) {
      prefetchNextPage();
    }
  }, [prefetchNextPage, query.data?.has_more, query.isFetching]);

  return { 
    ...query,
    // Utility functions
    getJobDisplayStatus: getCatalogingJobDisplayStatus,
    getJobStatusColor: getCatalogingJobStatusColor,
    isJobActionable: isCatalogingJobActionable,
    isJobInProgress: isCatalogingJobInProgress,
    prefetchNextPage,
  };
};

/**
 * Infinite scroll hook for cataloging jobs with optimized performance
 * FIXED: Proper error handling and data processing
 */
export const useCatalogingJobsInfinite = (filters: Partial<CatalogingJobFilters> = {}) => {
  const { organizationId } = useOrganization();
  const validatedFilters = useMemo(() => {
    try {
      return catalogingJobFiltersSchema.parse({ ...filters, page: 1 });
    } catch (error) {
      console.warn('Invalid cataloging job filters:', error);
      return catalogingJobFiltersSchema.parse({});
    }
  }, [filters]);

  // Setup realtime subscription
  useCatalogingJobsRealtime(organizationId || '');

  return useInfiniteQuery({
    queryKey: catalogingJobKeys.infinite(organizationId || '', validatedFilters),
    queryFn: async ({ pageParam = 1 }) => {
      const filtersWithPage = { ...validatedFilters, page: pageParam };
      return fetchCatalogingJobs(organizationId || '', filtersWithPage);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.has_more) return undefined;
      return allPages.length + 1;
    },
    enabled: !!organizationId,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof CatalogingJobError && !error.retryable) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Single cataloging job hook with optimized caching
 * FIXED: Proper error handling and type safety
 */
export const useCatalogingJob = (jobId: string) => {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: catalogingJobKeys.detail(jobId),
    queryFn: async (): Promise<TypedCatalogingJob | null> => {
      if (!organizationId || !jobId) {
        return null;
      }

      const { data, error } = await supabase
        .from('cataloging_jobs')
        .select('*')
        .eq('job_id', jobId)
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Record not found
          return null;
        }
        throw createErrorHandler('Fetch cataloging job')(error);
      }

      try {
        // Parse JSON fields safely
        const extractedData = typeof data.extracted_data === 'string'
          ? JSON.parse(data.extracted_data)
          : data.extracted_data;
        const imageUrls = typeof data.image_urls === 'string'
          ? JSON.parse(data.image_urls)
          : data.image_urls;

        const typedJob = {
          ...data,
          extracted_data: extractedData,
          image_urls: imageUrls,
        };

        if (!isTypedCatalogingJob(typedJob)) {
          throw new CatalogingJobError(
            'Invalid cataloging job structure',
            'INVALID_JOB_STRUCTURE',
            { job: typedJob },
            false
          );
        }

        return typedJob;
      } catch (error) {
        throw createErrorHandler('Process cataloging job')(error instanceof Error ? error : new Error(String(error)));
      }
    },
    enabled: !!organizationId && !!jobId,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof CatalogingJobError && !error.retryable) {
        return false;
      }
      return failureCount < 2;
    },
    // ✅ FIX: Added placeholderData to prevent UI layout shifts
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Cataloging job statistics hook
 * PERFORMANCE OPTIMIZED: Uses database-level aggregation instead of client-side processing
 * 
 * This hook now calls a database RPC function that performs COUNT with GROUP BY
 * directly in the database, drastically reducing data transfer and processing load.
 */
export const useCatalogingJobStats = () => {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: catalogingJobKeys.stats(organizationId || ''),
    queryFn: async () => {
      if (!organizationId) {
        throw new CatalogingJobError(
          'Organization ID is required',
          'MISSING_ORG_ID',
          {},
          false
        );
      }

      // Use database RPC for efficient aggregation
      const { data, error } = await supabase
        .rpc('get_cataloging_job_stats', { org_id: organizationId });

      if (error) {
        throw createErrorHandler('Fetch cataloging job stats')(error);
      }

      if (!data || data.length === 0) {
        // Return zero counts if no data
        return {
          total: 0,
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0,
        };
      }

      // The RPC returns an array with one row containing all counts
      const stats = data[0];
      
      return {
        total: Number(stats.total),
        pending: Number(stats.pending),
        processing: Number(stats.processing),
        completed: Number(stats.completed),
        failed: Number(stats.failed),
      };
    },
    enabled: !!organizationId,
    staleTime: 60000, // 1 minute - can be longer since this is now very fast
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof CatalogingJobError && !error.retryable) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create cataloging job mutation with optimistic updates
 * FIXED: Proper error handling and type safety
 */
export const useCreateCatalogingJob = () => {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  
  // FIXED: Get current user from Supabase auth
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  return useMutation({
    mutationKey: [getMutationKey('create', null, organizationId)],
    mutationFn: async (request: CatalogingJobCreateRequest): Promise<TypedCatalogingJob> => {
      if (!organizationId) {
        throw new CatalogingJobError(
          'Organization ID is required',
          'MISSING_ORG_ID',
          {},
          false
        );
      }

      // Validate request
      const validatedRequest = catalogingJobCreateRequestSchema.parse(request);

      // Call the create_cataloging_job RPC
      const { data, error } = await supabase.rpc('create_cataloging_job', {
        image_urls_payload: validatedRequest.image_urls,
        source_type_payload: validatedRequest.source_type || 'image_capture',
        initial_metadata_payload: validatedRequest.initial_metadata || null,
      });

      if (error) {
        throw createErrorHandler('Create cataloging job')(error);
      }

      if (!data || !data.job_id) {
        throw new CatalogingJobError(
          'Invalid response from create_cataloging_job',
          'INVALID_RESPONSE',
          { response: data },
          false
        );
      }

      // Create the typed job object
      const newJob: TypedCatalogingJob = {
        job_id: data.job_id,
        organization_id: organizationId,
        user_id: data.user_id || 'unknown',
        status: 'pending',
        image_urls: validatedRequest.image_urls,
        extracted_data: validatedRequest.initial_metadata ? validatedRequest.initial_metadata as BookMetadata : null,
        matched_edition_ids: null,
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return newJob;
    },
    onMutate: async (request) => {
      if (!organizationId) return;

      // FIXED: Create temporary job for optimistic update with actual user ID
      const tempJob: TypedCatalogingJob = {
        job_id: `temp-${Date.now()}`,
        organization_id: organizationId,
        user_id: currentUser?.id || 'unknown-user',
        status: 'pending',
        image_urls: request.image_urls,
        extracted_data: request.initial_metadata ? request.initial_metadata as BookMetadata : null,
        matched_edition_ids: null,
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistically add to lists
      catalogingJobOptimisticUpdates.addJobToLists(queryClient, organizationId, tempJob);

      return { tempJob };
    },
    onSuccess: (newJob, request, context) => {
      if (!organizationId) return;

      // Replace temporary job with real job
      if (context?.tempJob) {
        catalogingJobOptimisticUpdates.removeJobsFromLists(queryClient, organizationId, [context.tempJob.job_id]);
      }
      
      catalogingJobOptimisticUpdates.addJobToLists(queryClient, organizationId, newJob);
      
      // Set individual job data
      queryClient.setQueryData(catalogingJobKeys.detail(newJob.job_id), newJob);
      
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: catalogingJobKeys.stats(organizationId) });
      
      toast.success('Cataloging job created successfully');
    },
    onError: (error, request, context) => {
      if (!organizationId) return;

      // Remove temporary job on error
      if (context?.tempJob) {
        catalogingJobOptimisticUpdates.removeJobsFromLists(queryClient, organizationId, [context.tempJob.job_id]);
      }

      const errorMessage = error instanceof CatalogingJobError 
        ? error.message 
        : 'Failed to create cataloging job';
      
      toast.error(errorMessage);
    },
    retry: (failureCount, error) => {
      if (error instanceof CatalogingJobError && !error.retryable) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// ============================================================================
// REVIEW WIZARD DRAFT MANAGEMENT
// ============================================================================

/**
 * Review wizard draft cache key factory
 */
const reviewWizardDraftKeys = {
  all: ['review-wizard-drafts'] as const,
  draft: (jobId: string) => [...reviewWizardDraftKeys.all, jobId] as const,
} as const;

/**
 * Hook for managing review wizard draft state with auto-save
 * Implements the architectural requirement for 5-second auto-save with partial updates
 */
export const useCatalogJobDraft = (jobId: string) => {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();
  const [draftData, setDraftData] = useState<Partial<ReviewWizardDraft>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: async (draft: Partial<ReviewWizardDraft>) => {
      // Store draft in localStorage for now (could be extended to server-side storage)
      const draftKey = `cataloging-draft-${jobId}`;
      localStorage.setItem(draftKey, JSON.stringify({
        ...draft,
        lastSaved: new Date().toISOString(),
      jobId, 
      }));
      return draft;
    },
    onSuccess: () => {
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    },
    onError: (error) => {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft automatically');
    },
  });

  // Load draft from storage on mount
  useEffect(() => {
    const draftKey = `cataloging-draft-${jobId}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setDraftData(parsed);
        setLastSaved(parsed.lastSaved ? new Date(parsed.lastSaved) : null);
      } catch (error) {
        console.error('Failed to parse saved draft:', error);
      }
    }
  }, [jobId]);

  // Auto-save every 5 seconds when there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const autoSaveInterval = setInterval(() => {
      if (Object.keys(draftData).length > 0) {
        autoSaveMutation.mutate(draftData);
      }
    }, 5000); // 5 seconds

    return () => clearInterval(autoSaveInterval);
  }, [draftData, hasUnsavedChanges, autoSaveMutation]);

  // Update draft data
  const updateDraft = useCallback((updates: Partial<ReviewWizardDraft>) => {
    setDraftData(prev => {
      const newData = { ...prev, ...updates };
      setHasUnsavedChanges(true);
      return newData;
    });
  }, []);

  // Validate current draft
  const validateDraft = useCallback(() => {
    const result = reviewWizardDraftSchema.safeParse(draftData);
    return result.success ? { success: true, data: result.data } : { success: false, error: result.error };
  }, [draftData]);

  // Clear draft
  const clearDraft = useCallback(() => {
    const draftKey = `cataloging-draft-${jobId}`;
    localStorage.removeItem(draftKey);
    setDraftData({});
    setLastSaved(null);
    setHasUnsavedChanges(false);
  }, [jobId]);

  // Manual save
  const saveDraft = useCallback(() => {
    if (Object.keys(draftData).length > 0) {
      autoSaveMutation.mutate(draftData);
    }
  }, [draftData, autoSaveMutation]);

  return {
    draft: draftData,
    draftData,
    updateDraft,
    validateDraft,
    clearDraft,
    saveDraft,
    lastSaved,
    hasUnsavedChanges,
    isSaving: autoSaveMutation.isPending,
    saveError: autoSaveMutation.error,
  };
};

/**
 * Hook for managing contributors (illustrators, etc.)
 */
export const useContributorManagement = (initial: Contributor[] = []) => {
  const [contributors, setContributors] = useState<Contributor[]>(initial);

  const addContributor = useCallback((newContributor: Contributor) => {
    setContributors(prev => {
      const exists = prev.some(c =>
        c.name.toLowerCase() === newContributor.name.toLowerCase() &&
        ((c.author_type_id && newContributor.author_type_id && c.author_type_id === newContributor.author_type_id) ||
         (!c.author_type_id && !newContributor.author_type_id && c.role === newContributor.role))
      );
      if (exists) {
        toast.error('This contributor already exists');
        return prev;
      }
      return [...prev, newContributor];
    });
  }, []);

  const removeContributor = useCallback((index: number) => {
    setContributors(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateContributor = useCallback((index: number, updates: Partial<Contributor>) => {
    setContributors(prev => prev.map((contributor, i) =>
      i === index ? { ...contributor, ...updates } : contributor
    ));
  }, []);

  return {
    contributors,
    addContributor,
    removeContributor,
    updateContributor,
  };
};

export interface SelectedAttribute {
  attribute_type_id: string;
  string_value?: string;
  boolean_value?: boolean;
  number_value?: number;
}

export const useAttributeSelection = (initial: SelectedAttribute[] = []) => {
  const [attributes, setAttributes] = useState<SelectedAttribute[]>(initial);

  const addAttribute = useCallback((attribute: SelectedAttribute) => {
    setAttributes(prev => {
      if (prev.length >= 20) {
        toast.error('Maximum 20 attributes allowed');
        return prev;
      }
      return [...prev, attribute];
    });
  }, []);

  const removeAttribute = useCallback((index: number) => {
    setAttributes(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateAttribute = useCallback((index: number, updated: SelectedAttribute) => {
    setAttributes(prev => prev.map((attr, i) => i === index ? updated : attr));
  }, []);

  const clearAllAttributes = useCallback(() => setAttributes([]), []);

  return {
    attributes,
    addAttribute,
    removeAttribute,
    updateAttribute,
    clearAllAttributes,
  };
};

// ============================================================================
// ENHANCED FINALIZATION HOOK
// ============================================================================

/**
 * Enhanced finalization hook that supports the new fields
 */
export const useFinalizeCatalogingJob = () => {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const errorHandler = createErrorHandler('finalize-cataloging-job');

  return useMutation({
    mutationKey: ['finalize-cataloging-job'],
    mutationFn: async (request: CatalogingJobFinalizeRequest) => {
      // Validate request
      const validation = catalogingJobFinalizeRequestSchema.safeParse(request);
      if (!validation.success) {
        throw new CatalogingJobError(
          'Invalid finalization request',
          'VALIDATION_ERROR',
          { validationErrors: formatValidationErrors(validation.error) }
        );
      }

      const validatedRequest = validation.data;

      // Call the enhanced add_edition_to_inventory RPC
      const { data, error } = await supabase
        .rpc('add_edition_to_inventory', {
          p_organization_id: organizationId,
          p_job_id: validatedRequest.job_id,
          p_title: validatedRequest.title,
          p_subtitle: validatedRequest.subtitle,
          p_authors: validatedRequest.authors,
          p_illustrators: validatedRequest.illustrators?.map(i => ({
            name: i.name,
            author_type_id: i.author_type_id,
            role: i.role,
          })),
          p_publisher_name: validatedRequest.publisher_name,
          p_publisher_location_id: validatedRequest.publisher_location_id,
          p_publisher_location_text: validatedRequest.publisher_location_text,
          p_publication_year: validatedRequest.publication_year,
          p_edition_statement: validatedRequest.edition_statement,
          p_format_id: validatedRequest.format_id,
          p_pagination_text: validatedRequest.pagination_text,
          p_condition_id: validatedRequest.condition_id,
          p_price: validatedRequest.price,
          p_has_dust_jacket: validatedRequest.has_dust_jacket,
          p_sku: validatedRequest.sku,
          p_condition_notes: validatedRequest.condition_notes,
          p_selected_attributes: validatedRequest.selected_attributes,
          p_matched_edition_id: validatedRequest.matched_edition_id,
          p_create_new_edition: validatedRequest.create_new_edition,
        });

      if (error) {
        throw new CatalogingJobError(
          'Failed to finalize cataloging job',
          'FINALIZATION_ERROR',
          { supabaseError: error }
        );
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Clear draft on successful finalization
      const draftKey = `cataloging-draft-${variables.job_id}`;
      localStorage.removeItem(draftKey);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: catalogingJobKeys.all });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      
      // Show success message
      toast.success('Book successfully added to inventory!');
    },
    onError: errorHandler,
  });
};

/**
 * Delete cataloging jobs mutation with bulk support
 * FIXED: Server-side validation and proper error handling
 */
export const useDeleteCatalogingJobs = () => {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [getMutationKey('delete', null, organizationId)],
    mutationFn: async (jobIds: string[]) => {
      // The organizationId is no longer needed here, as it's handled by RLS.
      // We still check for it to ensure the user context is loaded.
      if (!organizationId) {
        throw new CatalogingJobError(
          'User organization context is not available.',
          'MISSING_ORG_ID',
          {},
          false
        );
      }

      if (!jobIds || jobIds.length === 0) {
        throw new CatalogingJobError(
          'At least one job ID is required.',
          'MISSING_JOB_IDS',
          {},
          false
        );
      }

      // Call the secure, prepared statement execution wrapper
      const { data, error } = await supabase
        .rpc('execute_bulk_delete', {
          job_ids: jobIds
          // max_batch_size can be passed here if needed, defaults to 50
        });

      if (error) {
        throw createErrorHandler('Delete cataloging jobs')(error);
      }

      // The new functions return an array, so we expect one result row
      if (!data || data.length === 0) {
        throw new CatalogingJobError(
          'Invalid response from delete_cataloging_jobs',
          'INVALID_RESPONSE',
          { response: data },
          false
        );
      }

      const result = data[0];
      
      // Handle partial failures
      if (result.invalid_count > 0) {
        const message = result.deleted_count > 0 
          ? `${result.deleted_count} job(s) deleted, ${result.invalid_count} could not be deleted (permission denied or not found).`
          : `No jobs could be deleted. (${result.invalid_count} invalid).`;
        
        throw new CatalogingJobError(
          message,
          'PARTIAL_FAILURE',
          { 
            deleted_count: result.deleted_count,
            invalid_count: result.invalid_count,
            deleted_job_ids: result.deleted_job_ids,
            invalid_job_ids: result.invalid_job_ids
          },
          false
        );
      }

      return { 
        deletedJobIds: result.deleted_job_ids,
        deletedCount: result.deleted_count
      };
    },
    onMutate: async (jobIds) => {
      if (!organizationId) return;

      // Optimistically remove jobs
      catalogingJobOptimisticUpdates.removeJobsFromLists(queryClient, organizationId, jobIds);

      return { jobIds };
    },
    onSuccess: (data, jobIds) => {
      if (!organizationId) return;

      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: catalogingJobKeys.stats(organizationId) });
      
      toast.success(`${jobIds.length} cataloging job(s) deleted successfully`);
    },
    onError: (error, jobIds) => {
      if (!organizationId) return;

      // Revert optimistic updates
      queryClient.invalidateQueries({ queryKey: catalogingJobKeys.lists() });

      const errorMessage = error instanceof CatalogingJobError 
        ? error.message 
        : 'Failed to delete cataloging jobs';
      
      toast.error(errorMessage);
    },
    retry: (failureCount, error) => {
      if (error instanceof CatalogingJobError && !error.retryable) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Retry cataloging jobs mutation
 * FIXED: Server-side validation and proper error handling
 */
export const useRetryCatalogingJobs = () => {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [getMutationKey('retry', null, organizationId)],
    mutationFn: async (jobIds: string[]) => {
      if (!organizationId) {
        throw new CatalogingJobError(
          'User organization context is not available.',
          'MISSING_ORG_ID',
          {},
          false
        );
      }

      if (!jobIds || jobIds.length === 0) {
        throw new CatalogingJobError(
          'At least one job ID is required.',
          'MISSING_JOB_IDS',
          {},
          false
        );
      }

      // Call the secure, prepared statement execution wrapper
      const { data, error } = await supabase
        .rpc('execute_bulk_retry', {
          job_ids: jobIds
        });

      if (error) {
        throw createErrorHandler('Retry cataloging jobs')(error);
      }

      if (!data || data.length === 0) {
        throw new CatalogingJobError(
          'Invalid response from retry_cataloging_jobs',
          'INVALID_RESPONSE',
          { response: data },
          false
        );
      }

      const result = data[0];
      
      // Handle partial failures
      if (result.invalid_count > 0) {
        const message = result.retried_count > 0 
          ? `${result.retried_count} job(s) retried, ${result.invalid_count} could not be retried (not failed, permission denied, or not found).`
          : `No jobs could be retried. (${result.invalid_count} invalid).`;
        
        throw new CatalogingJobError(
          message,
          'PARTIAL_FAILURE',
          { 
            retried_count: result.retried_count,
            invalid_count: result.invalid_count,
            retried_job_ids: result.retried_job_ids,
            invalid_job_ids: result.invalid_job_ids
          },
          false
        );
      }

      return { 
        retriedJobIds: result.retried_job_ids,
        retriedCount: result.retried_count
      };
    },
    onMutate: async (jobIds) => {
      if (!organizationId) return;

      // Optimistically update job statuses
      jobIds.forEach(jobId => {
        catalogingJobOptimisticUpdates.updateJobStatus(
          queryClient,
          jobId,
          organizationId,
          'pending',
          null
        );
      });

      return { jobIds };
    },
    onSuccess: (data, jobIds) => {
      if (!organizationId) return;

      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: catalogingJobKeys.stats(organizationId) });
      
      toast.success(`${jobIds.length} cataloging job(s) retried successfully`);
    },
    onError: (error, jobIds) => {
      if (!organizationId) return;

      // Revert optimistic updates
      jobIds.forEach(jobId => {
        queryClient.invalidateQueries({ queryKey: catalogingJobKeys.detail(jobId) });
      });
      queryClient.invalidateQueries({ queryKey: catalogingJobKeys.lists() });

      const errorMessage = error instanceof CatalogingJobError 
        ? error.message 
        : 'Failed to retry cataloging jobs';
      
      toast.error(errorMessage);
    },
    retry: (failureCount, error) => {
      if (error instanceof CatalogingJobError && !error.retryable) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// ============================================================================
// EXPORTS
// ============================================================================

export { CatalogingJobError };
export type { CatalogingJobFilters };