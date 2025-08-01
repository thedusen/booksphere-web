### Task 5: Review Wizard – Architectural Update Plan

**AI Persona:** Principal Software Architect (o3)

**Purpose:** Provide an architecture-level roadmap for incorporating the domain recommendations from `TASK_5_BOOK_DOMAIN_VALIDATION.md` into the existing Booksphere Cataloging Handoff System, while safeguarding scalability, data integrity, and long-term maintainability.

---

## 1. Context Recap
* **Validated Recommendations (High Priority UI Gaps):** Illustrator input, Publisher Location, Book Format selection, Pagination text, Comprehensive Attribute picker, Edition-matching suggestions.
* **System Strengths to Preserve:** Mature EAV attribute model, existing RPCs (`match_book_by_details`, `add_edition_to_inventory`), strict multi-tenancy, typed React Query data layer.

## 2. Architecture Patterns – Impact & Alignment
| Recommendation | Existing Boundary | Required Change | Coupling / Cohesion Notes |
|----------------|------------------|-----------------|--------------------------|
| Expose 53-attribute EAV picker | Database → `Cataloging API` → Web UI | **None on DB or API.** Add *Attribute Service* façade in Web to encapsulate attribute retrieval & caching. | Keeps DB/API untouched; UI coupled only to façade, improving cohesion in presentation layer. |
| Illustrator Input via `edition_contributors` | Cataloging API already supports contributors. | Extend *Cataloging Hook* layer to surface contributors sub-resource. | No new service; reuse existing RPC. Low coupling. |
| Publisher Location via `places` | Places data already exposed through API. | Introduce *Location Autocomplete Service* in Web, leveraging shared cache. | Decouples heavy lookup logic from wizard steps. |
| Book Format via `item_types` | Data already exposed. | Add lightweight *Format Service* that memoises lookup. | Maintains separation of concerns. |
| Pagination Field (`pagination_text_ol`) | Editions resource. | No service change. Bind field directly in Step 2 component. | Simple passthrough. |
| Edition Matching Suggestions | `match_book_by_details` RPC | Add *Edition-Match Service* to orchestrate RPC call, debounce, and ranking logic. | Keeps wizard thin; isolates matching strategy for future ML upgrades. |

## 3. Data-Flow & Consistency Strategy
1. **Single Source of Truth:** Continue funnelling all create/update operations through existing RPCs. No direct table writes from UI.
2. **Client-Side Caches:**
   • Attribute, Format, and Location datasets are *slow-moving artefacts*. Cache in React Query with 24h staleTime to minimise traffic.
   • Edition-Match results cached per ISBN/title input to avoid duplicate calls during editing session.
3. **Draft State Management:** Review wizard already uses auto-save draft via TanStack Mutation every 5s. Extend payload to include new fields—ensure *partial updates* to avoid race conditions.
4. **Optimistic vs. Pessimistic:**
   • For attribute toggles and contributor additions, **optimistic UI** is safe (low conflict risk).
   • For Edition matching, **pessimistic confirmation** required – always verify server suggestion before final commit.
5. **Realtime Sync:** No change; existing Realtime channel continues to broadcast job updates. New attribute data fits into existing payload schema.

## 4. Scalability & Evolution Analysis
| Area | Current Capacity | Impact of Change | Headroom After Change | Complexity ↔ Benefit |
|------|------------------|------------------|-----------------------|---------------------|
| Attribute Retrieval | O(1) lookup via indexed table | Slight increase in initial payload size | 10× current attribute count safe with caching | **Low C / High B** – minimal work unlocks rich metadata. |
| Edition-Match RPC | ≤50 calls/hr/org | Could spike while typing | Mitigate via debounced service + result caching | **Medium C / High B** – avoids duplicate editions & data silo. |
| Contributor & Location Autocomplete | Limited rows (<100k) | Adds additional read traffic | Scales horizontally; CDN cache possible | **Low-Medium C / Medium B**. |
| Wizard Draft Size | Avg 15 KB JSON | +5-10 KB with attributes | Within Supabase row limits | **Low C / High B**. |

> **Key Take-away:** Recommendations introduce negligible load on DB/Network when paired with intelligent client caching; benefits to data quality justify added complexity.

## 5. Risk & Breaking-Change Assessment
| Recommendation | Breaking Change Risk | Mitigation |
|----------------|---------------------|------------|
| Attribute Picker | None at API level; UI overhaul may overwhelm users | Progressive disclosure UI (search + categories). |
| Illustrator Field | Existing schema supports; risk of duplicate contributor rows | Enforce uniqueness in UI before RPC commit. |
| Edition Matching | False-positive matches could mis-link inventory | Provide clear *override* option & show confidence score. |
| Pagination Text | Free-text field; risk of inconsistent formats | Add client-side mask/validation helper but **do NOT** enforce strict pattern to maintain legacy data compatibility. |

## 6. Implementation Roadmap for Coding Agent
1. **Service Façades (Frontend Only)**
   - AttributeService
   - LocationService
   - FormatService
   - EditionMatchService
2. **React Query Hook Extensions**
   - Extend existing `useCatalogJob` mutations to include new fields.
   - Add hooks: `useAttributes()`, `useBookFormats()`, `usePublishPlaces()`.
3. **Wizard Step Updates**
   - **Step 1 (Bibliographic):**
     * Add Illustrator input (auto-complete contributors).
     * Add Publisher Location (LocationService).
     * Trigger EditionMatchService after ISBN/Title change.
   - **Step 2 (Physical Details):**
     * Add Book Format dropdown.
     * Add Pagination text field.
   - **Step 3 (Attributes):**
     * Replace current checkboxes with Attribute Picker (multi-select grouped by category).
4. **Draft & Finalization Flow**
   - Update draft schema & zod validation to include new props.
   - Ensure `add_edition_to_inventory()` RPC receives merged attributes & contributors.
5. **Performance Safeguards**
   - Debounce edition-match calls (500 ms).
   - Use React Query staleTime for static datasets.
6. **Testing & Monitoring**
   - Unit tests for new services (mocked Supabase).
   - E2E test: *scan → review → finalize* path with Illustrator & attributes.
   - Add metric: edition-match RPC call rate per org.

## 7. Areas Where Recommendations May Be Inappropriate
* **Complete Attribute Exposure in One Screen** – Could overwhelm novice users. Consider *progressive disclosure* or *smart defaults*.
* **Publisher Location Autocomplete** – If network latency high, may degrade UX; fallback to free-text allowed.
* **Edition Matching Confidence** – In edge cases (e.g., rare variants), auto-match may mislead; ensure easy bypass.

---

### Conclusion
Integrating the domain recommendations primarily affects the **presentation layer** and **client-side orchestration services**. Core database schema and RPC contracts remain stable, preserving backward compatibility while significantly enhancing data richness and cataloging accuracy.

Following this roadmap will deliver the benefits with controlled complexity and minimal risk of breaking existing workflows. 

### 6A. Consolidated Task Checklist – Architecture × UI/UX

> **Goal:** Provide the coding agent with one definitive, step-by-step list that merges architectural, service-layer, and UI/UX requirements. Follow this order unless parallelisation is explicitly noted.

| # | Work Item | Owner Layer | Blocking Dependencies | Complexity ↔ Benefit |
|---|-----------|-------------|-----------------------|----------------------|
| **1** | **Scaffold Frontend Service Façades**<br/>Create `AttributeService`, `LocationService`, `FormatService`, `EditionMatchService` with React Query caches (24h `staleTime`). | Frontend (TypeScript) | None | Low C / High B |
| **2** | **Extend React Query Hooks**<br/>`useCatalogJobDraft()` accepts new fields (illustrators, location_id / free-text, format_id, pagination_text, attributes[]). | Frontend Hooks | 1 | Medium C / High B |
| **3** | **Wizard – Step 1 Updates**<br/>a) Add **Combobox** for Illustrator (contributors).<br/>b) Add **Combobox** for Publisher Location.<br/>c) On valid ISBN+Title → call `EditionMatchService` (500 ms debounce). | UI (Step 1) | 1,2 | Medium C / High B |
| **4** | **Wizard – Edition Match Dialog**<br/>Render results via **Dialog** + `Card` components with confidence `Badge`s.<br/>Provide "Create New Edition" override. | UI | 3 | Medium C / High B |
| **5** | **Wizard – Step 2 Updates**<br/>a) **Select** for Book Format (from `FormatService`).<br/>b) **Input** for Pagination (`pagination_text_ol`). | UI (Step 2) | 1,2 | Low C / Medium B |
| **6** | **Wizard – Step 3 Attribute Picker**<br/>Implement Progressive-Disclosure **Command Picker** inside `Popover` (desktop) or `Sheet` (mobile). Selected attributes shown as `Badge`s. | UI (Step 3) | 1 | High C / High B |
| **7** | **Stateful UI**<br/>Add Skeletons, Error Alerts, and Empty states for every async component (services above). | UI / UX | 1-6 (parallel) | Low C / High B |
| **8** | **Accessibility Hardening**<br/>Keyboard nav, focus trapping in Dialog/Sheet, `aria-live` for dynamic lists, colour-contrast audit. | UI / UX | 3-6 | Medium C / High B |
| **9** | **Draft Persistence & Validation**<br/>Update Zod schema, extend auto-save payload, ensure partial updates. | Hooks / Backend RPC | 2 | Medium C / Medium B |
| **10** | **Finalisation Flow Update**<br/>Ensure merged attributes + contributors reach `add_edition_to_inventory()`.<br/>Add pessimistic confirmation before commit. | API Integration | 9 | Medium C / High B |
| **11** | **Performance Safeguards**<br/>Debounce edition-match; memoise slow-moving datasets; verify draft size limits. | Frontend | 1-10 | Low C / Medium B |
| **12** | **Testing** (parallelisable)<br/>• Unit tests for services & hooks (MSW).<br/>• Component tests for Combobox, Attribute Picker.<br/>• E2E: scan → review → finalise path inc. offline mode. | QA | 1-10 | High C / High B |

#### Parallelisation Notes
* Items **1 & 2** may proceed in parallel if different engineers own them.
* UI steps (**3-6**) follow sequentially per wizard flow but can be parallelised per step by feature branches.
* Accessibility (**8**) and Performance (**11**) hardening begin once corresponding UI step is functional.

#### Acceptance Criteria (Definition of Done)
1. **Functional UI**: All wizard steps render with data from services and support create/edit flows.
2. **Data Integrity**: Submitted payloads verified via integration test reach `add_edition_to_inventory()` without loss.
3. **A11y**: Axe-core scan passes with zero critical issues; keyboard navigation end-to-end.
4. **Performance**: Edition-match RPC ≤ 3 calls per ISBN edit; first wizard paint ≤ 1 s on 3G network.
5. **Test Coverage**: >80 % for new code; E2E happy-path passes CI.

---

*This checklist supersedes separate architecture and UI/UX docs for Task 5; the coding agent should treat this section as the single source of truth.* 