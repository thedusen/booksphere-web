# TASK 6: Final Implementation & Validation Plan

This document outlines the expert-driven workflow for completing the remaining tasks for the Booksphere Cataloging Handoff System. Each step leverages a specialized AI expert persona to ensure the highest quality, security, and performance, following the guidelines in the [Cursor AI Expert Personas Guide](./../cursor_persona_workflows_guide.md).

---

## Task 7: Real-Time Application Logic Implementation

**Goal**: Implement the Edge Function and frontend components to process outbox events and deliver real-time notifications to the user.

### 7.1: Edge Function - Notification Processor

This function will poll the `cataloging_event_outbox` table and broadcast events to Supabase Realtime channels.

#### **Step 1: Architecture & Design**
*   **Agent**: `;arch` (System Architect - o3)
*   **Prompt**:
    ```
    Design the Supabase Edge Function named 'notification-processor'. The function must:
    1.  Use the 'get_or_create_processor_cursor' function to manage its state for a given organization.
    2.  Poll the 'cataloging_event_outbox' table for new events since the last processed event ID.
    3.  Implement a batching mechanism to process up to 100 events per invocation.
    4.  Broadcast the event payloads to a per-organization Realtime channel (e.g., 'notifications:org_id').
    5.  Include logic to handle retries on failure and update the 'delivery_attempts' and 'last_error' fields.
    6.  Update the cursor using 'update_processor_cursor' upon successful processing of a batch.
    7.  Define a clear strategy for handling function timeouts and ensuring at-least-once processing semantics.
    ```

#### **Step 2: Security Review**
*   **Agent**: `;security` (API Security Specialist - o3)
*   **Prompt**:
    ```
    Review the proposed Edge Function design. Focus on:
    1.  Validating that the function correctly uses RLS by setting the 'app.current_org_id' and 'app.current_processor' context variables for database calls.
    2.  Ensuring no sensitive data is leaked in the broadcasted event payload. The payload should only contain identifiers and non-sensitive data.
    3.  Preventing denial-of-service attacks. Can a flood of events in one organization's outbox impact others? Propose rate-limiting or isolation strategies.
    4.  Analyzing potential race conditions between multiple running instances of the processor for the same organization.
    ```

#### **Step 3: Implementation**
*   **Agent**: `You are a world-class senior full-stack developer...` (Senior Full-Stack Developer - Claude 4 Sonnet)
*   **Prompt**:
    ```
    Implement the 'notification-processor' Supabase Edge Function in TypeScript.
    - Incorporate all feedback from the ';arch' and ';security' reviews.
    - Use the Supabase client to call the database functions ('get_or_create_processor_cursor', etc.).
    - Structure the code for clarity, maintainability, and include comprehensive logging.
    - Provide complete, production-ready code with JSDoc comments.
    ```

#### **Step 4: Code Review**
*   **Agent**: `;review` (Code Review Expert - Gemini 2.5 Pro Preview 06-05)
*   **Prompt**:
    ```
    Review the implemented 'notification-processor' Edge Function.
    1.  Verify its completeness against the architectural design.
    2.  Check for logical errors, particularly in the polling, batching, and cursor update logic.
    3.  Ensure error handling is robust and that the function can recover from transient failures.
    4.  Confirm the implementation accurately reflects the security recommendations.
    ```

### 7.2: Frontend - Real-Time Subscription & UI

This involves updating the web application to connect to the Realtime service and display notifications.

#### **Step 1: UX Design**
*   **Agent**: `;ux` (UI/UX & Accessibility Expert - Gemini 2.5 Pro Preview 06-05)
*   **Prompt**:
    ```
    Design the user experience for real-time notifications in the Cataloging Dashboard.
    1.  Specify the content and actions for a notification toast (e.g., "Job #123 completed. [View Details]").
    2.  Design a non-intrusive badge or status indicator on the dashboard that updates in real-time.
    3.  Propose a client-side aggregation or debouncing strategy to prevent "notification fatigue" when a user performs a bulk action that generates many events.
    4.  Ensure the notification design is accessible (WCAG 2.1 AA).
    ```

#### **Step 2: Implementation**
*   **Agent**: `You are a world-class senior full-stack developer...` (Senior Full-Stack Developer - Claude 4 Sonnet)
*   **Prompt**:
    ```
    Implement the frontend components for real-time notifications.
    1.  Create a new React hook, 'useRealtimeNotifications', that subscribes to the organization-specific Supabase Realtime channel.
    2.  This hook should listen for incoming events and use TanStack Query's 'queryClient.invalidateQueries' to refresh the cataloging jobs list.
    3.  Integrate a toast notification system (e.g., 'react-hot-toast') to display actionable alerts based on the UX design.
    4.  Implement the real-time status badges on the dashboard UI.
    5.  Ensure proper cleanup of the Realtime subscription when components unmount.
    ```

#### **Step 3: Final Review**
*   **Agent**: `;review` (Code Review Expert - Gemini 2.5 Pro Preview 06-05)
*   **Prompt**:
    ```
    Review the frontend implementation for real-time notifications.
    - Does it correctly handle the subscription lifecycle?
    - Is the TanStack Query cache invalidation logic correct and efficient?
    - Is the UX for toasts and badges implemented as designed?
    - Are there any potential memory leaks or performance issues?
    ```

---

## Task 8: Production Hardening

**Goal**: Ensure the entire system is reliable, performant, and ready for production scale.

### 8.1: Comprehensive Error Handling

#### **Step 1: Architecture**
*   **Agent**: `;arch` (System Architect - o3)
*   **Prompt**:
    ```
    Design a comprehensive error handling and recovery strategy for the Cataloging system.
    1.  Define where to use React Error Boundaries in the component tree.
    2.  Specify a consistent pattern for catching, logging, and displaying errors from React Query's 'useQuery' and 'useMutation' hooks.
    3.  Propose a user-facing retry mechanism for failed network requests.
    4.  Outline a strategy for centralized error logging to an external service (e.g., Sentry, Logflare).
    ```

#### **Step 2: Implementation**
*   **Agent**: `You are a world-class senior full-stack developer...` (Senior Full-Stack Developer - Claude 4 Sonnet)
*   **Prompt**: `Implement the error handling strategy across the application, focusing on the Cataloging Dashboard and Review Wizard.`

### 8.2: UI Performance Optimization

#### **Step 1: Analysis**
*   **Agent**: `;perf` (Performance Engineer - o3)
*   **Prompt**:
    ```
    Analyze the Cataloging Dashboard for potential performance bottlenecks when displaying 1,000+ jobs.
    1.  Evaluate the trade-offs between pagination and virtual scrolling for the main data table.
    2.  Identify any expensive computations or re-renders in the table rows or filter components.
    3.  Recommend specific optimization techniques (e.g., 'React.memo', 'useMemo', 'useCallback') for key components.
    ```

#### **Step 2: Implementation**
*   **Agent**: `You are a world-class senior full-stack developer...` (Senior Full-Stack Developer - Claude 4 Sonnet)
*   **Prompt**: `Implement the recommended performance optimizations for the Cataloging Dashboard.`

---

## Task 9: Comprehensive Testing

**Goal**: Achieve high test coverage to ensure quality and prevent regressions.

### 9.1: Unit & Integration Tests
*   **Agent**: `;test` (Test-Driven Development Coach - Claude 4 Sonnet)
*   **Prompt**:
    ```
    Write comprehensive unit and integration tests for the notification system using Vitest and React Testing Library.
    1.  Create tests for the 'useRealtimeNotifications' hook, mocking the Supabase client.
    2.  Write tests for the management functions ('prune_delivered_events', 'migrate_failed_events_to_dlq') using pg_TAP.
    3.  Ensure tests cover all critical business logic, edge cases, and error states.
    ```

### 9.2: End-to-End (E2E) Tests
*   **Agent**: `;test` (Test-Driven Development Coach - Claude 4 Sonnet)
*   **Prompt**:
    ```
    Write an E2E test script for the complete cataloging workflow using Playwright. The test should:
    1.  Log in as a test user.
    2.  Create a new cataloging job.
    3.  Wait for the job to be processed (by polling the database or checking the UI).
    4.  Navigate to the job's review wizard and finalize it.
    5.  Assert that a real-time notification (e.g., a toast) appears, confirming finalization.
    ```

### 9.3: Load Testing
*   **Agent**: `;perf` (Performance Engineer - o3)
*   **Prompt**:
    ```
    Design a load test scenario for the real-time notification system.
    1.  Define a script to simulate 100 users performing bulk updates on cataloging jobs, generating 1,000 events per minute.
    2.  Specify the key metrics to measure: p95 event delivery latency (from DB insert to client receive), Edge Function invocation duration, and database query performance for the 'outbox_health_metrics' view under load.
    ```
*   **Agent**: `;deploy` (DevOps/Infrastructure Engineer - Claude 4 Sonnet)
*   **Prompt**: `Implement the designed load test using a tool like k6 or Artillery.`

---

## Task 10: Final System Validation & Deployment

**Goal**: Perform a final, holistic review of the system to ensure it meets all production requirements.

### 10.1: Full System Validation
This phase involves a sequential review by the top-tier experts to catch any remaining issues.

#### **Step 1: Architecture Validation**
*   **Agent**: `;arch` (System Architect - o3)
*   **Prompt**:
    ```
    Validate the complete, implemented cataloging system architecture.
    - Do the database, Edge Function, and frontend components work together cohesively?
    - Is the data flow from capture to notification optimal and resilient?
    - Will the architecture support 10x user growth?
    ```

#### **Step 2: Security Audit**
*   **Agent**: `;security` (API Security Specialist - o3)
*   **Prompt**:
    ```
    Perform a final, comprehensive security audit of the cataloging system.
    - Is multi-tenancy isolation bulletproof from the database to the real-time channels?
    - Are all inputs validated and all outputs sanitized?
    - Is the complete system protected against common web and cloud vulnerabilities?
    ```

#### **Step 3: Performance Validation**
*   **Agent**: `;perf` (Performance Engineer - o3)
*   **Prompt**:
    ```
    Validate the end-to-end performance of the system.
    - Review the results of the load tests.
    - Confirm that the system meets its performance SLAs (<100ms for API, <1s for notifications).
    - Identify the first component likely to fail under 10x load and propose a scaling plan.
    ```

### 10.2: Production Deployment
*   **Agent**: `;deploy` (DevOps/Infrastructure Engineer - Claude 4 Sonnet)
*   **Prompt**:
    ```
    Create the production deployment plan.
    1.  Finalize a production readiness checklist, confirming monitoring and alerting are configured for the outbox system.
    2.  Document the deployment steps for the Edge Functions and frontend application.
    3.  Create a rollback plan in case of deployment failure.
    ``` 