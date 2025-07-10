-- 20240702_fix_create_data_quality_flag_function.sql
-- This function corrects and replaces the previous version of create_data_quality_flag.
-- Key fix:
-- 1. Removes the `p_title` parameter and the `title` column from the INSERT statement
--    to align with the actual database schema, where `title` is not a stored column.

CREATE OR REPLACE FUNCTION public.create_data_quality_flag(
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
    v_organization_id uuid;
BEGIN
    -- Get user and org from session
    v_flagged_by := auth.uid();
    v_organization_id := current_setting('request.jwt.claims', true)::json->>'organization_id';

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
        v_organization_id
    )
    RETURNING * INTO v_flag;

    RETURN v_flag;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
