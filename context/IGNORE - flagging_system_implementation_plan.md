# Flagging System: Analysis and Implementation Plan

This document provides an overview of the existing data quality flagging system and outlines the plan for implementing it in the Booksphere web application.

## Summary of the Existing Flagging System

Here is a summary of what has been built for the mobile application, based on the provided files and analysis of the database schema.

### 1. What's There (The Components)

*   **Database Schema:** The foundation is in the Supabase database.
    *   `data_quality_flags`: This is the core table. It's designed to store a flag against a specific `record_id` in a specific `table_name` (e.g., `books`, `editions`), and can even target a specific `field_name` (column). It includes essential fields like `status`, `description`, `suggested_value`, `flagged_by`, and importantly, `organization_id` for multi-tenancy.
    *   `data_quality_flag_comments`: A table for users to discuss a specific flag.
    *   `data_quality_flag_votes`: A table that allows users to upvote or downvote the validity of a flag. This suggests a future community-moderation feature.

*   **Data Models (`@ignore/flagging/flags.ts`):**
    *   A comprehensive set of TypeScript types and enums (`FlagType`, `FlagStatus`, `FlagPriority`, `FlagCategory`) that define the structure of a flag and its metadata. These are well-defined and provide a strong typing foundation.
    *   **Discrepancy Noted:** The TypeScript models use `priority: FlagPriority`, while the database schema has a column named `severity: string`. This will need to be reconciled.

*   **Core Logic Hook (`@ignore/flagging/useFlagging.ts`):**
    *   This is the primary hook for interacting with the Supabase `data_quality_flags` table.
    *   It provides asynchronous functions: `createFlag`, `getFlagsForRecord`, and `updateFlag`.
    *   It correctly scopes operations by `organizationId` and handles loading/error states.

*   **Client-Side State Management (`@ignore/flagging/FlaggingContext.tsx`):**
    *   A React Context provider built for the mobile app.
    *   It creates a robust client-side cache for "pending" flags, giving the user immediate feedback when they submit a flag.
    *   It manages the full lifecycle of a flag submission: pending -> success/failed, with support for retries.

*   **UI Components (`@ignore/flagging/FlaggingStatusToast.tsx`):**
    *   A React Native toast component that subscribes to the `FlaggingContext` to display the status of flag submissions globally within the app.

### 2. What's Been Done (The Progress)

A very solid, user-experience-focused foundation has been built for the **mobile app**. The architecture is sound: the database schema is well-structured, the data access logic is separated into a reusable hook, and the client-side state is managed by a context provider for a smooth, responsive feel. The system is designed to be robust, even handling retries for failed submissions.

### 3. What Needs to Be Done (The Path Forward for Web)

The core task is to port and adapt this mobile-first implementation to the Next.js web application.

*   **Port Business Logic:** The `useFlagging.ts` hook and `flags.ts` type definitions are platform-agnostic and can be moved directly into the web app's source (`src/hooks` and `src/lib/types`, respectively).
*   **Reconcile Schema Mismatch:** The `priority` vs. `severity` naming conflict must be resolved. The database schema should be the source of truth, so the code should be updated to use `severity`.
*   **Implement Web UI:** The web app needs its own set of UI components.
    *   A way to *initiate* a flag (e.g., a flag icon next to data points in the UI).
    *   A form/modal for submitting the flag details (`FlaggingForm`).
    *   A web-compatible toast/notification system (e.g., using `shadcn/ui`'s Toaster) to replace the React Native `FlaggingStatusToast`.
*   **Create Web Context:** A new `FlaggingProvider` for the web app needs to be created. It will be inspired by the mobile version but will use web components for notifications.
*   **Admin Interface:** The schema is designed for a review process (`status`, `reviewed_by`, etc.), but no interface exists to manage flags. A new area in the application is needed for administrators to view, assess, and resolve flags.

---

## Revised Implementation Plan

This plan has been updated to incorporate architectural and code-level feedback, ensuring the final implementation is robust, scalable, and secure.

### Guiding Principles & Key Decisions

*   **Database as Source of Truth:** All code will align strictly with the database schema (e.g., using `severity` and `field_name`). All core types will be generated directly from the Supabase MCP server to ensure consistency.
*   **Secure & Centralized Logic:** All data mutations and complex queries will be handled by Supabase RPCs (Remote Procedure Calls) via the MCP server to centralize business logic and enforce security rules like `organization_id` scoping.
*   **Validated & Sanitized Input:** All user-submitted data will be rigorously validated on both the client and server using Zod schemas.
*   **Performant by Design:** All lists of flags will be paginated. Database queries will be optimized, and appropriate indexes will be created.
*   **Proactive Admin Workflow:** The administrator dashboard will feature real-time notifications for new flags and will surface a full audit trail for accountability.
*   **Accessibility First:** All user-facing components (icons, forms, toasts) will be built to meet WCAG accessibility standards.
*   **Comprehensive Testing:** The entire feature will be validated with a full suite of unit, integration, and end-to-end (E2E) tests.

### Phase 1: Foundational Backend & Core Types

1.  [✅ Completed] **Schema Alignment & Type Generation:**
    *   Ensure the `data_quality_flags` table uses `severity` and `field_name`. If any changes are needed, create a migration file and save it in the `supabase/migrations/` directory, following the existing migration file pattern.
    *   Use the Supabase MCP server to generate the latest TypeScript types and save them to `src/lib/supabase/types.ts` (or the appropriate location). Do not use the Supabase CLI for this step.
    *   _Completed: Schema is aligned; latest types generated via MCP and saved to `src/lib/supabase/types.ts`._

2.  [✅ Completed] **Develop Supabase RPCs:**
    *   Create a `create_data_quality_flag` PostgreSQL function. This RPC will handle the insertion of a new flag, ensuring `flagged_by` and `organization_id` are set correctly from the session. The migration for this function must be saved in `supabase/migrations/`.
    *   Create an `update_flag_status` function for admins to resolve or reject flags, with its migration saved in `supabase/migrations/`.
    *   Create a `get_paginated_flags` function for the admin dashboard, with its migration saved in `supabase/migrations/`.
    *   All database migrations must be created and tracked in the project under `supabase/migrations/`.
    *   _Completed: All three RPCs created, with migrations in `supabase/migrations/`._

3.  [✅ Completed] **Centralize Custom Types & Validation:**
    *   Create `src/lib/types/flags.ts` for any custom types or enums not covered by Supabase MCP type generation (e.g., `FlagStatus` enum).
    *   Create `src/lib/validators/flags.ts` to define Zod schemas for validating flag creation form data.
    *   _Completed: Types and enums centralized in `src/lib/types/flags.ts`; Zod schemas in `src/lib/validators/flags.ts`._

### Phase 2: Core User-Facing Feature

1.  [✅ Completed] **Implement `useFlagging` Hook:**
    *   Create `src/hooks/useFlagging.ts`.
    *   This hook will be a lightweight wrapper around the new Supabase RPCs, using TanStack Query for server state management (`useQuery`, `useMutation`).
    *   _Completed: Refactored to use TanStack Query, Supabase RPCs, and Zod validation in `src/hooks/useFlagging.ts`._

2.  [✅ Completed] **Build Flagging UI Components:**
    *   Create a reusable `FlaggingIcon` button component.
    *   Create the `FlaggingForm` component within a `Sheet` or `Dialog` from `shadcn/ui`.
    *   The form will use the Zod schemas for client-side validation.
    *   Ensure all components are keyboard-navigable and screen-reader friendly.
    *   _Completed: Created production-quality components in `src/components/flagging/` including `FlaggingTrigger` (context menu pattern), `FlaggingButton`, `FlaggingForm` (comprehensive form with context preview), and `FlaggingProvider` (context management). All components follow accessibility best practices and use shadcn/ui patterns._

3.  [✅ Completed] **Develop Web `FlaggingProvider`:**
    *   Create `src/context/FlaggingContext.tsx`.
    *   This provider will manage UI state, call the `useFlagging` mutation, and display success/error notifications using the `shadcn/ui` `useToast` hook.
    *   _Completed: Implemented as `src/components/flagging/FlaggingProvider.tsx` with global state management and form coordination._

4.  **Integrate into App:**
    *   Wrap the main app layout with the `FlaggingProvider`.
    *   Place `FlaggingIcon` components next to relevant data fields in the inventory table and detail pages.

### Phase 3: Administrator Review Dashboard

1.  **Create Admin Page & Role Guarding:**
    *   Create the new route `src/app/(app)/admin/flags/page.tsx`.
    *   Implement role-based access control, checking the user's claims/role from the `AuthContext` to ensure only admins can view the page.

2.  **Build Flag Management Table:**
    *   Use the `get_paginated_flags` RPC (via the Supabase MCP server) to fetch and display flags in a `shadcn/ui` data table.
    *   Implement server-side pagination, filtering, and sorting controls.

3.  **Develop Review & Resolution UI:**
    *   Create a detail view (e.g., in a dialog or separate page) for a single flag.
    *   This UI will display all flag details, including the audit trail (`flagged_by`, `created_at`, `reviewed_by`, etc.).
    *   Provide admin controls to call the `update_flag_status` RPC (via the MCP server) to resolve or reject the flag.

4.  **Implement Notification System:**
    *   Use Supabase Realtime (via the MCP server) to listen for new rows in the `data_quality_flags` table.
    *   When a new flag appears, display a real-time toast or a notification indicator in the admin sidebar.

### Phase 4: Quality Assurance

1.  **Write Unit & Integration Tests:**
    *   Write unit tests for validators and utility functions.
    *   Write integration tests for the `useFlagging` hook to ensure it correctly interacts with the Supabase MCP RPCs.
2.  **Write End-to-End Tests:**
    *   Use a framework like Playwright or Cypress to create E2E tests for the full user workflow:
        *   A user successfully flags an item.
        *   An admin sees the flag, reviews it, and resolves it.

---

**Note:**
- All database migrations and schema changes must be created as SQL files and saved in the `supabase/migrations/` directory, following the existing project convention.
- All type generation, RPC calls, and real-time features should use the Supabase MCP server, not the CLI.
- If future requirements involve advanced analytics, reporting, or AI-driven moderation, consider leveraging additional MCP servers (such as analytics or AI/ML MCPs) for those features. For now, the Supabase MCP server is the best fit for all core flagging system needs.

### NEXT ACTION PLAN (Final Implementation Steps) – July 2025

The following tasks are **atomic** and should be executed sequentially by coding agents. Each task includes a brief "Complexity vs. Benefit" assessment to help with prioritisation and risk management.

| # | Task | Description | Complexity | Benefit |
|---|------|-------------|------------|---------|
| 1 | Fix Provider Integration | Correct the errors introduced when wrapping `src/app/(app)/layout.tsx` with `FlaggingProvider` (duplicate imports, missing symbols, ensure `QueryClient`, `TooltipProvider`, `AuthProvider`, `Sidebar`, `Header` are in scope). | Low | Blocking – required for context to function globally. |
| 2 | Integrate First `FlaggingTrigger` | Wrap the `title` cell in `src/app/(app)/components/inventory/StockItemRow.tsx` with `<FlaggingTrigger>` as proof-of-concept. | Low | Validates end-to-end flow for end-users. |
| 3 | Decide Additional Flaggable Fields | (Requires Product input) Enumerate which other fields across UI should be flaggable (e.g. author, publication year). | N/A | Govern scope of UI integration. |
| 4 | Wrap Remaining Fields | Add `FlaggingTrigger` to all agreed fields throughout the application. | Medium | Completes user-facing flagging capability. |
| 5 | Create Admin Flags Page | Add route `src/app/(app)/admin/flags/page.tsx`, guarded by role `admin`. | Medium | Enables staff to review flags. |
| 6 | Build Flags Data Table | Use `get_paginated_flags` RPC to display list with paging, sorting, filtering. | Medium | Operational visibility. |
| 7 | Build Flag Detail Dialog | Dialog/sheet showing full flag context plus controls (approve / reject) that call `update_flag_status` RPC. | Medium | Core admin workflow. |
| 8 | Realtime Notifications | Subscribe via Supabase Realtime to new flags → surface toast/badge for admins. | Medium | Improves admin responsiveness. |
| 9 | Fix Remaining Unit Tests | Resolve 3 failing `FlaggingProvider` tests and 10 failing `FlaggingTrigger` tests (mostly expectation tweaks). | Low | Restores CI confidence to 100 %. |
| 10 | Resolve Playwright Config | Fix duplicate `@playwright/test` issue, move E2E specs out of config scope. | Low | Unblocks E2E pipeline. |

> **Execution Hint:** Tasks 1 & 2 are prerequisites for any UI validation; tasks 5-8 relate to the admin surface and can progress in parallel once the provider is stable.

---

## EXECUTION PROMPTS & CHAT MANAGEMENT

### When to Start a New Chat

**Continue Current Chat For:**
- Tasks 1-4 (Provider integration and UI integration) - These depend heavily on the existing context and component understanding
- Task 9 (Fix remaining unit tests) - Requires context of previous test fixes and patterns

**Start New Chat For:**
- Task 5+ (Admin dashboard features) - These are separate features that don't require deep context of the flagging components
- Task 10 (Playwright config) - Standalone configuration issue

### Specific Prompts for Each Task

#### Task 1: Fix Provider Integration
**Prompt for Current Chat:**
```
I need to fix the FlaggingProvider integration in src/app/(app)/layout.tsx. The previous attempt introduced linter errors with duplicate imports and missing symbols. Please:

1. Review the current layout.tsx file to identify the exact errors
2. Check what imports and providers are already in scope
3. Properly integrate the FlaggingProvider without breaking existing functionality
4. Ensure QueryClient, TooltipProvider, AuthProvider, Sidebar, Header are all properly available

The FlaggingProvider is located at src/components/flagging/FlaggingProvider.tsx and should wrap the children appropriately.
```

#### Task 2: Integrate First FlaggingTrigger
**Prompt for Current Chat:**
```
Now that the FlaggingProvider is working, I need to integrate the first FlaggingTrigger as a proof-of-concept. Please:

1. Wrap the title cell in src/app/(app)/components/inventory/StockItemRow.tsx with <FlaggingTrigger>
2. Configure it for table_name="stock_items", record_id=item.id, field_name="title"
3. Test that the context menu appears and the flagging form works end-to-end
4. Ensure the integration follows the existing component patterns and doesn't break the table layout

The FlaggingTrigger component supports wrapping any content and shows a context menu on right-click.
```

#### Task 3: Decide Additional Flaggable Fields
**Prompt for New Chat:**
```
I need to decide which fields throughout the Booksphere inventory application should be flaggable by users. This is a product decision that requires understanding the current UI and identifying data quality pain points.

Please:
1. Analyze the inventory-related components to identify all user-visible data fields
2. Focus on fields where data quality issues are likely (book titles, authors, ISBNs, condition descriptions, etc.)
3. Consider both the inventory list view and detailed item pages
4. Provide a prioritized list of fields to make flaggable, with reasoning for each

Context: We have a FlaggingTrigger component that can wrap any content to enable flagging. The goal is to let users report data quality issues on specific fields.
```

#### Task 4: Wrap Remaining Fields
**Prompt for New Chat (if Task 3 completed) or Current Chat:**
```
Based on the agreed list of flaggable fields, I need to add FlaggingTrigger components throughout the inventory UI. Please:

1. Implement FlaggingTrigger wrappers for each identified field across:
   - Inventory list table (StockItemRow.tsx)
   - Inventory detail pages
   - Any other relevant inventory views
2. Ensure each trigger is configured with correct table_name, record_id, and field_name
3. Maintain existing UI layout and styling
4. Test that all integrations work properly

The FlaggingTrigger component is at src/components/flagging/FlaggingTrigger.tsx and the provider should already be integrated.
```

#### Task 5: Create Admin Flags Page
**Prompt for New Chat:**
```
I need to create an admin dashboard page for managing data quality flags in the Booksphere application. Please:

1. Create src/app/(app)/admin/flags/page.tsx with role-based access control
2. Check user permissions using the existing AuthContext patterns
3. Create a basic layout with proper navigation integration
4. Add placeholder content that will be filled in subsequent tasks
5. Follow the existing app routing and layout patterns

Context: This is a Next.js app with Supabase auth, using (app) routing. There are existing patterns for protected pages and admin functionality to follow.
```

#### Task 6: Build Flags Data Table
**Prompt for New Chat:**
```
I need to build a data table for displaying paginated flags in the admin dashboard. Please:

1. Use the get_paginated_flags Supabase RPC to fetch flag data
2. Create a shadcn/ui data table with columns for: status, table_name, field_name, description, severity, created_at, flagged_by
3. Implement server-side pagination with proper page controls
4. Add filtering by status (pending, resolved, rejected) and table_name
5. Add sorting capabilities for key columns
6. Follow existing table patterns in the inventory components

Context: The Booksphere app uses TanStack Query for server state, Supabase for backend, and has existing table components to reference. The get_paginated_flags RPC is already created in the database.
```

#### Task 7: Build Flag Detail Dialog
**Prompt for New Chat:**
```
I need to create a detailed view for individual flags with admin controls. Please:

1. Create a dialog/sheet that shows full flag details including audit trail
2. Display: original value, suggested value, description, severity, creation date, flagged by user
3. Add admin action buttons to approve/reject flags using the update_flag_status RPC
4. Show the full context of the flagged record (book/edition/stock_item details)
5. Handle success/error states with proper user feedback
6. Integrate with the flags data table for row click actions

Context: Use shadcn/ui Dialog or Sheet components, TanStack Query for mutations, and follow existing patterns for admin actions in the app.
```

#### Task 8: Realtime Notifications
**Prompt for New Chat:**
```
I need to implement realtime notifications for new flags using Supabase Realtime. Please:

1. Set up Supabase Realtime subscription to the data_quality_flags table
2. Show toast notifications when new flags are created
3. Add a notification badge/indicator in the admin sidebar for unread flags
4. Ensure notifications only show for admin users
5. Handle connection states and reconnection properly
6. Follow existing notification patterns in the app

Context: The app uses Supabase for backend with Realtime capabilities, shadcn/ui for notifications, and has existing auth context for role checking.
```

#### Task 9: Fix Remaining Unit Tests
**Prompt for Current Chat:**
```
I need to fix the remaining failing unit tests for the flagging system. Currently there are:
- 3 failing FlaggingProvider tests
- 10 failing FlaggingTrigger tests

Please:
1. Run the tests to see current failure modes
2. Fix each failing test by updating expectations or mock setup
3. Ensure all fixes maintain the test's original intent
4. Follow the patterns established in the previously fixed tests
5. Aim for 100% test pass rate

The test files are in src/components/flagging/__tests__/ and src/hooks/__tests__/. Previous test fixes focused on DOM polyfills, mock expectations, and component behavior alignment.
```

#### Task 10: Resolve Playwright Config
**Prompt for New Chat:**
```
I need to fix the Playwright E2E test configuration issue. There's a duplicate @playwright/test dependency and config problems. Please:

1. Analyze the current Playwright setup and identify the configuration conflicts
2. Fix any duplicate dependencies in package.json
3. Ensure E2E test specs are properly configured and discoverable
4. Test that the basic E2E test runs successfully
5. Follow Next.js and Playwright best practices for configuration

Context: This is a Next.js project with existing test infrastructure. The E2E test file is at e2e/flagging-system.spec.ts.
```

### New Chat Context Setup

When starting a new chat for tasks 5+, include this context:

```
I'm continuing work on the Booksphere flagging system implementation. This is a Next.js/Supabase SaaS platform for booksellers.

Key context:
- The flagging system foundation is complete (hooks, components, providers)
- Database has RPCs: create_data_quality_flag, update_flag_status, get_paginated_flags
- Components are in src/components/flagging/
- Uses TanStack Query, shadcn/ui, Supabase MCP
- Multi-tenant with organization_id scoping required
- Existing patterns in inventory components should be followed

Current task: [specific task from the plan]
```
