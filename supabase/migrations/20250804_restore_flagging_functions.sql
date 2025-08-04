-- Migration: 20250804_restore_flagging_functions
-- Purpose: Restore flagging functions after accidental removal during cleanup
-- This migration creates the correct versions with p_organization_id parameter to match frontend expectations

-- Drop any existing versions to ensure clean state
DROP FUNCTION IF EXISTS public.create_data_quality_flag CASCADE;
DROP FUNCTION IF EXISTS public.get_paginated_flags CASCADE;
DROP FUNCTION IF EXISTS public.update_flag_status CASCADE;

-- 1. CREATE_DATA_QUALITY_FLAG
-- Accepts organization_id as parameter (required by frontend) but also validates from JWT
CREATE OR REPLACE FUNCTION public.create_data_quality_flag(
    p_organization_id uuid,
    p_table_name text,
    p_record_id text,
    p_flag_type text,
    p_severity text,
    p_field_name text DEFAULT NULL,
    p_status text DEFAULT 'open',
    p_description text DEFAULT NULL,
    p_suggested_value jsonb DEFAULT NULL,
    p_details jsonb DEFAULT NULL
)
RETURNS public.data_quality_flags AS $$
DECLARE
    v_flag public.data_quality_flags;
    v_flagged_by uuid;
    v_jwt_organization_id uuid;
BEGIN
    -- Get user from auth
    v_flagged_by := auth.uid();
    IF v_flagged_by IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to create flags';
    END IF;

    -- Get organization from JWT and validate it matches the parameter
    v_jwt_organization_id := (current_setting('request.jwt.claims', true)::json->>'organization_id')::uuid;
    IF v_jwt_organization_id IS NULL THEN
        RAISE EXCEPTION 'Organization context not found in JWT';
    END IF;
    
    IF v_jwt_organization_id != p_organization_id THEN
        RAISE EXCEPTION 'Organization mismatch - access denied';
    END IF;

    -- Validate the record exists in the specified table (basic validation)
    -- This prevents orphaned flags
    IF p_table_name = 'books' THEN
        IF NOT EXISTS (SELECT 1 FROM public.books WHERE book_id = p_record_id::uuid) THEN
            RAISE EXCEPTION 'Book with ID % not found', p_record_id;
        END IF;
    ELSIF p_table_name = 'editions' THEN
        IF NOT EXISTS (SELECT 1 FROM public.editions WHERE edition_id = p_record_id::uuid) THEN
            RAISE EXCEPTION 'Edition with ID % not found', p_record_id;
        END IF;
    ELSIF p_table_name = 'stock_items' THEN
        IF NOT EXISTS (SELECT 1 FROM public.stock_items WHERE stock_item_id = p_record_id::uuid AND organization_id = p_organization_id) THEN
            RAISE EXCEPTION 'Stock item with ID % not found or access denied', p_record_id;
        END IF;
    ELSE
        RAISE EXCEPTION 'Invalid table_name: %', p_table_name;
    END IF;

    -- Insert the flag
    INSERT INTO public.data_quality_flags (
        table_name,
        record_id,
        field_name,
        flag_type,
        severity,
        status,
        description,
        suggested_value,
        details,
        flagged_by,
        organization_id
    ) VALUES (
        p_table_name,
        p_record_id,
        p_field_name,
        p_flag_type,
        p_severity,
        p_status,
        p_description,
        p_suggested_value,
        p_details,
        v_flagged_by,
        p_organization_id
    )
    RETURNING * INTO v_flag;

    RETURN v_flag;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. GET_PAGINATED_FLAGS
-- Accepts organization_id as parameter and enforces multi-tenancy
CREATE OR REPLACE FUNCTION public.get_paginated_flags(
    p_organization_id uuid,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0,
    p_status text DEFAULT NULL,
    p_table_name text DEFAULT NULL,
    p_severity text DEFAULT NULL,
    p_search text DEFAULT NULL,
    p_sort_by text DEFAULT 'created_at',
    p_sort_dir text DEFAULT 'desc'
)
RETURNS TABLE (
    flag_id uuid,
    table_name text,
    record_id text,
    field_name text,
    flag_type text,
    severity text,
    status text,
    description text,
    suggested_value jsonb,
    details jsonb,
    flagged_by uuid,
    organization_id uuid,
    created_at timestamptz,
    reviewed_by uuid,
    resolution_notes text,
    resolved_at timestamptz,
    item_title text
) AS $$
DECLARE
    v_jwt_organization_id uuid;
    v_sql text;
    v_sort_col text;
    v_sort_dir text;
BEGIN
    -- Validate organization context
    v_jwt_organization_id := (current_setting('request.jwt.claims', true)::json->>'organization_id')::uuid;
    IF v_jwt_organization_id IS NULL OR v_jwt_organization_id != p_organization_id THEN
        RAISE EXCEPTION 'Organization validation failed - access denied';
    END IF;

    -- Whitelist sortable columns to prevent SQL injection
    v_sort_col := CASE p_sort_by
        WHEN 'severity' THEN 'severity'
        WHEN 'item_title' THEN 'item_title'
        WHEN 'status' THEN 'status'
        ELSE 'created_at'
    END;

    -- Whitelist sort direction
    v_sort_dir := CASE lower(p_sort_dir)
        WHEN 'asc' THEN 'ASC'
        ELSE 'DESC'
    END;

    -- Build and execute dynamic SQL with proper escaping
    v_sql := format('
      WITH flag_items AS (
        SELECT f.*, b.title AS item_title
        FROM public.data_quality_flags f
        JOIN public.books b ON f.table_name = ''books'' AND f.record_id::uuid = b.book_id
        WHERE f.organization_id = %L
        UNION ALL
        SELECT f.*, e.edition_title_ol AS item_title
        FROM public.data_quality_flags f
        JOIN public.editions e ON f.table_name = ''editions'' AND f.record_id::uuid = e.edition_id
        WHERE f.organization_id = %L
        UNION ALL
        SELECT f.*, s.sku AS item_title
        FROM public.data_quality_flags f
        JOIN public.stock_items s ON f.table_name = ''stock_items'' AND f.record_id::uuid = s.stock_item_id
        WHERE f.organization_id = %L
      )
      SELECT flag_id, table_name, record_id, field_name, flag_type, severity, status, description, 
             suggested_value, details, flagged_by, organization_id, created_at, reviewed_by, 
             resolution_notes, resolved_at, item_title
      FROM flag_items
      WHERE (%L::text IS NULL OR status = %L)
        AND (%L::text IS NULL OR table_name = %L)
        AND (%L::text IS NULL OR severity = %L)
        AND (%L::text IS NULL OR (
            item_title ILIKE ''%%'' || %L || ''%%''
            OR description ILIKE ''%%'' || %L || ''%%''
            OR record_id ILIKE ''%%'' || %L || ''%%''
            OR field_name ILIKE ''%%'' || %L || ''%%''
        ))
      ORDER BY %I %s
      OFFSET %L LIMIT %L',
      p_organization_id, -- for books
      p_organization_id, -- for editions
      p_organization_id, -- for stock_items
      p_status, p_status,
      p_table_name, p_table_name,
      p_severity, p_severity,
      p_search, p_search, p_search, p_search, p_search,
      v_sort_col,
      v_sort_dir,
      p_offset,
      p_limit
    );

    RETURN QUERY EXECUTE v_sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. UPDATE_FLAG_STATUS
-- Now includes organization validation for security
CREATE OR REPLACE FUNCTION public.update_flag_status(
    p_organization_id uuid,
    p_flag_id uuid,
    p_status text,
    p_resolution_notes text DEFAULT NULL,
    p_reviewed_by uuid DEFAULT NULL
)
RETURNS public.data_quality_flags AS $$
DECLARE
    v_flag public.data_quality_flags;
    v_jwt_organization_id uuid;
    v_flag_org_id uuid;
BEGIN
    -- Validate organization context from JWT
    v_jwt_organization_id := (current_setting('request.jwt.claims', true)::json->>'organization_id')::uuid;
    IF v_jwt_organization_id IS NULL OR v_jwt_organization_id != p_organization_id THEN
        RAISE EXCEPTION 'Organization validation failed - access denied';
    END IF;

    -- Get the flag's organization_id to ensure user can only update their own organization's flags
    SELECT organization_id INTO v_flag_org_id
    FROM public.data_quality_flags
    WHERE flag_id = p_flag_id;

    IF v_flag_org_id IS NULL THEN
        RAISE EXCEPTION 'Flag not found';
    END IF;

    IF v_flag_org_id != p_organization_id THEN
        RAISE EXCEPTION 'Access denied - flag belongs to different organization';
    END IF;

    -- Validate status transition (business rule)
    IF p_status NOT IN ('open', 'in_review', 'resolved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid status: %', p_status;
    END IF;

    -- Update the flag
    UPDATE public.data_quality_flags
    SET status = p_status,
        resolution_notes = p_resolution_notes,
        reviewed_by = COALESCE(p_reviewed_by, auth.uid()),
        resolved_at = CASE 
            WHEN p_status IN ('resolved', 'rejected') THEN NOW() 
            ELSE resolved_at 
        END
    WHERE flag_id = p_flag_id
    RETURNING * INTO v_flag;

    RETURN v_flag;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION public.create_data_quality_flag IS 
'Creates a data quality flag for a specific record. Validates organization context and record existence.';

COMMENT ON FUNCTION public.get_paginated_flags IS 
'Retrieves paginated flags with filtering and sorting. Enforces organization-level access control.';

COMMENT ON FUNCTION public.update_flag_status IS 
'Updates flag status with proper organization validation and audit trail.';

-- Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_data_quality_flags_org_status_created 
ON public.data_quality_flags(organization_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_quality_flags_org_table_severity 
ON public.data_quality_flags(organization_id, table_name, severity);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_data_quality_flag TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_paginated_flags TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_flag_status TO authenticated;