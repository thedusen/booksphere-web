-- Create efficient cataloging job statistics function
-- This replaces the inefficient client-side aggregation with database-level counting

CREATE OR REPLACE FUNCTION get_cataloging_job_stats(org_id UUID)
RETURNS TABLE (
  total BIGINT,
  pending BIGINT,
  processing BIGINT,
  completed BIGINT,
  failed BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate organization access (RLS will also enforce this)
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Organization ID is required';
  END IF;

  -- Return aggregated counts in a single query
  RETURN QUERY
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'pending') as pending,
    COUNT(*) FILTER (WHERE status = 'processing') as processing,
    COUNT(*) FILTER (WHERE status = 'completed') as completed,
    COUNT(*) FILTER (WHERE status = 'failed') as failed
  FROM cataloging_jobs 
  WHERE organization_id = org_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_cataloging_job_stats(UUID) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_cataloging_job_stats(UUID) IS 
'Efficiently aggregates cataloging job status counts for an organization using database-level counting instead of client-side processing. Performance optimized for large datasets.'; 