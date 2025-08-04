-- Migration: 20250804_fix_severity_constraint
-- Purpose: Fix severity constraint mismatch between database and frontend
-- Database expects 'minor'/'major' but frontend sends 'low'/'medium'/'high'/'critical'

-- 1. DROP THE INCORRECT SEVERITY CONSTRAINT
ALTER TABLE public.data_quality_flags 
DROP CONSTRAINT IF EXISTS check_severity;

-- 2. ADD CORRECT SEVERITY CONSTRAINT MATCHING FRONTEND ENUM
ALTER TABLE public.data_quality_flags 
ADD CONSTRAINT check_severity 
CHECK (severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]));

-- 3. UPDATE CREATE_DATA_QUALITY_FLAG FUNCTION WITH VALIDATION
CREATE OR REPLACE FUNCTION public.create_data_quality_flag(
    p_organization_id uuid,
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
    v_jwt_organization_id uuid;
BEGIN
    -- Get user from auth
    v_flagged_by := auth.uid();
    IF v_flagged_by IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to create flags';
    END IF;

    -- Validate severity enum
    IF p_severity NOT IN ('low', 'medium', 'high', 'critical') THEN
        RAISE EXCEPTION 'Invalid severity: %. Must be one of: low, medium, high, critical', p_severity;
    END IF;

    -- Validate flag type enum
    IF p_flag_type NOT IN ('incorrect_data', 'missing_data', 'duplicate_record', 'inappropriate_content', 'copyright_issue', 'other') THEN
        RAISE EXCEPTION 'Invalid flag_type: %. Must be one of: incorrect_data, missing_data, duplicate_record, inappropriate_content, copyright_issue, other', p_flag_type;
    END IF;

    -- Validate status enum
    IF p_status NOT IN ('open', 'in_review', 'resolved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid status: %. Must be one of: open, in_review, resolved, rejected', p_status;
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
        RAISE EXCEPTION 'Invalid table_name: %. Must be one of: books, editions, stock_items', p_table_name;
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
        p_record_id::uuid,
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

-- 4. UPDATE FUNCTION COMMENTS
COMMENT ON FUNCTION public.create_data_quality_flag IS 
'Creates a data quality flag with comprehensive validation. Accepts text for record_id and casts to UUID. Validates all enum fields. Handles organization validation from JWT claims or app settings.';

-- 5. DOCUMENT TABLE SCHEMA FOR FUTURE REFERENCE
COMMENT ON TABLE public.data_quality_flags IS 
'Data quality flags for tracking issues with books, editions, and stock items. Supports multi-tenant organization scoping.';

COMMENT ON COLUMN public.data_quality_flags.severity IS 
'Flag severity level. Valid values: low, medium, high, critical';

COMMENT ON COLUMN public.data_quality_flags.flag_type IS 
'Type of data quality issue. Valid values: incorrect_data, missing_data, duplicate_record, inappropriate_content, copyright_issue, other';

COMMENT ON COLUMN public.data_quality_flags.status IS 
'Flag resolution status. Valid values: open, in_review, resolved, rejected';