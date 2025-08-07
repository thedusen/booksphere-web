import { Database } from '@/lib/supabase/types';
import { CATALOGING_STATUS_LABELS, CATALOGING_STATUS_COLORS } from '@/lib/constants/cataloging';

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
  isbn?: string;
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

// Type for edition matching results
export interface BookMatch {
  edition_id: string;
  title: string;
  subtitle?: string;
  authors?: string[];
  publisher_name?: string;
  publication_year?: number;
  confidence: 'high' | 'medium' | 'low';
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
  isbn?: string;
  subtitle?: string;
  authors?: string[];
  publisher_name?: string;
  publication_year?: number;
  publication_location?: string;
  edition_statement?: string;
  format_id?: string;
  pagination_text?: string;
  has_dust_jacket?: boolean;
  sku?: string;
  condition_notes?: string;
  selected_attributes?: string[];
}

// Type guards for runtime validation
export function isCatalogingJobStatus(value: unknown): value is CatalogingJobStatus {
  return typeof value === 'string' && ['pending', 'processing', 'completed', 'failed'].includes(value);
}

export function isBookMetadataV2(value: unknown): value is BookMetadata {
  if (!value || typeof value !== 'object') {
    console.error('❌ BookMetadata validation failed: value is not an object', { value, type: typeof value });
    return false;
  }
  
  const metadata = value as Record<string, unknown>;
  
  // SIMPLIFIED VALIDATION: Only require title to exist and be a non-empty string
  // This allows both AI Analysis jobs (no ISBN) and ISBN-based jobs to pass
  if (!metadata.title || typeof metadata.title !== 'string' || metadata.title.length === 0) {
    console.error('❌ BookMetadata validation failed: title is missing, not a string, or empty', { 
      title: metadata.title, 
      titleType: typeof metadata.title,
      allKeys: Object.keys(metadata)
    });
    return false;
  }
  
  console.log('🚀 CACHE-BUSTED VALIDATION V2 - Timestamp:', new Date().toISOString());
  console.log('✅ BookMetadata V2 validation passed for title:', metadata.title);
  
  // Optional fields type checking
  if (metadata.subtitle !== undefined && typeof metadata.subtitle !== 'string') return false;
  if (metadata.authors !== undefined && !Array.isArray(metadata.authors)) return false;
  if (metadata.primary_author !== undefined && typeof metadata.primary_author !== 'string') return false;
  if (metadata.publisher_name !== undefined && typeof metadata.publisher_name !== 'string') return false;
  if (metadata.publication_year !== undefined) {
    // Handle both number and string representations
    if (typeof metadata.publication_year !== 'number' && 
        (typeof metadata.publication_year !== 'string' || isNaN(Number(metadata.publication_year)))) {
      return false;
    }
  }
  if (metadata.publication_location !== undefined && typeof metadata.publication_location !== 'string') return false;
  if (metadata.edition_statement !== undefined && typeof metadata.edition_statement !== 'string') return false;
  if (metadata.isbn !== undefined && typeof metadata.isbn !== 'string') return false;
  if (metadata.isbn13 !== undefined && typeof metadata.isbn13 !== 'string') return false;
  if (metadata.isbn10 !== undefined && typeof metadata.isbn10 !== 'string') return false;
  if (metadata.page_count !== undefined) {
    // Handle both number and string representations
    if (typeof metadata.page_count !== 'number' && 
        (typeof metadata.page_count !== 'string' || isNaN(Number(metadata.page_count)))) {
      return false;
    }
  }
  if (metadata.format_name !== undefined && typeof metadata.format_name !== 'string') return false;
  if (metadata.language_name !== undefined && typeof metadata.language_name !== 'string') return false;
  if (metadata.condition_assessment !== undefined && typeof metadata.condition_assessment !== 'string') return false;
  if (metadata.has_dust_jacket !== undefined) {
    // Handle boolean, string boolean representations, and null
    const value = metadata.has_dust_jacket;
    const isValidBoolean = typeof value === 'boolean' || 
                          value === 'true' || value === 'false' ||
                          value === true || value === false ||
                          value === 1 || value === 0 ||
                          value === '1' || value === '0';
    
    if (!isValidBoolean) {
      return false;
    }
  }
  
  // Expanded validation to cover all BookMetadata fields
  if (metadata.extraction_confidence !== undefined) {
    // Handle both number and string representations
    if (typeof metadata.extraction_confidence !== 'number' && 
        (typeof metadata.extraction_confidence !== 'string' || isNaN(Number(metadata.extraction_confidence)))) {
      return false;
    }
  }
  if (metadata.extraction_source !== undefined && typeof metadata.extraction_source !== 'string') {
    return false;
  }
  if (metadata.description !== undefined && typeof metadata.description !== 'string') return false;
  if (metadata.table_of_contents !== undefined && !Array.isArray(metadata.table_of_contents)) return false;
  if (metadata.notes !== undefined && typeof metadata.notes !== 'string') return false;
  if (metadata.cover_image_url !== undefined && typeof metadata.cover_image_url !== 'string') return false;
  if (metadata.additional_images !== undefined && !Array.isArray(metadata.additional_images)) return false;

  if (metadata.suggested_price_range !== undefined) {
    if (typeof metadata.suggested_price_range !== 'object' || metadata.suggested_price_range === null) {
      return false;
    }
    const priceRange = metadata.suggested_price_range as Record<string, unknown>;
    if (typeof priceRange.min !== 'number' || typeof priceRange.max !== 'number' || typeof priceRange.currency !== 'string') {
      return false;
    }
  }
  
  return true;
}

export function isCatalogingJobImageUrls(value: unknown): value is CatalogingJobImageUrls {
  if (!value || typeof value !== 'object') return false;
  
  const urls = value as Record<string, unknown>;
  
  // All fields are optional, but if present must be strings or string arrays
  if (urls.cover_url !== undefined && typeof urls.cover_url !== 'string') return false;
  
  // Accept both naming conventions for backward compatibility
  if (urls.title_page_url !== undefined && typeof urls.title_page_url !== 'string') return false;
  if (urls.title_url !== undefined && typeof urls.title_url !== 'string') return false;
  if (urls.copyright_page_url !== undefined && typeof urls.copyright_page_url !== 'string') return false;
  if (urls.copyright_url !== undefined && typeof urls.copyright_url !== 'string') return false;
  
  if (urls.additional_images !== undefined && !Array.isArray(urls.additional_images)) return false;
  
  return true;
}

export function isTypedCatalogingJob(value: unknown): value is TypedCatalogingJob {
  if (!value || typeof value !== 'object') {
    console.error('❌ isTypedCatalogingJob: value is not an object', { value, type: typeof value });
    return false;
  }
  
  const job = value as Record<string, unknown>;
  
  console.log('🔍 Starting TypedCatalogingJob validation for:', {
    job_id: job.job_id,
    extraction_source: job.extracted_data && typeof job.extracted_data === 'object' ? (job.extracted_data as any).extraction_source : 'N/A'
  });
  
  
  // Required fields
  if (typeof job.job_id !== 'string') {
    console.error('❌ isTypedCatalogingJob: job_id is not a string', { job_id: job.job_id, type: typeof job.job_id });
    return false;
  }
  if (typeof job.organization_id !== 'string') {
    console.error('❌ isTypedCatalogingJob: organization_id is not a string', { organization_id: job.organization_id, type: typeof job.organization_id });
    return false;
  }
  if (typeof job.user_id !== 'string') {
    console.error('❌ isTypedCatalogingJob: user_id is not a string', { user_id: job.user_id, type: typeof job.user_id });
    return false;
  }
  if (typeof job.created_at !== 'string') {
    console.error('❌ isTypedCatalogingJob: created_at is not a string', { created_at: job.created_at, type: typeof job.created_at });
    return false;
  }
  if (typeof job.updated_at !== 'string') {
    console.error('❌ isTypedCatalogingJob: updated_at is not a string', { updated_at: job.updated_at, type: typeof job.updated_at });
    return false;
  }
  if (!isCatalogingJobStatus(job.status)) {
    console.error('❌ isTypedCatalogingJob: invalid status', { status: job.status });
    return false;
  }
  
  // Optional fields - more permissive validation
  if (job.extracted_data !== null && job.extracted_data !== undefined) {
    console.log('🔍 About to validate extracted_data:', {
      type: typeof job.extracted_data,
      isObject: typeof job.extracted_data === 'object',
      keys: job.extracted_data && typeof job.extracted_data === 'object' ? Object.keys(job.extracted_data) : 'N/A',
      data: job.extracted_data
    });
    
    if (!isBookMetadataV2(job.extracted_data)) {
      console.error('❌ isTypedCatalogingJob: extracted_data failed BookMetadata validation');
      return false;
    }
  } else {
    console.log('🔍 extracted_data is null or undefined:', job.extracted_data);
  }
  if (job.image_urls !== null && job.image_urls !== undefined && !isCatalogingJobImageUrls(job.image_urls)) {
    console.error('❌ isTypedCatalogingJob: image_urls failed validation');
    return false;
  }
  if (job.error_message !== null && job.error_message !== undefined && typeof job.error_message !== 'string') return false;

  // More permissive validation for matched_edition_ids
  if (job.matched_edition_ids !== null && job.matched_edition_ids !== undefined) {
    if (!Array.isArray(job.matched_edition_ids)) {
      console.error('❌ isTypedCatalogingJob: matched_edition_ids is not an array');
      return false;
    }
    if (job.matched_edition_ids.some(id => typeof id !== 'string')) {
      console.error('❌ isTypedCatalogingJob: matched_edition_ids contains non-string values');
      return false;
    }
  }
  
  console.log('✅ isTypedCatalogingJob: validation passed for job:', job.job_id);
  return true;
}

// Utility functions for working with cataloging jobs
export function getCatalogingJobDisplayStatus(status: CatalogingJobStatus): string {
  return CATALOGING_STATUS_LABELS[status] || 'Unknown Status';
}

export function getCatalogingJobStatusColor(status: CatalogingJobStatus): string {
  return CATALOGING_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
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