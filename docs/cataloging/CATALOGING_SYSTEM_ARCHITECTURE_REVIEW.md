# Cataloging System Architecture Review

> Objective: Provide a high-level architectural critique of the proposed **Cataloging Handoff System** with a clear "Complexity vs. Benefit" assessment for each major decision. Implementation details and code style are intentionally out of scope.

---

## 1. Architecture Patterns

| Decision | Observed Pattern | Strengths | Risks / Weaknesses | Complexity | Benefit |
| --- | --- | --- | --- | :---: | :---: |
| Event-driven pipeline (Outbox → Edge Function → Buildship) | Asynchronous, message-oriented integration | • Decouples capture & processing<br/>• Natural fault tolerance & back-pressure | • Distributed traceability can be harder<br/>• Requires robust retry & idempotency | Med-High | High |
| CQRS for Review UI | Separate read model for dashboard + command handlers | • Tailored read performance<br/>• Simplifies UI queries | • Dual data models introduce overhead<br/>• Eventual consistency adds cognitive load | High | High |
| Supabase Edge Functions as bounded context | Serverless, stateless services per domain slice | • Fine-grained scaling<br/>• Simple deployment | • Cold-start latency for bursty workloads<br/>• Tight coupling to Supabase runtime | Low | Medium |
| Strict RLS & organization scoping | Security boundary at data layer | • Defense-in-depth for multi-tenancy | • Schema migrations must always respect policies | Low | High |
| TanStack Query w/ Realtime sync | Client-side cache & live updates | • Smooth UX, offline support | • Cache invalidation complexity<br/>• Potential over-subscription costs | Medium | High |

## 2. Data Flow & Consistency

1. **Capture → Job Table (mobile/Web)**: Synchronous write; immediate durability under RLS.
2. **Outbox Trigger → Edge Function → Buildship**: Asynchronous, guaranteeing at-least-once delivery. Requires idempotent AI processing to avoid duplicate entries.
3. **AI writes extracted_data back to job**: Eventual consistency; UI must tolerate *processing* state.
4. **Realtime Subscriptions**: Push job status changes to dashboard; cache is reconciled via TanStack Query.
5. **Finalize RPC**: Transactional creation of `stock_item` + job status transition; enforces consistency boundary.

### Consistency Pattern Assessment

* **Write Path**: Strong consistency within a single Postgres transaction.
* **Read Path**: Eventually consistent between job table and materialized read models.
* **Trade-off**: Enables horizontal scalability of reads at the cost of temporarily divergent views (acceptable for back-office workflows).

## 3. Scalability & Evolution

| Growth Vector | Current Strategy | Evolution Path | Complexity | Benefit |
| --- | --- | --- | :---: | :---: |
| Job volume (10×) | Partitioned indexes on `cataloging_jobs`; JSONB GIN indexes | Add time-based partitioning or logical shards | Med | High |
| AI throughput | Stateless Edge Functions; Buildship auto-scales | Introduce task queue & worker pool for cost control | Med | Med-High |
| UI concurrency | Client-side caching + pagination | Adopt server-side streaming or WebSockets for high-frequency updates | Low-Med | Med |
| New capture sources (e.g., bulk CSV) | Clear service boundaries allow additional source_type events | Add dedicated ingest service publishing to same outbox channel | Low | High |
| Reporting & analytics | Read-optimized models, pg
db views | Offload to data warehouse (e.g., ClickHouse) via CDC | High | High |

## 4. Complexity vs. Benefit Summary

| Category | Overall Complexity | Overall Benefit | Verdict |
| --- | :---: | :---: | --- |
| Architecture Patterns | **Medium-High** | **High** | Justified – supports long-term flexibility.
| Data Flow / Consistency | **Medium** | **High** | Eventual consistency is acceptable given review workflow.
| Scalability Provisions | **Medium** | **High** | Path to 10× scale is clear with incremental changes.

> **Recommendation:** Proceed with the proposed patterns while prioritizing **observability** (tracing, metric correlation) and **idempotency safeguards** to tame distributed complexity. Document retry policies and state diagrams early to aid future onboarding and maintenance. 