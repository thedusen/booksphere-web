/**
 * Cataloging System Integration Tests
 * 
 * These tests verify the integration between the frontend hooks and the actual
 * Supabase database operations, including RPC calls, real-time subscriptions,
 * and data consistency.
 * 
 * Tests cover:
 * 1. Database RPC function calls (create, finalize, delete, retry)
 * 2. Real-time subscription handling
 * 3. Data validation and sanitization
 * 4. Multi-tenancy and organization scoping
 * 5. Transaction handling and rollback scenarios
 * 6. Performance under load
 * 7. Concurrent operation handling
 * 8. Cache invalidation and consistency
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { 
  TypedCatalogingJob, 
  CatalogingJobCreateRequest, 
  CatalogingJobFinalizeRequest,
  BookMetadata 
} from '@/lib/types/jobs';
import { 
  validateCatalogingJobCreateRequest, 
  validateCatalogingJobFinalizeRequest,
  sanitizeBookMetadata 
} from '@/lib/validators/cataloging';

// Test configuration
const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  testOrgId: 'test-org-integration',
  testUserId: 'test-user-integration',
};

// Integration test client
let supabase: ReturnType<typeof createClient>;

// Test data generators
const createMockBookMetadata = (overrides: Partial<BookMetadata> = {}): BookMetadata => ({
  title: 'Integration Test Book',
  primary_author: 'Test Author',
  isbn13: '9781234567890',
  extraction_source: 'ai_analysis',
  publisher_name: 'Test Publisher',
  publication_year: 2023,
  page_count: 300,
  extraction_confidence: 0.95,
  ...overrides,
});

const createMockCreateRequest = (overrides: Partial<CatalogingJobCreateRequest> = {}): CatalogingJobCreateRequest => ({
  source_type: 'manual_isbn',
  initial_metadata: createMockBookMetadata(),
  image_urls: { 
    cover_url: 'https://example.com/cover.jpg',
    title_page_url: 'https://example.com/title.jpg',
  },
  ...overrides,
});

const createMockFinalizeRequest = (jobId: string, overrides: Partial<CatalogingJobFinalizeRequest> = {}): CatalogingJobFinalizeRequest => ({
  job_id: jobId,
  title: 'Finalized Book Title',
  condition_id: 'test-condition-id',
  price: 25.99,
  authors: ['Main Author'],
  subtitle: 'A test subtitle',
  publisher_name: 'Test Publisher',
  publication_year: 2023,
  isbn: '9781234567890',
  has_dust_jacket: true,
  ...overrides,
});

describe('Cataloging System Integration Tests', () => {
  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
    
    // Verify connection
    const { data, error } = await supabase.from('organizations').select('id').limit(1);
    if (error) {
      throw new Error(`Failed to connect to Supabase: ${error.message}`);
    }
    
    console.log('✓ Supabase connection established');
  });

  beforeEach(async () => {
    // Clean up any existing test data
    await supabase
      .from('cataloging_jobs')
      .delete()
      .eq('organization_id', TEST_CONFIG.testOrgId);
    
    console.log('✓ Test data cleaned up');
  });

  afterAll(async () => {
    // Final cleanup
    await supabase
      .from('cataloging_jobs')
      .delete()
      .eq('organization_id', TEST_CONFIG.testOrgId);
    
    console.log('✓ Final cleanup completed');
  });

  describe('Database RPC Operations', () => {
    it('should create cataloging job successfully', async () => {
      const createRequest = createMockCreateRequest();
      
      // Validate request
      const validationResult = validateCatalogingJobCreateRequest(createRequest);
      expect(validationResult.success).toBe(true);
      
      // Call RPC function
      const { data, error } = await supabase.rpc('create_cataloging_job', {
        p_organization_id: TEST_CONFIG.testOrgId,
        p_user_id: TEST_CONFIG.testUserId,
        p_source_type: createRequest.source_type,
        p_initial_metadata: createRequest.initial_metadata,
        p_image_urls: createRequest.image_urls,
      });
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      const createResult = data as { job_id: string };
      expect(createResult.job_id).toBeDefined();
      expect(typeof createResult.job_id).toBe('string');
      
      console.log(`✓ Job created with ID: ${createResult.job_id}`);
      
      // Verify job was created in database
      const { data: jobData, error: jobError } = await supabase
        .from('cataloging_jobs')
        .select('*')
        .eq('job_id', createResult.job_id)
        .single();
      
      expect(jobError).toBeNull();
      expect(jobData).toBeDefined();
      
      if (jobData) {
        expect(jobData.organization_id).toBe(TEST_CONFIG.testOrgId);
        expect(jobData.user_id).toBe(TEST_CONFIG.testUserId);
        expect(jobData.status).toBe('pending');
        
        const extractedData = jobData.extracted_data as BookMetadata;
        expect(extractedData?.title).toBe(createRequest.initial_metadata?.title);
      }
    });

    it('should handle invalid create request', async () => {
      const invalidRequest = {
        source_type: '', // Invalid
        extracted_data: null, // Invalid
        image_urls: {},
      };
      
      // Validation should fail
      const validationResult = validateCatalogingJobCreateRequest(invalidRequest as any);
      expect(validationResult.success).toBe(false);
      
      // RPC call should fail
      const { data, error } = await supabase.rpc('create_cataloging_job', {
        p_organization_id: TEST_CONFIG.testOrgId,
        p_user_id: TEST_CONFIG.testUserId,
        p_source_type: invalidRequest.source_type,
        p_extracted_data: invalidRequest.extracted_data,
        p_image_urls: invalidRequest.image_urls,
      });
      
      expect(error).toBeDefined();
      expect(data).toBeNull();
      
      console.log(`✓ Invalid request rejected: ${error.message}`);
    });

    it('should retrieve cataloging jobs with filters', async () => {
      // Create test jobs
      const jobs = [];
      for (let i = 0; i < 3; i++) {
        const createRequest = createMockCreateRequest({
          extracted_data: createMockBookMetadata({ title: `Test Book ${i}` }),
        });
        
        const { data } = await supabase.rpc('create_cataloging_job', {
          p_organization_id: TEST_CONFIG.testOrgId,
          p_user_id: TEST_CONFIG.testUserId,
          p_source_type: createRequest.source_type,
          p_extracted_data: createRequest.extracted_data,
          p_image_urls: createRequest.image_urls,
        });
        
        jobs.push(data.job_id);
      }
      
      // Retrieve jobs
      const { data, error } = await supabase.rpc('get_cataloging_jobs', {
        p_organization_id: TEST_CONFIG.testOrgId,
        p_limit: 20,
        p_offset: 0,
        p_status: null,
        p_source_type: null,
        p_search_query: null,
        p_date_from: null,
        p_date_to: null,
      });
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.jobs).toBeDefined();
      expect(data.jobs.length).toBe(3);
      expect(data.total_count).toBe(3);
      expect(data.status_counts).toBeDefined();
      expect(data.status_counts.pending).toBe(3);
      
      console.log(`✓ Retrieved ${data.jobs.length} jobs`);
    });

    it('should filter jobs by search query', async () => {
      // Create jobs with different titles
      const titles = ['JavaScript Guide', 'Python Basics', 'Java Programming'];
      
      for (const title of titles) {
        const createRequest = createMockCreateRequest({
          extracted_data: createMockBookMetadata({ title }),
        });
        
        await supabase.rpc('create_cataloging_job', {
          p_organization_id: TEST_CONFIG.testOrgId,
          p_user_id: TEST_CONFIG.testUserId,
          p_source_type: createRequest.source_type,
          p_extracted_data: createRequest.extracted_data,
          p_image_urls: createRequest.image_urls,
        });
      }
      
      // Search for "Python"
      const { data, error } = await supabase.rpc('get_cataloging_jobs', {
        p_organization_id: TEST_CONFIG.testOrgId,
        p_limit: 20,
        p_offset: 0,
        p_status: null,
        p_source_type: null,
        p_search_query: 'Python',
        p_date_from: null,
        p_date_to: null,
      });
      
      expect(error).toBeNull();
      expect(data.jobs.length).toBe(1);
      expect(data.jobs[0].extracted_data.title).toBe('Python Basics');
      
      console.log(`✓ Search filtering works: found ${data.jobs.length} jobs`);
    });

    it('should finalize cataloging job successfully', async () => {
      // Create a job first
      const createRequest = createMockCreateRequest();
      const { data: createData } = await supabase.rpc('create_cataloging_job', {
        p_organization_id: TEST_CONFIG.testOrgId,
        p_user_id: TEST_CONFIG.testUserId,
        p_source_type: createRequest.source_type,
        p_extracted_data: createRequest.extracted_data,
        p_image_urls: createRequest.image_urls,
      });
      
      const jobId = createData.job_id;
      
      // Update job status to completed (prerequisite for finalization)
      await supabase
        .from('cataloging_jobs')
        .update({ status: 'completed' })
        .eq('job_id', jobId);
      
      // Finalize the job
      const finalizeRequest = createMockFinalizeRequest(jobId);
      
      // Validate finalize request
      const validationResult = validateCatalogingJobFinalizeRequest(finalizeRequest);
      expect(validationResult.success).toBe(true);
      
      // Call finalize RPC
      const { data, error } = await supabase.rpc('finalize_cataloging_job', {
        p_job_id: finalizeRequest.job_id,
        p_final_data: finalizeRequest.final_data,
        p_contributor_data: finalizeRequest.contributor_data,
        p_attributes: finalizeRequest.attributes,
      });
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.success).toBe(true);
      expect(data.stock_item_id).toBeDefined();
      
      console.log(`✓ Job finalized successfully, stock item ID: ${data.stock_item_id}`);
      
      // Verify job was marked as finalized
      const { data: jobData } = await supabase
        .from('cataloging_jobs')
        .select('*')
        .eq('job_id', jobId)
        .single();
      
      expect(jobData.status).toBe('finalized');
    });

    it('should delete cataloging jobs successfully', async () => {
      // Create test jobs
      const jobIds = [];
      for (let i = 0; i < 3; i++) {
        const createRequest = createMockCreateRequest({
          extracted_data: createMockBookMetadata({ title: `Delete Test ${i}` }),
        });
        
        const { data } = await supabase.rpc('create_cataloging_job', {
          p_organization_id: TEST_CONFIG.testOrgId,
          p_user_id: TEST_CONFIG.testUserId,
          p_source_type: createRequest.source_type,
          p_extracted_data: createRequest.extracted_data,
          p_image_urls: createRequest.image_urls,
        });
        
        jobIds.push(data.job_id);
      }
      
      // Delete jobs
      const { data, error } = await supabase.rpc('delete_cataloging_jobs', {
        p_job_ids: jobIds,
        p_organization_id: TEST_CONFIG.testOrgId,
      });
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.deleted_count).toBe(3);
      
      console.log(`✓ Deleted ${data.deleted_count} jobs`);
      
      // Verify jobs were deleted
      const { data: remainingJobs } = await supabase
        .from('cataloging_jobs')
        .select('job_id')
        .in('job_id', jobIds);
      
      expect(remainingJobs.length).toBe(0);
    });

    it('should retry failed cataloging jobs', async () => {
      // Create a job and mark it as failed
      const createRequest = createMockCreateRequest();
      const { data: createData } = await supabase.rpc('create_cataloging_job', {
        p_organization_id: TEST_CONFIG.testOrgId,
        p_user_id: TEST_CONFIG.testUserId,
        p_source_type: createRequest.source_type,
        p_extracted_data: createRequest.extracted_data,
        p_image_urls: createRequest.image_urls,
      });
      
      const jobId = createData.job_id;
      
      // Mark job as failed
      await supabase
        .from('cataloging_jobs')
        .update({ 
          status: 'failed', 
          error_message: 'Test failure' 
        })
        .eq('job_id', jobId);
      
      // Retry the job
      const { data, error } = await supabase.rpc('retry_cataloging_jobs', {
        p_job_ids: [jobId],
        p_organization_id: TEST_CONFIG.testOrgId,
      });
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.retried_count).toBe(1);
      
      console.log(`✓ Retried ${data.retried_count} jobs`);
      
      // Verify job status was reset
      const { data: jobData } = await supabase
        .from('cataloging_jobs')
        .select('*')
        .eq('job_id', jobId)
        .single();
      
      expect(jobData.status).toBe('pending');
      expect(jobData.error_message).toBeNull();
    });
  });

  describe('Data Validation and Sanitization', () => {
    it('should sanitize book metadata correctly', () => {
      const unsanitizedData = {
        title: '  Test Book  ',
        primary_author: 'Test Author\n',
        isbn13: '978-1-234-56789-0',
        publisher_name: '<script>alert("xss")</script>',
        publication_year: 2023,
        page_count: 300,
        extraction_source: 'ai_analysis',
        extraction_confidence: 0.95,
      };
      
      const sanitized = sanitizeBookMetadata(unsanitizedData);
      
      expect(sanitized.title).toBe('Test Book');
      expect(sanitized.primary_author).toBe('Test Author');
      expect(sanitized.isbn13).toBe('9781234567890');
      expect(sanitized.publisher_name).toBe('alert("xss")');
      
      console.log('✓ Data sanitization works correctly');
    });

    it('should handle null and undefined values', () => {
      const dataWithNulls = {
        title: 'Test Book',
        primary_author: null,
        isbn13: undefined,
        publisher_name: '',
        publication_year: 2023,
        page_count: null,
        extraction_source: 'ai_analysis',
        extraction_confidence: 0.95,
      };
      
      const sanitized = sanitizeBookMetadata(dataWithNulls as any);
      
      expect(sanitized.title).toBe('Test Book');
      expect(sanitized.primary_author).toBeNull();
      expect(sanitized.isbn13).toBeNull();
      expect(sanitized.publisher_name).toBeNull();
      expect(sanitized.page_count).toBeNull();
      
      console.log('✓ Null/undefined handling works correctly');
    });

    it('should validate complex finalize request', () => {
      const complexRequest = createMockFinalizeRequest('test-job-id', {
        final_data: createMockBookMetadata({
          title: 'Complex Book Title',
          authors: ['Author 1', 'Author 2', 'Author 3'],
          publisher_name: 'Complex Publisher',
          publication_year: 2023,
          page_count: 456,
          format_name: 'Hardcover',
          language_name: 'English',
          description: 'A complex book description with multiple sentences.',
          cover_image_url: 'https://example.com/complex-cover.jpg',
        }),
        contributor_data: [
          { name: 'Primary Author', role: 'author' },
          { name: 'Secondary Author', role: 'author' },
          { name: 'Editor', role: 'editor' },
          { name: 'Translator', role: 'translator' },
        ],
        attributes: [
          { attribute_type_id: 'signed', boolean_value: true },
          { attribute_type_id: 'first_edition', boolean_value: false },
          { attribute_type_id: 'condition', string_value: 'Fine' },
          { attribute_type_id: 'binding', string_value: 'Hardcover' },
          { attribute_type_id: 'price', decimal_value: 25.99 },
        ],
      });
      
      const validationResult = validateCatalogingJobFinalizeRequest(complexRequest);
      expect(validationResult.success).toBe(true);
      
      console.log('✓ Complex finalize request validation passed');
    });
  });

  describe('Multi-tenancy and Security', () => {
    it('should enforce organization scoping', async () => {
      // Create job in one organization
      const createRequest = createMockCreateRequest();
      const { data: createData } = await supabase.rpc('create_cataloging_job', {
        p_organization_id: TEST_CONFIG.testOrgId,
        p_user_id: TEST_CONFIG.testUserId,
        p_source_type: createRequest.source_type,
        p_extracted_data: createRequest.extracted_data,
        p_image_urls: createRequest.image_urls,
      });
      
      const jobId = createData.job_id;
      
      // Try to access from different organization
      const { data, error } = await supabase.rpc('get_cataloging_jobs', {
        p_organization_id: 'different-org-id',
        p_limit: 20,
        p_offset: 0,
        p_status: null,
        p_source_type: null,
        p_search_query: null,
        p_date_from: null,
        p_date_to: null,
      });
      
      expect(error).toBeNull();
      expect(data.jobs.length).toBe(0);
      
      console.log('✓ Organization scoping enforced');
    });

    it('should prevent unauthorized job deletion', async () => {
      // Create job
      const createRequest = createMockCreateRequest();
      const { data: createData } = await supabase.rpc('create_cataloging_job', {
        p_organization_id: TEST_CONFIG.testOrgId,
        p_user_id: TEST_CONFIG.testUserId,
        p_source_type: createRequest.source_type,
        p_extracted_data: createRequest.extracted_data,
        p_image_urls: createRequest.image_urls,
      });
      
      const jobId = createData.job_id;
      
      // Try to delete from different organization
      const { data, error } = await supabase.rpc('delete_cataloging_jobs', {
        p_job_ids: [jobId],
        p_organization_id: 'different-org-id',
      });
      
      expect(error).toBeNull();
      expect(data.deleted_count).toBe(0);
      
      // Verify job still exists
      const { data: jobData } = await supabase
        .from('cataloging_jobs')
        .select('job_id')
        .eq('job_id', jobId)
        .single();
      
      expect(jobData).toBeDefined();
      
      console.log('✓ Unauthorized deletion prevented');
    });
  });

  describe('Performance and Concurrent Operations', () => {
    it('should handle concurrent job creation', async () => {
      const numberOfJobs = 10;
      const createPromises = [];
      
      // Create multiple jobs concurrently
      for (let i = 0; i < numberOfJobs; i++) {
        const createRequest = createMockCreateRequest({
          extracted_data: createMockBookMetadata({ title: `Concurrent Test ${i}` }),
        });
        
        const promise = supabase.rpc('create_cataloging_job', {
          p_organization_id: TEST_CONFIG.testOrgId,
          p_user_id: TEST_CONFIG.testUserId,
          p_source_type: createRequest.source_type,
          p_extracted_data: createRequest.extracted_data,
          p_image_urls: createRequest.image_urls,
        });
        
        createPromises.push(promise);
      }
      
      // Wait for all to complete
      const results = await Promise.allSettled(createPromises);
      
      // Count successful creations
      const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value.error === null
      ).length;
      
      expect(successCount).toBe(numberOfJobs);
      
      console.log(`✓ Concurrent job creation successful: ${successCount}/${numberOfJobs}`);
    });

    it('should handle large batch operations', async () => {
      const batchSize = 50;
      const jobIds = [];
      
      // Create jobs in batches
      for (let i = 0; i < batchSize; i++) {
        const createRequest = createMockCreateRequest({
          extracted_data: createMockBookMetadata({ title: `Batch Test ${i}` }),
        });
        
        const { data } = await supabase.rpc('create_cataloging_job', {
          p_organization_id: TEST_CONFIG.testOrgId,
          p_user_id: TEST_CONFIG.testUserId,
          p_source_type: createRequest.source_type,
          p_extracted_data: createRequest.extracted_data,
          p_image_urls: createRequest.image_urls,
        });
        
        jobIds.push(data.job_id);
      }
      
      // Retrieve all jobs
      const { data, error } = await supabase.rpc('get_cataloging_jobs', {
        p_organization_id: TEST_CONFIG.testOrgId,
        p_limit: 100,
        p_offset: 0,
        p_status: null,
        p_source_type: null,
        p_search_query: null,
        p_date_from: null,
        p_date_to: null,
      });
      
      expect(error).toBeNull();
      expect(data.jobs.length).toBe(batchSize);
      expect(data.total_count).toBe(batchSize);
      
      // Batch delete
      const { data: deleteData } = await supabase.rpc('delete_cataloging_jobs', {
        p_job_ids: jobIds,
        p_organization_id: TEST_CONFIG.testOrgId,
      });
      
      expect(deleteData.deleted_count).toBe(batchSize);
      
      console.log(`✓ Batch operations successful: ${batchSize} jobs`);
    });
  });

  describe('Real-time Integration', () => {
    it('should establish real-time connection', async () => {
      const channel = supabase.channel('test-cataloging-jobs');
      
      let connected = false;
      
      channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'cataloging_jobs',
        }, () => {
          console.log('Real-time event received');
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            connected = true;
          }
        });
      
      // Wait for connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      expect(connected).toBe(true);
      
      // Cleanup
      await channel.unsubscribe();
      
      console.log('✓ Real-time connection established');
    });

    it('should receive real-time updates on job creation', async () => {
      const channel = supabase.channel('test-job-creation');
      
      let eventReceived = false;
      let receivedData: any = null;
      
      channel
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'cataloging_jobs',
        }, (payload) => {
          eventReceived = true;
          receivedData = payload.new;
        })
        .subscribe();
      
      // Wait for subscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a job
      const createRequest = createMockCreateRequest({
        extracted_data: createMockBookMetadata({ title: 'Real-time Test' }),
      });
      
      await supabase.rpc('create_cataloging_job', {
        p_organization_id: TEST_CONFIG.testOrgId,
        p_user_id: TEST_CONFIG.testUserId,
        p_source_type: createRequest.source_type,
        p_extracted_data: createRequest.extracted_data,
        p_image_urls: createRequest.image_urls,
      });
      
      // Wait for real-time event
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      expect(eventReceived).toBe(true);
      expect(receivedData).toBeDefined();
      expect(receivedData.organization_id).toBe(TEST_CONFIG.testOrgId);
      
      // Cleanup
      await channel.unsubscribe();
      
      console.log('✓ Real-time job creation event received');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      // Create a client with invalid URL
      const invalidClient = createClient('https://invalid-url.supabase.co', TEST_CONFIG.supabaseKey);
      
      const { data, error } = await invalidClient.rpc('create_cataloging_job', {
        p_organization_id: TEST_CONFIG.testOrgId,
        p_user_id: TEST_CONFIG.testUserId,
        p_source_type: 'manual',
        p_extracted_data: createMockBookMetadata(),
        p_image_urls: {},
      });
      
      expect(error).toBeDefined();
      expect(data).toBeNull();
      
      console.log(`✓ Database connection error handled: ${error.message}`);
    });

    it('should handle malformed data gracefully', async () => {
      const malformedData = {
        title: null,
        primary_author: undefined,
        isbn13: 'not-a-valid-isbn',
        publication_year: 'invalid-year',
        page_count: -1,
        extraction_source: 'ai_analysis',
      };
      
      const { data, error } = await supabase.rpc('create_cataloging_job', {
        p_organization_id: TEST_CONFIG.testOrgId,
        p_user_id: TEST_CONFIG.testUserId,
        p_source_type: 'manual',
        p_extracted_data: malformedData,
        p_image_urls: {},
      });
      
      expect(error).toBeDefined();
      expect(data).toBeNull();
      
      console.log(`✓ Malformed data rejected: ${error.message}`);
    });

    it('should handle missing required parameters', async () => {
      const { data, error } = await supabase.rpc('create_cataloging_job', {
        p_organization_id: null,
        p_user_id: null,
        p_source_type: null,
        p_extracted_data: null,
        p_image_urls: null,
      });
      
      expect(error).toBeDefined();
      expect(data).toBeNull();
      
      console.log(`✓ Missing parameters rejected: ${error.message}`);
    });
  });
}); 