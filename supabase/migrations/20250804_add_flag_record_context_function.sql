-- Migration: 20250804_add_flag_record_context_function
-- Purpose: Add function to fetch rich context data for flagged records
-- This enables the admin UI to display complete book/edition/stock_item details

-- Function to get rich context data for a flagged record
CREATE OR REPLACE FUNCTION public.get_flag_record_context(
    p_organization_id uuid,
    p_table_name text,
    p_record_id uuid
)
RETURNS jsonb AS $$
DECLARE
    v_result jsonb;
    v_book_data jsonb;
    v_edition_data jsonb;
    v_stock_item_data jsonb;
BEGIN
    -- Validate inputs
    IF p_organization_id IS NULL OR p_table_name IS NULL OR p_record_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Missing required parameters');
    END IF;

    -- Validate table_name
    IF p_table_name NOT IN ('books', 'editions', 'stock_items') THEN
        RETURN jsonb_build_object('error', 'Invalid table_name. Must be books, editions, or stock_items');
    END IF;

    -- Fetch data based on table type
    CASE p_table_name
        WHEN 'books' THEN
            SELECT jsonb_build_object(
                'type', 'book',
                'book_id', b.book_id,
                'title', b.title,
                'subtitle', b.subtitle,
                'description', b.description,
                'first_publish_year', b.first_publish_year_ol,
                'edition_count', b.edition_count_ol,
                'primary_cover_image_url', b.primary_cover_image_url,
                'open_library_work_key', b.open_library_work_key,
                'is_serial', b.is_serial,
                'created_at', b.created_at,
                'updated_at', b.updated_at,
                'notes', b.notes_ol,
                'links', b.links_ol,
                'excerpts', b.excerpts_ol
            ) INTO v_result
            FROM public.books b
            WHERE b.book_id = p_record_id;

        WHEN 'editions' THEN
            SELECT jsonb_build_object(
                'type', 'edition',
                'edition_id', e.edition_id,
                'book_id', e.book_id,
                'title', COALESCE(e.edition_title_ol, b.title),
                'subtitle', COALESCE(e.edition_subtitle_ol, b.subtitle),
                'book_title', b.title,
                'isbn10', e.isbn10_ol,
                'isbn13', e.isbn13_ol,
                'publisher_name', p.publisher_name,
                'publish_date', e.publish_date_text_ol,
                'number_of_pages', e.number_of_pages_ol,
                'physical_dimensions', e.physical_dimensions_text_ol,
                'weight_grams', e.weight_grams_ol,
                'by_statement', e.by_statement_ol,
                'description', COALESCE(e.description_ol, b.description),
                'edition_cover_image_url', e.edition_cover_image_url,
                'format_type', f.format_display_name,
                'series_title', e.series_title_ol,
                'series_number', e.series_number,
                'publish_country', e.publish_country_code_ol,
                'open_library_edition_key', e.open_library_edition_key,
                'created_at', e.created_at,
                'updated_at', e.updated_at,
                'pagination_text', e.pagination_text_ol,
                'contributors', e.contributors_ol
            ) INTO v_result
            FROM public.editions e
            LEFT JOIN public.books b ON e.book_id = b.book_id
            LEFT JOIN public.publishers p ON e.publisher_id = p.publisher_id
            LEFT JOIN public.item_specific_format_types f ON e.item_specific_format_type_id = f.format_type_id
            WHERE e.edition_id = p_record_id;

        WHEN 'stock_items' THEN
            SELECT jsonb_build_object(
                'type', 'stock_item',
                'stock_item_id', s.stock_item_id,
                'organization_id', s.organization_id,
                'edition_id', s.edition_id,
                'book_title', b.title,
                'edition_title', COALESCE(e.edition_title_ol, b.title),
                'isbn10', e.isbn10_ol,
                'isbn13', e.isbn13_ol,
                'publisher_name', p.publisher_name,
                'sku', s.sku,
                'condition', c.condition_name,
                'condition_notes', s.condition_notes,
                'selling_price_cents', s.selling_price_cents,
                'cost_cents', s.cost_cents,
                'location_in_store', s.location_in_store,
                'status', s.status,
                'is_consignment', s.is_consignment,
                'consignment_percentage', s.consignment_percentage,
                'date_acquired', s.date_acquired,
                'date_sold', s.date_sold,
                'notes', s.notes,
                'weight_grams', s.weight_grams,
                'length_mm', s.length_mm,
                'width_mm', s.width_mm,
                'height_mm', s.height_mm,
                'primary_image_url', s.primary_image_url,
                'created_at', s.created_at,
                'updated_at', s.updated_at,
                'number_of_pages', e.number_of_pages_ol,
                'publish_date', e.publish_date_text_ol,
                'edition_cover_image_url', e.edition_cover_image_url,
                'format_type', f.format_display_name,
                -- Include stock item attributes
                'attributes', (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'attribute_name', at.attribute_name,
                            'attribute_value', sia.attribute_value,
                            'created_at', sia.created_at
                        )
                    )
                    FROM public.stock_item_attributes sia
                    JOIN public.attribute_types at ON sia.attribute_type_id = at.attribute_type_id
                    WHERE sia.stock_item_id = s.stock_item_id
                )
            ) INTO v_result
            FROM public.stock_items s
            LEFT JOIN public.editions e ON s.edition_id = e.edition_id
            LEFT JOIN public.books b ON e.book_id = b.book_id
            LEFT JOIN public.publishers p ON e.publisher_id = p.publisher_id
            LEFT JOIN public.condition_types c ON s.condition_id = c.condition_id
            LEFT JOIN public.item_specific_format_types f ON e.item_specific_format_type_id = f.format_type_id
            WHERE s.stock_item_id = p_record_id 
            AND s.organization_id = p_organization_id;
    END CASE;

    -- Return result or error if no record found
    IF v_result IS NULL THEN
        RETURN jsonb_build_object(
            'error', 'Record not found',
            'table_name', p_table_name,
            'record_id', p_record_id
        );
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comment
COMMENT ON FUNCTION public.get_flag_record_context(uuid, text, uuid) IS 
'Fetches rich context data for flagged records. Returns complete book/edition/stock_item details as JSON for admin flag review UI. Supports organization scoping for multi-tenancy.';

-- Grant appropriate permissions (same as other flag functions)
-- This will be handled by RLS policies and existing security model