// packages/supabase/src/useCatalogJobs.ts

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

// ✅ IMPORT THE TYPE FROM THE SHARED PACKAGE
import type { CatalogJob } from '@booksphere/shared';

interface CatalogJobsParams {
  organizationId: string;
  client: SupabaseClient;
}

// Custom hook to fetch jobs and subscribe to real-time updates
export const useCatalogJobs = ({ organizationId, client }: CatalogJobsParams) => {
    const queryClient = useQueryClient();
    const queryKey = ['catalog-jobs', organizationId];

    // Fetch initial data
    const { data, isLoading, error, refetch } = useQuery<CatalogJob[]>({
        queryKey: queryKey,
        queryFn: async () => {
            if (!organizationId) return [];
            const { data, error } = await client
                .from('cataloging_jobs')
                .select('*')
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false });

            if (error) throw new Error(error.message);
            return data || [];
        },
        enabled: !!organizationId,
        staleTime: 30000, // Consider data fresh for 30 seconds
    });

    // Subscribe to real-time changes
    useEffect(() => {
        if (!organizationId) return;

        const channel = client
            .channel(`catalog_jobs:${organizationId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'cataloging_jobs', filter: `organization_id=eq.${organizationId}` },
                (payload) => {
                    console.log('Real-time change received!', payload);
                    queryClient.invalidateQueries({ queryKey });
                }
            )
            .subscribe();

        return () => {
            client.removeChannel(channel);
        };
    }, [organizationId, queryClient, queryKey]);

    return { data, isLoading, error, refetch };
};