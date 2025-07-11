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

### NEXT ACTION PLAN (Final Implementation Steps) – July 2025

The following tasks are **atomic** and should be executed sequentially by coding agents. Each task includes a brief "Complexity vs. Benefit" assessment to help with prioritisation and risk management.

| # | Task | Description | Expert Workflow | Complexity | Benefit | Status |
|---|------|-------------|-----------------|------------|---------|---------|
| 1 | ✅ Fix Provider Integration | Correct the errors introduced when wrapping `src/app/(app)/layout.tsx` with `FlaggingProvider` (duplicate imports, missing symbols, ensure `QueryClient`, `TooltipProvider`, `AuthProvider`, `Sidebar`, `Header` are in scope). | `;review` → `;code` | Low | Blocking – required for context to function globally. | **COMPLETED** |
| 2 | ✅ Integrate First `FlaggingTrigger` | Wrap the `title` cell in `src/app/(app)/components/inventory/StockItemRow.tsx` with `<FlaggingTrigger>` as proof-of-concept. | `;code` → `;review` | Low | Validates end-to-end flow for end-users. | **COMPLETED** |
| 3 | ✅ Decide Additional Flaggable Fields | (Requires Product input) Enumerate which other fields across UI should be flaggable (e.g. author, publication year). | `;business` → `;ux` | N/A | Govern scope of UI integration. | **COMPLETED** |
| 4 | ✅ Wrap Remaining Fields | Add `FlaggingTrigger` to all agreed fields throughout the application. | `;code` → `;perf` → `;review` | Medium | Completes user-facing flagging capability. | **COMPLETED** |
| 5 | 🔄 Create Admin Flags Page | Add route `src/app/(app)/admin/flags/page.tsx`, guarded by role `admin`. | `;security` → `;code` → `;review` | Medium | Enables staff to review flags. | **BASIC VERSION DONE** |
| 6 | Build Flags Data Table | Use `get_paginated_flags` RPC to display list with paging, sorting, filtering. | `;arch` → `;perf` → `;code` → `;review` | Medium | Operational visibility. | **NEXT PRIORITY** |
| 7 | Build Flag Detail Dialog | Dialog/sheet showing full flag context plus controls (approve / reject) that call `update_flag_status` RPC. | `;ux` → `;security` → `;code` → `;review` | Medium | Core admin workflow. | **PENDING** |
| 8 | Realtime Notifications | Subscribe via Supabase Realtime to new flags → surface toast/badge for admins. | `;arch` → `;security` → `;code` → `;review` | Medium | Improves admin responsiveness. | **PENDING** |
| 9 | ✅ Fix Remaining Unit Tests | Resolve 3 failing `FlaggingProvider` tests and 10 failing `FlaggingTrigger` tests (mostly expectation tweaks). | `;test` → `;review` | Low | Restores CI confidence to 100 %. | **COMPLETED** |
| 10 | ✅ Resolve Playwright Config | Fix duplicate `@playwright/test` issue, move E2E specs out of config scope. | `;deploy` → `;test` | Low | Unblocks E2E pipeline. | **COMPLETED** |

### Post-Completion System Review
**After All Tasks Complete:** `;arch` → `;security` → `;perf` → `;test` → `;deploy`

> **Execution Hint:** Tasks 1 & 2 are prerequisites for any UI validation; tasks 5-8 relate to the admin surface and can progress in parallel once the provider is stable.

---

## EXPERT TASK PROMPTS

### Task 1: Fix Provider Integration

#### `;review` (Gemini 2.5 Pro Preview 06-05)
<task>
Review the current FlaggingProvider integration in src/app/(app)/layout.tsx. The previous attempt introduced linter errors with duplicate imports and missing symbols. Analyze:

1. **Integration Issues:** Identify exact duplicate imports and missing symbol errors
2. **Scope Analysis:** Verify which providers (QueryClient, TooltipProvider, AuthProvider) are already available
3. **Component Dependencies:** Check if Sidebar and Header components are properly in scope
4. **Integration Strategy:** Recommend the cleanest approach to wrap children with FlaggingProvider

Focus on identifying the root cause of integration conflicts and providing a clear remediation strategy.
</task>

#### `;code` (Claude 4 Sonnet)
<task>
Fix the FlaggingProvider integration in src/app/(app)/layout.tsx based on the review findings. Implement:

1. **Clean Integration:** Remove duplicate imports and resolve missing symbols
2. **Provider Hierarchy:** Properly nest FlaggingProvider within existing provider structure
3. **Component Access:** Ensure QueryClient, TooltipProvider, AuthProvider, Sidebar, Header remain functional
4. **Error Prevention:** Add proper TypeScript typing and error handling

The FlaggingProvider is located at src/components/flagging/FlaggingProvider.tsx and should wrap children appropriately without breaking existing functionality.
</task>

### Task 2: Integrate First FlaggingTrigger

#### `;code` (Claude 4 Sonnet)
<task>
Integrate the first FlaggingTrigger as proof-of-concept in src/app/(app)/components/inventory/StockItemRow.tsx. Implement:

1. **Component Integration:** Wrap the title cell with `<FlaggingTrigger>`
2. **Configuration:** Set table_name="stock_items", record_id=item.id, field_name="title"
3. **Layout Preservation:** Maintain existing table styling and responsive behavior
4. **Event Handling:** Ensure context menu appears on right-click without interfering with table interactions

Test that the flagging form opens and submits properly, validating the end-to-end flagging workflow.
</task>

#### `;review` (Gemini 2.5 Pro Preview 06-05)
<task>
Review the FlaggingTrigger integration in the inventory table. Evaluate:

1. **Integration Quality:** Is the trigger properly integrated without breaking table layout?
2. **User Experience:** Does the context menu interaction feel natural and discoverable?
3. **Component Consistency:** Does the integration follow existing component patterns?
4. **Functionality Validation:** Does the end-to-end flagging workflow work correctly?

Provide feedback on any UX improvements or integration refinements needed.
</task>

### Task 3: Decide Additional Flaggable Fields

#### `;business` (o3)
<task>
Analyze the Booksphere inventory system to identify which fields should be flaggable for data quality issues. Evaluate:

1. **Data Quality Pain Points:** Which fields are most likely to have accuracy issues (titles, authors, ISBNs, conditions, pricing)?
2. **Business Impact:** Which incorrect fields cause the most operational problems for booksellers?
3. **User Workflows:** Where in the inventory process do data quality issues surface most?
4. **Priority Ranking:** Order fields by importance for business operations and customer experience

Consider both the inventory list view and detailed item pages. Focus on fields where crowdsourced corrections would provide significant value.
</task>

#### `;ux` (Gemini 2.5 Pro Preview 06-05)
<task>
Design the user experience for flagging multiple fields across the inventory interface. Consider:

1. **User Discovery:** How will users understand which fields are flaggable?
2. **Interaction Patterns:** Should all flaggable fields use the same interaction model (right-click context menu)?
3. **Visual Indicators:** How should flaggable fields be distinguished from non-flaggable ones?
4. **Cognitive Load:** How many flaggable fields can be present without overwhelming users?

Provide UX recommendations for making the flagging system discoverable and intuitive across the application.
</task>

### Task 4: Wrap Remaining Fields

#### `;code` (Claude 4 Sonnet)
<task>
Implement FlaggingTrigger wrappers for all agreed flaggable fields across the inventory UI. Add triggers to:

1. **Inventory List:** All identified fields in StockItemRow.tsx
2. **Detail Pages:** Relevant fields in item detail views
3. **Other Views:** Any additional inventory-related pages

For each trigger, ensure correct configuration with table_name, record_id, and field_name. Maintain existing UI layout and styling patterns.
</task>

#### `;perf` (o3)
<task>
Analyze the performance implications of multiple FlaggingTrigger components. Evaluate:

1. **Component Count:** Impact of 5-10 triggers per inventory row on rendering performance
2. **Event Handling:** Efficiency of multiple context menu event listeners
3. **Memory Usage:** Client-side memory impact of multiple trigger instances
4. **Optimization Opportunities:** Ways to improve performance while maintaining functionality

Recommend optimizations if needed to ensure smooth performance with large inventory lists.
</task>

#### `;review` (Gemini 2.5 Pro Preview 06-05)
<task>
Review the complete flagging UI integration across all inventory views. Assess:

1. **Consistency:** Are all flagging interactions consistent across different views?
2. **Layout Impact:** Do the triggers maintain proper visual hierarchy and spacing?
3. **User Experience:** Is the flagging capability discoverable and intuitive?
4. **Edge Cases:** How does the interface handle edge cases (missing data, loading states)?

Validate that the flagging system enhances rather than clutters the inventory interface.
</task>

### Task 5: Create Admin Flags Page

#### `;security` (o3)
<task>
Design the security model for the admin flags page. Analyze:

1. **Access Control:** Validate role-based access using existing AuthContext patterns
2. **Permission Scoping:** Ensure admins can only see flags for their organization
3. **Action Authorization:** Design security for flag resolution actions (approve/reject)
4. **Audit Requirements:** What audit trail is needed for admin actions on flags?

Ensure the admin interface follows security best practices for sensitive operations.
</task>

#### `;code` (Claude 4 Sonnet)
<task>
Create src/app/(app)/admin/flags/page.tsx with proper role-based access control. Implement:

1. **Route Protection:** Check user permissions using AuthContext patterns
2. **Layout Integration:** Follow existing admin page layout and navigation patterns
3. **Role Validation:** Ensure only admin users can access the page
4. **Placeholder Structure:** Create basic layout that will be filled in subsequent tasks

Follow the existing Next.js app routing patterns and admin functionality conventions.
</task>

#### `;review` (Gemini 2.5 Pro Preview 06-05)
<task>
Review the admin flags page foundation. Evaluate:

1. **Access Control:** Is the role-based protection properly implemented?
2. **Navigation Integration:** Does the page fit well within the existing admin area?
3. **Layout Quality:** Is the page structure ready for additional components?
4. **User Experience:** Does the admin interface follow established patterns?

Ensure the foundation is solid for building the complete admin dashboard.
</task>

### Task 6: Build Flags Data Table

#### `;arch` (o3)
<task>
Design the architecture for the flags data table with pagination. Analyze:

1. **Data Flow:** How should get_paginated_flags RPC integrate with TanStack Query?
2. **State Management:** What client-side state is needed for filtering/sorting?
3. **Performance Strategy:** How to handle large numbers of flags efficiently?
4. **Real-time Updates:** How should the table handle new flags appearing in real-time?

Design a robust, scalable approach for displaying and managing flag data.
</task>

#### `;perf` (o3)
<task>
Optimize the flags data table for performance. Consider:

1. **Pagination Strategy:** Optimal page size and loading patterns
2. **Query Optimization:** Efficient use of get_paginated_flags RPC
3. **Filtering Performance:** Impact of various filter combinations on database queries
4. **Sorting Efficiency:** Database vs. client-side sorting trade-offs

Ensure the table performs well with thousands of flags and frequent updates.
</task>

#### `;code` (Claude 4 Sonnet)
<task>
Build the flags data table using shadcn/ui components. Implement:

1. **Data Fetching:** Use get_paginated_flags RPC with TanStack Query
2. **Table Structure:** Columns for status, table_name, field_name, description, severity, created_at, flagged_by
3. **Pagination:** Server-side pagination with proper page controls
4. **Filtering:** Status (pending, resolved, rejected) and table_name filters
5. **Sorting:** Key column sorting capabilities

Follow existing table patterns in the inventory components and ensure responsive design.
</task>

#### `;review` (Gemini 2.5 Pro Preview 06-05)
<task>
Review the flags data table implementation. Assess:

1. **Data Presentation:** Is flag information clearly displayed and scannable?
2. **Interaction Design:** Are filtering and sorting controls intuitive?
3. **Performance Feel:** Does pagination and loading feel responsive?
4. **Visual Hierarchy:** Is the most important information prominently displayed?

Ensure the table provides an excellent admin experience for reviewing flags.
</task>

### Task 7: Build Flag Detail Dialog

#### `;ux` (Gemini 2.5 Pro Preview 06-05)
<task>
Design the user experience for the flag detail dialog. Consider:

1. **Information Architecture:** How to organize flag details, context, and actions
2. **Decision Support:** What information do admins need to approve/reject flags?
3. **Context Display:** How to show the flagged record context effectively
4. **Action Workflow:** Design the approve/reject workflow to prevent errors

Create a design that enables quick, confident decision-making by administrators.
</task>

#### `;security` (o3)
<task>
Validate the security of the flag detail dialog and admin actions. Analyze:

1. **Action Authorization:** Ensure only authorized admins can approve/reject flags
2. **Data Exposure:** Validate what record context is safe to display
3. **Operation Security:** Secure implementation of update_flag_status RPC calls
4. **Audit Trail:** Ensure proper logging of admin actions for accountability

Design security measures that protect data while enabling admin workflows.
</task>

#### `;code` (Claude 4 Sonnet)
<task>
Create the flag detail dialog with admin controls. Implement:

1. **Dialog Structure:** Use shadcn/ui Dialog or Sheet for the detail view
2. **Information Display:** Show full flag details and audit trail
3. **Context Integration:** Display relevant record context (book/edition/stock_item details)
4. **Admin Actions:** Approve/reject buttons using update_flag_status RPC
5. **State Handling:** Proper success/error states with user feedback

Integrate with the flags data table for row click actions and ensure smooth user experience.
</task>

#### `;review` (Gemini 2.5 Pro Preview 06-05)
<task>
Review the flag detail dialog implementation. Evaluate:

1. **Information Clarity:** Is all necessary information clearly presented?
2. **Action Confidence:** Do admins have enough context to make good decisions?
3. **Workflow Efficiency:** Is the approve/reject process streamlined?
4. **Error Handling:** Are error states and feedback clear and helpful?

Ensure the dialog provides an excellent admin experience for flag resolution.
</task>

### Task 8: Realtime Notifications

#### `;arch` (o3)
<task>
Design the architecture for realtime flag notifications. Analyze:

1. **Subscription Strategy:** How to efficiently subscribe to data_quality_flags table changes
2. **Notification Scope:** Ensuring notifications only reach appropriate admin users
3. **Connection Management:** Handling realtime connection states and reconnection
4. **Performance Impact:** Resource usage of realtime subscriptions

Design a robust, efficient approach for realtime admin notifications.
</task>

#### `;security` (o3)
<task>
Secure the realtime notification system. Validate:

1. **Subscription Security:** Ensure only admin users can subscribe to flag updates
2. **Data Filtering:** Verify notifications are properly scoped by organization_id
3. **Connection Security:** Secure handling of Supabase Realtime connections
4. **Information Exposure:** What flag data is safe to include in notifications

Ensure notifications maintain proper security boundaries while providing useful information.
</task>

#### `;code` (Claude 4 Sonnet)
<task>
Implement realtime notifications for new flags. Create:

1. **Realtime Subscription:** Subscribe to data_quality_flags table changes via Supabase Realtime
2. **Toast Notifications:** Show toast notifications for new flags
3. **Badge Indicators:** Add notification badge in admin sidebar for unread flags
4. **Role Filtering:** Ensure notifications only show for admin users
5. **Connection Handling:** Proper connection state management and reconnection

Follow existing notification patterns in the app and ensure reliability.
</task>

#### `;review` (Gemini 2.5 Pro Preview 06-05)
<task>
Review the realtime notification implementation. Assess:

1. **User Experience:** Are notifications helpful without being intrusive?
2. **Visual Integration:** Do badges and indicators fit well with existing UI?
3. **Timing and Relevance:** Are notifications timely and actionable?
4. **Performance Impact:** Do realtime features maintain app responsiveness?

Ensure notifications enhance admin productivity without creating UI clutter.
</task>

### Task 9: Fix Remaining Unit Tests

#### `;test` (Claude 4 Sonnet)
<task>
Fix the 13 failing unit tests for the flagging system. Address:

1. **FlaggingProvider Tests:** Resolve 3 failing tests, likely related to mock setup or component behavior
2. **FlaggingTrigger Tests:** Fix 10 failing tests, focusing on expectation alignment
3. **Mock Configuration:** Ensure proper mocking of Supabase, TanStack Query, and UI components
4. **Test Intent Preservation:** Maintain the original intent of each test while fixing failures

Follow patterns from previously fixed tests and aim for 100% test pass rate.
</task>

#### `;review` (Gemini 2.5 Pro Preview 06-05)
<task>
Review the unit test fixes for quality and coverage. Evaluate:

1. **Test Quality:** Are the fixes maintaining good testing practices?
2. **Coverage Validation:** Do tests adequately cover the flagging system functionality?
3. **Test Maintainability:** Are tests structured for easy future maintenance?
4. **CI Integration:** Will these tests provide reliable CI/CD validation?

Ensure the test suite provides confidence in the flagging system's reliability.
</task>

### Task 10: Resolve Playwright Config

#### `;deploy` (Claude 4 Sonnet)
<task>
Fix the Playwright E2E test configuration issues. Resolve:

1. **Dependency Conflicts:** Fix duplicate @playwright/test dependency in package.json
2. **Configuration Problems:** Ensure Playwright config is properly set up for Next.js
3. **Spec Discovery:** Verify E2E test specs are properly configured and discoverable
4. **Project Integration:** Follow Next.js and Playwright best practices

Ensure the E2E test infrastructure is ready for comprehensive flagging system testing.
</task>

#### `;test` (Claude 4 Sonnet)
<task>
Validate the Playwright E2E test setup and create comprehensive flagging tests. Create:

1. **Basic Test Validation:** Ensure the existing e2e/flagging-system.spec.ts runs successfully
2. **End-to-End Scenarios:** Test complete user workflows (flag creation, admin review, resolution)
3. **Cross-Browser Testing:** Ensure tests work across different browser environments
4. **Test Reliability:** Implement proper waits and assertions for stable test execution

Build a robust E2E test suite that validates the complete flagging system workflow.
</task>

---

## POST-COMPLETION SYSTEM REVIEW

### Final System Validation Workflow: `;arch` → `;security` → `;perf` → `;test` → `;deploy`

#### `;arch` (o3) - End-to-End Architecture Review
<task>
Conduct a comprehensive architecture review of the completed flagging system. Analyze:

1. **System Integration:** How well do all components (database, backend RPCs, UI components, admin dashboard) work together?
2. **Data Flow Validation:** Is the flag lifecycle (creation → review → resolution) properly architected?
3. **Scalability Assessment:** Will the system handle growth in users, flags, and data volume?
4. **Architectural Consistency:** Are design patterns consistent across all components?
5. **Future Evolution:** How well positioned is the system for future enhancements (AI moderation, analytics, etc.)?

Identify any architectural gaps or inconsistencies that need addressing before production.
</task>

#### `;security` (o3) - Complete Security Audit
<task>
Perform a comprehensive security audit of the entire flagging system. Validate:

1. **Multi-Tenant Security:** Is organization_id scoping properly enforced throughout the system?
2. **Role-Based Access:** Are admin functions properly protected from unauthorized access?
3. **Data Protection:** Is sensitive information (user data, flag details) properly secured?
4. **Input Validation:** Are all user inputs properly validated and sanitized?
5. **Audit Trail:** Is there sufficient logging for accountability and compliance?
6. **Attack Surface:** What are the potential security vulnerabilities and how are they mitigated?

Ensure the system meets production security standards for a multi-tenant SaaS platform.
</task>

#### `;perf` (o3) - Performance Analysis
<task>
Analyze the performance characteristics of the complete flagging system. Evaluate:

1. **Database Performance:** How do the RPCs perform under load? Are indexes optimized?
2. **UI Responsiveness:** Does the flagging interface remain responsive with multiple triggers per page?
3. **Real-time Performance:** What's the impact of Supabase Realtime subscriptions on system resources?
4. **Scale Testing:** How does the system perform with 1000+ flags and 100+ concurrent users?
5. **Memory Usage:** Are there any memory leaks or excessive resource consumption?
6. **Network Efficiency:** Are API calls and data transfers optimized?

Provide recommendations for any performance optimizations needed for production.
</task>

#### `;test` (Claude 4 Sonnet) - Comprehensive Testing Strategy
<task>
Validate the complete testing strategy for the flagging system. Ensure:

1. **Test Coverage:** Is there adequate unit, integration, and E2E test coverage?
2. **Critical Path Testing:** Are all important user workflows properly tested?
3. **Edge Case Coverage:** Are error conditions and edge cases adequately tested?
4. **CI/CD Integration:** Do tests run reliably in the continuous integration pipeline?
5. **Test Maintainability:** Are tests structured for easy maintenance as the system evolves?
6. **Performance Testing:** Are there tests for performance and load scenarios?

Ensure the test suite provides confidence for production deployment and ongoing development.
</task>

#### `;deploy` (Claude 4 Sonnet) - Production Deployment Readiness
<task>
Assess production deployment readiness for the flagging system. Validate:

1. **Deployment Strategy:** Is there a clear, safe deployment plan for the flagging system?
2. **Environment Configuration:** Are all environment variables and configs properly set?
3. **Database Migrations:** Are all migrations tested and ready for production deployment?
4. **Monitoring Setup:** Is there adequate monitoring and alerting for the flagging system?
5. **Rollback Plan:** Is there a clear rollback strategy if issues arise?
6. **Documentation:** Is deployment and operational documentation complete?
7. **Feature Flags:** Should any features be behind feature flags for gradual rollout?

Ensure the system is ready for safe, successful production deployment.
</task>

---

## EXECUTION PROMPTS & CHAT MANAGEMENT

### When to Start a New Chat

**Continue Current Chat For:**
- Tasks 1-4 (Provider integration and UI integration) - These depend heavily on the existing context and component understanding
- Task 9 (Fix remaining unit tests) - Requires context of previous test fixes and patterns

**Start New Chat For:**
- Task 5+ (Admin dashboard features) - These are separate features that don't require deep context of the flagging components
- Task 10 (Playwright config) - Standalone configuration issue

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

---

**Note:**
- All database migrations and schema changes must be created as SQL files and saved in the `supabase/migrations/` directory, following the existing project convention.
- All type generation, RPC calls, and real-time features should use the Supabase MCP server, not the CLI.
- If future requirements involve advanced analytics, reporting, or AI-driven moderation, consider leveraging additional MCP servers (such as analytics or AI/ML MCPs) for those features. For now, the Supabase MCP server is the best fit for all core flagging system needs.