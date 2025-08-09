/**
 * Book API Service
 * 
 * Real API integration using Buildship endpoints, matching the mobile app implementation.
 * This replaces the mock book lookup functions.
 */

// Types matching mobile app's API structure
export interface BookData {
  isbn?: string;
  title?: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  published_date?: string;
  page_count?: number;
  cover_image_url?: string;
  format_type?: string;
}

export interface ApiResponse {
  jsonResult?: {
    bookData?: BookData;
  };
  error?: string;
  status?: string;
}

/**
 * Fetch enriched book data by ISBN using Buildship API
 * This matches the exact implementation from mobile app's review.tsx
 */
export const fetchBookDataByISBN = async (isbn: string): Promise<BookData> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  if (!baseUrl) {
    throw new Error('API base URL not configured. Please set NEXT_PUBLIC_API_BASE_URL in environment variables.');
  }

  const response = await fetch(`${baseUrl}/getEnrichedBookDataByIsbn?isbn=${isbn}`);
  
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  
  const data: ApiResponse = await response.json();
  
  if (data.jsonResult && data.jsonResult.bookData) {
    return data.jsonResult.bookData;
  }
  
  throw new Error('Book data not found for this ISBN.');
};

/**
 * Validate ISBN format (10 or 13 digits)
 */
export const validateISBN = (isbn: string): boolean => {
  const cleanIsbn = isbn.replace(/[-\s]/g, '');
  return /^(97[89])?\d{9}[\dX]$/i.test(cleanIsbn);
};

/**
 * Clean ISBN by removing dashes and spaces
 */
export const cleanISBN = (isbn: string): string => {
  return isbn.replace(/[-\s]/g, '');
};

/**
 * Format ISBN with dashes for display
 */
export const formatISBN = (isbn: string): string => {
  const clean = cleanISBN(isbn);
  
  if (clean.length === 10) {
    return `${clean.slice(0, 1)}-${clean.slice(1, 6)}-${clean.slice(6, 9)}-${clean.slice(9)}`;
  }
  
  if (clean.length === 13) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 12)}-${clean.slice(12)}`;
  }
  
  return isbn; // Return as-is if not standard length
};