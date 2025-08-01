-- Create sanitized view for notification processor
-- This view exposes only safe, non-sensitive fields from the outbox table

CREATE OR REPLACE VIEW v_cataloging_event_public AS
SELECT 
    id,
    organization_id,
    event_type,
    job_id,
    entity_id,
    entity_type,
    created_at,
    delivery_attempts,
    last_error,
    delivered_at
FROM cataloging_event_outbox
WHERE delivered_at IS NULL  -- Only undelivered events
ORDER BY id ASC;

-- Grant access to the service role for the Edge Function
GRANT SELECT ON v_cataloging_event_public TO service_role;

-- Add RLS policy to ensure organization isolation
ALTER VIEW v_cataloging_event_public SET (security_invoker = true);

-- Create RLS policy for the view
CREATE POLICY "Organizations can only see their own events" ON cataloging_event_outbox
    FOR SELECT USING (
        organization_id::text = current_setting('app.current_org_id', true)
    );

-- Enable RLS on the underlying table if not already enabled
ALTER TABLE cataloging_event_outbox ENABLE ROW LEVEL SECURITY; 