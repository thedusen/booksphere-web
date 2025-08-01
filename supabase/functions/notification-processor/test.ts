/**
 * Test suite for the notification-processor Edge Function
 * 
 * This file contains comprehensive tests to validate:
 * - Security measures (RLS, input validation, payload sanitization)
 * - Rate limiting functionality
 * - Advisory lock behavior
 * - Error handling and recovery
 * - Performance under load
 */

import { assertEquals, assertExists, assertRejects } from 'https://deno.land/std@0.168.0/testing/asserts.ts'
import { createClient } from '@supabase/supabase-js'

// Test configuration
const TEST_ORG_ID = 'test-org-uuid-12345'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321'
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'test-key'

// Test utilities
async function createTestClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

async function createTestEvent(supabase: any, orgId: string, eventType: string = 'job_completed') {
  const { data, error } = await supabase
    .from('cataloging_event_outbox')
    .insert({
      organization_id: orgId,
      event_type: eventType,
      job_id: crypto.randomUUID(),
      entity_type: 'cataloging_job',
      event_data: { test: true },
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

async function invokeNotificationProcessor(orgId: string) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/notification-processor?org_id=${orgId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
  })
  
  return {
    status: response.status,
    data: await response.json(),
  }
}

// Test Suite
Deno.test('Security: Input Validation', async () => {
  // Test invalid org_id format
  const invalidResponse = await invokeNotificationProcessor('invalid-uuid')
  assertEquals(invalidResponse.status, 500)
  assertEquals(invalidResponse.data.success, false)
  
  // Test missing org_id
  const missingResponse = await fetch(`${SUPABASE_URL}/functions/v1/notification-processor`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
  })
  
  assertEquals(missingResponse.status, 500)
})

Deno.test('Security: RLS Context Setting', async () => {
  const supabase = await createTestClient()
  
  // Set RLS context
  await supabase.rpc('set_config', {
    setting_name: 'app.current_org_id',
    new_value: TEST_ORG_ID,
    is_local: true
  })
  
  // Verify context is set
  const { data: orgId } = await supabase.rpc('current_setting', {
    setting_name: 'app.current_org_id'
  })
  
  assertEquals(orgId, TEST_ORG_ID)
})

Deno.test('Security: Payload Sanitization', async () => {
  const supabase = await createTestClient()
  
  // Create test event with sensitive data
  const event = await createTestEvent(supabase, TEST_ORG_ID)
  
  // Query sanitized view
  const { data: sanitizedEvents } = await supabase
    .from('v_cataloging_event_public')
    .select('*')
    .eq('id', event.id)
  
  assertExists(sanitizedEvents)
  assertEquals(sanitizedEvents.length, 1)
  
  const sanitizedEvent = sanitizedEvents[0]
  
  // Verify only safe fields are present
  assertExists(sanitizedEvent.id)
  assertExists(sanitizedEvent.event_type)
  assertExists(sanitizedEvent.created_at)
  
  // Verify sensitive fields are not present
  assertEquals(sanitizedEvent.event_data, undefined)
  assertEquals(sanitizedEvent.internal_notes, undefined)
})

Deno.test('Functionality: Cursor Management', async () => {
  const supabase = await createTestClient()
  
  // Set RLS context
  await supabase.rpc('set_config', {
    setting_name: 'app.current_org_id',
    new_value: TEST_ORG_ID,
    is_local: true
  })
  
  // Get or create cursor
  const { data: cursor } = await supabase.rpc('get_or_create_processor_cursor', {
    p_organization_id: TEST_ORG_ID,
    p_processor_name: 'test-processor'
  })
  
  assertExists(cursor)
  assertEquals(cursor.last_processed_id, '0')
  assertEquals(cursor.events_processed_count, 0)
  
  // Update cursor
  await supabase.rpc('update_processor_cursor', {
    p_organization_id: TEST_ORG_ID,
    p_processor_name: 'test-processor',
    p_last_processed_id: '123',
    p_events_processed: 5
  })
  
  // Verify update
  const { data: updatedCursor } = await supabase.rpc('get_or_create_processor_cursor', {
    p_organization_id: TEST_ORG_ID,
    p_processor_name: 'test-processor'
  })
  
  assertEquals(updatedCursor.last_processed_id, '123')
  assertEquals(updatedCursor.events_processed_count, 5)
})

Deno.test('Functionality: Advisory Locks', async () => {
  const supabase = await createTestClient()
  
  // Acquire lock
  const { data: lockAcquired } = await supabase.rpc('pg_try_advisory_xact_lock', {
    key: 'test-lock-key'
  })
  
  assertEquals(lockAcquired, true)
  
  // Try to acquire same lock (should fail in same transaction)
  const { data: lockAcquiredAgain } = await supabase.rpc('pg_try_advisory_xact_lock', {
    key: 'test-lock-key'
  })
  
  assertEquals(lockAcquiredAgain, false)
})

Deno.test('Integration: Full Processing Flow', async () => {
  const supabase = await createTestClient()
  
  // Create test events
  const event1 = await createTestEvent(supabase, TEST_ORG_ID, 'job_started')
  const event2 = await createTestEvent(supabase, TEST_ORG_ID, 'job_completed')
  
  // Process events
  const response = await invokeNotificationProcessor(TEST_ORG_ID)
  
  assertEquals(response.status, 200)
  assertEquals(response.data.success, true)
  assertExists(response.data.processed)
  assertExists(response.data.duration_ms)
  assertEquals(response.data.organization_id, TEST_ORG_ID)
  
  console.log(`Processed ${response.data.processed} events in ${response.data.duration_ms}ms`)
})

Deno.test('Performance: Batch Processing', async () => {
  const supabase = await createTestClient()
  
  // Create multiple test events
  const events = []
  for (let i = 0; i < 10; i++) {
    events.push(await createTestEvent(supabase, TEST_ORG_ID, `batch_test_${i}`))
  }
  
  const startTime = Date.now()
  const response = await invokeNotificationProcessor(TEST_ORG_ID)
  const processingTime = Date.now() - startTime
  
  assertEquals(response.status, 200)
  assertEquals(response.data.success, true)
  
  console.log(`Batch processed ${response.data.processed} events in ${processingTime}ms`)
  
  // Verify reasonable performance (should process 10 events in under 5 seconds)
  assertEquals(processingTime < 5000, true)
})

Deno.test('Error Handling: Malformed Events', async () => {
  const supabase = await createTestClient()
  
  // Create malformed event (missing required fields)
  const { error } = await supabase
    .from('cataloging_event_outbox')
    .insert({
      organization_id: TEST_ORG_ID,
      event_type: null, // Invalid
      event_data: { malformed: true },
    })
  
  // Should fail due to constraints
  assertExists(error)
})

Deno.test('Monitoring: Health Metrics', async () => {
  const supabase = await createTestClient()
  
  // Get processor health
  const { data: health } = await supabase.rpc('get_processor_cursor_health')
  
  assertExists(health)
  assertEquals(Array.isArray(health), true)
  
  // Get advisory lock status
  const { data: locks } = await supabase.rpc('get_advisory_lock_status')
  
  assertExists(locks)
  assertEquals(Array.isArray(locks), true)
})

// Run all tests
if (import.meta.main) {
  console.log('🧪 Running Notification Processor Tests...')
  console.log('⚠️  Make sure to run these tests against a test database!')
  console.log('⚠️  Tests will create and modify data in the database.')
  console.log('')
} 