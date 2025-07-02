-- Migration: Create view_book_inventory_summary view for optimized inventory list display
-- This view provides a consolidated summary of books with stock item counts for the main inventory list

CREATE OR REPLACE VIEW view_book_inventory_summary AS
SELECT
    b.book_id,
    b.title,
    b.subtitle,
    b.primary_cover_image_url AS cover_image_url,
    -- Get the primary author from book_authors relationship
    (
        SELECT COALESCE(a.name, a.personal_name, 'Unknown Author') 
        FROM book_authors ba
        LEFT JOIN authors a ON ba.author_id = a.author_id
        WHERE ba.book_id = b.book_id
        ORDER BY a.name
        LIMIT 1
    ) AS primary_author,
    -- Get representative ISBN from the first edition with stock items  
    (
        SELECT COALESCE(e.isbn13_ol, e.isbn10_ol)
        FROM editions e
        WHERE e.book_id = b.book_id
        AND EXISTS (
            SELECT 1 FROM stock_items si 
            WHERE si.edition_id = e.edition_id 
            AND si.is_active_for_sale = true
        )
        ORDER BY e.isbn13_ol IS NOT NULL DESC, e.isbn10_ol IS NOT NULL DESC
        LIMIT 1
    ) AS isbn13,
    -- Count of active stock items across all editions
    COUNT(si.stock_item_id) AS item_count,
    -- Price range for quick display
    MIN(si.selling_price_amount) AS min_price,
    MAX(si.selling_price_amount) AS max_price,
    -- Organization for RLS filtering
    si.organization_id
FROM
    books b
    LEFT JOIN editions e ON b.book_id = e.book_id
    LEFT JOIN stock_items si ON e.edition_id = si.edition_id AND si.is_active_for_sale = true
WHERE
    si.stock_item_id IS NOT NULL  -- Only books with active stock items
GROUP BY
    b.book_id, b.title, b.subtitle, b.primary_cover_image_url, si.organization_id
ORDER BY
    b.title;

-- Create an index on the view for performance
CREATE INDEX IF NOT EXISTS idx_book_inventory_summary_organization 
ON stock_items (organization_id, is_active_for_sale, edition_id);

-- Note: This view will be used by a new RPC function to efficiently fetch book summaries
-- for the main inventory list screen.