# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Booksphere Web is a professional inventory management system for independent booksellers, built with:
- **Framework**: Next.js 15.3.4 with App Router
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **UI**: shadcn/ui components with Tailwind CSS
- **State Management**: TanStack Query with realtime subscriptions
- **Authentication**: Supabase Auth

## Common Development Commands

### Development
```bash
npm run dev          # Start development server with Turbopack on port 3001
npm run build        # Build for production
npm run start        # Start production server
```

### Testing
```bash
npm run test         # Run unit tests (Vitest)
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run test:e2e     # Run E2E tests (Playwright)
npm run test:e2e:headed # Run E2E tests with browser UI
npm run test:e2e:report # Show E2E test report
```

### Code Quality
```bash
npm run lint         # Run ESLint
```

### AI Tools
```bash
npm run gemini       # Run Gemini CLI for AI assistance
```

## Architecture Overview

### Directory Structure
- `/src/app/(app)/` - Application routes with shared layout
- `/src/components/` - Reusable React components (shadcn/ui based)
- `/src/hooks/` - Custom React hooks (useInventory, useCatalogJobs, useFlagging)
- `/src/lib/` - Core libraries and utilities
  - `/lib/types/` - TypeScript type definitions (api, flags, inventory, jobs)
  - `/lib/supabase/` - Supabase client and auto-generated types
  - `/lib/services/` - External service integrations (book-api.ts for Buildship)
- `/supabase/` - Database infrastructure
  - `/migrations/` - SQL migration files (timestamped)
  - `/functions/` - Edge Functions (notification-processor)
- `/e2e/` - End-to-end Playwright tests
- `/mobile-app-reference/` - Reference implementation from mobile app

### Core Architectural Constraints

**CRITICAL**: These patterns are non-negotiable and must be followed:

1. **Database-First Design**: Always reason from the database schema outwards. Prefer RPCs over direct table access.

2. **Strict Data Hierarchy**: `books` (the work) → `editions` (a specific publication) → `stock_items` (a physical copy)

3. **EAV Pattern for Attributes**: All unique book metadata (e.g., "signed," "first edition") MUST use the `stock_item_attributes` table. **NEVER** add columns to `stock_items`.

4. **Multi-Tenancy Security**: All queries touching `stock_items` or related user data MUST be scoped by `organization_id`.

5. **Type Safety**: No `any` types. All functions, props, and state must be strictly typed. Use interfaces from `/src/lib/types/`.

6. **Modern React Patterns**: Use Server Components by default. Use TanStack Query for all server state; **NEVER** fetch data in `useEffect`.

### Key Architectural Patterns

1. **Event-Driven Architecture**: Uses Supabase outbox pattern for async processing
   - Cataloging jobs → Outbox → Edge Functions → AI Processing (Buildship)
   - Ensures at-least-once delivery with idempotency
   - Dead Letter Queue (DLQ) support for failed events

2. **CQRS for UI**: Separate read/write models
   - Write: Direct Supabase operations with RLS
   - Read: Optimized queries with materialized views
   - Keyset pagination for performance

3. **Multi-Tenancy**: Organization-scoped data with strict RLS policies
   - All queries automatically filtered by organization_id
   - Security enforced at database level
   - JWT claims for organization context

4. **Realtime Updates**: TanStack Query + Supabase Realtime
   - Automatic cache invalidation on data changes
   - Live status updates for long-running operations
   - Subscription-based updates for cataloging jobs

### Core Features

1. **Cataloging System**: AI-powered book data extraction
   - Mobile capture → Processing queue → Review workflow
   - Bulk operations with optimistic updates
   - Performance-optimized data tables
   - Web-based barcode scanning with QuaggaJS
   - ISBN manual entry and lookup via Buildship API

2. **Inventory Management**: Stock tracking and search
   - Advanced search with keyset pagination (`search_inventory` RPC)
   - Condition grading and pricing
   - Real-time stock updates
   - Edition grouping with `get_edition_details` RPC

3. **Flagging System**: Data quality management
   - Context-aware flagging from any component
   - Review workflow with status tracking (`get_paginated_flags` RPC)
   - Analytics and reporting
   - Auto-apply functionality for bulk fixes

## Database Patterns & RPCs

### Critical Database Functions
- **`search_inventory()`**: Main inventory search with keyset pagination
- **`get_edition_details()`**: Fetch detailed edition information
- **`add_stock_item_attribute()`**: Add EAV attributes to stock items
- **`create_data_quality_flag()`**: Create data quality flags
- **`update_flag_status()`**: Update flag resolution status
- **`get_paginated_flags()`**: Paginated flag retrieval
- **`delete_cataloging_jobs()`**: Bulk delete cataloging jobs
- **`retry_cataloging_jobs()`**: Retry failed cataloging jobs

### EAV Pattern Usage
To add attributes like "Signed" to stock items:
1. Query `attribute_types` table for the attribute UUID
2. Call `add_stock_item_attribute` RPC with `stock_item_id`, attribute UUID, and value
3. Never add columns directly to `stock_items` table

### Outbox Pattern
- Events written to `outbox` table with status tracking
- Processed by edge functions with cursor management
- Monitoring views: `outbox_statistics`, `outbox_performance`
- DLQ support for failed events after max retries

## External Integrations

### Buildship API
- **Endpoint**: Configured via `NEXT_PUBLIC_API_BASE_URL` env variable
- **Main Function**: `fetchBookDataByISBN()` in `/src/lib/services/book-api.ts`
- **Response Format**: `ApiResponse` with nested `jsonResult.bookData`
- **Used For**: ISBN lookups, book data enrichment

### Supabase Configuration
- **Cloud Instance**: `oteqbwupxzjjvqbkumlt.supabase.co`
- **Auth**: JWT-based with organization claims
- **RLS**: Enforced on all tables
- **Realtime**: Enabled for job status updates

## Testing Strategy

- **Unit Tests**: Vitest with React Testing Library
  - Setup: `/src/test/setup.ts`
  - Coverage target: 80%
- **E2E Tests**: Playwright against cloud Supabase
  - Test organization: `test-org-id`
  - Auth credentials stored in `.env.local`
- **Mocking**: Supabase client mocked in unit tests

## Performance Optimizations

- **Data Tables**: Virtual scrolling for large datasets
- **Search**: Debounced queries with server-side filtering
- **Images**: Lazy loading with intersection observer
- **Bundle**: Code splitting by route
- **Database**: Optimized indexes on frequently queried columns
- **Pagination**: Keyset pagination for consistent performance

## Security Considerations

- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: RLS policies enforce access control
- **Validation**: Zod schemas for all user input
- **Sanitization**: Server-side validation in edge functions
- **API Keys**: Never commit to repository, use environment variables
- **XSS Prevention**: React's built-in escaping, no dangerouslySetInnerHTML

## Forbidden Patterns

**NEVER** do these things - they violate core architectural principles:

- Add columns like `is_signed` or `edition_number` to `stock_items` table (use EAV pattern)
- Use `useEffect` for data fetching (use TanStack Query hooks)
- Write database queries without `organization_id` scoping where required
- Modify Supabase-generated `types.ts` directly (changes must come from migrations)
- Use `any` types anywhere in the codebase
- Load external scripts from CDNs (security risk - use npm packages)
- Create mock APIs when real endpoints exist

## Development Workflow

1. **Feature Development**:
   - Start with database migration if schema changes needed
   - Create/update TypeScript types
   - Implement React components with TanStack Query
   - Add unit tests alongside implementation
   - Test with E2E tests before PR

2. **Cataloging Flow** (Web matches Mobile):
   - Scan/Manual ISBN → Review Page (API call) → Add to Inventory Wizard
   - Review page fetches data from Buildship API
   - AddToInventoryWizard handles 3-step inventory addition

3. **State Management**:
   - Server state: TanStack Query with custom hooks
   - Form state: React Hook Form with Zod validation
   - UI state: React Context or local state
   - Never mix concerns - keep state types separate

## Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://oteqbwupxzjjvqbkumlt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_BASE_URL=https://buildship-api-url.com
```

## Development Server

- Runs on port 3001 (configured in package.json)
- Access at http://localhost:3001/
- Uses Turbopack for fast refresh