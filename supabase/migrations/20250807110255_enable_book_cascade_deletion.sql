-- Enable CASCADE DELETE for platform-managed book hierarchy
-- while protecting user inventory data

BEGIN;

-- =====================================================================================
-- PLATFORM TABLES: Enable CASCADE DELETE
-- These tables are managed by platform admins only
-- =====================================================================================

-- 1. book_authors table - Authors linked to books
ALTER TABLE book_authors 
  DROP CONSTRAINT IF EXISTS book_authors_book_id_fkey,
  ADD CONSTRAINT book_authors_book_id_fkey 
    FOREIGN KEY (book_id) REFERENCES books(book_id) 
    ON DELETE CASCADE;

-- 2. book_genres table - Genres linked to books  
ALTER TABLE book_genres
  DROP CONSTRAINT IF EXISTS book_genres_book_id_fkey,
  ADD CONSTRAINT book_genres_book_id_fkey 
    FOREIGN KEY (book_id) REFERENCES books(book_id) 
    ON DELETE CASCADE;

-- 3. editions table - Book editions/publications
ALTER TABLE editions
  DROP CONSTRAINT IF EXISTS editions_book_id_fkey,
  ADD CONSTRAINT editions_book_id_fkey 
    FOREIGN KEY (book_id) REFERENCES books(book_id) 
    ON DELETE CASCADE;

-- 4. pricing_attribute_impacts table - Pricing analysis data
-- Check if this constraint exists first
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'pricing_attribute_impacts_book_id_fkey'
    ) THEN
        ALTER TABLE pricing_attribute_impacts
          DROP CONSTRAINT pricing_attribute_impacts_book_id_fkey,
          ADD CONSTRAINT pricing_attribute_impacts_book_id_fkey 
            FOREIGN KEY (book_id) REFERENCES books(book_id) 
            ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================================================
-- EDITION-LEVEL CASCADE DELETES
-- Enable cascade for platform data related to editions
-- =====================================================================================

-- 5. classifications table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'classifications_edition_id_fkey'
    ) THEN
        ALTER TABLE classifications
          DROP CONSTRAINT classifications_edition_id_fkey,
          ADD CONSTRAINT classifications_edition_id_fkey 
            FOREIGN KEY (edition_id) REFERENCES editions(edition_id) 
            ON DELETE CASCADE;
    END IF;
END $$;

-- 6. edition_contributors table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'edition_contributors_edition_id_fkey'
    ) THEN
        ALTER TABLE edition_contributors
          DROP CONSTRAINT edition_contributors_edition_id_fkey,
          ADD CONSTRAINT edition_contributors_edition_id_fkey 
            FOREIGN KEY (edition_id) REFERENCES editions(edition_id) 
            ON DELETE CASCADE;
    END IF;
END $$;

-- 7. edition_languages table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'edition_languages_edition_id_fkey'
    ) THEN
        ALTER TABLE edition_languages
          DROP CONSTRAINT edition_languages_edition_id_fkey,
          ADD CONSTRAINT edition_languages_edition_id_fkey 
            FOREIGN KEY (edition_id) REFERENCES editions(edition_id) 
            ON DELETE CASCADE;
    END IF;
END $$;

-- 8. edition_publish_places table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'edition_publish_places_edition_id_fkey'
    ) THEN
        ALTER TABLE edition_publish_places
          DROP CONSTRAINT edition_publish_places_edition_id_fkey,
          ADD CONSTRAINT edition_publish_places_edition_id_fkey 
            FOREIGN KEY (edition_id) REFERENCES editions(edition_id) 
            ON DELETE CASCADE;
    END IF;
END $$;

-- 9. edition_subjects table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'edition_subjects_edition_id_fkey'
    ) THEN
        ALTER TABLE edition_subjects
          DROP CONSTRAINT edition_subjects_edition_id_fkey,
          ADD CONSTRAINT edition_subjects_edition_id_fkey 
            FOREIGN KEY (edition_id) REFERENCES editions(edition_id) 
            ON DELETE CASCADE;
    END IF;
END $$;

-- 10. external_identifiers table (ISBN, ASIN, etc.)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'external_identifiers_edition_id_fkey'
    ) THEN
        ALTER TABLE external_identifiers
          DROP CONSTRAINT external_identifiers_edition_id_fkey,
          ADD CONSTRAINT external_identifiers_edition_id_fkey 
            FOREIGN KEY (edition_id) REFERENCES editions(edition_id) 
            ON DELETE CASCADE;
    END IF;
END $$;

-- 11. printings table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'printings_edition_id_fkey'
    ) THEN
        ALTER TABLE printings
          DROP CONSTRAINT printings_edition_id_fkey,
          ADD CONSTRAINT printings_edition_id_fkey 
            FOREIGN KEY (edition_id) REFERENCES editions(edition_id) 
            ON DELETE CASCADE;
    END IF;
END $$;

-- 12. market_pricing_data table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'market_pricing_data_edition_id_fkey'
    ) THEN
        ALTER TABLE market_pricing_data
          DROP CONSTRAINT market_pricing_data_edition_id_fkey,
          ADD CONSTRAINT market_pricing_data_edition_id_fkey 
            FOREIGN KEY (edition_id) REFERENCES editions(edition_id) 
            ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================================================
-- USER DATA PROTECTION: Ensure RESTRICT constraints
-- These tables contain user business data and must be protected
-- =====================================================================================

-- Verify stock_items has RESTRICT constraint (should already exist)
-- This prevents edition deletion if any user has stock items
DO $$
BEGIN
    -- Check if constraint exists and what its delete action is
    IF EXISTS (
        SELECT 1 FROM information_schema.referential_constraints rc
        JOIN information_schema.table_constraints tc ON rc.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'stock_items'
        AND tc.constraint_name = 'stock_items_edition_id_fkey'
        AND rc.delete_rule = 'CASCADE'
    ) THEN
        -- If it has CASCADE, change to RESTRICT to protect user data
        ALTER TABLE stock_items
          DROP CONSTRAINT stock_items_edition_id_fkey,
          ADD CONSTRAINT stock_items_edition_id_fkey 
            FOREIGN KEY (edition_id) REFERENCES editions(edition_id) 
            ON DELETE RESTRICT;
    END IF;
    
    -- If no constraint exists at all, add RESTRICT constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'stock_items'
        AND constraint_name = 'stock_items_edition_id_fkey'
    ) THEN
        ALTER TABLE stock_items
          ADD CONSTRAINT stock_items_edition_id_fkey 
            FOREIGN KEY (edition_id) REFERENCES editions(edition_id) 
            ON DELETE RESTRICT;
    END IF;
END $$;

-- =====================================================================================
-- SAFE DELETE BOOK FUNCTION
-- Platform admin function to safely delete books with validation
-- =====================================================================================

CREATE OR REPLACE FUNCTION safe_delete_book(
    target_book_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stock_count INTEGER;
    editions_count INTEGER;
    result JSON;
BEGIN
    -- Check if book exists
    IF NOT EXISTS (SELECT 1 FROM books WHERE book_id = target_book_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Book not found',
            'error_code', 'BOOK_NOT_FOUND',
            'book_id', target_book_id
        );
    END IF;
    
    -- Count stock items associated with this book (across all organizations)
    SELECT COUNT(*) INTO stock_count
    FROM stock_items si
    JOIN editions e ON si.edition_id = e.edition_id
    WHERE e.book_id = target_book_id;
    
    -- If stock items exist, prevent deletion
    IF stock_count > 0 THEN
        -- Get count of affected editions for additional info
        SELECT COUNT(*) INTO editions_count
        FROM editions
        WHERE book_id = target_book_id;
        
        RETURN json_build_object(
            'success', false,
            'error', 'Cannot delete book: stock items exist',
            'error_code', 'STOCK_ITEMS_EXIST',
            'book_id', target_book_id,
            'stock_items_count', stock_count,
            'editions_count', editions_count,
            'details', 'This book has ' || stock_count || ' stock items across ' || editions_count || ' editions in user inventories. Remove all stock items before deleting the book.'
        );
    END IF;
    
    -- Get info about what will be deleted before deletion
    SELECT COUNT(*) INTO editions_count
    FROM editions
    WHERE book_id = target_book_id;
    
    -- Safe to delete - perform CASCADE deletion
    DELETE FROM books WHERE book_id = target_book_id;
    
    -- Return success with deletion details
    RETURN json_build_object(
        'success', true,
        'message', 'Book deleted successfully',
        'book_id', target_book_id,
        'editions_deleted', editions_count,
        'cascade_deleted', true
    );
    
EXCEPTION
    WHEN foreign_key_violation THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Foreign key constraint violation',
            'error_code', 'CONSTRAINT_VIOLATION',
            'book_id', target_book_id,
            'details', 'Unexpected foreign key constraint prevented deletion. This may indicate additional references not handled by this function.'
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Unexpected error during deletion',
            'error_code', 'UNKNOWN_ERROR',
            'book_id', target_book_id,
            'sql_error', SQLERRM
        );
END;
$$;

-- Grant execute permission to authenticated users (will be restricted by RLS in practice)
GRANT EXECUTE ON FUNCTION safe_delete_book(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION safe_delete_book(UUID) IS 
'Safely delete a book from the platform database. Checks for existing stock items and prevents deletion if any exist. Returns detailed JSON response with success/error status and deletion details.';

COMMIT;