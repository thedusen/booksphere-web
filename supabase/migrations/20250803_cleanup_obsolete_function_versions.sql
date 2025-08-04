-- Migration: cleanup_obsolete_function_versions
-- Date: 2025-08-03
-- Purpose: Remove obsolete function versions identified during database health analysis
-- 
-- CRITICAL: This migration ONLY removes duplicate/obsolete versions
-- Active versions used by Web, Mobile, and Buildship are preserved

-- Drop obsolete search_inventory versions
-- Keeping only: search_inventory(org_id uuid, search_query text, filter_type text, sort_by text, filters jsonb, limit_count integer, last_date_added timestamptz, last_edition_id uuid)
DROP FUNCTION IF EXISTS public.search_inventory(text, text, text, jsonb, integer, integer);

-- Drop obsolete get_edition_details versions  
-- Keeping only: get_edition_details(p_edition_id uuid, p_organization_id uuid) used by web app
-- Note: Buildship uses get_edition_details_by_isbn which is a different function
DROP FUNCTION IF EXISTS public.get_edition_details(p_edition_id uuid);

-- Drop obsolete create_data_quality_flag version with title parameter
-- Keeping only: create_data_quality_flag without title parameter (9 params)
DROP FUNCTION IF EXISTS public.create_data_quality_flag(
    p_table_name text, 
    p_record_id text, 
    p_flag_type text, 
    p_severity text, 
    p_field_name text, 
    p_status text, 
    p_description text, 
    p_suggested_value jsonb, 
    p_details jsonb, 
    p_title text
);

-- Drop obsolete get_paginated_flags version without organization_id parameter
-- Keeping only: get_paginated_flags(p_organization_id uuid, ...) with explicit org scoping
DROP FUNCTION IF EXISTS public.get_paginated_flags(
    p_limit integer, 
    p_offset integer, 
    p_status text, 
    p_table_name text, 
    p_severity text, 
    p_search text, 
    p_sort_by text, 
    p_sort_dir text
);

-- Add comment to document active functions
COMMENT ON FUNCTION public.search_inventory(uuid, text, text, text, jsonb, integer, timestamptz, uuid) IS 
'Active inventory search function used by both Web and Mobile apps. Uses keyset pagination for performance.';

COMMENT ON FUNCTION public.get_edition_details(uuid, uuid) IS 
'Active edition details function used by Web app. Mobile app uses different functions.';

COMMENT ON FUNCTION public.create_data_quality_flag(text, text, text, text, text, text, text, jsonb, jsonb) IS 
'Active flagging function used by Web app only. Current version without title parameter.';

COMMENT ON FUNCTION public.get_paginated_flags(uuid, integer, integer, text, text, text, text, text, text) IS 
'Active flagging function used by Web app only. Current version with explicit organization scoping.';