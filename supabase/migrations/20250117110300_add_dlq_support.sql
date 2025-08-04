-- Add DLQ support by adding a status to events
-- and modifying the view to only select pending events.

-- Add a status column to the outbox table
ALTER TABLE cataloging_event_outbox
ADD COLUMN status text NOT NULL DEFAULT 'pending';

-- Create an index for efficient querying of pending events
CREATE INDEX IF NOT EXISTS idx_cataloging_event_outbox_status
ON cataloging_event_outbox(status);

-- Update the sanitized view to only select pending events
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
WHERE status = 'pending' -- Only process pending events
ORDER BY id ASC;

-- RLS policies and grants are inherited and do not need to be redefined. 