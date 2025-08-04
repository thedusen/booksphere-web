-- Migration: 20250804_fix_record_id_type_mismatch
-- Purpose: Fix the record_id type mismatch in flagging functions
-- The data_quality_flags table has record_id as UUID, but frontend sends text
-- We need to properly cast the text parameter to UUID when inserting

-- 1. UPDATE CREATE_DATA_QUALITY_FLAG
CREATE OR REPLACE FUNCTION public.create_data_quality_flag(
    p_organization_id uuid,
    p_table_name text,
    p_record_id text,  -- Keep as text to match frontend
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
        RAISE EXCEPTION 'Organization mismatch - access denied';
    END IF;

    -- Validate the record exists in the specified table
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
        p_record_id::uuid,  -- Cast text to uuid for insert
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

-- 2. UPDATE GET_PAGINATED_FLAGS (no change needed here as it uses internal queries)
-- The function already handles record_id correctly in the JOINs

-- 3. UPDATE UPDATE_FLAG_STATUS (no change needed as it uses flag_id which is uuid)
-- This function doesn't use record_id parameter

-- Update comments
COMMENT ON FUNCTION public.create_data_quality_flag IS 
'Creates a data quality flag. Accepts text for record_id and casts to UUID. Handles organization validation from JWT claims or app settings.';