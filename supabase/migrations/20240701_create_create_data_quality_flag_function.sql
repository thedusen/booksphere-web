-- 20240701_create_create_data_quality_flag_function.sql
CREATE OR REPLACE FUNCTION public.create_data_quality_flag(
    p_table_name text,
    p_record_id text,
    p_flag_type text,
    p_severity text,
    p_field_name text DEFAULT NULL,
    p_status text DEFAULT 'open',
    p_description text DEFAULT NULL,
    p_suggested_value jsonb DEFAULT NULL,
    p_details jsonb DEFAULT NULL,
    p_title text DEFAULT NULL
)
RETURNS public.data_quality_flags AS 56216
DECLARE
    v_flag public.data_quality_flags;
    v_flagged_by uuid;
    v_organization_id uuid;
BEGIN
    -- Get user and org from session (assumes RLS policies are set up)
    v_flagged_by := auth.uid();
    v_organization_id := current_setting('request.jwt.claims', true)::json->>'organization_id';

    INSERT INTO public.data_quality_flags (
        table_name, record_id, field_name, flag_type, severity, status, description, suggested_value, details, flagged_by, organization_id, title
    ) VALUES (
        p_table_name, p_record_id, p_field_name, p_flag_type, p_severity, p_status, p_description, p_suggested_value, p_details, v_flagged_by, v_organization_id, p_title
    )
    RETURNING * INTO v_flag;

    RETURN v_flag;
END;
56216 LANGUAGE plpgsql SECURITY DEFINER;

