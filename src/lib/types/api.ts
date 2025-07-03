// types/api.ts

export interface BookData {
  // --- Core Fields (usually present from API) ---
  isbn: string;
  title: string;
  authors: string[];
  publisher: string;
  published_date: string;
  cover_image_url: string;

  // --- Enriched/Editable Catalog Fields (optional) ---
  subtitle?: string;
  description?: string;
  page_count?: number;
  categories?: string[];
  format_type?: string; // e.g., 'Paperback', 'Hardcover'
  published_country?: string; // e.g., 'USA', 'GBR'

  // --- Foreign Key Fields ---
  // These correspond to the IDs in related tables.
  language_id?: number;
  series_id?: number;
}

// This interface defines the shape of the data returned from our initial fetch.
export interface ApiResult {
  isNew: boolean;
  isbn: string;
  bookData: BookData;
  updated_at: string;
}

// This is the top-level wrapper for our Buildship API response.
export interface ApiResponse {
  jsonResult: ApiResult;
}

export interface Condition {
  condition_id: string;
  standard_name: string;
  description: string | null;
}