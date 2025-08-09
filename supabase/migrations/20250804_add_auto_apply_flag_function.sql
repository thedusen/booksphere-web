-- Migration: 20250804_add_auto_apply_flag_function
-- Purpose: Add function to automatically apply suggested changes when flags are resolved
-- This is optional functionality that can be called explicitly when resolving flags

-- Function to apply suggested values from resolved flags to target records
CREATE OR REPLACE FUNCTION public.apply_flag_suggested_value(
    p_organization_id uuid,
    p_flag_id uuid,
    p_apply_change boolean DEFAULT true
)
RETURNS jsonb AS $$
DECLARE
    v_flag public.data_quality_flags;
    v_sql text;
    v_result jsonb;
    v_old_value jsonb;
    v_affected_rows integer;
BEGIN
    -- Validate inputs
    IF p_organization_id IS NULL OR p_flag_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Organization ID and flag ID are required');
    END IF;

    -- Get flag details with organization validation
    SELECT * INTO v_flag
    FROM public.data_quality_flags
    WHERE flag_id = p_flag_id 
    AND organization_id = p_organization_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Flag not found or access denied');
    END IF;

    -- Validate flag is in resolved status
    IF v_flag.status != 'resolved' THEN
        RETURN jsonb_build_object(
            'error', 'Flag must be resolved before applying changes',
            'current_status', v_flag.status
        );
    END IF;

    -- Validate we have a suggested value
    IF v_flag.suggested_value IS NULL THEN
        RETURN jsonb_build_object('error', 'No suggested value to apply');
    END IF;

    -- Validate table name
    IF v_flag.table_name NOT IN ('books', 'editions', 'stock_items') THEN
        RETURN jsonb_build_object('error', 'Invalid table name: ' || v_flag.table_name);
    END IF;

    -- If field_name is NULL, this is a record-level flag, not a field-specific one
    IF v_flag.field_name IS NULL THEN
        RETURN jsonb_build_object(
            'error', 'Cannot apply suggested value for record-level flags',
            'suggestion', 'Record-level flags require manual resolution'
        );
    END IF;

    -- Dry run mode - just return what would be changed without applying
    IF NOT p_apply_change THEN
        -- Get current value for comparison
        CASE v_flag.table_name
            WHEN 'books' THEN
                EXECUTE format('SELECT to_jsonb(%I) FROM public.books WHERE book_id = $1', v_flag.field_name)
                USING v_flag.record_id INTO v_old_value;
            WHEN 'editions' THEN
                EXECUTE format('SELECT to_jsonb(%I) FROM public.editions WHERE edition_id = $1', v_flag.field_name)
                USING v_flag.record_id INTO v_old_value;
            WHEN 'stock_items' THEN
                EXECUTE format('SELECT to_jsonb(%I) FROM public.stock_items WHERE stock_item_id = $1 AND organization_id = $2', v_flag.field_name)
                USING v_flag.record_id, p_organization_id INTO v_old_value;
        END CASE;

        RETURN jsonb_build_object(
            'dry_run', true,
            'flag_id', p_flag_id,
            'table_name', v_flag.table_name,
            'record_id', v_flag.record_id,
            'field_name', v_flag.field_name,
            'current_value', v_old_value,
            'suggested_value', v_flag.suggested_value,
            'would_change', (v_old_value != v_flag.suggested_value)
        );
    END IF;

    -- Apply the change based on table type
    CASE v_flag.table_name
        WHEN 'books' THEN
            -- Books table doesn't have organization_id, so simpler update
            -- Get old value first for audit trail
            EXECUTE format('SELECT to_jsonb(%I) FROM public.books WHERE book_id = $1', v_flag.field_name)
            USING v_flag.record_id INTO v_old_value;

            -- Apply the change
            v_sql := format(
                'UPDATE public.books SET %I = $1, updated_at = NOW() WHERE book_id = $2',
                v_flag.field_name
            );
            
            EXECUTE v_sql USING 
                (v_flag.suggested_value #>> '{}')::text, -- Extract text value from jsonb
                v_flag.record_id;
            
            GET DIAGNOSTICS v_affected_rows = ROW_COUNT;

        WHEN 'editions' THEN
            -- Editions table doesn't have organization_id
            -- Get old value first
            EXECUTE format('SELECT to_jsonb(%I) FROM public.editions WHERE edition_id = $1', v_flag.field_name)
            USING v_flag.record_id INTO v_old_value;

            -- Apply the change
            v_sql := format(
                'UPDATE public.editions SET %I = $1, updated_at = NOW() WHERE edition_id = $2',
                v_flag.field_name
            );
            
            EXECUTE v_sql USING 
                (v_flag.suggested_value #>> '{}')::text,
                v_flag.record_id;
            
            GET DIAGNOSTICS v_affected_rows = ROW_COUNT;

        WHEN 'stock_items' THEN
            -- Stock items have organization_id, so include in WHERE clause
            -- Get old value first
            EXECUTE format('SELECT to_jsonb(%I) FROM public.stock_items WHERE stock_item_id = $1 AND organization_id = $2', v_flag.field_name)
            USING v_flag.record_id, p_organization_id INTO v_old_value;

            -- Apply the change with organization scoping
            v_sql := format(
                'UPDATE public.stock_items SET %I = $1, updated_at = NOW() WHERE stock_item_id = $2 AND organization_id = $3',
                v_flag.field_name
            );
            
            EXECUTE v_sql USING 
                (v_flag.suggested_value #>> '{}')::text,
                v_flag.record_id,
                p_organization_id;
            
            GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
    END CASE;

    -- Check if update was successful
    IF v_affected_rows = 0 THEN
        RETURN jsonb_build_object(
            'error', 'No records updated. Record may not exist or access denied.',
            'table_name', v_flag.table_name,
            'record_id', v_flag.record_id
        );
    END IF;

    -- Log the change in outbox for audit trail
    INSERT INTO public.outbox_events (
        organization_id,
        event_type,
        table_name,
        record_id,
        event_data,
        created_by
    ) VALUES (
        p_organization_id,
        'flag_change_applied',
        v_flag.table_name,
        v_flag.record_id,
        jsonb_build_object(
            'flag_id', p_flag_id,
            'field_name', v_flag.field_name,
            'old_value', v_old_value,
            'new_value', v_flag.suggested_value,
            'applied_by', auth.uid(),
            'applied_at', NOW()
        ),
        auth.uid()
    );

    -- Return success result
    RETURN jsonb_build_object(
        'success', true,
        'flag_id', p_flag_id,
        'table_name', v_flag.table_name,
        'record_id', v_flag.record_id,
        'field_name', v_flag.field_name,
        'old_value', v_old_value,
        'new_value', v_flag.suggested_value,
        'applied_at', NOW(),
        'applied_by', auth.uid()
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Return error details for debugging
        RETURN jsonb_build_object(
            'error', 'Failed to apply suggested value',
            'details', SQLERRM,
            'sql_state', SQLSTATE,
            'flag_id', p_flag_id
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comment
COMMENT ON FUNCTION public.apply_flag_suggested_value(uuid, uuid, boolean) IS 
'Applies suggested values from resolved flags to target records. Supports dry-run mode for preview. Includes audit logging and organization scoping. Only works with field-specific flags (not record-level flags).

Usage:
- apply_flag_suggested_value(org_id, flag_id, true) - Apply the change
- apply_flag_suggested_value(org_id, flag_id, false) - Dry run preview
';

-- Create convenience function to apply changes when resolving flags
CREATE OR REPLACE FUNCTION public.resolve_flag_with_changes(
    p_organization_id uuid,
    p_flag_id uuid,
    p_resolution_notes text DEFAULT NULL,
    p_apply_suggested_changes boolean DEFAULT false
)
RETURNS jsonb AS $$
DECLARE
    v_flag_update_result public.data_quality_flags;
    v_apply_result jsonb;
    v_result jsonb;
BEGIN
    -- First resolve the flag
    SELECT * INTO v_flag_update_result
    FROM public.update_flag_status(p_organization_id, p_flag_id, 'resolved', p_resolution_notes);

    -- Initialize result
    v_result := jsonb_build_object(
        'flag_resolved', true,
        'flag_id', p_flag_id,
        'status', 'resolved'
    );

    -- If requested, also apply suggested changes
    IF p_apply_suggested_changes THEN
        SELECT public.apply_flag_suggested_value(p_organization_id, p_flag_id, true) INTO v_apply_result;
        v_result := v_result || jsonb_build_object('change_application', v_apply_result);
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.resolve_flag_with_changes(uuid, uuid, text, boolean) IS 
'Convenience function to resolve a flag and optionally apply suggested changes in one operation. Returns combined result of both operations.';