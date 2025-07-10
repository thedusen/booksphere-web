-- 20240701_create_get_paginated_flags_function.sql
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
    title text
) AS 56216
BEGIN
    RETURN QUERY
    SELECT
        flag_id, table_name, record_id, field_name, flag_type, severity, status, description, suggested_value, details, flagged_by, organization_id, created_at, reviewed_by, resolution_notes, resolved_at, title
    FROM public.data_quality_flags
    WHERE (p_status IS NULL OR status = p_status)
      AND (p_table_name IS NULL OR table_name = p_table_name)
      AND (p_severity IS NULL OR severity = p_severity)
      AND (p_search IS NULL OR (
            title ILIKE '%' || p_search || '%'
         OR description ILIKE '%' || p_search || '%'
         OR record_id ILIKE '%' || p_search || '%'
         OR field_name ILIKE '%' || p_search || '%'
      ))
    ORDER BY
        CASE WHEN p_sort_by = 'created_at' AND p_sort_dir = 'desc' THEN created_at END DESC,
        CASE WHEN p_sort_by = 'created_at' AND p_sort_dir = 'asc' THEN created_at END ASC,
        CASE WHEN p_sort_by = 'severity' AND p_sort_dir = 'desc' THEN severity END DESC,
        CASE WHEN p_sort_by = 'severity' AND p_sort_dir = 'asc' THEN severity END ASC
    OFFSET p_offset
    LIMIT p_limit;
END;
56216 LANGUAGE plpgsql SECURITY DEFINER;

