-- Create processor cursor management functions
-- These functions manage the state of event processors to ensure no gaps in processing

-- Table to track processor cursors
CREATE TABLE IF NOT EXISTS processor_cursors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    processor_name text NOT NULL,
    last_processed_id text NOT NULL DEFAULT '0',
    events_processed_count bigint NOT NULL DEFAULT 0,
    last_processed_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    
    UNIQUE(organization_id, processor_name)
);

-- Enable RLS
ALTER TABLE processor_cursors ENABLE ROW LEVEL SECURITY;

-- RLS policy for processor cursors
CREATE POLICY "Organizations can only access their own processor cursors" ON processor_cursors
    FOR ALL USING (
        organization_id::text = current_setting('app.current_org_id', true)
    );

-- Grant access to service role
GRANT ALL ON processor_cursors TO service_role;

-- Function to get or create processor cursor
CREATE OR REPLACE FUNCTION get_or_create_processor_cursor(
    p_organization_id uuid,
    p_processor_name text
) RETURNS TABLE (
    last_processed_id text,
    events_processed_count bigint,
    last_processed_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert cursor if it doesn't exist
    INSERT INTO processor_cursors (organization_id, processor_name)
    VALUES (p_organization_id, p_processor_name)
    ON CONFLICT (organization_id, processor_name) DO NOTHING;
    
    -- Return current cursor state
    RETURN QUERY
    SELECT 
        pc.last_processed_id,
        pc.events_processed_count,
        pc.last_processed_at
    FROM processor_cursors pc
    WHERE pc.organization_id = p_organization_id
      AND pc.processor_name = p_processor_name;
END;
$$;

-- Function to update processor cursor
CREATE OR REPLACE FUNCTION update_processor_cursor(
    p_organization_id uuid,
    p_processor_name text,
    p_last_processed_id text,
    p_events_processed bigint
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE processor_cursors
    SET 
        last_processed_id = p_last_processed_id,
        events_processed_count = events_processed_count + p_events_processed,
        last_processed_at = now(),
        updated_at = now()
    WHERE organization_id = p_organization_id
      AND processor_name = p_processor_name;
    
    RETURN FOUND;
END;
$$;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION get_or_create_processor_cursor(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION update_processor_cursor(uuid, text, text, bigint) TO service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_processor_cursors_org_processor 
    ON processor_cursors(organization_id, processor_name);

CREATE INDEX IF NOT EXISTS idx_processor_cursors_last_processed 
    ON processor_cursors(last_processed_at);

-- Function to get processor cursor health metrics
CREATE OR REPLACE FUNCTION get_processor_cursor_health()
RETURNS TABLE (
    organization_id uuid,
    processor_name text,
    last_processed_id text,
    events_processed_count bigint,
    last_processed_at timestamptz,
    minutes_since_last_process numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        pc.organization_id,
        pc.processor_name,
        pc.last_processed_id,
        pc.events_processed_count,
        pc.last_processed_at,
        EXTRACT(EPOCH FROM (now() - pc.last_processed_at)) / 60 as minutes_since_last_process
    FROM processor_cursors pc
    ORDER BY pc.last_processed_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_processor_cursor_health() TO service_role; 