// hooks/useCatalogJobsSimple.ts - Simplified version matching mobile app
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

// Use the types from our existing system
export type CatalogJob = {
  job_id: string;
  organization_id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  image_urls: any;
  extracted_data: any;
  matched_edition_ids: string[] | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type CatalogJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Custom hook to fetch jobs and subscribe to real-time updates
export const useCatalogJobs = (organizationId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['catalog-jobs', organizationId];

  console.log('🚀 Simple useCatalogJobs hook called with:', { organizationId });

  // Fetch initial data
  const { data, isLoading, error, refetch } = useQuery<CatalogJob[]>({
    queryKey: queryKey,
    queryFn: async () => {
      console.log('🔍 Simple hook queryFn executing with organizationId:', organizationId);
      
      if (!organizationId) {
        console.log('❌ No organizationId provided');
        return [];
      }
      
      const { data, error } = await supabase
        .from('cataloging_jobs')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      console.log('📊 Simple hook Supabase query result:', {
        dataCount: data?.length || 0,
        error: error?.message || null,
        firstJob: data?.[0]?.status || 'none'
      });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Subscribe to real-time changes
  useEffect(() => {
    if (!organizationId) return;

    console.log('📡 Setting up real-time subscription for organizationId:', organizationId);

    const channel = supabase
      .channel(`catalog_jobs:${organizationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cataloging_jobs', filter: `organization_id=eq.${organizationId}` },
        (payload) => {
          console.log('📡 Real-time change received!', {
            eventType: payload.eventType,
            table: payload.table,
            jobId: payload.new?.job_id || payload.old?.job_id,
            newStatus: payload.new?.status,
            oldStatus: payload.old?.status
          });
          // Invalidate the query to force a refetch, which will update the UI
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      console.log('🧹 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [organizationId, queryClient, queryKey]);

  return { data, isLoading, error, refetch };
};