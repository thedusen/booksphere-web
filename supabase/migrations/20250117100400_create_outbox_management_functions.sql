-- ============================================================================
-- MIGRATION: create_outbox_management_functions
-- TIMESTAMP: 20250117100400
-- ============================================================================
-- Purpose: Create optimized functions for outbox maintenance, error handling,
-- and cursor-based processing state management.
-- ============================================================================

-- ============================================================================
-- PRUNING FUNCTION - OPTIMIZED FOR PRODUCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.prune_delivered_events(
    retention_hours INTEGER DEFAULT 72,
    max_batch_size INTEGER DEFAULT 5000
)
RETURNS TABLE (deleted_count BIGINT, execution_time_ms BIGINT, oldest_delivered_event_age_hours NUMERIC) AS $$
DECLARE
    start_time TIMESTAMPTZ := clock_timestamp();
    cutoff_time TIMESTAMPTZ := NOW() - (retention_hours || ' hours')::INTERVAL;
    total_deleted BIGINT;
    oldest_remaining TIMESTAMPTZ;
BEGIN
    -- Use a CTE to select and lock rows for deletion to avoid race conditions
    WITH rows_to_delete AS (
        SELECT event_id
        FROM public.cataloging_event_outbox
        WHERE delivered_at IS NOT NULL
          AND delivered_at < cutoff_time
        ORDER BY delivered_at
        LIMIT max_batch_size
        FOR UPDATE SKIP LOCKED
    )
    DELETE FROM public.cataloging_event_outbox
    WHERE event_id IN (SELECT event_id FROM rows_to_delete);

    GET DIAGNOSTICS total_deleted = ROW_COUNT;

    -- This calculates the age of the oldest *remaining* delivered event, which is useful
    -- for monitoring if the pruning process itself is keeping up.
    SELECT MIN(delivered_at) INTO oldest_remaining
    FROM public.cataloging_event_outbox
    WHERE delivered_at IS NOT NULL;

    RETURN QUERY SELECT
        total_deleted,
        EXTRACT(EPOCH FROM (clock_timestamp() - start_time) * 1000)::BIGINT,
        COALESCE(EXTRACT(EPOCH FROM (NOW() - oldest_remaining)) / 3600, 0)::NUMERIC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- DEAD LETTER QUEUE MANAGEMENT
-- ============================================================================
CREATE OR REPLACE FUNCTION public.migrate_failed_events_to_dlq(
    max_delivery_attempts INTEGER DEFAULT 3
)
RETURNS TABLE (moved_count BIGINT, affected_organizations UUID[]) AS $$
DECLARE
    moved_events BIGINT;
    org_list UUID[];
BEGIN
    WITH failed_events AS (
        DELETE FROM public.cataloging_event_outbox
        WHERE delivery_attempts >= max_delivery_attempts
          AND delivered_at IS NULL
          AND created_at < NOW() - INTERVAL '5 minutes' -- Grace period for transient errors
        RETURNING *
    ),
    inserted_dlq AS (
        INSERT INTO public.cataloging_event_outbox_dlq (
            original_event_id, organization_id, event_type,
            entity_type, entity_id, event_data,
            delivery_attempts, last_error, failed_at
        )
        SELECT
            event_id, organization_id, event_type,
            entity_type, entity_id, event_data,
            delivery_attempts,
            -- Preserve last specific error, otherwise provide a default.
            COALESCE(last_error, 'Max delivery attempts exceeded'),
            NOW()
        FROM failed_events
        RETURNING organization_id
    )
    SELECT
        COUNT(*)::BIGINT,
        array_agg(DISTINCT organization_id)
    INTO moved_events, org_list
    FROM inserted_dlq;

    RETURN QUERY SELECT
        COALESCE(moved_events, 0),
        COALESCE(org_list, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- CURSOR MANAGEMENT FUNCTIONS (RACE CONDITION HARDENED)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_or_create_processor_cursor(
    p_processor_name TEXT,
    p_organization_id UUID
)
RETURNS TABLE (last_processed_event_id UUID, last_processed_at TIMESTAMPTZ) AS $$
DECLARE
    oldest_event_id UUID;
BEGIN
    LOOP
        -- First, try to select the existing cursor.
        RETURN QUERY
        SELECT c.last_processed_event_id, c.last_processed_at
        FROM public.cataloging_event_outbox_cursor c
        WHERE c.processor_name = p_processor_name
          AND c.organization_id = p_organization_id;

        -- If found, exit the loop.
        IF FOUND THEN
            RETURN;
        END IF;

        -- If not found, find the oldest undelivered event to start from.
        SELECT event_id INTO oldest_event_id
        FROM public.cataloging_event_outbox
        WHERE organization_id = p_organization_id
          AND delivered_at IS NULL
        ORDER BY created_at, event_id
        LIMIT 1;

        -- Try to insert a new cursor, but do nothing if another process inserted it first.
        INSERT INTO public.cataloging_event_outbox_cursor (
            processor_name, organization_id, last_processed_event_id,
            last_processed_at, updated_at
        ) VALUES (
            p_processor_name, p_organization_id,
            COALESCE(oldest_event_id, '00000000-0000-0000-0000-000000000000'::UUID),
            NOW(), NOW()
        )
        ON CONFLICT (processor_name, organization_id) DO NOTHING;

        -- Loop will repeat and the SELECT will now find the cursor.
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.update_processor_cursor(
    p_processor_name TEXT,
    p_organization_id UUID,
    p_last_processed_event_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.cataloging_event_outbox_cursor
    SET
        last_processed_event_id = p_last_processed_event_id,
        last_processed_at = NOW(),
        updated_at = NOW()
    WHERE processor_name = p_processor_name
      AND organization_id = p_organization_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- BATCH DELIVERY CONFIRMATION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.confirm_event_delivery(
    p_event_ids UUID[],
    p_organization_id UUID
)
RETURNS TABLE (confirmed_count BIGINT, failed_count BIGINT) AS $$
DECLARE
    confirmed_events BIGINT;
    total_events BIGINT := array_length(p_event_ids, 1);
BEGIN
    UPDATE public.cataloging_event_outbox
    SET
        delivered_at = NOW(),
        delivery_attempts = delivery_attempts + 1
    WHERE event_id = ANY(p_event_ids)
      AND organization_id = p_organization_id
      AND delivered_at IS NULL;

    GET DIAGNOSTICS confirmed_events = ROW_COUNT;

    RETURN QUERY SELECT
        confirmed_events,
        total_events - confirmed_events;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.prune_delivered_events(INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.migrate_failed_events_to_dlq(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_or_create_processor_cursor(TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_processor_cursor(TEXT, UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_event_delivery(UUID[], UUID) TO service_role;

-- Add function documentation
COMMENT ON FUNCTION public.prune_delivered_events(INTEGER, INTEGER) IS 'Efficiently prunes delivered events older than a retention period using a locked-row approach.';
COMMENT ON FUNCTION public.migrate_failed_events_to_dlq(INTEGER) IS 'Moves events that failed delivery to the dead letter queue, preserving the last known error.';
COMMENT ON FUNCTION public.get_or_create_processor_cursor(TEXT, UUID) IS 'Atomically gets or creates a cursor for an Edge Function processor, hardened against race conditions.';
COMMENT ON FUNCTION public.update_processor_cursor(TEXT, UUID, UUID) IS 'Updates a processor''s cursor after a batch of events has been successfully processed.';
COMMENT ON FUNCTION public.confirm_event_delivery(UUID[], UUID) IS 'Efficiently marks a batch of events as delivered for a specific organization.'; 