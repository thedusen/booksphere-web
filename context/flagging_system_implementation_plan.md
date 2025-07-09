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

*   **Database as Source of Truth:** All code will align strictly with the database schema (e.g., using `severity` and `field_name`). All core types will be generated directly from the Supabase schema to ensure consistency.
*   **Secure & Centralized Logic:** All data mutations and complex queries will be handled by Supabase RPCs (Remote Procedure Calls) to centralize business logic and enforce security rules like `organization_id` scoping.
*   **Validated & Sanitized Input:** All user-submitted data will be rigorously validated on both the client and server using Zod schemas.
*   **Performant by Design:** All lists of flags will be paginated. Database queries will be optimized, and appropriate indexes will be created.
*   **Proactive Admin Workflow:** The administrator dashboard will feature real-time notifications for new flags and will surface a full audit trail for accountability.
*   **Accessibility First:** All user-facing components (icons, forms, toasts) will be built to meet WCAG accessibility standards.
*   **Comprehensive Testing:** The entire feature will be validated with a full suite of unit, integration, and end-to-end (E2E) tests.

### Phase 1: Foundational Backend & Core Types

1.  **Schema Alignment & Type Generation:**
    *   Ensure the `data_quality_flags` table uses `severity` and `field_name`. Create a migration if any changes are needed.
    *   Configure and run `supabase gen types typescript` to generate `types.ts`, which will serve as our foundational type library.

2.  **Develop Supabase RPCs:**
    *   Create a `create_data_quality_flag` PostgreSQL function. This RPC will handle the insertion of a new flag, ensuring `flagged_by` and `organization_id` are set correctly from the session.
    *   Create an `update_flag_status` function for admins to resolve or reject flags.
    *   Create a `get_paginated_flags` function for the admin dashboard.

3.  **Centralize Custom Types & Validation:**
    *   Create `src/lib/types/flags.ts` for any custom types or enums not covered by Supabase generation (e.g., `FlagStatus` enum).
    *   Create `src/lib/validators/flags.ts` to define Zod schemas for validating flag creation form data.

### Phase 2: Core User-Facing Feature

1.  **Implement `useFlagging` Hook:**
    *   Create `src/hooks/useFlagging.ts`.
    *   This hook will be a lightweight wrapper around the new Supabase RPCs, using TanStack Query for server state management (`useQuery`, `useMutation`).

2.  **Build Flagging UI Components:**
    *   Create a reusable `FlaggingIcon` button component.
    *   Create the `FlaggingForm` component within a `Sheet` or `Dialog` from `shadcn/ui`.
    *   The form will use the Zod schemas for client-side validation.
    *   Ensure all components are keyboard-navigable and screen-reader friendly.

3.  **Develop Web `FlaggingProvider`:**
    *   Create `src/context/FlaggingContext.tsx`.
    *   This provider will manage UI state, call the `useFlagging` mutation, and display success/error notifications using the `shadcn/ui` `useToast` hook.

4.  **Integrate into App:**
    *   Wrap the main app layout with the `FlaggingProvider`.
    *   Place `FlaggingIcon` components next to relevant data fields in the inventory table and detail pages.

### Phase 3: Administrator Review Dashboard

1.  **Create Admin Page & Role Guarding:**
    *   Create the new route `src/app/(app)/admin/flags/page.tsx`.
    *   Implement role-based access control, checking the user's claims/role from the `AuthContext` to ensure only admins can view the page.

2.  **Build Flag Management Table:**
    *   Use the `get_paginated_flags` RPC to fetch and display flags in a `shadcn/ui` data table.
    *   Implement server-side pagination, filtering, and sorting controls.

3.  **Develop Review & Resolution UI:**
    *   Create a detail view (e.g., in a dialog or separate page) for a single flag.
    *   This UI will display all flag details, including the audit trail (`flagged_by`, `created_at`, `reviewed_by`, etc.).
    *   Provide admin controls to call the `update_flag_status` RPC to resolve or reject the flag.

4.  **Implement Notification System:**
    *   Use Supabase Realtime to listen for new rows in the `data_quality_flags` table.
    *   When a new flag appears, display a real-time toast or a notification indicator in the admin sidebar.

### Phase 4: Quality Assurance

1.  **Write Unit & Integration Tests:**
    *   Write unit tests for validators and utility functions.
    *   Write integration tests for the `useFlagging` hook to ensure it correctly interacts with the Supabase RPCs.
2.  **Write End-to-End Tests:**
    *   Use a framework like Playwright or Cypress to create E2E tests for the full user workflow:
        *   A user successfully flags an item.
        *   An admin sees the flag, reviews it, and resolves it.
