-- ============================================================================
-- MIGRATION: create_outbox_security_policies
-- TIMESTAMP: 20250117100200
-- ============================================================================
-- Purpose: Implement strict organization-scoped RLS policies to prevent
-- cross-tenant data leakage and ensure secure event delivery.
-- ============================================================================

-- Enable Row Level Security on all outbox tables
ALTER TABLE public.cataloging_event_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cataloging_event_outbox_dlq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cataloging_event_outbox_cursor ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION TO GET ORGANIZATION IDS FOR A USER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_organization_ids()
RETURNS TABLE(organization_id UUID) AS $$
BEGIN
    -- Check if a user is authenticated
    IF auth.uid() IS NULL THEN
        RETURN;
    END IF;

    -- Return the organization IDs associated with the current user
    RETURN QUERY
    SELECT o.id FROM public.organizations o
    JOIN public.organization_members om ON o.id = om.organization_id
    WHERE om.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MAIN OUTBOX TABLE POLICIES
-- ============================================================================

-- Policy for service_role to have unrestricted access.
-- This is necessary for triggers and management functions running as `service_role`.
CREATE POLICY "Allow service_role full access on outbox"
ON public.cataloging_event_outbox FOR ALL TO service_role USING (true);

-- Policy for authenticated users - read-only access to their organization's events
CREATE POLICY "Allow users to read events from their organizations"
ON public.cataloging_event_outbox FOR SELECT TO authenticated
USING (organization_id IN (SELECT * FROM public.get_user_organization_ids()));


-- ============================================================================
-- DEAD LETTER QUEUE POLICIES
-- ============================================================================

-- Policy for service_role - unrestricted DLQ access
CREATE POLICY "Allow service_role full access on DLQ"
ON public.cataloging_event_outbox_dlq FOR ALL TO service_role USING (true);

-- Policy for authenticated users - read-only DLQ access for debugging
CREATE POLICY "Allow users to read DLQ events from their organizations"
ON public.cataloging_event_outbox_dlq FOR SELECT TO authenticated
USING (organization_id IN (SELECT * FROM public.get_user_organization_ids()));

-- ============================================================================
-- CURSOR TABLE POLICIES
-- ============================================================================

-- Policy for service_role - unrestricted cursor access
CREATE POLICY "Allow service_role full access on cursor table"
ON public.cataloging_event_outbox_cursor FOR ALL TO service_role USING (true);

-- Policy for authenticated users - read-only cursor access for monitoring
CREATE POLICY "Allow users to read cursors from their organizations"
ON public.cataloging_event_outbox_cursor FOR SELECT TO authenticated
USING (organization_id IN (SELECT * FROM public.get_user_organization_ids()));


-- ============================================================================
-- GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant service_role permissions for outbox operations
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cataloging_event_outbox TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cataloging_event_outbox_dlq TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cataloging_event_outbox_cursor TO service_role;

-- Grant authenticated users read-only permissions for monitoring
GRANT SELECT ON TABLE public.cataloging_event_outbox TO authenticated;
GRANT SELECT ON TABLE public.cataloging_event_outbox_dlq TO authenticated;
GRANT SELECT ON TABLE public.cataloging_event_outbox_cursor TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_user_organization_ids() TO authenticated, service_role;


-- Add policy documentation
COMMENT ON POLICY "Allow service_role full access on outbox" ON public.cataloging_event_outbox IS 'Unrestricted access for service_role to manage the outbox system.';
COMMENT ON POLICY "Allow users to read events from their organizations" ON public.cataloging_event_outbox IS 'Ensures users can only view outbox events belonging to their own organizations.'; 