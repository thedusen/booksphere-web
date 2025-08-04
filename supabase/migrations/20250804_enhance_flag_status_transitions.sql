-- Migration: 20250804_enhance_flag_status_transitions
-- Purpose: Enhance update_flag_status function to support all status transitions including reversed rejections
-- Adds validation, proper resolved_at handling, and organization scoping

-- Enhanced function to update flag status with full transition support
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
    v_current_status text;
    v_valid_transitions text[];
BEGIN
    -- Validate inputs
    IF p_organization_id IS NULL OR p_flag_id IS NULL OR p_status IS NULL THEN
        RAISE EXCEPTION 'Organization ID, flag ID, and status are required';
    END IF;

    -- Validate status value
    IF p_status NOT IN ('open', 'in_review', 'resolved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid status. Must be: open, in_review, resolved, or rejected';
    END IF;

    -- Get current flag status and verify organization access
    SELECT status INTO v_current_status
    FROM public.data_quality_flags
    WHERE flag_id = p_flag_id 
    AND organization_id = p_organization_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Flag not found or access denied';
    END IF;

    -- Define valid status transitions
    -- Note: We now allow transitions FROM rejected back to open/in_review
    CASE v_current_status
        WHEN 'open' THEN
            v_valid_transitions := ARRAY['in_review', 'resolved', 'rejected'];
        WHEN 'in_review' THEN
            v_valid_transitions := ARRAY['open', 'resolved', 'rejected'];
        WHEN 'resolved' THEN
            v_valid_transitions := ARRAY['open', 'in_review']; -- Allow reopening resolved flags
        WHEN 'rejected' THEN
            v_valid_transitions := ARRAY['open', 'in_review']; -- NEW: Allow reversing rejections
        ELSE
            RAISE EXCEPTION 'Unknown current status: %', v_current_status;
    END CASE;

    -- Validate transition
    IF p_status = v_current_status THEN
        -- Same status - just update notes if provided
        NULL; -- Allow this (useful for updating resolution notes)
    ELSIF NOT (p_status = ANY(v_valid_transitions)) THEN
        RAISE EXCEPTION 'Invalid status transition from % to %. Valid transitions: %', 
            v_current_status, p_status, array_to_string(v_valid_transitions, ', ');
    END IF;

    -- Update the flag with proper resolved_at handling
    UPDATE public.data_quality_flags
    SET 
        status = p_status,
        resolution_notes = COALESCE(p_resolution_notes, resolution_notes),
        reviewed_by = COALESCE(p_reviewed_by, auth.uid(), reviewed_by),
        resolved_at = CASE 
            -- Set resolved_at when transitioning TO resolved or rejected
            WHEN p_status IN ('resolved', 'rejected') AND v_current_status NOT IN ('resolved', 'rejected') THEN NOW()
            -- Clear resolved_at when transitioning FROM resolved/rejected back to open/in_review
            WHEN p_status IN ('open', 'in_review') AND v_current_status IN ('resolved', 'rejected') THEN NULL
            -- Keep existing resolved_at for other transitions
            ELSE resolved_at
        END
    WHERE flag_id = p_flag_id
    AND organization_id = p_organization_id
    RETURNING * INTO v_flag;

    -- Log the status change for audit trail
    INSERT INTO public.outbox_events (
        organization_id,
        event_type,
        table_name,
        record_id,
        event_data,
        created_by
    ) VALUES (
        p_organization_id,
        'flag_status_changed',
        'data_quality_flags',
        p_flag_id,
        jsonb_build_object(
            'flag_id', p_flag_id,
            'old_status', v_current_status,
            'new_status', p_status,
            'resolution_notes', p_resolution_notes,
            'reviewed_by', COALESCE(p_reviewed_by, auth.uid())
        ),
        COALESCE(p_reviewed_by, auth.uid())
    );

    RETURN v_flag;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comment
COMMENT ON FUNCTION public.update_flag_status(uuid, uuid, text, text, uuid) IS 
'Enhanced flag status update function with full transition validation. Supports reversing rejected flags back to open/in_review. Includes audit logging and proper resolved_at timestamp handling.';

-- For backward compatibility, maintain the old function signature but delegate to the new one
CREATE OR REPLACE FUNCTION public.update_flag_status(
    p_flag_id uuid,
    p_status text,
    p_resolution_notes text DEFAULT NULL,
    p_reviewed_by uuid DEFAULT NULL
)
RETURNS public.data_quality_flags AS $$
DECLARE
    v_organization_id uuid;
    v_result public.data_quality_flags;
BEGIN
    -- Get organization_id from the flag record
    SELECT organization_id INTO v_organization_id
    FROM public.data_quality_flags
    WHERE flag_id = p_flag_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Flag not found: %', p_flag_id;
    END IF;

    -- Call the enhanced function
    SELECT * INTO v_result
    FROM public.update_flag_status(v_organization_id, p_flag_id, p_status, p_resolution_notes, p_reviewed_by);

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_flag_status(uuid, text, text, uuid) IS 
'Backward compatibility wrapper for update_flag_status. Automatically resolves organization_id from flag record.';