// Flag-related enums and types for the data quality flagging system

export enum FlagStatus {
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export enum FlagType {
  INCORRECT_DATA = 'incorrect_data',
  MISSING_DATA = 'missing_data',
  DUPLICATE_RECORD = 'duplicate_record',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  COPYRIGHT_ISSUE = 'copyright_issue',
  OTHER = 'other',
}

export enum FlagSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface FlagFormData {
  table_name: string;
  record_id: string;
  field_name?: string;
  flag_type: FlagType;
  severity: FlagSeverity;
  description?: string;
  suggested_value?: unknown;
  details?: Record<string, unknown>;
}

export interface FlagStatusUpdate {
  flag_id: string;
  status: FlagStatus;
  resolution_notes?: string;
  reviewed_by?: string;
}

/**
 * Standardized context data interface for flagging operations
 * Ensures consistency across all flagging trigger implementations
 */
export interface FlagContextData {
  // Book/Edition Information
  title?: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  publicationDate?: string;
  
  // Stock Item Information  
  condition?: string;
  price?: number;
  sku?: string;
  location?: string;
  
  // Additional Context
  [key: string]: unknown;
}

/**
 * Helper function to create standardized context data
 * Use this to ensure consistent field naming across components
 */
export function createFlagContextData(data: {
  // Book/Edition fields
  title?: string;
  primaryAuthor?: string;
  author?: string;
  isbn13?: string;
  isbn10?: string;
  isbn?: string;
  publisher?: string;
  publicationDate?: string;
  
  // Stock item fields
  condition?: string;
  sellingPrice?: number;
  price?: number;
  sku?: string;
  locationInStore?: string;
  location?: string;
  
  // Allow additional fields
  [key: string]: unknown;
}): FlagContextData {
  return {
    title: data.title,
    author: data.primaryAuthor || data.author,
    isbn: data.isbn13 || data.isbn10 || data.isbn,
    publisher: data.publisher,
    publicationDate: data.publicationDate,
    condition: data.condition,
    price: data.sellingPrice || data.price,
    sku: data.sku,
    location: data.locationInStore || data.location,
    
    // Include any additional fields not covered above
    ...Object.fromEntries(
      Object.entries(data).filter(([key]) => 
        !['title', 'primaryAuthor', 'author', 'isbn13', 'isbn10', 'isbn', 
          'publisher', 'publicationDate', 'condition', 'sellingPrice', 
          'price', 'sku', 'locationInStore', 'location'].includes(key)
      )
    )
  };
}
