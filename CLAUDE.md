# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Booksphere Web is a professional inventory management system for independent booksellers, built with:
- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **UI**: shadcn/ui components with Tailwind CSS
- **State Management**: TanStack Query with realtime subscriptions
- **Authentication**: Supabase Auth

## Common Development Commands

### Development
```bash
npm run dev          # Start development server with Turbopack
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

## Architecture Overview

### Directory Structure
- `/src/app/(app)/` - Application routes with shared layout
- `/src/components/` - Reusable React components
- `/src/hooks/` - Custom React hooks
- `/src/lib/` - Core libraries and utilities
- `/supabase/` - Database migrations and edge functions
- `/e2e/` - End-to-end Playwright tests

### Key Architectural Patterns

1. **Event-Driven Architecture**: Uses Supabase outbox pattern for async processing
   - Cataloging jobs → Outbox → Edge Functions → AI Processing (Buildship)
   - Ensures at-least-once delivery with idempotency

2. **CQRS for UI**: Separate read/write models
   - Write: Direct Supabase operations with RLS
   - Read: Optimized queries with materialized views

3. **Multi-Tenancy**: Organization-scoped data with strict RLS policies
   - All queries automatically filtered by organization_id
   - Security enforced at database level

4. **Realtime Updates**: TanStack Query + Supabase Realtime
   - Automatic cache invalidation on data changes
   - Live status updates for long-running operations

### Core Features

1. **Cataloging System**: AI-powered book data extraction
   - Mobile capture → Processing queue → Review workflow
   - Bulk operations with optimistic updates
   - Performance-optimized data tables

2. **Inventory Management**: Stock tracking and search
   - Advanced search with keyset pagination
   - Condition grading and pricing
   - Real-time stock updates

3. **Flagging System**: Data quality management
   - Context-aware flagging from any component
   - Review workflow with status tracking
   - Analytics and reporting

## Database Considerations

- **Supabase Cloud**: Uses cloud instance (not local)
- **RLS Policies**: All tables have Row Level Security
- **Migrations**: Located in `/supabase/migrations/`
- **Performance**: Optimized indexes for search and pagination

## Testing Strategy

- **Unit Tests**: Vitest with React Testing Library
- **E2E Tests**: Playwright against cloud Supabase
- **Test Data**: Use test organization (`test-org-id`)
- **Mocking**: Supabase client mocked in unit tests

## State Management

- **Server State**: TanStack Query for all API calls
- **Client State**: React Context for UI state
- **Form State**: React Hook Form with Zod validation
- **Realtime**: Supabase channels for live updates

## Performance Optimization

- **Data Tables**: Virtual scrolling for large datasets
- **Search**: Debounced queries with server-side filtering
- **Images**: Lazy loading with intersection observer
- **Bundle**: Code splitting by route

## Security Best Practices

- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: RLS policies enforce access control
- **Validation**: Zod schemas for all user input
- **Sanitization**: Server-side validation in edge functions

## Development Memories

- Start and find the development server at http://localhost:3001/
- Start the server with npm run dev