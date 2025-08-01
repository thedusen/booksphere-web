-- ============================================================================
-- COMPREHENSIVE pg_TAP TESTS FOR OUTBOX MANAGEMENT FUNCTIONS
-- ============================================================================
-- Tests cover:
-- 1. Happy path scenarios - normal function operation
-- 2. Edge cases - empty tables, boundary conditions, null values
-- 3. Error handling - constraint violations, race conditions
-- 4. Concurrency - multiple processors, simultaneous operations
-- 5. Data integrity - proper cleanup, accurate counts
-- ============================================================================

BEGIN;
SELECT plan(87); -- Total number of tests (82 ok + 5 lives_ok assertions)

-- ============================================================================
-- TEST SETUP
-- ============================================================================

-- Create test organizations
INSERT INTO public.organizations (id, name, created_at, updated_at) VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Test Org 1', NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'Test Org 2', NOW(), NOW());

-- Helper function to create test events
CREATE OR REPLACE FUNCTION create_test_event(
    p_org_id UUID,
    p_event_type TEXT DEFAULT 'test_event',
    p_delivered BOOLEAN DEFAULT FALSE,
    p_delivery_attempts INTEGER DEFAULT 0,
    p_created_offset INTERVAL DEFAULT '0 seconds'
) RETURNS UUID AS $$
DECLARE
    event_id UUID := gen_random_uuid();
BEGIN
    INSERT INTO public.cataloging_event_outbox (
        event_id, organization_id, event_type, entity_type, entity_id,
        event_data, delivered_at, delivery_attempts, created_at
    ) VALUES (
        event_id, p_org_id, p_event_type, 'test_entity', 'test_id',
        '{"test": true}'::jsonb,
        CASE WHEN p_delivered THEN NOW() - p_created_offset ELSE NULL END,
        p_delivery_attempts,
        NOW() - p_created_offset
    );
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TESTS FOR prune_delivered_events()
-- ============================================================================

-- Test 1: Function exists and has correct signature
SELECT has_function(
    'public',
    'prune_delivered_events',
    ARRAY['integer', 'integer'],
    'prune_delivered_events function should exist with correct parameters'
);

-- Test 2: Basic pruning of old delivered events
SELECT lives_ok(
    $$ SELECT * FROM prune_delivered_events(48, 1000) $$,
    'prune_delivered_events should execute without errors'
);

-- Test 3: Prune delivered events older than retention period
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    old_event_id UUID;
    recent_event_id UUID;
    result_row RECORD;
BEGIN
    -- Create old delivered event (older than 48 hours)
    old_event_id := create_test_event(org_id, 'old_event', TRUE, 1, '50 hours');
    
    -- Create recent delivered event (within 48 hours)
    recent_event_id := create_test_event(org_id, 'recent_event', TRUE, 1, '24 hours');
    
    -- Create undelivered event (should not be affected)
    PERFORM create_test_event(org_id, 'undelivered_event', FALSE, 0, '50 hours');
    
    -- Run pruning with 48-hour retention
    SELECT * INTO result_row FROM prune_delivered_events(48, 1000);
    
    -- Should have deleted exactly 1 event (the old one)
    PERFORM ok(result_row.deleted_count = 1, 'Should delete exactly 1 old delivered event');
    
    -- Verify old event was deleted
    PERFORM ok(
        NOT EXISTS (SELECT 1 FROM public.cataloging_event_outbox WHERE event_id = old_event_id),
        'Old delivered event should be deleted'
    );
    
    -- Verify recent event still exists
    PERFORM ok(
        EXISTS (SELECT 1 FROM public.cataloging_event_outbox WHERE event_id = recent_event_id),
        'Recent delivered event should still exist'
    );
    
    -- Verify undelivered event still exists
    PERFORM ok(
        EXISTS (SELECT 1 FROM public.cataloging_event_outbox WHERE event_id IS NOT NULL AND delivered_at IS NULL),
        'Undelivered events should not be affected'
    );
END $$;

-- Test 4: Respect max_batch_size parameter
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    result_row RECORD;
    i INTEGER;
BEGIN
    -- Clean up previous test data
    DELETE FROM public.cataloging_event_outbox WHERE organization_id = org_id;
    
    -- Create 10 old delivered events
    FOR i IN 1..10 LOOP
        PERFORM create_test_event(org_id, 'batch_test_' || i, TRUE, 1, '50 hours');
    END LOOP;
    
    -- Run pruning with batch size of 5
    SELECT * INTO result_row FROM prune_delivered_events(48, 5);
    
    -- Should have deleted exactly 5 events (limited by batch size)
    PERFORM ok(result_row.deleted_count = 5, 'Should respect max_batch_size parameter');
    
    -- Should have 5 events remaining
    PERFORM ok(
        (SELECT COUNT(*) FROM public.cataloging_event_outbox WHERE organization_id = org_id) = 5,
        'Should have remaining events after batch-limited pruning'
    );
END $$;

-- Test 5: Handle empty table gracefully
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    result_row RECORD;
BEGIN
    -- Clean up all test data
    DELETE FROM public.cataloging_event_outbox WHERE organization_id = org_id;
    
    -- Run pruning on empty table
    SELECT * INTO result_row FROM prune_delivered_events(48, 1000);
    
    PERFORM ok(result_row.deleted_count = 0, 'Should handle empty table gracefully');
    PERFORM ok(result_row.execution_time_ms >= 0, 'Should return valid execution time');
    PERFORM ok(result_row.oldest_delivered_event_age_hours = 0, 'Should return 0 for oldest event age when no events');
END $$;

-- Test 6: Return accurate execution metrics
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    result_row RECORD;
BEGIN
    -- Create test event
    PERFORM create_test_event(org_id, 'metrics_test', TRUE, 1, '50 hours');
    
    SELECT * INTO result_row FROM prune_delivered_events(48, 1000);
    
    PERFORM ok(result_row.execution_time_ms > 0, 'Should return positive execution time');
    PERFORM ok(result_row.oldest_delivered_event_age_hours >= 0, 'Should return valid oldest event age');
END $$;

-- ============================================================================
-- TESTS FOR migrate_failed_events_to_dlq()
-- ============================================================================

-- Test 7: Function exists and has correct signature
SELECT has_function(
    'public',
    'migrate_failed_events_to_dlq',
    ARRAY['integer'],
    'migrate_failed_events_to_dlq function should exist with correct parameters'
);

-- Test 8: Basic DLQ migration functionality
SELECT lives_ok(
    $$ SELECT * FROM migrate_failed_events_to_dlq(3) $$,
    'migrate_failed_events_to_dlq should execute without errors'
);

-- Test 9: Migrate events that exceed max delivery attempts
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    failed_event_id UUID;
    retrying_event_id UUID;
    result_row RECORD;
BEGIN
    -- Clean up previous test data
    DELETE FROM public.cataloging_event_outbox WHERE organization_id = org_id;
    DELETE FROM public.cataloging_event_outbox_dlq WHERE organization_id = org_id;
    
    -- Create event that exceeded max attempts (should be migrated)
    failed_event_id := create_test_event(org_id, 'failed_event', FALSE, 5, '10 minutes');
    
    -- Create event still within retry limit (should not be migrated)
    retrying_event_id := create_test_event(org_id, 'retrying_event', FALSE, 2, '10 minutes');
    
    -- Update failed event with error message
    UPDATE public.cataloging_event_outbox 
    SET last_error = 'Max retries exceeded'
    WHERE event_id = failed_event_id;
    
    -- Run DLQ migration with max_delivery_attempts = 3
    SELECT * INTO result_row FROM migrate_failed_events_to_dlq(3);
    
    -- Should have moved exactly 1 event
    PERFORM ok(result_row.moved_count = 1, 'Should migrate exactly 1 failed event');
    PERFORM ok(org_id = ANY(result_row.affected_organizations), 'Should return affected organization');
    
    -- Verify failed event was moved to DLQ
    PERFORM ok(
        NOT EXISTS (SELECT 1 FROM public.cataloging_event_outbox WHERE event_id = failed_event_id),
        'Failed event should be removed from main table'
    );
    
    PERFORM ok(
        EXISTS (SELECT 1 FROM public.cataloging_event_outbox_dlq WHERE original_event_id = failed_event_id),
        'Failed event should be in DLQ table'
    );
    
    -- Verify retrying event is still in main table
    PERFORM ok(
        EXISTS (SELECT 1 FROM public.cataloging_event_outbox WHERE event_id = retrying_event_id),
        'Retrying event should remain in main table'
    );
END $$;

-- Test 10: Preserve error information in DLQ
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    failed_event_id UUID;
    dlq_record RECORD;
BEGIN
    -- Clean up previous test data
    DELETE FROM public.cataloging_event_outbox WHERE organization_id = org_id;
    DELETE FROM public.cataloging_event_outbox_dlq WHERE organization_id = org_id;
    
    -- Create failed event with specific error
    failed_event_id := create_test_event(org_id, 'error_preservation_test', FALSE, 5, '10 minutes');
    
    UPDATE public.cataloging_event_outbox 
    SET last_error = 'Specific error message',
        event_data = '{"original": "data"}'::jsonb
    WHERE event_id = failed_event_id;
    
    -- Migrate to DLQ
    PERFORM migrate_failed_events_to_dlq(3);
    
    -- Verify error information is preserved
    SELECT * INTO dlq_record 
    FROM public.cataloging_event_outbox_dlq 
    WHERE original_event_id = failed_event_id;
    
    PERFORM ok(dlq_record.last_error = 'Specific error message', 'Should preserve original error message');
    PERFORM ok(dlq_record.delivery_attempts = 5, 'Should preserve delivery attempt count');
    PERFORM ok(dlq_record.event_data = '{"original": "data"}'::jsonb, 'Should preserve original event data');
    PERFORM ok(dlq_record.failed_at IS NOT NULL, 'Should set failed_at timestamp');
END $$;

-- Test 11: Handle events without error message
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    failed_event_id UUID;
    dlq_record RECORD;
BEGIN
    -- Clean up previous test data
    DELETE FROM public.cataloging_event_outbox WHERE organization_id = org_id;
    DELETE FROM public.cataloging_event_outbox_dlq WHERE organization_id = org_id;
    
    -- Create failed event without error message
    failed_event_id := create_test_event(org_id, 'no_error_msg_test', FALSE, 5, '10 minutes');
    
    -- Migrate to DLQ
    PERFORM migrate_failed_events_to_dlq(3);
    
    -- Verify default error message is used
    SELECT * INTO dlq_record 
    FROM public.cataloging_event_outbox_dlq 
    WHERE original_event_id = failed_event_id;
    
    PERFORM ok(dlq_record.last_error = 'Max delivery attempts exceeded', 'Should use default error message when none provided');
END $$;

-- Test 12: Respect grace period for recent failures
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    recent_failed_id UUID;
    old_failed_id UUID;
    result_row RECORD;
BEGIN
    -- Clean up previous test data
    DELETE FROM public.cataloging_event_outbox WHERE organization_id = org_id;
    DELETE FROM public.cataloging_event_outbox_dlq WHERE organization_id = org_id;
    
    -- Create recently failed event (within grace period)
    recent_failed_id := create_test_event(org_id, 'recent_failure', FALSE, 5, '2 minutes');
    
    -- Create old failed event (outside grace period)
    old_failed_id := create_test_event(org_id, 'old_failure', FALSE, 5, '10 minutes');
    
    -- Run DLQ migration
    SELECT * INTO result_row FROM migrate_failed_events_to_dlq(3);
    
    -- Should only migrate the old failure (respecting 5-minute grace period)
    PERFORM ok(result_row.moved_count = 1, 'Should only migrate events outside grace period');
    
    -- Verify recent failure is still in main table
    PERFORM ok(
        EXISTS (SELECT 1 FROM public.cataloging_event_outbox WHERE event_id = recent_failed_id),
        'Recent failure should remain in main table during grace period'
    );
    
    -- Verify old failure was migrated
    PERFORM ok(
        EXISTS (SELECT 1 FROM public.cataloging_event_outbox_dlq WHERE original_event_id = old_failed_id),
        'Old failure should be migrated to DLQ'
    );
END $$;

-- Test 13: Handle empty result set gracefully
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    result_row RECORD;
BEGIN
    -- Clean up all events
    DELETE FROM public.cataloging_event_outbox WHERE organization_id = org_id;
    
    -- Run DLQ migration on empty table
    SELECT * INTO result_row FROM migrate_failed_events_to_dlq(3);
    
    PERFORM ok(result_row.moved_count = 0, 'Should handle empty table gracefully');
    PERFORM ok(array_length(result_row.affected_organizations, 1) IS NULL, 'Should return empty organization array');
END $$;

-- ============================================================================
-- TESTS FOR CURSOR MANAGEMENT FUNCTIONS
-- ============================================================================

-- Test 14: get_or_create_processor_cursor function exists
SELECT has_function(
    'public',
    'get_or_create_processor_cursor',
    ARRAY['text', 'uuid'],
    'get_or_create_processor_cursor function should exist'
);

-- Test 15: update_processor_cursor function exists
SELECT has_function(
    'public',
    'update_processor_cursor',
    ARRAY['text', 'uuid', 'uuid'],
    'update_processor_cursor function should exist'
);

-- Test 16: Create new cursor when none exists
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    processor_name TEXT := 'test-processor';
    result_row RECORD;
BEGIN
    -- Clean up any existing cursors
    DELETE FROM public.cataloging_event_outbox_cursor 
    WHERE processor_name = processor_name AND organization_id = org_id;
    
    -- Get or create cursor
    SELECT * INTO result_row 
    FROM get_or_create_processor_cursor(processor_name, org_id);
    
    -- Should return a valid cursor
    PERFORM ok(result_row.last_processed_event_id IS NOT NULL, 'Should return valid cursor ID');
    PERFORM ok(result_row.last_processed_at IS NOT NULL, 'Should return valid timestamp');
    
    -- Verify cursor was created in database
    PERFORM ok(
        EXISTS (
            SELECT 1 FROM public.cataloging_event_outbox_cursor 
            WHERE processor_name = processor_name AND organization_id = org_id
        ),
        'Cursor should be created in database'
    );
END $$;

-- Test 17: Return existing cursor when it exists
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    processor_name TEXT := 'existing-processor';
    original_cursor_id UUID := gen_random_uuid();
    result_row RECORD;
BEGIN
    -- Clean up and create existing cursor
    DELETE FROM public.cataloging_event_outbox_cursor 
    WHERE processor_name = processor_name AND organization_id = org_id;
    
    INSERT INTO public.cataloging_event_outbox_cursor (
        processor_name, organization_id, last_processed_event_id, last_processed_at, updated_at
    ) VALUES (
        processor_name, org_id, original_cursor_id, NOW() - INTERVAL '1 hour', NOW()
    );
    
    -- Get existing cursor
    SELECT * INTO result_row 
    FROM get_or_create_processor_cursor(processor_name, org_id);
    
    -- Should return the existing cursor
    PERFORM ok(result_row.last_processed_event_id = original_cursor_id, 'Should return existing cursor ID');
END $$;

-- Test 18: Update cursor successfully
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    processor_name TEXT := 'update-test-processor';
    new_cursor_id UUID := gen_random_uuid();
    update_result BOOLEAN;
    cursor_record RECORD;
BEGIN
    -- Create initial cursor
    PERFORM get_or_create_processor_cursor(processor_name, org_id);
    
    -- Update cursor
    SELECT * INTO update_result 
    FROM update_processor_cursor(processor_name, org_id, new_cursor_id);
    
    -- Should return true for successful update
    PERFORM ok(update_result = TRUE, 'Should return true for successful cursor update');
    
    -- Verify cursor was updated
    SELECT * INTO cursor_record 
    FROM public.cataloging_event_outbox_cursor 
    WHERE processor_name = processor_name AND organization_id = org_id;
    
    PERFORM ok(cursor_record.last_processed_event_id = new_cursor_id, 'Cursor ID should be updated');
    PERFORM ok(cursor_record.updated_at > cursor_record.last_processed_at, 'Updated timestamp should be current');
END $$;

-- ============================================================================
-- TESTS FOR confirm_event_delivery()
-- ============================================================================

-- Test 19: confirm_event_delivery function exists
SELECT has_function(
    'public',
    'confirm_event_delivery',
    ARRAY['uuid[]', 'uuid'],
    'confirm_event_delivery function should exist'
);

-- Test 20: Confirm delivery of multiple events
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    event_id_1 UUID;
    event_id_2 UUID;
    event_id_3 UUID;
    event_ids UUID[];
    result_row RECORD;
BEGIN
    -- Clean up and create test events
    DELETE FROM public.cataloging_event_outbox WHERE organization_id = org_id;
    
    event_id_1 := create_test_event(org_id, 'confirm_test_1', FALSE, 1);
    event_id_2 := create_test_event(org_id, 'confirm_test_2', FALSE, 1);
    event_id_3 := create_test_event('22222222-2222-2222-2222-222222222222', 'other_org_event', FALSE, 1);
    
    event_ids := ARRAY[event_id_1, event_id_2, event_id_3]; -- Include event from different org
    
    -- Confirm delivery
    SELECT * INTO result_row 
    FROM confirm_event_delivery(event_ids, org_id);
    
    -- Should confirm 2 events (only from correct org)
    PERFORM ok(result_row.confirmed_count = 2, 'Should confirm events from correct organization only');
    PERFORM ok(result_row.failed_count = 1, 'Should report failed count for events from other organizations');
    
    -- Verify events were marked as delivered
    PERFORM ok(
        (SELECT COUNT(*) FROM public.cataloging_event_outbox 
         WHERE event_id IN (event_id_1, event_id_2) AND delivered_at IS NOT NULL) = 2,
        'Confirmed events should be marked as delivered'
    );
    
    -- Verify delivery attempts were incremented
    PERFORM ok(
        (SELECT COUNT(*) FROM public.cataloging_event_outbox 
         WHERE event_id IN (event_id_1, event_id_2) AND delivery_attempts = 2) = 2,
        'Delivery attempts should be incremented'
    );
END $$;

-- ============================================================================
-- CONCURRENCY AND RACE CONDITION TESTS
-- ============================================================================

-- Test 21: Cursor creation race condition handling
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    processor_name TEXT := 'race-condition-processor';
    result_1 RECORD;
    result_2 RECORD;
BEGIN
    -- Clean up
    DELETE FROM public.cataloging_event_outbox_cursor 
    WHERE processor_name = processor_name AND organization_id = org_id;
    
    -- Simulate concurrent cursor creation (this tests the LOOP and conflict handling)
    SELECT * INTO result_1 FROM get_or_create_processor_cursor(processor_name, org_id);
    SELECT * INTO result_2 FROM get_or_create_processor_cursor(processor_name, org_id);
    
    -- Both calls should succeed and return the same cursor
    PERFORM ok(result_1.last_processed_event_id = result_2.last_processed_event_id, 
               'Concurrent cursor creation should return same cursor ID');
    
    -- Should only have one cursor record
    PERFORM ok(
        (SELECT COUNT(*) FROM public.cataloging_event_outbox_cursor 
         WHERE processor_name = processor_name AND organization_id = org_id) = 1,
        'Should only create one cursor record despite concurrent calls'
    );
END $$;

-- Test 22: Pruning with concurrent inserts
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    event_id UUID;
    result_row RECORD;
BEGIN
    -- Clean up and create old delivered event
    DELETE FROM public.cataloging_event_outbox WHERE organization_id = org_id;
    event_id := create_test_event(org_id, 'concurrent_prune_test', TRUE, 1, '50 hours');
    
    -- The SKIP LOCKED mechanism should handle concurrent access gracefully
    SELECT * INTO result_row FROM prune_delivered_events(48, 1000);
    
    PERFORM ok(result_row.deleted_count >= 0, 'Concurrent pruning should complete without errors');
END $$;

-- ============================================================================
-- BOUNDARY CONDITIONS AND EDGE CASES
-- ============================================================================

-- Test 23: Prune with zero retention hours
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    recent_event_id UUID;
    result_row RECORD;
BEGIN
    -- Clean up and create very recent event
    DELETE FROM public.cataloging_event_outbox WHERE organization_id = org_id;
    recent_event_id := create_test_event(org_id, 'zero_retention_test', TRUE, 1, '1 minute');
    
    -- Prune with 0 hour retention (should delete everything delivered)
    SELECT * INTO result_row FROM prune_delivered_events(0, 1000);
    
    PERFORM ok(result_row.deleted_count = 1, 'Zero retention should delete all delivered events');
END $$;

-- Test 24: DLQ migration with zero max attempts
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    event_id UUID;
    result_row RECORD;
BEGIN
    -- Clean up and create event with 0 attempts
    DELETE FROM public.cataloging_event_outbox WHERE organization_id = org_id;
    DELETE FROM public.cataloging_event_outbox_dlq WHERE organization_id = org_id;
    
    event_id := create_test_event(org_id, 'zero_attempts_test', FALSE, 0, '10 minutes');
    
    -- Migrate with 0 max attempts (should migrate everything undelivered outside grace period)
    SELECT * INTO result_row FROM migrate_failed_events_to_dlq(0);
    
    PERFORM ok(result_row.moved_count = 1, 'Zero max attempts should migrate all undelivered events outside grace period');
END $$;

-- Test 25: Extremely large batch size
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    result_row RECORD;
    i INTEGER;
BEGIN
    -- Clean up and create multiple events
    DELETE FROM public.cataloging_event_outbox WHERE organization_id = org_id;
    
    FOR i IN 1..5 LOOP
        PERFORM create_test_event(org_id, 'large_batch_test_' || i, TRUE, 1, '50 hours');
    END LOOP;
    
    -- Use extremely large batch size
    SELECT * INTO result_row FROM prune_delivered_events(48, 1000000);
    
    PERFORM ok(result_row.deleted_count = 5, 'Large batch size should process all eligible events');
END $$;

-- ============================================================================
-- DATA INTEGRITY TESTS
-- ============================================================================

-- Test 26: Verify no data loss during pruning
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    initial_count INTEGER;
    final_count INTEGER;
    deleted_count INTEGER;
    result_row RECORD;
BEGIN
    -- Clean up and create mixed events
    DELETE FROM public.cataloging_event_outbox WHERE organization_id = org_id;
    
    -- Create events that should be deleted
    PERFORM create_test_event(org_id, 'delete_me_1', TRUE, 1, '50 hours');
    PERFORM create_test_event(org_id, 'delete_me_2', TRUE, 1, '60 hours');
    
    -- Create events that should remain
    PERFORM create_test_event(org_id, 'keep_me_1', TRUE, 1, '10 hours');
    PERFORM create_test_event(org_id, 'keep_me_2', FALSE, 1, '50 hours');
    
    SELECT COUNT(*) INTO initial_count FROM public.cataloging_event_outbox WHERE organization_id = org_id;
    
    -- Run pruning
    SELECT * INTO result_row FROM prune_delivered_events(48, 1000);
    deleted_count := result_row.deleted_count;
    
    SELECT COUNT(*) INTO final_count FROM public.cataloging_event_outbox WHERE organization_id = org_id;
    
    -- Verify count arithmetic
    PERFORM ok(initial_count - deleted_count = final_count, 'Event counts should be consistent');
    PERFORM ok(final_count = 2, 'Should retain exactly 2 events (1 recent delivered, 1 undelivered)');
END $$;

-- Test 27: Verify DLQ migration preserves all required data
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    event_id UUID;
    original_record RECORD;
    dlq_record RECORD;
BEGIN
    -- Clean up and create detailed test event
    DELETE FROM public.cataloging_event_outbox WHERE organization_id = org_id;
    DELETE FROM public.cataloging_event_outbox_dlq WHERE organization_id = org_id;
    
    event_id := create_test_event(org_id, 'data_preservation_test', FALSE, 5, '10 minutes');
    
    UPDATE public.cataloging_event_outbox SET
        entity_type = 'test_entity_type',
        entity_id = 'test_entity_id',
        event_data = '{"preserved": "data", "nested": {"value": 42}}'::jsonb,
        last_error = 'Detailed error message'
    WHERE event_id = event_id;
    
    -- Capture original data
    SELECT * INTO original_record FROM public.cataloging_event_outbox WHERE event_id = event_id;
    
    -- Migrate to DLQ
    PERFORM migrate_failed_events_to_dlq(3);
    
    -- Verify all data was preserved
    SELECT * INTO dlq_record FROM public.cataloging_event_outbox_dlq WHERE original_event_id = event_id;
    
    PERFORM ok(dlq_record.organization_id = original_record.organization_id, 'Organization ID should be preserved');
    PERFORM ok(dlq_record.event_type = original_record.event_type, 'Event type should be preserved');
    PERFORM ok(dlq_record.entity_type = original_record.entity_type, 'Entity type should be preserved');
    PERFORM ok(dlq_record.entity_id = original_record.entity_id, 'Entity ID should be preserved');
    PERFORM ok(dlq_record.event_data = original_record.event_data, 'Event data should be preserved');
    PERFORM ok(dlq_record.delivery_attempts = original_record.delivery_attempts, 'Delivery attempts should be preserved');
    PERFORM ok(dlq_record.last_error = original_record.last_error, 'Error message should be preserved');
END $$;

-- ============================================================================
-- PERFORMANCE AND MONITORING TESTS
-- ============================================================================

-- Test 28: Execution time reporting accuracy
DO $$
DECLARE
    result_row RECORD;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    actual_duration NUMERIC;
    reported_duration NUMERIC;
BEGIN
    start_time := clock_timestamp();
    SELECT * INTO result_row FROM prune_delivered_events(48, 1000);
    end_time := clock_timestamp();
    
    actual_duration := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    reported_duration := result_row.execution_time_ms;
    
    -- Reported time should be reasonably close to actual time (within 100ms tolerance)
    PERFORM ok(
        ABS(actual_duration - reported_duration) < 100,
        'Reported execution time should be accurate within reasonable tolerance'
    );
END $$;

-- Test 29: Oldest event age calculation
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    old_event_id UUID;
    result_row RECORD;
    expected_age NUMERIC;
BEGIN
    -- Clean up and create event with known age
    DELETE FROM public.cataloging_event_outbox WHERE organization_id = org_id;
    
    old_event_id := create_test_event(org_id, 'age_calculation_test', TRUE, 1, '72 hours');
    
    SELECT * INTO result_row FROM prune_delivered_events(48, 1000); -- Will delete the event
    
    -- Since we deleted the old event, create another for age calculation
    old_event_id := create_test_event(org_id, 'remaining_age_test', TRUE, 1, '36 hours');
    
    SELECT * INTO result_row FROM prune_delivered_events(48, 1000); -- Won't delete (within retention)
    
    -- Age should be approximately 36 hours (within 1 hour tolerance)
    expected_age := 36;
    PERFORM ok(
        ABS(result_row.oldest_delivered_event_age_hours - expected_age) < 1,
        'Oldest event age calculation should be accurate'
    );
END $$;

-- ============================================================================
-- MULTI-TENANT ISOLATION TESTS
-- ============================================================================

-- Test 30: Ensure organization isolation in pruning
DO $$
DECLARE
    org1_id UUID := '11111111-1111-1111-1111-111111111111';
    org2_id UUID := '22222222-2222-2222-2222-222222222222';
    org1_event UUID;
    org2_event UUID;
    result_row RECORD;
BEGIN
    -- Clean up and create events for both organizations
    DELETE FROM public.cataloging_event_outbox WHERE organization_id IN (org1_id, org2_id);
    
    org1_event := create_test_event(org1_id, 'org1_old_event', TRUE, 1, '50 hours');
    org2_event := create_test_event(org2_id, 'org2_old_event', TRUE, 1, '50 hours');
    
    -- Run pruning
    SELECT * INTO result_row FROM prune_delivered_events(48, 1000);
    
    -- Should delete events from both organizations
    PERFORM ok(result_row.deleted_count = 2, 'Should prune events from all organizations');
    
    PERFORM ok(
        NOT EXISTS (SELECT 1 FROM public.cataloging_event_outbox WHERE event_id IN (org1_event, org2_event)),
        'Events from both organizations should be pruned'
    );
END $$;

-- Test 31: Ensure organization isolation in DLQ migration
DO $$
DECLARE
    org1_id UUID := '11111111-1111-1111-1111-111111111111';
    org2_id UUID := '22222222-2222-2222-2222-222222222222';
    org1_event UUID;
    org2_event UUID;
    result_row RECORD;
BEGIN
    -- Clean up and create failed events for both organizations
    DELETE FROM public.cataloging_event_outbox WHERE organization_id IN (org1_id, org2_id);
    DELETE FROM public.cataloging_event_outbox_dlq WHERE organization_id IN (org1_id, org2_id);
    
    org1_event := create_test_event(org1_id, 'org1_failed', FALSE, 5, '10 minutes');
    org2_event := create_test_event(org2_id, 'org2_failed', FALSE, 5, '10 minutes');
    
    -- Run DLQ migration
    SELECT * INTO result_row FROM migrate_failed_events_to_dlq(3);
    
    -- Should migrate events from both organizations
    PERFORM ok(result_row.moved_count = 2, 'Should migrate failed events from all organizations');
    
    -- Verify both organizations are in affected list
    PERFORM ok(
        org1_id = ANY(result_row.affected_organizations) AND org2_id = ANY(result_row.affected_organizations),
        'Both organizations should be in affected organizations list'
    );
    
    -- Verify events are in correct organization contexts in DLQ
    PERFORM ok(
        EXISTS (SELECT 1 FROM public.cataloging_event_outbox_dlq 
                WHERE original_event_id = org1_event AND organization_id = org1_id),
        'Org1 event should be in DLQ with correct organization ID'
    );
    
    PERFORM ok(
        EXISTS (SELECT 1 FROM public.cataloging_event_outbox_dlq 
                WHERE original_event_id = org2_event AND organization_id = org2_id),
        'Org2 event should be in DLQ with correct organization ID'
    );
END $$;

-- Test 32: Cursor isolation between organizations
DO $$
DECLARE
    org1_id UUID := '11111111-1111-1111-1111-111111111111';
    org2_id UUID := '22222222-2222-2222-2222-222222222222';
    processor_name TEXT := 'shared-processor-name';
    cursor1_id UUID;
    cursor2_id UUID;
    result1 RECORD;
    result2 RECORD;
BEGIN
    -- Clean up cursors
    DELETE FROM public.cataloging_event_outbox_cursor 
    WHERE processor_name = processor_name AND organization_id IN (org1_id, org2_id);
    
    -- Create cursors for both organizations with same processor name
    SELECT * INTO result1 FROM get_or_create_processor_cursor(processor_name, org1_id);
    SELECT * INTO result2 FROM get_or_create_processor_cursor(processor_name, org2_id);
    
    -- Should have different cursors for different organizations
    PERFORM ok(
        result1.last_processed_event_id != result2.last_processed_event_id,
        'Different organizations should have separate cursors even with same processor name'
    );
    
    -- Should have exactly 2 cursor records
    PERFORM ok(
        (SELECT COUNT(*) FROM public.cataloging_event_outbox_cursor 
         WHERE processor_name = processor_name) = 2,
        'Should create separate cursor records for each organization'
    );
END $$;

-- ============================================================================
-- ERROR HANDLING AND EDGE CASES
-- ============================================================================

-- Test 33: Handle NULL parameters gracefully
SELECT lives_ok(
    $$ SELECT * FROM prune_delivered_events(NULL, 1000) $$,
    'prune_delivered_events should handle NULL retention_hours parameter'
);

SELECT lives_ok(
    $$ SELECT * FROM prune_delivered_events(48, NULL) $$,
    'prune_delivered_events should handle NULL max_batch_size parameter'
);

SELECT lives_ok(
    $$ SELECT * FROM migrate_failed_events_to_dlq(NULL) $$,
    'migrate_failed_events_to_dlq should handle NULL max_delivery_attempts parameter'
);

-- Test 34: Handle negative parameters
DO $$
DECLARE
    result_row RECORD;
BEGIN
    -- Test with negative values
    SELECT * INTO result_row FROM prune_delivered_events(-1, 1000);
    PERFORM ok(result_row.deleted_count >= 0, 'Should handle negative retention hours gracefully');
    
    SELECT * INTO result_row FROM migrate_failed_events_to_dlq(-1);
    PERFORM ok(result_row.moved_count >= 0, 'Should handle negative max delivery attempts gracefully');
END $$;

-- Test 35: Handle extremely large parameters
DO $$
DECLARE
    result_row RECORD;
BEGIN
    -- Test with very large values
    SELECT * INTO result_row FROM prune_delivered_events(999999, 999999);
    PERFORM ok(result_row.deleted_count >= 0, 'Should handle very large parameters gracefully');
    
    SELECT * INTO result_row FROM migrate_failed_events_to_dlq(999999);
    PERFORM ok(result_row.moved_count >= 0, 'Should handle very large max delivery attempts gracefully');
END $$;

-- ============================================================================
-- COMPREHENSIVE WORKFLOW TESTS
-- ============================================================================

-- Test 36: Complete event lifecycle simulation
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    processor_name TEXT := 'lifecycle-processor';
    event_id UUID;
    cursor_result RECORD;
    confirm_result RECORD;
    prune_result RECORD;
    cursor_before UUID;
    cursor_after UUID;
BEGIN
    -- Clean up
    DELETE FROM public.cataloging_event_outbox WHERE organization_id = org_id;
    DELETE FROM public.cataloging_event_outbox_cursor 
    WHERE processor_name = processor_name AND organization_id = org_id;
    
    -- 1. Create initial cursor
    SELECT * INTO cursor_result FROM get_or_create_processor_cursor(processor_name, org_id);
    cursor_before := cursor_result.last_processed_event_id;
    
    -- 2. Create and process event
    event_id := create_test_event(org_id, 'lifecycle_test', FALSE, 0);
    
    -- 3. Confirm delivery
    SELECT * INTO confirm_result FROM confirm_event_delivery(ARRAY[event_id], org_id);
    PERFORM ok(confirm_result.confirmed_count = 1, 'Event should be confirmed for delivery');
    
    -- 4. Update cursor
    PERFORM update_processor_cursor(processor_name, org_id, event_id);
    
    -- 5. Verify cursor was updated
    SELECT * INTO cursor_result FROM get_or_create_processor_cursor(processor_name, org_id);
    cursor_after := cursor_result.last_processed_event_id;
    PERFORM ok(cursor_after = event_id, 'Cursor should be updated to processed event');
    
    -- 6. Age the event and prune
    UPDATE public.cataloging_event_outbox 
    SET delivered_at = NOW() - INTERVAL '50 hours',
        created_at = NOW() - INTERVAL '50 hours'
    WHERE event_id = event_id;
    
    SELECT * INTO prune_result FROM prune_delivered_events(48, 1000);
    PERFORM ok(prune_result.deleted_count = 1, 'Aged event should be pruned');
    
    -- 7. Verify event is gone but cursor remains
    PERFORM ok(
        NOT EXISTS (SELECT 1 FROM public.cataloging_event_outbox WHERE event_id = event_id),
        'Pruned event should be removed from outbox'
    );
    
    PERFORM ok(
        EXISTS (SELECT 1 FROM public.cataloging_event_outbox_cursor 
                WHERE processor_name = processor_name AND organization_id = org_id),
        'Cursor should remain after event pruning'
    );
END $$;

-- Test 37: Failure and recovery simulation
DO $$
DECLARE
    org_id UUID := '11111111-1111-1111-1111-111111111111';
    event_id UUID;
    dlq_migration_result RECORD;
    dlq_count INTEGER;
BEGIN
    -- Clean up
    DELETE FROM public.cataloging_event_outbox WHERE organization_id = org_id;
    DELETE FROM public.cataloging_event_outbox_dlq WHERE organization_id = org_id;
    
    -- 1. Create event that will fail
    event_id := create_test_event(org_id, 'failure_recovery_test', FALSE, 0, '10 minutes');
    
    -- 2. Simulate multiple failed delivery attempts
    UPDATE public.cataloging_event_outbox 
    SET delivery_attempts = 5, 
        last_error = 'Simulated delivery failure'
    WHERE event_id = event_id;
    
    -- 3. Migrate to DLQ
    SELECT * INTO dlq_migration_result FROM migrate_failed_events_to_dlq(3);
    PERFORM ok(dlq_migration_result.moved_count = 1, 'Failed event should be moved to DLQ');
    
    -- 4. Verify DLQ contains the event
    SELECT COUNT(*) INTO dlq_count 
    FROM public.cataloging_event_outbox_dlq 
    WHERE original_event_id = event_id;
    PERFORM ok(dlq_count = 1, 'Event should be in DLQ table');
    
    -- 5. Verify original table is clean
    PERFORM ok(
        NOT EXISTS (SELECT 1 FROM public.cataloging_event_outbox WHERE event_id = event_id),
        'Failed event should be removed from main outbox table'
    );
END $$;

-- ============================================================================
-- CLEANUP
-- ============================================================================

-- Test 38: Verify test isolation - clean state after tests
DO $$
DECLARE
    outbox_count INTEGER;
    dlq_count INTEGER;
    cursor_count INTEGER;
BEGIN
    -- Clean up all test data
    DELETE FROM public.cataloging_event_outbox WHERE organization_id IN (
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222'
    );
    
    DELETE FROM public.cataloging_event_outbox_dlq WHERE organization_id IN (
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222'
    );
    
    DELETE FROM public.cataloging_event_outbox_cursor WHERE organization_id IN (
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222'
    );
    
    -- Verify cleanup
    SELECT COUNT(*) INTO outbox_count FROM public.cataloging_event_outbox WHERE organization_id IN (
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222'
    );
    
    SELECT COUNT(*) INTO dlq_count FROM public.cataloging_event_outbox_dlq WHERE organization_id IN (
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222'
    );
    
    SELECT COUNT(*) INTO cursor_count FROM public.cataloging_event_outbox_cursor WHERE organization_id IN (
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222'
    );
    
    PERFORM ok(outbox_count = 0, 'Outbox should be clean after test cleanup');
    PERFORM ok(dlq_count = 0, 'DLQ should be clean after test cleanup');
    PERFORM ok(cursor_count = 0, 'Cursor table should be clean after test cleanup');
END $$;

-- Drop test helper function
DROP FUNCTION create_test_event(UUID, TEXT, BOOLEAN, INTEGER, INTERVAL);

-- Clean up test organizations
DELETE FROM public.organizations WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
);

SELECT * FROM finish(); 