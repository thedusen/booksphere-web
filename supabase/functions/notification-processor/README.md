# Notification Processor Edge Function

This Edge Function implements the Transactional Outbox pattern for reliable real-time event delivery in the Booksphere cataloging system.

## Architecture

The function polls the `cataloging_event_outbox` table and broadcasts sanitized events to per-organization Realtime channels, ensuring:

- **At-least-once delivery**: Events are reprocessed on failure
- **Multi-tenant isolation**: Per-organization channels and RLS enforcement
- **Security**: Input validation, payload sanitization, and rate limiting
- **Scalability**: Concurrent processing prevention via advisory locks

## Security Features

1. **RLS Context**: Sets `app.current_org_id` and `app.current_processor` for all DB operations
2. **Input Validation**: Strict UUID validation for organization IDs
3. **Payload Sanitization**: Filters sensitive data using `SafeEventPayloadSchema`
4. **Rate Limiting**: 1000 events per minute per organization
5. **Advisory Locks**: Prevents concurrent processing race conditions

## Usage

The function expects an `org_id` query parameter:

```
POST /functions/v1/notification-processor?org_id=<uuid>
```

## Response Format

```json
{
  "success": true,
  "processed": 42,
  "completed": true,
  "duration_ms": 1250,
  "organization_id": "uuid"
}
```

## Database Dependencies

- `get_or_create_processor_cursor(p_organization_id, p_processor_name)`
- `update_processor_cursor(p_organization_id, p_processor_name, p_last_processed_id, p_events_processed)`
- `v_cataloging_event_public` view (sanitized event data)
- `cataloging_event_outbox` table

## Configuration

- `BATCH_SIZE`: 100 events per batch
- `TIMEOUT_BUFFER_MS`: 5000ms reserved for cleanup
- `MAX_EVENTS_PER_MINUTE`: 1000 events per org per minute

## Deployment

Deploy using the Supabase CLI:

```bash
supabase functions deploy notification-processor
```

## Monitoring

The function logs structured information for monitoring:
- Processing duration and batch sizes
- Rate limiting events
- Lock acquisition status
- Error details (sanitized)

## Error Handling

- Transient failures: Retry with exponential backoff
- Permanent failures: Update `delivery_attempts` and `last_error`
- Timeout handling: Partial progress commits before function timeout 