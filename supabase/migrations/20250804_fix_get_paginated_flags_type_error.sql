-- Fix get_paginated_flags function SQL type error
-- Issue: Trying to use ILIKE on UUID record_id field causes operator error

CREATE OR REPLACE FUNCTION public.get_paginated_flags(
    p_organization_id uuid,
    p_limit integer,
    p_offset integer,
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
    -- Try to get organization from JWT claims first, then fall back to app settings
    BEGIN
        v_jwt_organization_id := (current_setting('request.jwt.claims', true)::json->>'organization_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_jwt_organization_id := NULL;
    END;
    
    -- If no JWT claim, try app setting
    IF v_jwt_organization_id IS NULL THEN
        BEGIN
            v_jwt_organization_id := current_setting('app.current_org_id', true)::uuid;
        EXCEPTION WHEN OTHERS THEN
            v_jwt_organization_id := NULL;
        END;
    END IF;
    
    -- If we have a JWT org, validate it matches the parameter
    IF v_jwt_organization_id IS NOT NULL AND v_jwt_organization_id != p_organization_id THEN
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
    -- FIX: Convert record_id to text before using ILIKE
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
            OR record_id::text ILIKE ''%%'' || %L || ''%%''
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

    -- Execute the dynamic query
    RETURN QUERY EXECUTE v_sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.get_paginated_flags TO authenticated;

COMMENT ON FUNCTION public.get_paginated_flags IS 
'FIXED: Retrieves paginated data quality flags with proper UUID to text casting for search functionality. Includes organization validation via JWT claims with fallback to app settings.';