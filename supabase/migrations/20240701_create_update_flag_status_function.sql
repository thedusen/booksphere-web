-- 20240701_create_update_flag_status_function.sql
CREATE OR REPLACE FUNCTION public.update_flag_status(
    p_flag_id uuid,
    p_status text,
    p_resolution_notes text DEFAULT NULL,
    p_reviewed_by uuid DEFAULT NULL
)
RETURNS public.data_quality_flags AS 56216
DECLARE
    v_flag public.data_quality_flags;
BEGIN
    UPDATE public.data_quality_flags
    SET status = p_status,
        resolution_notes = p_resolution_notes,
        reviewed_by = COALESCE(p_reviewed_by, auth.uid()),
        resolved_at = CASE WHEN p_status = 'resolved' THEN NOW() ELSE resolved_at END
    WHERE flag_id = p_flag_id
    RETURNING * INTO v_flag;

    RETURN v_flag;
END;
56216 LANGUAGE plpgsql SECURITY DEFINER;

