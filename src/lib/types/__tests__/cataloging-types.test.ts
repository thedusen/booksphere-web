import { describe, it, expect } from 'vitest';
import {
  TypedCatalogingJob,
  BookMetadata,
  CatalogingJobImageUrls,
  CatalogingJobCreateRequest,
  CatalogingJobFinalizeRequest,
  isBookMetadataV2,
  isCatalogingJobImageUrls,
  isTypedCatalogingJob,
  isCatalogingJobStatus,
  getCatalogingJobDisplayStatus,
  getCatalogingJobStatusColor,
  isCatalogingJobActionable,
  isCatalogingJobInProgress,
} from '../jobs';
import {
  bookMetadataSchema,
  catalogingJobCreateRequestSchema,
  catalogingJobFinalizeRequestSchema,
  catalogingJobFiltersSchema,
  validateBookMetadata,
  validateCatalogingJobCreateRequest,
  validateCatalogingJobFinalizeRequest,
  validateCatalogingJobFilters,
  formatValidationErrors,
  sanitizeBookMetadata,
} from '@/lib/validators/cataloging';

describe('Cataloging Types and Validation', () => {
  describe('BookMetadata Type Guard', () => {
    it('should validate valid book metadata', () => {
      // ✅ FIX: Use 'any' type to ensure runtime validation is tested
      const validMetadata: any = {
        title: 'Test Book',
        subtitle: 'A Test Subtitle',
        authors: ['Author One', 'Author Two'],
        primary_author: 'Author One',
        publisher_name: 'Test Publisher',
        publication_year: 2023,
        isbn13: '9781234567890',
        page_count: 300,
        extraction_confidence: 0.95,
        extraction_source: 'ai_analysis',
        has_dust_jacket: true,
      };

      expect(isBookMetadataV2(validMetadata)).toBe(true);
    });

    it('should reject invalid book metadata', () => {
      const invalidMetadata = {
        // Missing required title
        subtitle: 'A Test Subtitle',
        authors: ['Author One'],
        publication_year: 'not a number', // Invalid type
      };

      expect(isBookMetadataV2(invalidMetadata)).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(isBookMetadataV2(null)).toBe(false);
      expect(isBookMetadataV2(undefined)).toBe(false);
      expect(isBookMetadataV2('')).toBe(false);
    });
  });

  describe('CatalogingJobImageUrls Type Guard', () => {
    it('should validate valid image URLs', () => {
      // ✅ FIX: Use 'any' type to ensure runtime validation is tested
      const validUrls: any = {
        cover_url: 'https://example.com/cover.jpg',
        title_page_url: 'https://example.com/title.jpg',
        copyright_page_url: 'https://example.com/copyright.jpg',
        additional_images: ['https://example.com/extra1.jpg', 'https://example.com/extra2.jpg'],
      };

      expect(isCatalogingJobImageUrls(validUrls)).toBe(true);
    });

    it('should validate empty object', () => {
      expect(isCatalogingJobImageUrls({})).toBe(true);
    });

    it('should reject invalid types', () => {
      const invalidUrls = {
        cover_url: 123, // Invalid type
        title_page_url: 'https://example.com/title.jpg',
      };

      expect(isCatalogingJobImageUrls(invalidUrls)).toBe(false);
    });
  });

  describe('CatalogingJobStatus Type Guard', () => {
    it('should validate valid statuses', () => {
      expect(isCatalogingJobStatus('pending')).toBe(true);
      expect(isCatalogingJobStatus('processing')).toBe(true);
      expect(isCatalogingJobStatus('completed')).toBe(true);
      expect(isCatalogingJobStatus('failed')).toBe(true);
    });

    it('should reject invalid statuses', () => {
      expect(isCatalogingJobStatus('invalid')).toBe(false);
      expect(isCatalogingJobStatus('')).toBe(false);
      expect(isCatalogingJobStatus(null)).toBe(false);
      expect(isCatalogingJobStatus(undefined)).toBe(false);
    });
  });

  describe('TypedCatalogingJob Type Guard', () => {
    it('should validate complete cataloging job', () => {
      // ✅ FIX: Use 'any' type to ensure runtime validation is tested
      const validJob: any = {
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        organization_id: '987fcdeb-51d3-12b4-a456-426614174001',
        user_id: '456e7890-e89b-12d3-a456-426614174002',
        status: 'completed',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T01:00:00Z',
        extracted_data: {
          title: 'Test Book',
          authors: ['Test Author'],
          isbn13: '9781234567890',
        },
        image_urls: {
          cover_url: 'https://example.com/cover.jpg',
        },
        error_message: null,
        matched_edition_ids: ['bf48c152-8c38-4433-b137-961d1e574c93'],
      };

      expect(isTypedCatalogingJob(validJob)).toBe(true);
    });

    it('should reject job with invalid structure', () => {
      const invalidJob = {
        job_id: 'not-a-uuid',
        organization_id: '987fcdeb-51d3-12b4-a456-426614174001',
        // Missing required fields
      };

      expect(isTypedCatalogingJob(invalidJob)).toBe(false);
    });
  });

  describe('Status Utility Functions', () => {
    it('should return correct display status', () => {
      expect(getCatalogingJobDisplayStatus('pending')).toBe('Pending Processing');
      expect(getCatalogingJobDisplayStatus('processing')).toBe('Processing');
      expect(getCatalogingJobDisplayStatus('completed')).toBe('Ready for Review');
      expect(getCatalogingJobDisplayStatus('failed')).toBe('Processing Failed');
    });

    it('should return correct status colors', () => {
      expect(getCatalogingJobStatusColor('pending')).toBe('bg-yellow-100 text-yellow-800');
      expect(getCatalogingJobStatusColor('processing')).toBe('bg-blue-100 text-blue-800');
      expect(getCatalogingJobStatusColor('completed')).toBe('bg-green-100 text-green-800');
      expect(getCatalogingJobStatusColor('failed')).toBe('bg-red-100 text-red-800');
    });

    it('should correctly identify actionable jobs', () => {
      expect(isCatalogingJobActionable('completed')).toBe(true);
      expect(isCatalogingJobActionable('pending')).toBe(false);
      expect(isCatalogingJobActionable('processing')).toBe(false);
      expect(isCatalogingJobActionable('failed')).toBe(false);
    });

    it('should correctly identify in-progress jobs', () => {
      expect(isCatalogingJobInProgress('pending')).toBe(true);
      expect(isCatalogingJobInProgress('processing')).toBe(true);
      expect(isCatalogingJobInProgress('completed')).toBe(false);
      expect(isCatalogingJobInProgress('failed')).toBe(false);
    });
  });

  describe('Zod Schema Validation', () => {
    describe('Book Metadata Schema', () => {
      it('should validate complete book metadata', () => {
        const validData = {
          title: 'Test Book',
          subtitle: 'A Test Subtitle',
          authors: ['Author One', 'Author Two'],
          primary_author: 'Author One',
          publisher_name: 'Test Publisher',
          publication_year: 2023,
          isbn13: '9781234567890',
          isbn10: '1234567890',
          page_count: 300,
          format_name: 'Hardcover',
          language_name: 'English',
          extraction_confidence: 0.95,
          extraction_source: 'ai_analysis',
          has_dust_jacket: true,
          description: 'A test book description',
          cover_image_url: 'https://example.com/cover.jpg',
          suggested_price_range: {
            min: 10.00,
            max: 25.00,
            currency: 'USD',
          },
        };

        const result = bookMetadataSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.title).toBe('Test Book');
          expect(result.data.suggested_price_range?.currency).toBe('USD');
        }
      });

      it('should reject invalid book metadata', () => {
        const invalidData = {
          title: '', // Empty title
          publication_year: 'not a number',
          isbn13: 'invalid-isbn',
          page_count: -1,
          extraction_confidence: 1.5, // Over 1.0
        };

        const result = bookMetadataSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0);
        }
      });
    });

    describe('Cataloging Job Create Request Schema', () => {
      it('should validate valid create request', () => {
        const validRequest = {
          image_urls: {
            cover_url: 'https://example.com/cover.jpg',
            title_page_url: 'https://example.com/title.jpg',
          },
          source_type: 'image_capture',
          initial_metadata: {
            title: 'Preliminary Title',
          },
        };

        const result = catalogingJobCreateRequestSchema.safeParse(validRequest);
        expect(result.success).toBe(true);
      });

      it('should reject request without image URLs', () => {
        const invalidRequest = {
          source_type: 'image_capture',
        };

        const result = catalogingJobCreateRequestSchema.safeParse(invalidRequest);
        expect(result.success).toBe(false);
      });
    });

    describe('Cataloging Job Finalize Request Schema', () => {
      it('should validate valid finalize request', () => {
        const validRequest = {
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Final Book Title',
          condition_id: '987fcdeb-51d3-12b4-a456-426614174001',
          price: 25.99,
          subtitle: 'Final Subtitle',
          authors: ['Final Author'],
          publication_year: 2023,
          has_dust_jacket: true,
          condition_notes: 'Excellent condition',
        };

        const result = catalogingJobFinalizeRequestSchema.safeParse(validRequest);
        expect(result.success).toBe(true);
      });

      it('should reject request with invalid UUID', () => {
        const invalidRequest = {
          job_id: 'not-a-uuid',
          title: 'Test Title',
          condition_id: 'also-not-a-uuid',
          price: 25.99,
        };

        const result = catalogingJobFinalizeRequestSchema.safeParse(invalidRequest);
        expect(result.success).toBe(false);
      });

      it('should reject request with invalid price', () => {
        const invalidRequest = {
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Test Title',
          condition_id: '987fcdeb-51d3-12b4-a456-426614174001',
          price: 0, // Invalid - must be at least 0.01
        };

        const result = catalogingJobFinalizeRequestSchema.safeParse(invalidRequest);
        expect(result.success).toBe(false);
      });
    });

    describe('Cataloging Job Filters Schema', () => {
      it('should validate empty filters with defaults', () => {
        const result = catalogingJobFiltersSchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
          expect(result.data.limit).toBe(25);
        }
      });

      it('should validate filters with all fields', () => {
        const filters = {
          status: 'completed',
          date_from: '2023-01-01T00:00:00Z',
          date_to: '2023-12-31T23:59:59Z',
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          search_query: 'test query',
          page: 2,
          limit: 50,
        };

        const result = catalogingJobFiltersSchema.safeParse(filters);
        expect(result.success).toBe(true);
      });

      it('should reject filters with invalid date range', () => {
        const filters = {
          date_from: '2023-12-31T23:59:59Z',
          date_to: '2023-01-01T00:00:00Z', // Before date_from
        };

        const result = catalogingJobFiltersSchema.safeParse(filters);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Validation Utility Functions', () => {
    it('should validate book metadata and return success', () => {
      const validData = {
        title: 'Test Book',
        authors: ['Test Author'],
      };

      const result = validateBookMetadata(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test Book');
      }
    });

    it('should validate book metadata and return error', () => {
      const invalidData = {
        title: '', // Empty title
      };

      const result = validateBookMetadata(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('should format validation errors correctly', () => {
      const invalidData = {
        title: '',
        page_count: -1,
      };

      const result = bookMetadataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const formattedErrors = formatValidationErrors(result.error);
        expect(formattedErrors).toHaveProperty('title');
        expect(formattedErrors).toHaveProperty('page_count');
        expect(typeof formattedErrors.title).toBe('string');
        expect(typeof formattedErrors.page_count).toBe('string');
      }
    });

    it('should sanitize book metadata correctly', () => {
      const dirtyMetadata: BookMetadata = {
        title: '  Test Book  ',
        subtitle: '  Test Subtitle  ',
        authors: ['  Author One  ', '  Author Two  ', ''],
        primary_author: '  Primary Author  ',
        publisher_name: '  Test Publisher  ',
        description: '  Test description  ',
        notes: '  Test notes  ',
        table_of_contents: ['  Chapter 1  ', '  Chapter 2  ', ''],
      };

      const sanitized = sanitizeBookMetadata(dirtyMetadata);
      expect(sanitized.title).toBe('Test Book');
      expect(sanitized.subtitle).toBe('Test Subtitle');
      expect(sanitized.authors).toEqual(['Author One', 'Author Two']);
      expect(sanitized.primary_author).toBe('Primary Author');
      expect(sanitized.publisher_name).toBe('Test Publisher');
      expect(sanitized.description).toBe('Test description');
      expect(sanitized.notes).toBe('Test notes');
      expect(sanitized.table_of_contents).toEqual(['Chapter 1', 'Chapter 2']);
    });
  });
}); 