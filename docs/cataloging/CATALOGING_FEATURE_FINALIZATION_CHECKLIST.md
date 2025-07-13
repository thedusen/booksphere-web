# Cataloging Feature Finalization Checklist

This document provides a step-by-step plan to close all remaining gaps for the Booksphere cataloging handoff feature, ensuring full compliance with the original implementation plan and production-readiness standards.

---

## 1. Raise Test Coverage to ≥ 80%

**Agent(s):**
- `;test` (Test-Driven Development Coach)
- `;code` (Senior Full-Stack Developer) – for any stubs required

**Prompt for `;test`:**
```text
;test
We need to raise JS/TS statement coverage from 22 % to ≥ 80 %.
Scope only `src/**` (exclude storybook, mocks, etc.).
1. Identify uncovered critical paths (services, hooks, ReviewWizard).
2. Generate Vitest suites (unit & integration) covering:
   • happy path, edge cases, error handling
   • optimistic updates & cache invalidation in useCatalogJobs
   • reconnection logic once implemented (see TODO)
3. Provide Playwright E2E additions for:
   • full cataloging workflow (scan → review → finalize)
   • dashboard bulk delete/retry actions
Return runnable code snippets + instructions to place them under `src/**/__tests__` or `e2e/`.
```

---

## 2. Eliminate Remaining `any` Types

**Agent:**
- `;code` (Senior Full-Stack Developer)

**Prompt:**
```text
;code
Search for explicit `any` usages in the codebase (grep already lists ~14).
Refactor each occurrence to strict types using generated Supabase types or dedicated interfaces.
Pay particular attention to:
• cataloging-services.ts (Edition match mapping & confidence scoring)
• useCatalogJobs / useInventory hooks
Update function generics where needed and add type guards.
Deliver a series of file edits with minimal churn and passing existing test suite.
```

---

## 3. Implement Reconnect / Back-Pressure Logic in `useRealtimeNotifications`

**Agent(s):**
- `;perf` (Performance Engineer) – design & metrics
- `;code` – implementation

**Prompt for `;perf`:**
```text
;perf
Assess useRealtimeNotifications.tsx for subscription resilience under:
• 5 × reconnects/minute
• 100 concurrent dashboard users/org
Design an exponential-back-off reconnect strategy and buffer flush mechanism.
Provide “Scale Impact” analysis (baseline vs 10× load) and advise on memory limits.
```

**Follow-up prompt for `;code`:**
```text
;code
Implement the reconnect & buffer strategy defined in the preceding ;perf analysis.
Add unit tests (Vitest) and integration test cases to the existing hook test suite.
Ensure no race conditions with TanStack Query cache updates.
```

---

## 4. Resolve Intermittent Playwright Build Error

**Agent:**
- `;test`

**Prompt:**
```text
;test
A previous Playwright run logged a Next.js Turbopack build error (see error-context.md).
1. Diagnose root cause (likely missing dependency in globals.css import chain).
2. Patch configuration or code.
3. Re-run the cataloging E2E suite and attach a clean report artefact.
Provide the fix as code edits plus CI step verification.
```

---

## 5. Automated Accessibility Audit & Fixes

**Agent(s):**
- `;ux` (UI/UX & Accessibility Expert)
- `;code` – if remediations needed

**Prompt for `;ux`:**
```text
;ux
Run an automated axe-core and keyboard-navigation audit on:
• CatalogingDashboard pages
• ReviewWizard flow
List all WCAG 2.1 AA violations with severity.
Recommend aria-label / colour-contrast / focus-ring fixes.
Ignore backend aspects.
```

**If issues are found, follow with a `;code` prompt to apply the remediation.**

---

## 6. Final Validation Gate Before Deploy

**Agent(s):**
- `;arch` (System Architect) – confirmation
- `;deploy` (DevOps/Infrastructure Engineer)

**Prompt for `;arch`:**
```text
;arch
Confirm that the cataloging feature now satisfies:
• architectural principles (CQRS, outbox, strict typing)
• performance SLAs (<100 ms filtered query, <1 s notification)
• security & multi-tenancy invariants
Provide a PASS/FAIL summary and any residual architectural debt.
```

**Prompt for `;deploy`:**
```text
;deploy
Prepare production rollout checklist:
1. Zero-downtime migration plan confirmation
2. Rollback & DB snapshot strategy
3. Health-check endpoints & monitoring dashboards URLs
4. Post-deploy smoke tests (Playwright)
Return an “Operational Risk: Low/Med/High” rating with sign-off steps.
```

---

# Guidance: When to Start a New Chat for Context Preservation

**Start a new chat when:**
- Switching between major task groups above (e.g., from test coverage to accessibility)
- Changing agent persona (e.g., from `;test` to `;ux` or `;arch`)
- The current chat context exceeds 50–100 messages or covers multiple unrelated issues
- You need a "fresh perspective" for a final review or sign-off
- After a major refactor or large batch of code changes

**Continue in the same chat when:**
- Iterating on a single, focused task (e.g., test coverage improvements)
- Following up on a previous agent’s output with a related implementation (`;perf` → `;code`)
- Debugging a single issue through multiple steps

**Tip:**
For best output quality, always paste the relevant context (e.g., this checklist section and any recent diffs) into the new chat when starting a new agent session. 