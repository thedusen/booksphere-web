/**
 * CACHE-BUSTING VALIDATION MODULE
 * 
 * This module bypasses persistent browser/Next.js caching issues by providing
 * validation functions through a completely new import path.
 * 
 * Created to resolve AI Analysis job validation errors.
 */

import { BookMetadata } from './jobs';

/**
 * Cache-busted validation function for BookMetadata
 * Only requires title field - allows both AI Analysis and ISBN-based jobs
 */
export function validateBookMetadataCacheBusted(value: unknown): value is BookMetadata {
  // Add multiple debug markers to ensure this new code is executing
  console.log('🔥 CACHE-BYPASS MODULE EXECUTING - New file path!');
  console.log('⚡ validateBookMetadataCacheBusted - Timestamp:', new Date().toISOString());
  
  if (!value || typeof value !== 'object') {
    console.error('❌ Cache-bypass validation failed: value is not an object', { value, type: typeof value });
    return false;
  }
  
  const metadata = value as Record<string, unknown>;
  
  // SIMPLE VALIDATION: Only require title to exist and be a non-empty string
  // This allows both AI Analysis jobs (no ISBN) and ISBN-based jobs to pass
  if (!metadata.title || typeof metadata.title !== 'string' || metadata.title.length === 0) {
    console.error('❌ Cache-bypass validation failed: title is missing, not a string, or empty', { 
      title: metadata.title, 
      titleType: typeof metadata.title,
      allKeys: Object.keys(metadata)
    });
    return false;
  }
  
  console.log('✅ CACHE-BYPASS VALIDATION PASSED for title:', metadata.title);
  
  // Optional fields type checking - same logic as before but in new module
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
  
  console.log('🎉 CACHE-BYPASS MODULE VALIDATION COMPLETE - SUCCESS!');
  return true;
}