/**
 * Cataloging Constants
 * 
 * Single source of truth for default values used across the cataloging system.
 * This prevents inconsistencies between different parts of the application.
 */

// Default pagination values
export const CATALOGING_DEFAULTS = {
  // Pagination
  PAGE_SIZE: 25,
  PAGE_NUMBER: 1,
  MAX_PAGE_SIZE: 100,
  
  // Sorting
  SORT_BY: 'created_at' as const,
  SORT_ORDER: 'desc' as const,
  
  // Bulk operations
  MAX_BULK_DELETE: 50,
  MAX_BULK_RETRY: 20,
  
  // Search and filters
  MAX_SEARCH_QUERY_LENGTH: 100,
} as const;

// Status-related constants
export const CATALOGING_STATUS_LABELS = {
  pending: 'Pending Processing',
  processing: 'Processing',
  completed: 'Ready for Review',
  failed: 'Processing Failed',
} as const;

export const CATALOGING_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
} as const;

// Image upload constants
export const CATALOGING_IMAGE_LIMITS = {
  MAX_ADDITIONAL_IMAGES: 10,
  MAX_FILE_SIZE_MB: 10,
  ACCEPTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'] as const,
} as const;

// Metadata validation constants
export const CATALOGING_VALIDATION_LIMITS = {
  TITLE_MAX_LENGTH: 500,
  SUBTITLE_MAX_LENGTH: 500,
  PUBLISHER_MAX_LENGTH: 255,
  DESCRIPTION_MAX_LENGTH: 2000,
  NOTES_MAX_LENGTH: 1000,
  CONDITION_NOTES_MAX_LENGTH: 1000,
  SKU_MAX_LENGTH: 100,
  EDITION_STATEMENT_MAX_LENGTH: 100,
  PUBLICATION_LOCATION_MAX_LENGTH: 255,
  MAX_AUTHORS: 10,
  MAX_TABLE_OF_CONTENTS_ENTRIES: 50,
  TABLE_OF_CONTENTS_ENTRY_MAX_LENGTH: 500,
  ERROR_MESSAGE_MAX_LENGTH: 1000,
  CONDITION_ASSESSMENT_MAX_LENGTH: 500,
  MAX_ATTRIBUTES: 20,
  MAX_MATCHED_EDITIONS: 10,
} as const;

// Price validation constants
export const CATALOGING_PRICE_LIMITS = {
  MIN_PRICE: 0.01,
  MAX_PRICE: 99999.99,
} as const;

// Date validation constants
export const CATALOGING_DATE_LIMITS = {
  MIN_PUBLICATION_YEAR: 1000,
  MAX_PUBLICATION_YEAR_OFFSET: 5, // Years in the future
} as const; 