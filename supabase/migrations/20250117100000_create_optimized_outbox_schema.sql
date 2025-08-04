-- ============================================================================
-- MIGRATION: create_optimized_outbox_schema
-- TIMESTAMP: 20250117100000
-- ============================================================================
-- Purpose: Create transactionally safe, high-performance outbox pattern
-- for real-time notifications with proper multi-tenancy and security.
-- ============================================================================

-- Main outbox table for reliable event delivery
CREATE TABLE IF NOT EXISTS public.cataloging_event_outbox (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('created', 'updated', 'deleted')),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('cataloging_job', 'flag')),
    entity_id UUID NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ NULL,
    delivery_attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT NULL,

    -- Ensure event_data is minimal (max 1KB)
    CONSTRAINT event_data_size_limit CHECK (pg_column_size(event_data) <= 1024)
);

-- Dead letter queue for poison pill events
CREATE TABLE IF NOT EXISTS public.cataloging_event_outbox_dlq (
    dlq_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_event_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    delivery_attempts INTEGER NOT NULL,
    last_error TEXT NOT NULL,
    failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Reference to original event for debugging
    CONSTRAINT original_event_reference UNIQUE (original_event_id)
);

-- Durable cursor storage for Edge Function state management
CREATE TABLE IF NOT EXISTS public.cataloging_event_outbox_cursor (
    processor_name TEXT NOT NULL,
    organization_id UUID NOT NULL,
    last_processed_event_id UUID NOT NULL,
    last_processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (processor_name, organization_id)
);

-- Add table comments for documentation
COMMENT ON TABLE public.cataloging_event_outbox IS 'Transactional outbox for reliable event delivery to real-time notification system';
COMMENT ON TABLE public.cataloging_event_outbox_dlq IS 'Dead letter queue for events that failed delivery after maximum retry attempts';
COMMENT ON TABLE public.cataloging_event_outbox_cursor IS 'Durable cursor storage for Edge Function processors to track processing state';

-- Add column comments for critical fields
COMMENT ON COLUMN public.cataloging_event_outbox.event_data IS 'Minimal event payload (max 1KB) - contains only non-sensitive identifiers';
COMMENT ON COLUMN public.cataloging_event_outbox.delivered_at IS 'Timestamp when event was successfully delivered (NULL = pending delivery)';
COMMENT ON COLUMN public.cataloging_event_outbox.delivery_attempts IS 'Number of delivery attempts (used for retry logic and DLQ migration)'; 