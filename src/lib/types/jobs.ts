import { Database } from '@/lib/supabase/types';

// Use generated Supabase types for cataloging jobs
export type CatalogingJob = Database['public']['Tables']['cataloging_jobs']['Row'];
export type CatalogingJobInsert = Database['public']['Tables']['cataloging_jobs']['Insert'];
export type CatalogingJobUpdate = Database['public']['Tables']['cataloging_jobs']['Update'];
export type CatalogingJobStatus = Database['public']['Enums']['cataloging_job_status'];

// Book metadata structure for extracted_data field
export interface BookMetadata {
  // Basic book information
  title: string;
  subtitle?: string;
  authors?: string[];
  primary_author?: string;
  
  // Publication details
  publisher_name?: string;
  publication_year?: number;
  publication_location?: string;
  edition_statement?: string;
  
  // Physical characteristics
  isbn13?: string;
  isbn10?: string;
  page_count?: number;
  format_name?: string;
  language_name?: string;
  
  // Condition and attributes
  condition_assessment?: string;
  has_dust_jacket?: boolean;
  
  // Extracted metadata quality
  extraction_confidence?: number;
  extraction_source?: 'ai_analysis' | 'isbn_lookup' | 'manual_entry';
  
  // Additional metadata
  description?: string;
  table_of_contents?: string[];
  notes?: string;
  
  // Images and references
  cover_image_url?: string;
  additional_images?: string[];
  
  // Pricing context (if available)
  suggested_price_range?: {
    min: number;
    max: number;
    currency: string;
  };
}

// Image URLs structure for the cataloging job
export interface CatalogingJobImageUrls {
  cover_url?: string;
  title_page_url?: string;
  copyright_page_url?: string;
  additional_images?: string[];
}

// Strongly typed cataloging job with proper extracted_data
export interface TypedCatalogingJob extends Omit<CatalogingJob, 'extracted_data' | 'image_urls'> {
  extracted_data: BookMetadata | null;
  image_urls: CatalogingJobImageUrls | null;
}

// API response types for various cataloging operations
export interface CatalogingJobListResponse {
  jobs: TypedCatalogingJob[];
  total_count: number;
  has_more: boolean;
}

export interface CatalogingJobCreateRequest {
  image_urls: CatalogingJobImageUrls;
  source_type?: 'isbn_scan' | 'manual_isbn' | 'image_capture';
  initial_metadata?: Partial<BookMetadata>;
}

export interface CatalogingJobFinalizeRequest {
  job_id: string;
  title: string;
  condition_id: string;
  price: number;
  subtitle?: string;
  authors?: string[];
  publisher_name?: string;
  publication_year?: number;
  publication_location?: string;
  edition_statement?: string;
  has_dust_jacket?: boolean;
  sku?: string;
  condition_notes?: string;
  selected_attributes?: string[];
}

// Type guards for runtime validation
export function isCatalogingJobStatus(value: unknown): value is CatalogingJobStatus {
  return typeof value === 'string' && ['pending', 'processing', 'completed', 'failed'].includes(value);
}

export function isBookMetadata(value: unknown): value is BookMetadata {
  if (!value || typeof value !== 'object') return false;
  
  const metadata = value as Record<string, unknown>;
  
  // Title is required
  if (typeof metadata.title !== 'string') return false;
  
  // Optional fields type checking
  if (metadata.subtitle !== undefined && typeof metadata.subtitle !== 'string') return false;
  if (metadata.authors !== undefined && !Array.isArray(metadata.authors)) return false;
  if (metadata.primary_author !== undefined && typeof metadata.primary_author !== 'string') return false;
  if (metadata.publisher_name !== undefined && typeof metadata.publisher_name !== 'string') return false;
  if (metadata.publication_year !== undefined && typeof metadata.publication_year !== 'number') return false;
  if (metadata.publication_location !== undefined && typeof metadata.publication_location !== 'string') return false;
  if (metadata.edition_statement !== undefined && typeof metadata.edition_statement !== 'string') return false;
  if (metadata.isbn13 !== undefined && typeof metadata.isbn13 !== 'string') return false;
  if (metadata.isbn10 !== undefined && typeof metadata.isbn10 !== 'string') return false;
  if (metadata.page_count !== undefined && typeof metadata.page_count !== 'number') return false;
  if (metadata.format_name !== undefined && typeof metadata.format_name !== 'string') return false;
  if (metadata.language_name !== undefined && typeof metadata.language_name !== 'string') return false;
  if (metadata.condition_assessment !== undefined && typeof metadata.condition_assessment !== 'string') return false;
  if (metadata.has_dust_jacket !== undefined && typeof metadata.has_dust_jacket !== 'boolean') return false;
  
  // Expanded validation to cover all BookMetadata fields
  if (metadata.extraction_confidence !== undefined && typeof metadata.extraction_confidence !== 'number') return false;
  if (metadata.extraction_source !== undefined && !['ai_analysis', 'isbn_lookup', 'manual_entry'].includes(metadata.extraction_source as string)) return false;
  if (metadata.description !== undefined && typeof metadata.description !== 'string') return false;
  if (metadata.table_of_contents !== undefined && !Array.isArray(metadata.table_of_contents)) return false;
  if (metadata.notes !== undefined && typeof metadata.notes !== 'string') return false;
  if (metadata.cover_image_url !== undefined && typeof metadata.cover_image_url !== 'string') return false;
  if (metadata.additional_images !== undefined && !Array.isArray(metadata.additional_images)) return false;

  if (metadata.suggested_price_range !== undefined) {
    if (typeof metadata.suggested_price_range !== 'object' || metadata.suggested_price_range === null) return false;
    const priceRange = metadata.suggested_price_range as Record<string, unknown>;
    if (typeof priceRange.min !== 'number' || typeof priceRange.max !== 'number' || typeof priceRange.currency !== 'string') return false;
  }
  
  return true;
}

export function isCatalogingJobImageUrls(value: unknown): value is CatalogingJobImageUrls {
  if (!value || typeof value !== 'object') return false;
  
  const urls = value as Record<string, unknown>;
  
  // All fields are optional, but if present must be strings or string arrays
  if (urls.cover_url !== undefined && typeof urls.cover_url !== 'string') return false;
  if (urls.title_page_url !== undefined && typeof urls.title_page_url !== 'string') return false;
  if (urls.copyright_page_url !== undefined && typeof urls.copyright_page_url !== 'string') return false;
  if (urls.additional_images !== undefined && !Array.isArray(urls.additional_images)) return false;
  
  return true;
}

export function isTypedCatalogingJob(value: unknown): value is TypedCatalogingJob {
  if (!value || typeof value !== 'object') return false;
  
  const job = value as Record<string, unknown>;
  
  // Required fields
  if (typeof job.job_id !== 'string') return false;
  if (typeof job.organization_id !== 'string') return false;
  if (typeof job.user_id !== 'string') return false;
  if (typeof job.created_at !== 'string') return false;
  if (typeof job.updated_at !== 'string') return false;
  if (!isCatalogingJobStatus(job.status)) return false;
  
  // Optional fields
  if (job.extracted_data !== null && !isBookMetadata(job.extracted_data)) return false;
  if (job.image_urls !== null && !isCatalogingJobImageUrls(job.image_urls)) return false;
  if (job.error_message !== null && typeof job.error_message !== 'string') return false;

  // Added missing validation for matched_edition_ids
  if (job.matched_edition_ids !== null) {
    if (!Array.isArray(job.matched_edition_ids)) return false;
    if (job.matched_edition_ids.some(id => typeof id !== 'string')) return false;
  }
  
  return true;
}

// Utility functions for working with cataloging jobs
export function getCatalogingJobDisplayStatus(status: CatalogingJobStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending Processing';
    case 'processing':
      return 'Processing';
    case 'completed':
      return 'Ready for Review';
    case 'failed':
      return 'Processing Failed';
    default:
      return 'Unknown Status';
  }
}

export function getCatalogingJobStatusColor(status: CatalogingJobStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function isCatalogingJobActionable(status: CatalogingJobStatus): boolean {
  return status === 'completed';
}

export function isCatalogingJobInProgress(status: CatalogingJobStatus): boolean {
  return status === 'pending' || status === 'processing';
}

// Error types for cataloging operations
export interface CatalogingJobError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export function isCatalogingJobError(value: unknown): value is CatalogingJobError {
  if (!value || typeof value !== 'object') return false;
  
  const error = value as Record<string, unknown>;
  
  return (
    typeof error.code === 'string' &&
    typeof error.message === 'string' &&
    (error.details === undefined || typeof error.details === 'object')
  );
}