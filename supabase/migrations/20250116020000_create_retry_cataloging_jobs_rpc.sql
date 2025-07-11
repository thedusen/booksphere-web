-- Migration: Create `retry_cataloging_jobs` RPC
-- This function enables bulk retry of 'failed' cataloging jobs with server-side validation.
-- It ensures jobs belong to the correct organization and are in a retryable state.

CREATE OR REPLACE FUNCTION retry_cataloging_jobs(
  job_ids_param UUID[],
  org_id UUID
)
RETURNS TABLE (
  retried_count BIGINT,
  invalid_count BIGINT,
  retried_job_ids UUID[],
  invalid_job_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  retried_ids UUID[];
  invalid_ids UUID[];
BEGIN
  -- Validate inputs
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Organization ID is required';
  END IF;

  -- Find valid jobs to retry and update their status to 'pending'
  WITH jobs_to_retry AS (
    UPDATE cataloging_jobs
    SET status = 'pending', updated_at = NOW(), error_message = NULL
    WHERE job_id = ANY(job_ids_param)
      AND organization_id = org_id
      AND status = 'failed'
    RETURNING job_id
  )
  SELECT ARRAY_AGG(job_id) INTO retried_ids FROM jobs_to_retry;

  -- Identify invalid job IDs (not found, not failed, or wrong org)
  invalid_ids := ARRAY(
    SELECT unnest(job_ids_param)
    EXCEPT
    SELECT unnest(coalesce(retried_ids, '{}'))
  );

  -- Return results
  RETURN QUERY SELECT
    COALESCE(ARRAY_LENGTH(retried_ids, 1), 0),
    COALESCE(ARRAY_LENGTH(invalid_ids, 1), 0),
    retried_ids,
    invalid_ids;
END;
$$;

GRANT EXECUTE ON FUNCTION retry_cataloging_jobs(UUID[], UUID) TO authenticated;

COMMENT ON FUNCTION retry_cataloging_jobs(UUID[], UUID) IS
'Performs a bulk retry of failed cataloging jobs for a given organization, ensuring ownership and retryable status.'; 