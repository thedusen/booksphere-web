import { z } from 'zod';
import { CATALOGING_DEFAULTS, CATALOGING_VALIDATION_LIMITS, CATALOGING_PRICE_LIMITS, CATALOGING_DATE_LIMITS, CATALOGING_IMAGE_LIMITS } from '@/lib/constants/cataloging';

// Cataloging job status enum validation
export const catalogingJobStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed']);

// ISBN validation schemas
export const isbn13Schema = z.string()
  .regex(/^97[89]\d{10}$/, 'ISBN-13 must be 13 digits starting with 978 or 979')
  .optional();

export const isbn10Schema = z.string()
  .regex(/^\d{9}[\dX]$/, 'ISBN-10 must be 10 digits or 9 digits followed by X')
  .optional();

// Book metadata validation schema
export const bookMetadataSchema = z.object({
  // Basic book information (title is required)
  title: z.string().min(1, 'Title is required').max(500, 'Title must be less than 500 characters'),
  subtitle: z.string().max(500, 'Subtitle must be less than 500 characters').optional(),
  authors: z.array(z.string().min(1, 'Author name cannot be empty')).max(10, 'Maximum 10 authors allowed').optional(),
  primary_author: z.string().max(255, 'Primary author must be less than 255 characters').optional(),
  
  // Publication details
  publisher_name: z.string().max(255, 'Publisher name must be less than 255 characters').optional(),
  publication_year: z.number().int().min(1000, 'Publication year must be after 1000').max(new Date().getFullYear() + 5, 'Publication year cannot be more than 5 years in the future').optional(),
  publication_location: z.string().max(255, 'Publication location must be less than 255 characters').optional(),
  edition_statement: z.string().max(100, 'Edition statement must be less than 100 characters').optional(),
  
  // Physical characteristics
  isbn13: isbn13Schema,
  isbn10: isbn10Schema,
  page_count: z.number().int().min(1, 'Page count must be at least 1').max(10000, 'Page count cannot exceed 10,000').optional(),
  format_name: z.string().max(100, 'Format name must be less than 100 characters').optional(),
  language_name: z.string().max(100, 'Language name must be less than 100 characters').optional(),
  
  // Condition and attributes
  condition_assessment: z.string().max(500, 'Condition assessment must be less than 500 characters').optional(),
  has_dust_jacket: z.boolean().optional(),
  
  // Extracted metadata quality
  extraction_confidence: z.number().min(0, 'Extraction confidence must be at least 0').max(1, 'Extraction confidence cannot exceed 1').optional(),
  extraction_source: z.enum(['ai_analysis', 'isbn_lookup', 'manual_entry']).optional(),
  
  // Additional metadata
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  table_of_contents: z.array(z.string().max(500, 'Table of contents entry must be less than 500 characters')).max(50, 'Maximum 50 table of contents entries').optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  
  // Images and references
  cover_image_url: z.string().url('Cover image URL must be a valid URL').optional(),
  additional_images: z.array(z.string().url('Additional image URL must be a valid URL')).max(10, 'Maximum 10 additional images').optional(),
  
  // Pricing context (if available)
  suggested_price_range: z.object({
    min: z.number().min(0, 'Minimum price must be at least 0'),
    max: z.number().min(0, 'Maximum price must be at least 0'),
    currency: z.string().length(3, 'Currency must be 3 characters (e.g., USD, EUR)').toUpperCase(),
  }).refine(data => data.max >= data.min, {
    message: 'Maximum price must be greater than or equal to minimum price',
    path: ['max'],
  }).optional(),
});

// Image URLs validation schema
export const catalogingJobImageUrlsSchema = z.object({
  cover_url: z.string().url('Cover URL must be a valid URL').optional(),
  title_page_url: z.string().url('Title page URL must be a valid URL').optional(),
  copyright_page_url: z.string().url('Copyright page URL must be a valid URL').optional(),
  additional_images: z.array(z.string().url('Additional image URL must be a valid URL')).max(10, 'Maximum 10 additional images').optional(),
}).refine(data => {
  // At least one image URL must be provided
  return data.cover_url || data.title_page_url || data.copyright_page_url || (data.additional_images && data.additional_images.length > 0);
}, {
  message: 'At least one image URL must be provided',
  path: ['cover_url'],
});

// Cataloging job creation request validation
export const catalogingJobCreateRequestSchema = z.object({
  image_urls: catalogingJobImageUrlsSchema,
  source_type: z.enum(['isbn_scan', 'manual_isbn', 'image_capture']).optional(),
  initial_metadata: bookMetadataSchema.partial().optional(),
});

// Cataloging job finalization request validation
export const catalogingJobFinalizeRequestSchema = z.object({
  job_id: z.string().uuid('Job ID must be a valid UUID'),
  title: z.string().min(1, 'Title is required').max(500, 'Title must be less than 500 characters'),
  condition_id: z.string().uuid('Condition ID must be a valid UUID'),
  price: z.number().min(0.01, 'Price must be at least $0.01').max(99999.99, 'Price cannot exceed $99,999.99'),
  
  // Optional fields
  subtitle: z.string().max(500, 'Subtitle must be less than 500 characters').optional(),
  authors: z.array(z.string().min(1, 'Author name cannot be empty')).max(10, 'Maximum 10 authors allowed').optional(),
  publisher_name: z.string().max(255, 'Publisher name must be less than 255 characters').optional(),
  publication_year: z.number().int().min(1000, 'Publication year must be after 1000').max(new Date().getFullYear() + 5, 'Publication year cannot be more than 5 years in the future').optional(),
  publication_location: z.string().max(255, 'Publication location must be less than 255 characters').optional(),
  edition_statement: z.string().max(100, 'Edition statement must be less than 100 characters').optional(),
  has_dust_jacket: z.boolean().optional(),
  sku: z.string().max(100, 'SKU must be less than 100 characters').optional(),
  condition_notes: z.string().max(1000, 'Condition notes must be less than 1000 characters').optional(),
  selected_attributes: z.array(z.string().uuid('Attribute ID must be a valid UUID')).max(20, 'Maximum 20 attributes allowed').optional(),
});

// Cataloging job list filters validation
export const catalogingJobFiltersSchema = z.object({
  status: catalogingJobStatusSchema.optional(),
  source_type: z.enum(['isbn_scan', 'manual_isbn', 'image_capture']).optional(),
  date_from: z.string().datetime({ message: 'Date from must be a valid ISO datetime' }).optional(),
  date_to: z.string().datetime({ message: 'Date to must be a valid ISO datetime' }).optional(),
  user_id: z.string().uuid('User ID must be a valid UUID').optional(),
  search_query: z.string().max(CATALOGING_DEFAULTS.MAX_SEARCH_QUERY_LENGTH, `Search query must be less than ${CATALOGING_DEFAULTS.MAX_SEARCH_QUERY_LENGTH} characters`).optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'status']).optional().default(CATALOGING_DEFAULTS.SORT_BY),
  sort_order: z.enum(['asc', 'desc']).optional().default(CATALOGING_DEFAULTS.SORT_ORDER),
  page: z.number().int().min(1, 'Page must be at least 1').optional().default(CATALOGING_DEFAULTS.PAGE_NUMBER),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(CATALOGING_DEFAULTS.MAX_PAGE_SIZE, `Limit cannot exceed ${CATALOGING_DEFAULTS.MAX_PAGE_SIZE}`).optional().default(CATALOGING_DEFAULTS.PAGE_SIZE),
}).refine(data => {
  // If both date filters are provided, date_to should be after date_from
  if (data.date_from && data.date_to) {
    return new Date(data.date_to) >= new Date(data.date_from);
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['date_to'],
});

// Cataloging job update schema (for status updates)
export const catalogingJobUpdateSchema = z.object({
  job_id: z.string().uuid('Job ID must be a valid UUID'),
  status: catalogingJobStatusSchema.optional(),
  error_message: z.string().max(1000, 'Error message must be less than 1000 characters').optional(),
  extracted_data: bookMetadataSchema.optional(),
  matched_edition_ids: z.array(z.string().uuid('Edition ID must be a valid UUID')).max(10, 'Maximum 10 matched editions').optional(),
})
.superRefine((data, ctx) => {
  // ✅ FIX: Use superRefine for conditional validation with accurate error paths
  if (data.status === 'failed' && !data.error_message) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Failed jobs must have an error message.',
      path: ['error_message'],
    });
  }
  if (data.status === 'completed' && !data.extracted_data) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Completed jobs must have extracted data.',
      path: ['extracted_data'],
    });
  }
});

// Error response schema
export const catalogingJobErrorSchema = z.object({
  code: z.string().min(1, 'Error code is required'),
  message: z.string().min(1, 'Error message is required'),
  details: z.record(z.string(), z.unknown()).optional(),
});

// Bulk operations schema
export const catalogingJobBulkDeleteSchema = z.object({
  job_ids: z.array(z.string().uuid('Job ID must be a valid UUID')).min(1, 'At least one job ID is required').max(CATALOGING_DEFAULTS.MAX_BULK_DELETE, `Maximum ${CATALOGING_DEFAULTS.MAX_BULK_DELETE} jobs can be deleted at once`),
});

export const catalogingJobBulkRetrySchema = z.object({
  job_ids: z.array(z.string().uuid('Job ID must be a valid UUID')).min(1, 'At least one job ID is required').max(CATALOGING_DEFAULTS.MAX_BULK_RETRY, `Maximum ${CATALOGING_DEFAULTS.MAX_BULK_RETRY} jobs can be retried at once`),
});

// Type inference for use in components
export type BookMetadata = z.infer<typeof bookMetadataSchema>;
export type CatalogingJobImageUrls = z.infer<typeof catalogingJobImageUrlsSchema>;
export type CatalogingJobCreateRequest = z.infer<typeof catalogingJobCreateRequestSchema>;
export type CatalogingJobFinalizeRequest = z.infer<typeof catalogingJobFinalizeRequestSchema>;
export type CatalogingJobFilters = z.infer<typeof catalogingJobFiltersSchema>;
export type CatalogingJobUpdate = z.infer<typeof catalogingJobUpdateSchema>;
export type CatalogingJobError = z.infer<typeof catalogingJobErrorSchema>;
export type CatalogingJobBulkDelete = z.infer<typeof catalogingJobBulkDeleteSchema>;
export type CatalogingJobBulkRetry = z.infer<typeof catalogingJobBulkRetrySchema>;
export type CatalogingJobSourceType = z.infer<typeof catalogingJobFiltersSchema.shape.source_type>;

// Utility functions for validation
export function validateBookMetadata(data: unknown): { success: true; data: BookMetadata } | { success: false; error: z.ZodError } {
  const result = bookMetadataSchema.safeParse(data);
  return result.success ? { success: true, data: result.data } : { success: false, error: result.error };
}

export function validateCatalogingJobCreateRequest(data: unknown): { success: true; data: CatalogingJobCreateRequest } | { success: false; error: z.ZodError } {
  const result = catalogingJobCreateRequestSchema.safeParse(data);
  return result.success ? { success: true, data: result.data } : { success: false, error: result.error };
}

export function validateCatalogingJobFinalizeRequest(data: unknown): { success: true; data: CatalogingJobFinalizeRequest } | { success: false; error: z.ZodError } {
  const result = catalogingJobFinalizeRequestSchema.safeParse(data);
  return result.success ? { success: true, data: result.data } : { success: false, error: result.error };
}

export function validateCatalogingJobFilters(data: unknown): { success: true; data: CatalogingJobFilters } | { success: false; error: z.ZodError } {
  const result = catalogingJobFiltersSchema.safeParse(data);
  return result.success ? { success: true, data: result.data } : { success: false, error: result.error };
}

// Helper function to format validation errors for user display
export function formatValidationErrors(error: z.ZodError): Record<string, string> {
  const formattedErrors: Record<string, string> = {};
  
  error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    formattedErrors[path] = issue.message;
  });
  
  return formattedErrors;
}

// Helper function to check if a string is a valid UUID
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

// Helper function to sanitize metadata for database storage
export function sanitizeBookMetadata(metadata: BookMetadata): BookMetadata {
  return {
    ...metadata,
    title: metadata.title.trim(),
    subtitle: metadata.subtitle?.trim(),
    authors: metadata.authors?.map(author => author.trim()).filter(Boolean),
    primary_author: metadata.primary_author?.trim(),
    publisher_name: metadata.publisher_name?.trim(),
    publication_location: metadata.publication_location?.trim(),
    edition_statement: metadata.edition_statement?.trim(),
    description: metadata.description?.trim(),
    notes: metadata.notes?.trim(),
    condition_assessment: metadata.condition_assessment?.trim(),
    table_of_contents: metadata.table_of_contents?.map(item => item.trim()).filter(Boolean),
  };
} 