# Notification System Test Suite

This directory contains comprehensive tests for the real-time notification system, covering both frontend React hooks and backend database functions.

## Test Files

### 1. `useRealtimeNotifications.test.tsx`
Comprehensive unit and integration tests for the `useRealtimeNotifications` React hook.

**Coverage:**
- ✅ Connection lifecycle management (connecting → connected → syncing → synced)
- ✅ Event debouncing and aggregation (2-second window)
- ✅ Toast notification types (success, error, info, aggregated)
- ✅ TanStack Query cache invalidation
- ✅ Memory leak prevention and cleanup
- ✅ Error handling and edge cases
- ✅ Multi-tenant organization isolation
- ✅ Navigation actions from toast buttons

### 2. `supabase/tests/outbox_management_functions.sql`
pg_TAP tests for database management functions.

**Coverage:**
- ✅ `prune_delivered_events()` - event cleanup with retention periods
- ✅ `migrate_failed_events_to_dlq()` - dead letter queue management
- ✅ Cursor management functions for processors
- ✅ Event delivery confirmation
- ✅ Concurrency and race condition handling
- ✅ Multi-tenant data isolation
- ✅ Performance monitoring and metrics

## Running the Tests

### Frontend Tests (Vitest)

```bash
# Run all hook tests
npm run test src/hooks/__tests__/

# Run specific test file
npm run test src/hooks/__tests__/useRealtimeNotifications.test.tsx

# Run with coverage
npm run test:coverage src/hooks/__tests__/

# Run in watch mode
npm run test:watch src/hooks/__tests__/useRealtimeNotifications.test.tsx
```

### Database Tests (pg_TAP)

First, ensure pg_TAP is installed in your Supabase instance:

```sql
-- Connect to your Supabase database and run:
CREATE EXTENSION IF NOT EXISTS pgtap;
```

Then run the tests:

```bash
# Using Supabase CLI
supabase test db

# Or run specific test file
psql "your-connection-string" < supabase/tests/outbox_management_functions.sql

# Using the MCP Supabase integration
# The tests can also be executed via the Supabase MCP server
```

## Test Coverage Metrics

### React Hook Tests (42 test cases)
- **Initialization:** 4 tests
- **Event Handling:** 4 tests  
- **Debouncing/Aggregation:** 5 tests
- **Connection Management:** 3 tests
- **Edge Cases:** 6 tests
- **Cleanup/Memory:** 4 tests
- **Toast Actions:** 3 tests

### Database Function Tests (38 test cases)
- **prune_delivered_events:** 6 tests
- **migrate_failed_events_to_dlq:** 7 tests
- **Cursor Management:** 6 tests
- **Event Delivery:** 2 tests
- **Concurrency:** 3 tests
- **Edge Cases:** 5 tests
- **Data Integrity:** 3 tests
- **Performance:** 2 tests
- **Multi-tenant:** 3 tests
- **Workflow:** 3 tests

## Expected Test Results

All tests should pass in a clean environment. Key assertions include:

### Frontend Tests
- Proper Supabase Realtime subscription management
- Correct debouncing behavior (2-second aggregation window)
- Appropriate toast notifications for different event types
- Cache invalidation after event processing
- Memory leak prevention through proper cleanup

### Database Tests  
- Accurate event pruning based on retention policies
- Proper DLQ migration with error preservation
- Race condition handling in cursor management
- Multi-tenant data isolation
- Performance metrics accuracy

## Troubleshooting

### Common Issues

**Frontend Tests:**
- Ensure all mocks are properly reset between tests
- Check that timer mocks are correctly fast-forwarded
- Verify TanStack Query client setup in test wrappers

**Database Tests:**
- Ensure test isolation by cleaning up data between tests
- Verify pg_TAP extension is installed
- Check that test organizations exist before running tests

### Debug Commands

```bash
# Frontend: Run with debug output
npm run test src/hooks/__tests__/useRealtimeNotifications.test.tsx -- --reporter=verbose

# Database: Enable SQL logging
\set ECHO queries
```

## Integration with CI/CD

These tests are designed to run in continuous integration environments:

### Frontend (GitHub Actions example)
```yaml
- name: Run Frontend Tests
  run: npm run test:coverage src/hooks/__tests__/
  
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

### Database (CI example)
```yaml
- name: Run Database Tests
  run: |
    supabase start
    supabase test db --file=outbox_management_functions.sql
```

## Next Steps

After implementing these tests:

1. **Monitor Test Performance:** Track test execution times
2. **Expand Coverage:** Add integration tests for the complete notification pipeline
3. **Load Testing:** Use the database functions in stress test scenarios
4. **Documentation:** Keep this README updated as tests evolve

## Related Documentation

- [Cataloging System Architecture](../../docs/cataloging/)
- [Notification Processor Implementation](../../NOTIFICATION_PROCESSOR_IMPLEMENTATION.md)
- [Real-time Notifications Guide](../../REALTIME_NOTIFICATIONS_IMPLEMENTATION.md) 