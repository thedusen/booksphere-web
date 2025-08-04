// hooks/useFlagging.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { flagFormSchema } from "@/lib/validators/flags";
import { FlagFormData } from "@/lib/types/flags";
import { useOrganization } from "./useOrganization";
import { flagStatusUpdateSchema } from "@/lib/validators/flags";

// Types for paginated flag response
export interface PaginatedFlag {
  flag_id: string;
  table_name: string;
  record_id: string;
  field_name: string | null;
  flag_type: string;
  severity: string;
  status: string;
  description: string;
  suggested_value: unknown;
  details: unknown;
  flagged_by: string;
  organization_id: string;
  created_at: string;
  reviewed_by: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  item_title: string | null;
}

// --- CREATE FLAG ---
export function useCreateFlag() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: FlagFormData) => {
      if (!organizationId) {
        throw new Error("Organization context is required");
      }

      // Validate the data with Zod
      const validatedData = flagFormSchema.parse(data);
      
      const { data: result, error } = await supabase.rpc('create_data_quality_flag', {
        p_organization_id: organizationId,
        p_table_name: validatedData.table_name,
        p_record_id: validatedData.record_id,
        p_flag_type: validatedData.flag_type,
        p_severity: validatedData.severity,
        p_field_name: validatedData.field_name || null,
        p_status: 'open',
        p_description: validatedData.description || null,
        p_suggested_value: validatedData.suggested_value || null,
        p_details: validatedData.details || null,
      });
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['flags'] });
    },
  });
}

// --- UPDATE FLAG STATUS ---
export function useUpdateFlagStatus() {
  const { organizationId, user } = useOrganization();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ flag_id, status, resolution_notes }: {
      flag_id: string;
      status: string;
      resolution_notes?: string;
    }) => {
      // Validate inputs
      const validation = flagStatusUpdateSchema.safeParse({ flag_id, status, resolution_notes });
      if (!validation.success) {
        throw new Error('Invalid input');
      }

      if (!organizationId) {
        throw new Error('Organization context is required');
      }

      const { data, error } = await supabase.rpc('update_flag_status', {
        p_organization_id: organizationId,
        p_flag_id: flag_id,
        p_status: status,
        p_resolution_notes: resolution_notes || null,
        p_reviewed_by: user?.id || null,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate all flag queries
      queryClient.invalidateQueries({ queryKey: ['flags'] });
    },
  });
}

// --- GET FLAGS FOR RECORD (single record, e.g. for detail page) ---
export function useFlagsForRecord(table_name: string, record_id: string, enabled = true) {
  const { organizationId } = useOrganization();
  
  return useQuery({
    queryKey: ['flags', table_name, record_id],
    queryFn: async () => {
      if (!organizationId) {
        throw new Error("Organization context is required");
      }

      // Use the paginated RPC with filters for this record
      const { data, error } = await supabase.rpc('get_paginated_flags', {
        p_organization_id: organizationId,
        p_limit: 100,
        p_offset: 0,
        p_table_name: table_name,
        p_status: null,
        p_severity: null,
        p_search: null,
        p_sort_by: 'created_at',
        p_sort_dir: 'desc',
      });
      if (error) throw error;
      // Filter client-side for this record (since the RPC is generic)
      return (data ?? []).filter((f: PaginatedFlag) => f.record_id === record_id);
    },
    enabled: enabled && !!organizationId,
  });
}

// --- GET PAGINATED FLAGS (admin dashboard) ---
export function usePaginatedFlags({
  limit = 20,
  offset = 0,
  status,
  table_name,
  severity,
  search,
  sort_by = 'created_at',
  sort_dir = 'desc',
}: {
  limit?: number;
  offset?: number;
  status?: string | null;
  table_name?: string | null;
  severity?: string | null;
  search?: string | null;
  sort_by?: string;
  sort_dir?: string;
}) {
  const { organizationId, loading: orgLoading, error: orgError } = useOrganization();
  
  return useQuery({
    queryKey: [
      'flags',
      { organizationId, limit, offset, status, table_name, severity, search, sort_by, sort_dir },
    ],
    queryFn: async () => {
      if (!organizationId) {
        throw new Error("Organization context is required");
      }

      const { data, error } = await supabase.rpc('get_paginated_flags', {
        p_organization_id: organizationId,
        p_limit: limit,
        p_offset: offset,
        p_status: status ?? null,
        p_table_name: table_name ?? null,
        p_severity: severity ?? null,
        p_search: search ?? null,
        p_sort_by: sort_by,
        p_sort_dir: sort_dir,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !orgLoading && !orgError && !!organizationId,
  });
}
