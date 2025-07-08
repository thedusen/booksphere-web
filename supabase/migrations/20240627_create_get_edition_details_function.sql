-- Migration: Create or replace get_edition_details function
-- Returns all details for a single edition, including book info and all stock items for the org

CREATE OR REPLACE FUNCTION get_edition_details(
  edition_id_in uuid,
  org_id_in uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT
    jsonb_build_object(
      'edition_id', e.edition_id,
      'book_title', b.title,
      'authors', (
        SELECT COALESCE(string_agg(a.name, ', '), '')
        FROM book_authors ba
        JOIN authors a ON ba.author_id = a.author_id
        WHERE ba.book_id = b.book_id
      ),
      'isbn13', e.isbn13_ol,
      'isbn10', e.isbn10_ol,
      'publisher_name', COALESCE(p.name, ''),
      'published_date', COALESCE(e.publish_date_text_ol, ''),
      'cover_image_url', COALESCE(e.edition_cover_image_url, ''),
      'stock_items', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'stock_item_id', si.stock_item_id,
            'sku', si.sku,
            'selling_price_amount', si.selling_price_amount,
            'location_in_store_text', si.location_in_store_text,
            'condition_name', COALESCE(cs.standard_name, si.condition, 'Unknown'),
            'condition_notes', si.condition_description,
            'is_active_for_sale', si.is_active_for_sale,
            'date_added_to_stock', si.date_added_to_stock
          )
        ), '[]'::jsonb)
        FROM stock_items si
        LEFT JOIN condition_standards cs ON si.condition_id = cs.condition_id
        WHERE si.edition_id = e.edition_id AND si.organization_id = org_id_in
      )
    )
  INTO result
  FROM editions e
  JOIN books b ON e.book_id = b.book_id
  LEFT JOIN publishers p ON b.publisher_id = p.publisher_id
  WHERE e.edition_id = edition_id_in;

  RETURN result;
END;
$$; 