-- ============================================================================
-- MIGRATION: create_outbox_trigger_functions
-- TIMESTAMP: 20250117100300
-- ============================================================================
-- Purpose: Create transactionally safe triggers that insert events into
-- the outbox table within the same transaction as business operations.
-- ============================================================================

-- Main trigger function for cataloging jobs
CREATE OR REPLACE FUNCTION public.cataloging_outbox_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- This trigger now captures events for INSERT, UPDATE, and DELETE.
    -- The decision to notify on DELETE is a business logic choice, kept for UI consistency.
    -- If a finalized job is deleted, the UI may need to be updated.
    IF TG_OP = 'UPDATE' AND (
        OLD.status IS NOT DISTINCT FROM NEW.status AND
        OLD.completed_at IS NOT DISTINCT FROM NEW.completed_at AND
        OLD.finalized_at IS NOT DISTINCT FROM NEW.finalized_at
    ) THEN
        -- Skip if no meaningful status or timestamp change occurred, reducing noise.
        RETURN NEW;
    END IF;

    -- Create a transactionally safe outbox event
    INSERT INTO public.cataloging_event_outbox (
        organization_id,
        event_type,
        entity_type,
        entity_id,
        event_data,
        created_at
    ) VALUES (
        COALESCE(NEW.organization_id, OLD.organization_id),
        LOWER(TG_OP), -- 'INSERT' -> 'insert', 'UPDATE' -> 'update', etc.
        'cataloging_job',
        COALESCE(NEW.id, OLD.id),
        jsonb_build_object(
            'job_id', COALESCE(NEW.id, OLD.id),
            'status', COALESCE(NEW.status, OLD.status),
            'source_type', COALESCE(NEW.source_type, OLD.source_type),
            'updated_at', COALESCE(NEW.updated_at, OLD.updated_at),
            'completed_at', COALESCE(NEW.completed_at, OLD.completed_at),
            'finalized_at', COALESCE(NEW.finalized_at, OLD.finalized_at)
        ),
        NOW()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Trigger for the flags table
CREATE OR REPLACE FUNCTION public.flags_outbox_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip if no meaningful status change occurred
    IF TG_OP = 'UPDATE' AND (
        OLD.status IS NOT DISTINCT FROM NEW.status AND
        OLD.resolved_at IS NOT DISTINCT FROM NEW.resolved_at
    ) THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.cataloging_event_outbox (
        organization_id,
        event_type,
        entity_type,
        entity_id,
        event_data,
        created_at
    ) VALUES (
        COALESCE(NEW.organization_id, OLD.organization_id),
        LOWER(TG_OP),
        'flag',
        COALESCE(NEW.id, OLD.id),
        jsonb_build_object(
            'flag_id', COALESCE(NEW.id, OLD.id),
            'status', COALESCE(NEW.status, OLD.status),
            'type', COALESCE(NEW.type, OLD.type),
            'resolved_at', COALESCE(NEW.resolved_at, OLD.resolved_at)
        ),
        NOW()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Drop existing triggers before creating new ones to ensure idempotency
DROP TRIGGER IF EXISTS cataloging_jobs_outbox_trigger ON public.cataloging_jobs;
DROP TRIGGER IF EXISTS flags_outbox_trigger ON public.flags;

-- Apply trigger to cataloging_jobs table
CREATE TRIGGER cataloging_jobs_outbox_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.cataloging_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.cataloging_outbox_trigger();

-- Apply trigger to flags table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flags' AND table_schema = 'public') THEN
        EXECUTE '
            CREATE TRIGGER flags_outbox_trigger
                AFTER INSERT OR UPDATE OR DELETE ON public.flags
                FOR EACH ROW
                EXECUTE FUNCTION public.flags_outbox_trigger();
        ';
    END IF;
END $$;

-- Add trigger documentation
COMMENT ON FUNCTION public.cataloging_outbox_trigger() IS 'Transactionally safe trigger for creating outbox events from cataloging job changes.';
COMMENT ON FUNCTION public.flags_outbox_trigger() IS 'Transactionally safe trigger for creating outbox events from flag changes.';

GRANT EXECUTE ON FUNCTION public.cataloging_outbox_trigger() TO service_role;
GRANT EXECUTE ON FUNCTION public.flags_outbox_trigger() TO service_role; 