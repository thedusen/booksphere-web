-- Migration: 20250804_document_data_quality_flags_schema
-- Purpose: Document the complete data_quality_flags table schema for future reference
-- This table was created outside the migration system, so we're documenting its current state

-- NOTE: This is documentation only - the table already exists
-- Future schema changes should use ALTER statements in new migrations

/*
REFERENCE: Current data_quality_flags table structure (as of 2025-08-04)

CREATE TABLE public.data_quality_flags (
    flag_id uuid NOT NULL DEFAULT gen_random_uuid(),
    table_name text NOT NULL,
    record_id uuid NOT NULL,
    flag_type text NOT NULL,
    description text,
    details jsonb,
    status text DEFAULT 'open'::text,
    flagged_by uuid,
    reviewed_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    field_name text,
    original_value jsonb,
    suggested_value jsonb,
    organization_id uuid,
    severity text DEFAULT 'medium'::text,
    resolution_notes text,
    
    -- Constraints:
    CONSTRAINT data_quality_flags_pkey PRIMARY KEY (flag_id),
    CONSTRAINT check_severity CHECK (severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))
);

-- Indexes (if any exist)
-- CREATE INDEX idx_data_quality_flags_organization_id ON public.data_quality_flags(organization_id);
-- CREATE INDEX idx_data_quality_flags_status ON public.data_quality_flags(status);
-- CREATE INDEX idx_data_quality_flags_created_at ON public.data_quality_flags(created_at);

-- Row Level Security (RLS) - needs investigation
-- ALTER TABLE public.data_quality_flags ENABLE ROW LEVEL SECURITY;
*/

-- Add comprehensive table and column comments
COMMENT ON TABLE public.data_quality_flags IS 
'Data quality flags for tracking issues with books, editions, and stock items. 
Supports multi-tenant organization scoping. Created outside migration system.';

COMMENT ON COLUMN public.data_quality_flags.flag_id IS 
'Primary key - auto-generated UUID';

COMMENT ON COLUMN public.data_quality_flags.table_name IS 
'Target table name. Valid values: books, editions, stock_items';

COMMENT ON COLUMN public.data_quality_flags.record_id IS 
'UUID of the flagged record in the target table';

COMMENT ON COLUMN public.data_quality_flags.flag_type IS 
'Type of data quality issue. Valid values: incorrect_data, missing_data, duplicate_record, inappropriate_content, copyright_issue, other';

COMMENT ON COLUMN public.data_quality_flags.severity IS 
'Flag severity level. Valid values: low, medium, high, critical. Default: medium';

COMMENT ON COLUMN public.data_quality_flags.status IS 
'Flag resolution status. Valid values: open, in_review, resolved, rejected. Default: open';

COMMENT ON COLUMN public.data_quality_flags.description IS 
'Human-readable description of the data quality issue';

COMMENT ON COLUMN public.data_quality_flags.field_name IS 
'Optional: specific field name that has the issue';

COMMENT ON COLUMN public.data_quality_flags.original_value IS 
'JSON representation of the original/current value';

COMMENT ON COLUMN public.data_quality_flags.suggested_value IS 
'JSON representation of the suggested corrected value';

COMMENT ON COLUMN public.data_quality_flags.details IS 
'Additional context data about the flag (JSON)';

COMMENT ON COLUMN public.data_quality_flags.flagged_by IS 
'UUID of the user who created the flag';

COMMENT ON COLUMN public.data_quality_flags.reviewed_by IS 
'UUID of the user who reviewed/resolved the flag';

COMMENT ON COLUMN public.data_quality_flags.organization_id IS 
'Organization context for multi-tenancy';

COMMENT ON COLUMN public.data_quality_flags.created_at IS 
'Timestamp when flag was created. Default: now()';

COMMENT ON COLUMN public.data_quality_flags.resolved_at IS 
'Timestamp when flag was resolved (populated when status changes to resolved/rejected)';

COMMENT ON COLUMN public.data_quality_flags.resolution_notes IS 
'Notes from the reviewer explaining the resolution';

-- Create recommended indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_data_quality_flags_organization_id 
ON public.data_quality_flags(organization_id);

CREATE INDEX IF NOT EXISTS idx_data_quality_flags_status 
ON public.data_quality_flags(status);

CREATE INDEX IF NOT EXISTS idx_data_quality_flags_created_at 
ON public.data_quality_flags(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_quality_flags_table_record 
ON public.data_quality_flags(table_name, record_id);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_data_quality_flags_org_status_created 
ON public.data_quality_flags(organization_id, status, created_at DESC);