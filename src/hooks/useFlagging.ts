// hooks/useFlagging.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { flagFormSchema, flagStatusUpdateSchema } from '@/lib/validators/flags';
import type { FlagFormData, FlagStatusUpdate } from '@/lib/types/flags';

// Define the return type for a single flag from the paginated RPC
// to avoid using `any`.
export interface PaginatedFlag {
  flag_id: string;
  table_name: string;
  record_id: string;
  field_name: string | null;
  flag_type: string;
  severity: string;
  status: string;
  description: string | null;
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: FlagFormData) => {
      // Validate input
      const parsed = flagFormSchema.safeParse(input);
      if (!parsed.success) {
        throw new Error(parsed.error.message);
      }
      // Call the RPC
      const { data, error } = await supabase.rpc('create_data_quality_flag', {
        p_table_name: input.table_name,
        p_record_id: input.record_id,
        p_flag_type: input.flag_type,
        p_severity: input.severity,
        p_field_name: input.field_name ?? null,
        p_status: 'open',
        p_description: input.description ?? null,
        p_suggested_value: input.suggested_value ?? null,
        p_details: input.details ?? null,
      });
      if (error) throw error;
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['flags', input.table_name, input.record_id] });
      return data;
    },
  });
}

// --- UPDATE FLAG STATUS ---
export function useUpdateFlagStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: FlagStatusUpdate) => {
      // Validate input
      const parsed = flagStatusUpdateSchema.safeParse(input);
      if (!parsed.success) {
        throw new Error(parsed.error.message);
      }
      // Call the RPC
      const { data, error } = await supabase.rpc('update_flag_status', {
        p_flag_id: input.flag_id,
        p_status: input.status,
        p_resolution_notes: input.resolution_notes ?? null,
        p_reviewed_by: input.reviewed_by ?? null,
      });
      if (error) throw error;
      // Invalidate relevant queries
      queryClient.invalidateQueries();
      return data;
    },
  });
}

// --- GET FLAGS FOR RECORD (single record, e.g. for detail page) ---
export function useFlagsForRecord(table_name: string, record_id: string, enabled = true) {
  return useQuery({
    queryKey: ['flags', table_name, record_id],
    queryFn: async () => {
      // Use the paginated RPC with filters for this record
      const { data, error } = await supabase.rpc('get_paginated_flags', {
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
    enabled,
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
  return useQuery({
    queryKey: [
      'flags',
      { limit, offset, status, table_name, severity, search, sort_by, sort_dir },
    ],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_paginated_flags', {
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
  });
}
