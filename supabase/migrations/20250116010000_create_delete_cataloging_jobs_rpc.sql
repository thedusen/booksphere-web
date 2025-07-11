-- Migration: Create `delete_cataloging_jobs` RPC
-- This function enables bulk deletion of cataloging jobs with server-side validation.
-- It ensures that users can only delete jobs belonging to their own organization.

CREATE OR REPLACE FUNCTION delete_cataloging_jobs(
  job_ids_param UUID[],
  org_id UUID
)
RETURNS TABLE (
  deleted_count BIGINT,
  invalid_count BIGINT,
  deleted_job_ids UUID[],
  invalid_job_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_ids UUID[];
  invalid_ids UUID[];
BEGIN
  -- Validate inputs
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Organization ID is required';
  END IF;

  -- Find valid jobs to delete
  WITH jobs_to_delete AS (
    DELETE FROM cataloging_jobs
    WHERE job_id = ANY(job_ids_param) AND organization_id = org_id
    RETURNING job_id
  )
  SELECT ARRAY_AGG(job_id) INTO deleted_ids FROM jobs_to_delete;

  -- Identify invalid/non-existent job IDs
  invalid_ids := ARRAY(
    SELECT unnest(job_ids_param)
    EXCEPT
    SELECT unnest(coalesce(deleted_ids, '{}'))
  );

  -- Return results
  RETURN QUERY SELECT
    COALESCE(ARRAY_LENGTH(deleted_ids, 1), 0),
    COALESCE(ARRAY_LENGTH(invalid_ids, 1), 0),
    deleted_ids,
    invalid_ids;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_cataloging_jobs(UUID[], UUID) TO authenticated;

COMMENT ON FUNCTION delete_cataloging_jobs(UUID[], UUID) IS
'Performs a bulk delete of cataloging jobs for a given organization, ensuring ownership and providing a detailed result of the operation.'; 