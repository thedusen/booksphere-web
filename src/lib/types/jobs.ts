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

export function isBookMetadata(value: unknown): value is BookMetadata {
  if (!value || typeof value !== 'object') {
    console.log('BookMetadata validation failed: value is not an object', { value, type: typeof value });
    return false;
  }
  
  const metadata = value as Record<string, unknown>;
  
  // Title is required
  if (typeof metadata.title !== 'string') {
    console.log('BookMetadata validation failed: title is not a string', { title: metadata.title, type: typeof metadata.title });
    return false;
  }
  
  // Optional fields type checking with detailed logging
  if (metadata.subtitle !== undefined && typeof metadata.subtitle !== 'string') {
    console.log('BookMetadata validation failed: subtitle type mismatch', { subtitle: metadata.subtitle, type: typeof metadata.subtitle });
    return false;
  }
  if (metadata.authors !== undefined && !Array.isArray(metadata.authors)) {
    console.log('BookMetadata validation failed: authors is not an array', { authors: metadata.authors, type: typeof metadata.authors });
    return false;
  }
  if (metadata.primary_author !== undefined && typeof metadata.primary_author !== 'string') {
    console.log('BookMetadata validation failed: primary_author type mismatch', { primary_author: metadata.primary_author, type: typeof metadata.primary_author });
    return false;
  }
  if (metadata.publisher_name !== undefined && typeof metadata.publisher_name !== 'string') {
    console.log('BookMetadata validation failed: publisher_name type mismatch', { publisher_name: metadata.publisher_name, type: typeof metadata.publisher_name });
    return false;
  }
  if (metadata.publication_year !== undefined && typeof metadata.publication_year !== 'number') {
    console.log('BookMetadata validation failed: publication_year type mismatch', { publication_year: metadata.publication_year, type: typeof metadata.publication_year });
    return false;
  }
  if (metadata.publication_location !== undefined && typeof metadata.publication_location !== 'string') {
    console.log('BookMetadata validation failed: publication_location type mismatch', { publication_location: metadata.publication_location, type: typeof metadata.publication_location });
    return false;
  }
  if (metadata.edition_statement !== undefined && typeof metadata.edition_statement !== 'string') {
    console.log('BookMetadata validation failed: edition_statement type mismatch', { edition_statement: metadata.edition_statement, type: typeof metadata.edition_statement });
    return false;
  }
  if (metadata.isbn !== undefined && typeof metadata.isbn !== 'string') {
    console.log('BookMetadata validation failed: isbn type mismatch', { isbn: metadata.isbn, type: typeof metadata.isbn });
    return false;
  }
  if (metadata.isbn13 !== undefined && typeof metadata.isbn13 !== 'string') {
    console.log('BookMetadata validation failed: isbn13 type mismatch', { isbn13: metadata.isbn13, type: typeof metadata.isbn13 });
    return false;
  }
  if (metadata.isbn10 !== undefined && typeof metadata.isbn10 !== 'string') {
    console.log('BookMetadata validation failed: isbn10 type mismatch', { isbn10: metadata.isbn10, type: typeof metadata.isbn10 });
    return false;
  }
  if (metadata.page_count !== undefined && typeof metadata.page_count !== 'number') {
    console.log('BookMetadata validation failed: page_count type mismatch', { page_count: metadata.page_count, type: typeof metadata.page_count });
    return false;
  }
  if (metadata.format_name !== undefined && typeof metadata.format_name !== 'string') {
    console.log('BookMetadata validation failed: format_name type mismatch', { format_name: metadata.format_name, type: typeof metadata.format_name });
    return false;
  }
  if (metadata.language_name !== undefined && typeof metadata.language_name !== 'string') {
    console.log('BookMetadata validation failed: language_name type mismatch', { language_name: metadata.language_name, type: typeof metadata.language_name });
    return false;
  }
  if (metadata.condition_assessment !== undefined && typeof metadata.condition_assessment !== 'string') {
    console.log('BookMetadata validation failed: condition_assessment type mismatch', { condition_assessment: metadata.condition_assessment, type: typeof metadata.condition_assessment });
    return false;
  }
  if (metadata.has_dust_jacket !== undefined && typeof metadata.has_dust_jacket !== 'boolean') {
    console.log('BookMetadata validation failed: has_dust_jacket type mismatch', { has_dust_jacket: metadata.has_dust_jacket, type: typeof metadata.has_dust_jacket });
    return false;
  }
  
  // Expanded validation to cover all BookMetadata fields
  if (metadata.extraction_confidence !== undefined && typeof metadata.extraction_confidence !== 'number') {
    console.log('BookMetadata validation failed: extraction_confidence type mismatch', { extraction_confidence: metadata.extraction_confidence, type: typeof metadata.extraction_confidence });
    return false;
  }
  if (metadata.extraction_source !== undefined && !['ai_analysis', 'isbn_lookup', 'manual_entry', 'image_capture'].includes(metadata.extraction_source as string)) {
    console.log('BookMetadata validation failed: extraction_source invalid value', { extraction_source: metadata.extraction_source, type: typeof metadata.extraction_source, allowedValues: ['ai_analysis', 'isbn_lookup', 'manual_entry', 'image_capture'] });
    return false;
  }
  if (metadata.description !== undefined && typeof metadata.description !== 'string') {
    console.log('BookMetadata validation failed: description type mismatch', { description: metadata.description, type: typeof metadata.description });
    return false;
  }
  if (metadata.table_of_contents !== undefined && !Array.isArray(metadata.table_of_contents)) {
    console.log('BookMetadata validation failed: table_of_contents is not an array', { table_of_contents: metadata.table_of_contents, type: typeof metadata.table_of_contents });
    return false;
  }
  if (metadata.notes !== undefined && typeof metadata.notes !== 'string') {
    console.log('BookMetadata validation failed: notes type mismatch', { notes: metadata.notes, type: typeof metadata.notes });
    return false;
  }
  if (metadata.cover_image_url !== undefined && typeof metadata.cover_image_url !== 'string') {
    console.log('BookMetadata validation failed: cover_image_url type mismatch', { cover_image_url: metadata.cover_image_url, type: typeof metadata.cover_image_url });
    return false;
  }
  if (metadata.additional_images !== undefined && !Array.isArray(metadata.additional_images)) {
    console.log('BookMetadata validation failed: additional_images is not an array', { additional_images: metadata.additional_images, type: typeof metadata.additional_images });
    return false;
  }

  if (metadata.suggested_price_range !== undefined) {
    if (typeof metadata.suggested_price_range !== 'object' || metadata.suggested_price_range === null) {
      console.log('BookMetadata validation failed: suggested_price_range is not an object', { suggested_price_range: metadata.suggested_price_range, type: typeof metadata.suggested_price_range });
      return false;
    }
    const priceRange = metadata.suggested_price_range as Record<string, unknown>;
    if (typeof priceRange.min !== 'number' || typeof priceRange.max !== 'number' || typeof priceRange.currency !== 'string') {
      console.log('BookMetadata validation failed: suggested_price_range structure invalid', { 
        min: priceRange.min, 
        minType: typeof priceRange.min,
        max: priceRange.max, 
        maxType: typeof priceRange.max,
        currency: priceRange.currency,
        currencyType: typeof priceRange.currency
      });
      return false;
    }
  }
  
  console.log('BookMetadata validation passed for:', { title: metadata.title });
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
  if (!value || typeof value !== 'object') return false;
  
  const job = value as Record<string, unknown>;
  
  // Debug logging to understand what's failing
  const validationResults = {
    hasJobId: typeof job.job_id === 'string',
    hasOrgId: typeof job.organization_id === 'string',
    hasUserId: typeof job.user_id === 'string',
    hasCreatedAt: typeof job.created_at === 'string',
    hasUpdatedAt: typeof job.updated_at === 'string',
    hasValidStatus: isCatalogingJobStatus(job.status),
    extractedDataValid: job.extracted_data === null || job.extracted_data === undefined || isBookMetadata(job.extracted_data),
    imageUrlsValid: job.image_urls === null || job.image_urls === undefined || isCatalogingJobImageUrls(job.image_urls),
    errorMessageValid: job.error_message === null || job.error_message === undefined || typeof job.error_message === 'string',
    matchedEditionIdsValid: job.matched_edition_ids === null || job.matched_edition_ids === undefined || (Array.isArray(job.matched_edition_ids) && job.matched_edition_ids.every(id => typeof id === 'string'))
  };
  
  console.log('TypedCatalogingJob validation details:', {
    jobId: job.job_id,
    validation: validationResults,
    actualTypes: {
      job_id: typeof job.job_id,
      organization_id: typeof job.organization_id,
      user_id: typeof job.user_id,
      created_at: typeof job.created_at,
      updated_at: typeof job.updated_at,
      status: job.status,
      extracted_data: job.extracted_data === null ? 'null' : typeof job.extracted_data,
      image_urls: job.image_urls === null ? 'null' : typeof job.image_urls,
      error_message: job.error_message === null ? 'null' : typeof job.error_message,
      matched_edition_ids: job.matched_edition_ids === null ? 'null' : Array.isArray(job.matched_edition_ids) ? 'array' : typeof job.matched_edition_ids
    },
    fullJob: job
  });
  
  // Required fields
  if (typeof job.job_id !== 'string') return false;
  if (typeof job.organization_id !== 'string') return false;
  if (typeof job.user_id !== 'string') return false;
  if (typeof job.created_at !== 'string') return false;
  if (typeof job.updated_at !== 'string') return false;
  if (!isCatalogingJobStatus(job.status)) return false;
  
  // Optional fields - more permissive validation
  if (job.extracted_data !== null && job.extracted_data !== undefined && !isBookMetadata(job.extracted_data)) return false;
  if (job.image_urls !== null && job.image_urls !== undefined && !isCatalogingJobImageUrls(job.image_urls)) return false;
  if (job.error_message !== null && job.error_message !== undefined && typeof job.error_message !== 'string') return false;

  // More permissive validation for matched_edition_ids
  if (job.matched_edition_ids !== null && job.matched_edition_ids !== undefined) {
    if (!Array.isArray(job.matched_edition_ids)) return false;
    if (job.matched_edition_ids.some(id => typeof id !== 'string')) return false;
  }
  
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