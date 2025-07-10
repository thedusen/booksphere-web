-- 20240701_fix_get_paginated_flags_function.sql
CREATE OR REPLACE FUNCTION public.get_paginated_flags(
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
) AS 56216
DECLARE
    v_org_id uuid := current_setting('request.jwt.claims', true)::json->>'organization_id';
    v_sql text;
BEGIN
    v_sql := '
      WITH flag_items AS (
        SELECT f.*, b.title AS item_title
        FROM public.data_quality_flags f
        JOIN public.books b ON f.table_name = ''books'' AND f.record_id::uuid = b.book_id
        WHERE f.organization_id = 
        UNION ALL
        SELECT f.*, e.edition_title_ol AS item_title
        FROM public.data_quality_flags f
        JOIN public.editions e ON f.table_name = ''editions'' AND f.record_id::uuid = e.edition_id
        WHERE f.organization_id = 
        UNION ALL
        SELECT f.*, s.sku AS item_title
        FROM public.data_quality_flags f
        JOIN public.stock_items s ON f.table_name = ''stock_items'' AND f.record_id::uuid = s.stock_item_id
        WHERE f.organization_id = 
      )
      SELECT flag_id, table_name, record_id, field_name, flag_type, severity, status, description, suggested_value, details, flagged_by, organization_id, created_at, reviewed_by, resolution_notes, resolved_at, item_title
      FROM flag_items
      WHERE (::text IS NULL OR status = )
        AND (::text IS NULL OR table_name = )
        AND (::text IS NULL OR severity = )
        AND (::text IS NULL OR (
            item_title ILIKE ''%'' ||  || ''%''
            OR description ILIKE ''%'' ||  || ''%''
            OR record_id ILIKE ''%'' ||  || ''%''
            OR field_name ILIKE ''%'' ||  || ''%''
        ))
      ORDER BY ' ||
        CASE WHEN p_sort_by = 'created_at' THEN 'created_at' WHEN p_sort_by = 'severity' THEN 'severity' WHEN p_sort_by = 'item_title' THEN 'item_title' ELSE 'created_at' END || ' ' ||
        CASE WHEN lower(p_sort_dir) = 'asc' THEN 'ASC' ELSE 'DESC' END || '
      OFFSET  LIMIT ';

    RETURN QUERY EXECUTE v_sql
      USING v_org_id, p_status, p_table_name, p_severity, p_search, p_offset, p_limit;
END;
56216 LANGUAGE plpgsql SECURITY DEFINER;

