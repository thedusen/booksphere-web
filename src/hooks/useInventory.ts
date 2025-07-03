// packages/supabase/src/useInventory.ts

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
// ✅ CORRECTED: All type imports now come from the single shared package
import type { FilterType, GroupedEdition, BookSummary, StockItemDetails, ConditionStandard } from '@/lib/types/inventory';

// Define a common params interface for hooks that need the client
interface BaseHookParams {
  client: SupabaseClient;
  organizationId: string;
}

interface InventoryHookParams extends BaseHookParams {
  searchQuery: string;
  filterType: FilterType;
  sortBy?: string;
  filters?: Record<string, any>;
}

interface BookSummaryParams extends BaseHookParams {
  bookId: string;
}

interface StockItemParams extends BaseHookParams {
  stockItemId: string;
}

interface InventorySummaryMetrics {
  book_count: number;
  total_value_in_cents: number;
  needs_photos_count: number;
  total_item_count: number;
}

export interface AttributeType {
  attribute_type_id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  sort_order: number | null;
}

export interface AttributeCategory {
  category_id: string;
  name: string;
  description: string | null;
  sort_order: number | null;
}

const ITEMS_PER_PAGE = 20;

export const useInventory = ({ 
  searchQuery, 
  filterType, 
  organizationId, 
  client,
  sortBy = 'date_added_to_stock DESC',
  filters = {}
}: InventoryHookParams) => {
  return useInfiniteQuery({
    queryKey: ['inventory', searchQuery, filterType, organizationId, sortBy, filters],
    queryFn: async ({ pageParam = 0 }: { pageParam?: number }) => {
      const { data, error } = await client.rpc('search_inventory', {
        org_id: organizationId,
        search_query: searchQuery,
        filter_type: filterType,
        sort_by: sortBy,
        filters: filters,
        limit_count: ITEMS_PER_PAGE,
        offset_count: pageParam * ITEMS_PER_PAGE,
      });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        total_copies: parseInt(item.total_copies),
        price_range: {
          min: parseFloat(item.min_price || '0'),
          max: parseFloat(item.max_price || '0'),
        },
      })) as GroupedEdition[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: GroupedEdition[], pages: GroupedEdition[][]) => {
      // Corrected logic for getNextPageParam
      if (lastPage.length < ITEMS_PER_PAGE) return undefined;
      return pages.length;
    },
    enabled: !!organizationId && !!client,
    staleTime: 5 * 60 * 1000, // 5 minutes - reduce redundant fetches for inventory data
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
  });
};

export const useInventorySummaryMetrics = ({ 
  searchQuery, 
  filterType, 
  organizationId, 
  client,
  sortBy = 'date_added_to_stock DESC',
  filters = {}
}: InventoryHookParams) => {
  return useQuery({
    queryKey: ['inventory-summary-metrics', searchQuery, filterType, organizationId, sortBy, filters],
    queryFn: async (): Promise<InventorySummaryMetrics> => {
      const { data, error } = await client.rpc('get_inventory_summary_metrics', {
        org_id: organizationId,
        search_query: searchQuery,
        filter_type: filterType,
        sort_by: sortBy,
        filters: filters,
      });
      if (error) throw error;
      const metrics = data || {};
      return {
        book_count: parseInt(metrics.book_count || '0'),
        total_item_count: parseInt(metrics.total_item_count || '0'),
        total_value_in_cents: parseInt(metrics.total_value_in_cents || '0'),
        needs_photos_count: parseInt(metrics.needs_photos_count || '0'),
      };
    },
    enabled: !!organizationId && !!client,
    staleTime: 3 * 60 * 1000, // 3 minutes - summary metrics don't change as frequently
    gcTime: 8 * 60 * 1000, // 8 minutes - keep in cache
  });
};

export const useStockItem = ({ stockItemId, organizationId, client }: StockItemParams) => {
  return useQuery<StockItemDetails>({
    queryKey: ['stock-item', stockItemId],
    queryFn: async () => {
      const { data, error } = await client.rpc('get_stock_item_details', {
        stock_item_id_in: stockItemId,
        org_id_in: organizationId,
      });
      if (error) throw new Error(error.message);
      return data as StockItemDetails;
    },
    enabled: !!stockItemId && !!organizationId && !!client,
  });
};

export const useBookSummary = ({ bookId, organizationId, client }: BookSummaryParams) => {
  return useQuery<BookSummary>({
    queryKey: ['book-summary', bookId, organizationId],
    queryFn: async () => {
      const { data, error } = await client.rpc('get_book_summary', {
        book_id_in: bookId,
        org_id_in: organizationId,
      });
      if (error) throw new Error(error.message);
      return data as BookSummary;
    },
    enabled: !!bookId && !!organizationId && !!client,
  });
};

export const useConditions = ({ client }: { client: SupabaseClient }) => {
  return useQuery<ConditionStandard[]>({
    queryKey: ['condition_standards'],
    queryFn: async () => {
      const { data, error } = await client
        .from('condition_standards')
        .select('condition_id, standard_name, description')
        .order('sort_order', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    staleTime: 60 * 60 * 1000,
  });
};

export const useAttributes = ({ client }: { client: SupabaseClient }) => {
  return useQuery<{ attributeTypes: AttributeType[]; attributeCategories: AttributeCategory[] }>({
    queryKey: ['attribute_types_and_categories'],
    queryFn: async () => {
      // Fetch attribute types
      const { data: types, error: typesError } = await client
        .from('attribute_types')
        .select('attribute_type_id, name, description, category_id, sort_order')
        .order('sort_order', { ascending: true });
      if (typesError) throw new Error(typesError.message);
      // Fetch attribute categories
      const { data: categories, error: categoriesError } = await client
        .from('attribute_categories')
        .select('category_id, name, description, sort_order')
        .order('sort_order', { ascending: true });
      if (categoriesError) throw new Error(categoriesError.message);
      return {
        attributeTypes: types as AttributeType[],
        attributeCategories: categories as AttributeCategory[],
      };
    },
    staleTime: 60 * 60 * 1000,
  });
};

