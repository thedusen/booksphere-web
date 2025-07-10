# Recommended Future Improvements

This document tracks recommended technical improvements for the Booksphere platform.

## Flagging System

### Optimize `get_paginated_flags` RPC for Single-Record Queries

- **Current Situation:** The `useFlagsForRecord` hook currently fetches a list of up to 100 flags and filters them on the client-side to find the flags relevant to a specific record. This is because the `get_paginated_flags` RPC does not support filtering by a single `record_id`.

- **Recommendation:** To improve performance and reduce data transfer, the `get_paginated_flags` PostgreSQL function should be updated to accept an optional `p_record_id` parameter.

- **Benefit:** This would allow the `useFlagsForRecord` hook to fetch only the exact flags it needs, making the query much more efficient, especially in organizations with a large number of flags.

- **Example Implementation (in the RPC):**
  ```sql
  -- Add to parameter list
  p_record_id text DEFAULT NULL

  -- Add to WHERE clause
  AND (p_record_id IS NULL OR record_id = p_record_id)
  ```
