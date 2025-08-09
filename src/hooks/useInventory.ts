// packages/supabase/src/useInventory.ts

import { useInfiniteQuery, useQuery, UseInfiniteQueryResult, InfiniteData } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
// ✅ CORRECTED: All type imports now come from the single shared package
import type { FilterType, GroupedEdition as BaseGroupedEdition, BookSummary, StockItemDetails, ConditionStandard } from '@/lib/types/inventory';
import React from 'react';
import { Database } from '@/lib/supabase/types';

// Extend GroupedEdition to include max_date_added for pagination
export interface GroupedEditionWithDate extends BaseGroupedEdition {
  max_date_added: string;
  edition_id: string;
}

// Define a common params interface for hooks that need the client
interface BaseHookParams {
  client: SupabaseClient;
  organizationId: string;
}

interface InventoryHookParams extends BaseHookParams {
  searchQuery: string;
  filterType: FilterType;
  sortBy?: string;
  filters?: Record<string, unknown>;
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

interface EditionDetailsParams extends BaseHookParams {
  editionId: string;
}

const ITEMS_PER_PAGE = 20;

type SearchInventoryResponse = Database['public']['Functions']['search_inventory']['Returns'];

export const useInventory = (
  params: InventoryHookParams
): UseInfiniteQueryResult<InfiniteData<GroupedEditionWithDate[], unknown>, Error> => {
  const { searchQuery, filterType, organizationId, client, sortBy = 'date_added_to_stock DESC', filters = {} } = params;
  // Memoize the flattened filters for query key stability
  const stableFilters = React.useMemo(() => JSON.stringify(filters), [filters]);
  return useInfiniteQuery<GroupedEditionWithDate[], Error>({
    queryKey: ['inventory', searchQuery, filterType, organizationId, sortBy, stableFilters],
    queryFn: async ({ pageParam }) => {
      const { last_date_added = null, last_edition_id = null } = (pageParam as { last_date_added: string | null; last_edition_id: string | null }) || {};
      const { data, error } = await client.rpc('search_inventory', {
        p_org_id: organizationId,
        p_search_query: searchQuery,
        p_filter_type: filterType,
        p_sort_by: sortBy,
        p_filters: filters,
        p_limit_count: ITEMS_PER_PAGE,
        p_last_date_added: last_date_added,
        p_last_edition_id: last_edition_id,
      });
      if (error) throw error;
      return (data || []).map((item: SearchInventoryResponse[number]) => ({
        ...item,
        total_copies: parseInt(String(item.total_copies)), // Ensure total_copies is a string before parsing
        price_range: {
          min: parseFloat(String(item.min_price || '0')), // Ensure min_price is a string before parsing
          max: parseFloat(String(item.max_price || '0')), // Ensure max_price is a string before parsing
        },
      })) as GroupedEditionWithDate[];
    },
    initialPageParam: { last_date_added: null, last_edition_id: null },
    getNextPageParam: (lastPage: GroupedEditionWithDate[], pages: GroupedEditionWithDate[][]) => {
      if (!lastPage || lastPage.length < ITEMS_PER_PAGE) return undefined;
      const lastItem = lastPage[lastPage.length - 1];
      return {
        last_date_added: lastItem.max_date_added,
        last_edition_id: lastItem.edition_id,
      };
    },
    enabled: !!organizationId && !!client,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Prevent automatic refetching on navigation/tab focus
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
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
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 8 * 60 * 1000, // 8 minutes
    // Prevent automatic refetching on navigation/tab focus
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
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

export const useEditionDetails = ({ editionId, organizationId, client }: EditionDetailsParams) => {
  return useQuery<GroupedEditionWithDate>({
    queryKey: ['edition-details', editionId, organizationId],
    queryFn: async () => {
      const { data, error } = await client.rpc('get_edition_details', {
        p_edition_id: editionId,
        p_organization_id: organizationId,
      });
      if (error) throw error;
      if (!data) throw new Error("Edition not found");
      // Map book_title from backend to title in GroupedEdition for canonical display
      return {
        ...data,
        title: data.book_title, // always use book title as canonical title
        authors: data.authors,
        isbn13: data.isbn13,
        isbn10: data.isbn10,
      } as GroupedEditionWithDate;
    },
    enabled: !!editionId && !!organizationId && !!client,
  });
};

