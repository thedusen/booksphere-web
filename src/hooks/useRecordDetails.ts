// hooks/useRecordDetails.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useOrganization } from "./useOrganization";

// Types for the context data returned by the database function
export interface BookContext {
  type: 'book';
  book_id: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  first_publish_year: number | null;
  edition_count: number | null;
  primary_cover_image_url: string | null;
  open_library_work_key: string | null;
  is_serial: boolean | null;
  created_at: string;
  updated_at: string;
  notes: unknown;
  links: unknown;
  excerpts: unknown;
}

export interface EditionContext {
  type: 'edition';
  edition_id: string;
  book_id: string | null;
  title: string | null;
  subtitle: string | null;
  book_title: string | null;
  isbn10: string | null;
  isbn13: string | null;
  publisher_name: string | null;
  publish_date: string | null;
  number_of_pages: number | null;
  physical_dimensions: string | null;
  weight_grams: number | null;
  by_statement: string | null;
  description: string | null;
  edition_cover_image_url: string | null;
  format_type: string | null;
  series_title: string | null;
  series_number: string | null;
  publish_country: string | null;
  open_library_edition_key: string | null;
  created_at: string;
  updated_at: string;
  pagination_text: string | null;
  contributors: unknown;
}

export interface StockItemAttribute {
  attribute_name: string;
  attribute_value: string;
  created_at: string;
}

export interface StockItemContext {
  type: 'stock_item';
  stock_item_id: string;
  organization_id: string;
  edition_id: string | null;
  book_title: string | null;
  edition_title: string | null;
  isbn10: string | null;
  isbn13: string | null;
  publisher_name: string | null;
  sku: string | null;
  condition: string | null;
  condition_notes: string | null;
  selling_price_cents: number | null;
  cost_cents: number | null;
  location_in_store: string | null;
  status: string | null;
  is_consignment: boolean | null;
  consignment_percentage: number | null;
  date_acquired: string | null;
  date_sold: string | null;
  notes: string | null;
  weight_grams: number | null;
  length_mm: number | null;
  width_mm: number | null;
  height_mm: number | null;
  primary_image_url: string | null;
  created_at: string;
  updated_at: string;
  number_of_pages: number | null;
  publish_date: string | null;
  edition_cover_image_url: string | null;
  format_type: string | null;
  attributes: StockItemAttribute[] | null;
}

export type RecordContext = BookContext | EditionContext | StockItemContext;

export interface RecordContextError {
  error: string;
  table_name?: string;
  record_id?: string;
}

// Main hook to fetch record details
export function useRecordDetails(
  tableName: string,
  recordId: string,
  enabled: boolean = true
) {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['record-details', tableName, recordId, organizationId],
    queryFn: async (): Promise<RecordContext | RecordContextError> => {
      if (!organizationId) {
        throw new Error("Organization context is required");
      }

      const { data, error } = await supabase.rpc('get_flag_record_context', {
        p_organization_id: organizationId,
        p_table_name: tableName,
        p_record_id: recordId,
      });

      if (error) throw error;
      
      // The function returns jsonb, so data is the parsed object
      return data as RecordContext | RecordContextError;
    },
    enabled: enabled && !!organizationId && !!tableName && !!recordId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Typed hooks for specific record types
export function useBookDetails(bookId: string, enabled: boolean = true) {
  const result = useRecordDetails('books', bookId, enabled);
  
  return {
    ...result,
    data: result.data && 'type' in result.data && result.data.type === 'book' 
      ? result.data as BookContext 
      : undefined,
    error: result.data && 'error' in result.data 
      ? result.data as RecordContextError 
      : result.error,
  };
}

export function useEditionDetails(editionId: string, enabled: boolean = true) {
  const result = useRecordDetails('editions', editionId, enabled);
  
  return {
    ...result,
    data: result.data && 'type' in result.data && result.data.type === 'edition' 
      ? result.data as EditionContext 
      : undefined,
    error: result.data && 'error' in result.data 
      ? result.data as RecordContextError 
      : result.error,
  };
}

export function useStockItemDetails(stockItemId: string, enabled: boolean = true) {
  const result = useRecordDetails('stock_items', stockItemId, enabled);
  
  return {
    ...result,
    data: result.data && 'type' in result.data && result.data.type === 'stock_item' 
      ? result.data as StockItemContext 
      : undefined,
    error: result.data && 'error' in result.data 
      ? result.data as RecordContextError 
      : result.error,
  };
}

// Helper function to format price from cents
export function formatPrice(cents: number | null): string {
  if (cents === null || cents === undefined) return 'N/A';
  return `$${(cents / 100).toFixed(2)}`;
}

// Helper function to format dimensions
export function formatDimensions(length?: number | null, width?: number | null, height?: number | null): string {
  const dims = [length, width, height].filter(d => d !== null && d !== undefined);
  if (dims.length === 0) return 'N/A';
  return `${dims.join(' × ')} mm`;
}

// Helper function to format weight
export function formatWeight(grams: number | null): string {
  if (grams === null || grams === undefined) return 'N/A';
  if (grams < 1000) return `${grams}g`;
  return `${(grams / 1000).toFixed(1)}kg`;
}