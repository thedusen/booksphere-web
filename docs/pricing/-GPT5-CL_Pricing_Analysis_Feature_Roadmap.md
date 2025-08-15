# Pricing Analysis Feature Roadmap - Agent-Driven Implementation

<meta>
  <version>AGENT-ENHANCED-FINAL</version>
  <status>PRODUCTION-READY</status>
  <last_updated>2025-01-15</last_updated>
  <purpose>Complete agent-driven implementation guide with copy-paste workflows for Booksphere pricing analysis feature</purpose>
</meta>

## Agent Context Document

**IMPORTANT**: This roadmap is designed for implementation using specialized AI agents through Claude Code or Cursor. Each phase includes:
- Executive business summary
- Human prerequisites checklist 
- Detailed step-by-step instructions
- Linear agent workflow prompts (copy-paste ready)
- Sequential thinking and iteration instructions

**Agent Reference Strategy**: 
- Primary context: This roadmap document
- Embedded context: Essential technical details included in each prompt
- Database integration: Existing Booksphere schema patterns must be followed
- Quality assurance: Each phase includes review and validation steps

## Executive Summary

The Pricing Analysis feature enables rapid, data-driven pricing decisions for book inventory through multi-source market intelligence. This roadmap provides a complete, actionable plan for implementing a production-grade pricing system that delivers sub-12-second recommendations with explainable evidence.

**Core Value Proposition**: Transform the 15-60 minute manual pricing research process into a <12 second automated analysis with confidence scores and market evidence.

**MVP Scope**: ISBN-based pricing using Amazon and eBay data with deterministic pricing engine and LLM explanations.

**Architecture Philosophy**: Platform-level service with tenant isolation, async orchestration, progressive results, and strict latency guarantees.

**Business Rules (From Domain Expert Analysis)**:
- Worth cataloging thresholds: median sold price ≥ $12, expected net margin ≥ $5, sell-through probability ≥ 60% within 90 days
- Default risk weights: 50% sell-through, 30% margin, 20% comparables recency/quality
- LLM budget: ~$0.01 per run soft cap with 2s timeout
- Idempotency window: 5 minutes for identical ISBN requests
- SLOs: ≥99% success rate, P95 ≤12s, provider timeout 3-5s, alert on >2% error rate
- Delivered price required for comps: use price + shipping for sold/listed items; use delivered price in all medians and ranges
- Comp hygiene: exclude lots/bundles, POD/facsimiles, international/teacher editions, book club editions when mismatched, and obvious condition mismatches
- Auction hygiene: favor BIN and multi-bid auctions; downweight single-bid/ultra-low-bid auctions; cap influence of outliers
- Seller quality: default exclude sellers with rating <95% or <50 feedback; allow tenant-configurable thresholds and whitelists
- Recency: use 90-day window by default; extend to 180 days with time-decay when samples are scarce
- Deduplication: collapse relists and identical multi-listings from the same seller; prevent a single seller from dominating comps
- Exception path: allow explicit bypass of worth-cataloging gates when flagged as antiquarian_candidate or for scarce ISBNs with thin comps

## Core Capabilities

<capabilities>
  <mvp>
    - ISBN-based quick price assessment (<12s P95)
    - Multi-source data aggregation (Amazon, eBay, ISBNdb)
    - Confidence-weighted recommendations with explainable rationale
    - Progressive results (first partial <3s)
    - Seller blocklists and quality filtering
    - Worth-cataloging recommendations
    - Detailed comparable analysis with provenance
  </mvp>
  <future>
    - Pre-ISBN book disambiguation (Phase 2)
    - Antiquarian marketplace integration (Phase 2)
    - Photo-based condition analysis (Phase 3)
    - Dynamic repricing automation (Phase 5)
    - Market trend analytics (Phase 6)
  </future>
</capabilities>

## Technical Architecture

### System Design Principles

1. **Service Boundaries**: Clear separation between orchestrator, connectors, pricing engine, and explainer
2. **Data Consistency**: Eventual consistency with immutable, versioned quotes
3. **Multi-Tenancy**: Platform-level service with tenant-scoped artifacts via RLS
4. **Resilience**: Graceful degradation, circuit breakers, quota management
5. **Observability**: Comprehensive metrics, tracing, and kill switches
6. **Quota-Aware Fan-Out**: Dynamic provider selection based on source registry availability
7. **Privacy Controls**: Global observations anonymized with competitive intelligence protection

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client UI                            │
│  (Quick Assessment)              (Detailed Analysis)         │
└────────────────┬────────────────────────┬───────────────────┘
                 │                        │
                 ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│               Pricing Orchestrator (Edge Function)           │
│  • Job lifecycle management                                  │
│  • Progressive update streaming                              │
│  • Cache management                                          │
│  • Timeout enforcement (15s hard cap)                        │
└────────┬───────────────┬───────────────┬────────────────────┘
         │               │               │
         ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Amazon     │ │     eBay     │ │   ISBNdb     │
│  Connector   │ │  Connector   │ │  Connector   │
│              │ │              │ │              │
│ • SP-API     │ │ • Finding    │ │ • Metadata   │
│ • Offers     │ │   API        │ │ • Pricing    │
│ • Pricing    │ │ • Sold comps │ │   (upgrade)  │
└──────────────┘ └──────────────┘ └──────────────┘
         │               │               │
         └───────────────┴───────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Deterministic Pricing Engine                    │
│  • Robust statistics (trimmed median, IQR)                   │
│  • Source reliability weighting                              │
│  • Condition/binding adjustments                             │
│  • Confidence scoring                                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    LLM Explainer (Gemini 2.5)                │
│  • Rationale generation (<2s budget)                         │
│  • Tie-break narratives                                      │
│  • Cached explanations                                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Persistence Layer (Supabase)              │
│  ┌─────────────────────────┬─────────────────────────────┐  │
│  │    Tenant-Scoped        │      Global Platform        │  │
│  │  • pricing_jobs          │  • market_pricing_data     │  │
│  │  • price_quotes          │    (edition-level)         │  │
│  │  • seller_blocklist      │  • sellers                 │  │
│  │                          │  • source_registry         │  │
│  └─────────────────────────┴─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Layered Caching Strategy (Critical Architecture Pattern)

<caching>
  <layer name="ISBN Base Cache">
    <key>isbn13 + global_params_hash</key>
    <ttl>6 hours (shortest provider refresh)</ttl>
    <staleness>Mark stale after 12 hours</staleness>
    <content>Core market data aggregated across providers</content>
  </layer>
  <layer name="Provider Overlay Cache">
    <key>isbn13 + provider_id + provider_params_hash</key>
    <ttl>Amazon: 6h, eBay: 24h, ISBNdb: 7d, FX: 24h</ttl>
    <staleness>Amazon: 12h, eBay: 48h, ISBNdb: 14d</staleness>
    <content>Provider-specific observations and metadata</content>
  </layer>
  <layer name="Quote Cache">
    <key>isbn13 + tenant_params_hash + filters_hash</key>
    <ttl>6 hours with confidence degradation over time</ttl>
    <staleness>Linear confidence reduction based on stalest source</staleness>
    <content>Final price quote with tenant-specific adjustments</content>
  </layer>
</caching>

**Cache Coherence Strategy**:
- Provider-level invalidation preserves layered structure
- Global observations anonymized beyond edition-level aggregates
- Cross-tenant sharing limited to aggregated statistics with N≥10 observations per edition

### Latency Guarantees & Progressive Update Mechanics

- **First Partial**: ≤ 3 seconds (fastest provider + basic computation)
- **P95 Cold Cache**: ≤ 12 seconds (all providers + LLM explanation)
- **Hard Timeout**: 15 seconds (return partial results with warnings)
- **Warm Cache**: < 1 second (cached quote retrieval)
- **Idempotency Window**: 5 minutes (reuse results for identical ISBN+params)

**Progressive Consistency Guarantees**:
- **Monotonic Improvement**: Later updates only add confidence/evidence, never contradict earlier price ranges
- **Source Attribution**: Each partial result clearly labeled with contributing sources
- **Confidence Bounds**: Explicit confidence scoring based on available vs. total expected sources
- **Freshness Indicators**: Timestamp and staleness warnings for all cached data

## Database Schema

### Database Schema Integration

**CRITICAL**: The pricing feature integrates with existing Booksphere tables. Analysis reveals:
- `organizations` table exists (id, name, amazon_refresh_token, ebay_refresh_token)
- `marketplaces` table exists (marketplace_id, name, code, api_endpoint)
- `market_pricing_data` table exists but needs pricing-specific enhancements
- `editions` and `stock_items` tables ready for integration
- Migration pattern: `YYYYMMDD_description.sql` with proper RLS

### New Tables (Migrations Required)

```sql
-- Migration: 20250116000000_create_pricing_system_tables.sql
-- Tenant-scoped tables (RLS enforced on organization_id)

CREATE TABLE pricing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  input_key TEXT NOT NULL, -- isbn13 or descriptor_hash
  input_payload JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'partial', 'completed', 'failed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  latency_ms INTEGER,
  partial_payload JSONB,
  error JSONB,
  idempotency_key TEXT NOT NULL,
  warnings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, idempotency_key)
);

CREATE TABLE price_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES pricing_jobs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  edition_id UUID REFERENCES editions(edition_id),
  suggested_price DECIMAL(10,2) NOT NULL,
  low_price DECIMAL(10,2) NOT NULL,
  high_price DECIMAL(10,2) NOT NULL,
  currency_code TEXT DEFAULT 'USD',
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  parameters_used JSONB NOT NULL, -- weights, thresholds, version
  evidence_refs UUID[], -- references to market_pricing_data
  freshness_timestamp TIMESTAMPTZ NOT NULL,
  rationale_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE seller_blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  marketplace_id UUID REFERENCES marketplaces(marketplace_id),
  seller_platform_id TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, marketplace_id, seller_platform_id)
);

-- Global platform tables (service-role write, orchestrator read)
-- Note: market_pricing_data table already exists with basic structure

-- Extend existing market_pricing_data table for pricing feature
ALTER TABLE market_pricing_data ADD COLUMN IF NOT EXISTS seller_platform_id TEXT;
ALTER TABLE market_pricing_data ADD COLUMN IF NOT EXISTS seller_name TEXT;
ALTER TABLE market_pricing_data ADD COLUMN IF NOT EXISTS seller_rating DECIMAL(3,2);
ALTER TABLE market_pricing_data ADD COLUMN IF NOT EXISTS seller_location TEXT;
ALTER TABLE market_pricing_data ADD COLUMN IF NOT EXISTS listing_url TEXT;
ALTER TABLE market_pricing_data ADD COLUMN IF NOT EXISTS shipping_price DECIMAL(10,2);
ALTER TABLE market_pricing_data ADD COLUMN IF NOT EXISTS is_relist BOOLEAN DEFAULT FALSE;
ALTER TABLE market_pricing_data ADD COLUMN IF NOT EXISTS photo_count INTEGER;
ALTER TABLE market_pricing_data ADD COLUMN IF NOT EXISTS description_length INTEGER;
ALTER TABLE market_pricing_data ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
-- Domain nuance for pricing accuracy (moved to attributes JSONB for extensibility)
-- Extensible attributes bag for forward compatibility
ALTER TABLE market_pricing_data ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb;

-- Attribute catalog for canonicalization and synonym mapping
CREATE TABLE IF NOT EXISTS attribute_catalog (
  key TEXT PRIMARY KEY,                      -- canonical key, e.g., 'is_ex_library'
  data_type TEXT NOT NULL CHECK (data_type IN ('boolean','string','number','enum')),
  allowed_values TEXT[],                    -- for enums or constrained strings
  synonyms TEXT[] DEFAULT '{}',             -- e.g., '{exlibrary, ex-lib, ex lib}'
  description TEXT,
  weight_hint NUMERIC(4,3),                 -- optional signal weight for engine
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id UUID REFERENCES marketplaces(marketplace_id),
  seller_platform_id TEXT NOT NULL,
  name TEXT,
  rating DECIMAL(3,2),
  location TEXT,
  history_signals JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(marketplace_id, seller_platform_id)
);

CREATE TABLE pricing_cache (
  cache_key TEXT PRIMARY KEY,
  price_quote_id UUID REFERENCES price_quotes(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE source_registry (
  source_code TEXT PRIMARY KEY, -- amazon, ebay, isbndb, vialibri
  cost_weight DECIMAL(3,2) DEFAULT 1.0,
  expected_latency_ms INTEGER,
  daily_quota_hint INTEGER,
  current_quota_remaining INTEGER,
  reliability_weight DECIMAL(3,2) DEFAULT 1.0,
  circuit_breaker_state TEXT DEFAULT 'closed' CHECK (circuit_breaker_state IN ('closed', 'open', 'half-open')),
  failure_count INTEGER DEFAULT 0,
  last_failure_at TIMESTAMPTZ,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize with MVP defaults
INSERT INTO source_registry (source_code, cost_weight, expected_latency_ms, daily_quota_hint, reliability_weight) VALUES
('amazon', 1.0, 3000, 1000, 1.0),
('ebay', 1.0, 4000, 5000, 0.9),
('isbndb', 0.5, 2000, 500, 0.8);
```

### Indexes and Partitioning

```sql
-- Performance indexes
CREATE INDEX idx_pricing_jobs_org_created ON pricing_jobs(organization_id, created_at DESC);
CREATE INDEX idx_price_quotes_org_edition ON price_quotes(organization_id, edition_id, created_at DESC);
CREATE INDEX idx_market_pricing_data_edition ON market_pricing_data(edition_id, price_date DESC);
CREATE INDEX idx_market_pricing_data_marketplace ON market_pricing_data(marketplace_id, seller_platform_id);
CREATE INDEX idx_market_pricing_data_quality ON market_pricing_data(is_relist, price_date DESC);
-- GIN index for extensible attributes bag
CREATE INDEX IF NOT EXISTS idx_market_pricing_data_attributes_gin ON market_pricing_data USING GIN (attributes jsonb_path_ops);

-- Partitioning (monthly for observations, quarterly for quotes)
CREATE TABLE market_pricing_data_y2025m01 PARTITION OF market_pricing_data
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
  
CREATE TABLE price_quotes_y2025q1 PARTITION OF price_quotes
  FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
```

### RLS Policies (Following Booksphere Patterns)

```sql
-- Migration: 20250116000001_create_pricing_rls_policies.sql
-- Note: Following existing Booksphere RLS pattern with auth.jwt() organization_id claims

-- Tenant-scoped tables (organization_id isolation)
ALTER TABLE pricing_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY pricing_jobs_tenant_isolation ON pricing_jobs
  FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

ALTER TABLE price_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY price_quotes_tenant_isolation ON price_quotes
  FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

ALTER TABLE seller_blocklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY seller_blocklist_tenant_isolation ON seller_blocklist
  FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Global platform tables (read access for all, service-role write)
ALTER TABLE market_pricing_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY market_pricing_data_read ON market_pricing_data
  FOR SELECT USING (true);
CREATE POLICY market_pricing_data_service_write ON market_pricing_data
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY market_pricing_data_service_update ON market_pricing_data
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
CREATE POLICY sellers_read ON sellers
  FOR SELECT USING (true);
CREATE POLICY sellers_service_write ON sellers
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE pricing_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY pricing_cache_read ON pricing_cache
  FOR SELECT USING (true);
CREATE POLICY pricing_cache_service_write ON pricing_cache
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE source_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY source_registry_read ON source_registry
  FOR SELECT USING (true);
CREATE POLICY source_registry_service_write ON source_registry
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Attribute catalog (global platform)
ALTER TABLE attribute_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY attribute_catalog_read ON attribute_catalog
  FOR SELECT USING (true);
CREATE POLICY attribute_catalog_service_write ON attribute_catalog
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

## API Design

### Endpoints

#### POST /api/pricing/jobs
**Purpose**: Create an async pricing job (idempotent)

```typescript
// Request
interface CreatePricingJobRequest {
  isbn13: string;
  options?: {
    allow_expensive_sources?: boolean;
    excluded_sources?: string[];
    refresh?: boolean;
    condition_hints?: {
      grade?: 'fine' | 'very_good' | 'good' | 'acceptable' | 'poor';
      has_dust_jacket?: boolean;
      is_signed?: boolean;
    };
  };
}

// Response
interface CreatePricingJobResponse {
  job_id: string;
  status: 'pending' | 'running' | 'partial' | 'completed' | 'failed';
  idempotency_key: string;
  cache_hit: boolean;
  estimated_completion_ms?: number;
}
```

#### GET /api/pricing/jobs/{id}
**Purpose**: Get job status with progressive results

```typescript
interface GetPricingJobResponse {
  job_id: string;
  status: 'pending' | 'running' | 'partial' | 'completed' | 'failed';
  progress: {
    sources_completed: string[];
    sources_pending: string[];
    sources_failed: string[];
  };
  partial_result?: {
    suggested_price?: number;
    price_range?: { low: number; high: number };
    confidence_score?: number;
    basis_sources: string[];
    sample_comp_count: number;
    freshness_timestamp: string;
  };
  final_result?: {
    quote_id: string;
    suggested_price: number;
    price_range: { low: number; high: number };
    confidence_score: number;
    worth_cataloging: boolean;
    expected_sell_speed: 'fast' | 'medium' | 'slow';
    rationale: string;
    warnings?: string[];
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

#### GET /api/pricing/quotes/{id}
**Purpose**: Get final pricing quote with full details

```typescript
interface GetPricingQuoteResponse {
  quote_id: string;
  edition_id: string;
  suggested_price: number;
  price_range: { low: number; high: number };
  confidence_score: number;
  currency: string;
  worth_cataloging: boolean;
  comparables: {
    source: string;
    count: number;
    median_price: number;
    date_range: { from: string; to: string };
    samples: Array<{
      price: number;
      condition: string;
      seller: string;
      date: string;
      url: string;
    }>;
  }[];
  adjustments: {
    condition_modifier?: number;
    binding_modifier?: number;
    signed_premium?: number;
  };
  rationale: {
    summary: string;
    key_factors: string[];
    confidence_drivers: string[];
  };
  metadata: {
    parameters_version: string;
    created_at: string;
    freshness_timestamp: string;
    cache_ttl_seconds: number;
  };
}
```

### Error Taxonomy

```typescript
enum PricingErrorCode {
  // Client errors (4xx)
  INVALID_ISBN = 'INVALID_ISBN',
  UNSUPPORTED_IDENTIFIER = 'UNSUPPORTED_IDENTIFIER',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Server errors (5xx)
  PROVIDER_TIMEOUT = 'PROVIDER_TIMEOUT',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  ENGINE_ERROR = 'ENGINE_ERROR',
  
  // Partial failures (2xx with warnings)
  PARTIAL_DATA = 'PARTIAL_DATA',
  STALE_CACHE = 'STALE_CACHE',
  LOW_CONFIDENCE = 'LOW_CONFIDENCE'
}
```

## Implementation Phases - Agent-Driven Workflows

### Phase 0: Foundations (Week 1-2)

#### Executive Summary
**Business Importance**: Establishes the technical foundation for all pricing functionality. Without proper database schema, RLS policies, and performance optimization, the entire feature will fail under production load.

**Expected Outcome**: Production-ready database infrastructure with multi-tenant isolation, optimized for high-concurrent pricing job processing (target: 100+ concurrent jobs).

**Critical Success Factors**: 
- Zero data leakage between organizations
- Sub-200ms database query performance 
- Proper integration with existing Booksphere schema patterns
- Source registry with quota-aware fan-out capabilities
- Partitioned tables for scalable pricing data storage

#### Human Prerequisites Checklist
- [ ] Database migration review approval from technical lead
- [ ] Confirm RLS security requirements with security team
- [ ] Validate organization_id JWT claims implementation
- [ ] Approve partitioning strategy for high-volume tables
- [ ] Service-role key available for source registry updates
- [ ] Review source registry update ownership rules

#### Detailed Implementation Steps
1. **Schema Design Review** (30 min)
   - Analyze existing table relationships
   - Validate foreign key constraints
   - Confirm UUID patterns match existing schema
   - Define source registry update semantics (see Appendix A5)

2. **Migration Creation** (2 hours)
   - Create timestamped migration file (YYYYMMDD_description.sql)
   - Include proper CASCADE deletions
   - Add comprehensive constraints and indexes
   - Implement source registry with update_source_registry RPC
   - Create partitioned tables for market_pricing_data (by price_date)
   - Create partitioned tables for price_quotes (by organization_id, created_at)
   - Adopt an extensible attributes model for `market_pricing_data` via `attributes JSONB` + GIN index; create `attribute_catalog` for canonical keys, allowed values, and synonyms
   - Ensure UI/business logic maps nuanced condition and jacket states via EAV attributes on `stock_items`

3. **RLS Policy Implementation** (1 hour)
   - Create organization-scoped policies
   - Test with multiple organization contexts
   - Verify service-role exceptions for source registry updates
   - Implement ownership rules (orchestrator vs connectors vs admin)

4. **Performance Optimization** (1 hour)
   - Add composite index (edition_id, price_date) for trend queries
   - Add index (organization_id, created_at DESC) for quote retrieval
   - Set up table partitioning for high-volume data
   - Create monitoring views
   - Configure partition pruning strategies
   - Add quality/pruning indexes to support deduplication and relist collapsing; add GIN index for `attributes`

5. **Type Generation & Testing** (30 min)
   - Regenerate TypeScript types
   - Test schema with sample queries
   - Validate integration points
   - Test source registry update functions

#### Agent Workflow: Database Foundation

**Agent 1: PostgreSQL Database Architect** 
```
You are a world-class PostgreSQL Database Architect with 20 years of experience designing and optimizing high-transaction databases. 

CONTEXT: You're implementing the database foundation for a pricing analysis feature in Booksphere, a book inventory management system. The system processes concurrent pricing jobs for multiple organizations (multi-tenant) with strict data isolation.

EXISTING SCHEMA INTEGRATION:
- organizations table exists (id UUID, name, amazon_refresh_token, ebay_refresh_token)
- marketplaces table exists (marketplace_id UUID, name, code, api_endpoint) 
- market_pricing_data table exists with basic structure
- editions table exists (edition_id UUID, book_id, isbn13_ol, etc.)
- Current RLS pattern: organization_id scoping via JWT claims
- Migration pattern: YYYYMMDD_description.sql format

CRITICAL ARCHITECTURE REQUIREMENTS:
- Source registry for quota-aware fan-out and dynamic provider selection (see Appendix A5)
- Layered caching with provider-specific TTLs (Amazon 6h, eBay 24h, ISBNdb 7d)
- Global observations sharing with privacy controls (anonymized, N≥10 threshold)
- Progressive update support with monotonic improvement guarantees (see Appendix A2)
- Full audit lineage with parameter versioning and trace_id tracking
- Circuit breaker state tracking per provider (see Appendix A4 error codes)
- Seller blocklist integration with pricing flow
- Partitioned tables: market_pricing_data by price_date, price_quotes by organization_id/created_at
- Composite indexes for performance: (edition_id, price_date), (organization_id, created_at DESC)

BUSINESS RULES TO IMPLEMENT:
- Worth cataloging: median sold price ≥ $12, margin ≥ $5, sell-through ≥ 60%
- Risk weights: 50% sell-through, 30% margin, 20% recency
- Idempotency: 5-minute window for identical requests
- Provider timeouts: 3-5s with circuit breaker after failures

TASK: Create a comprehensive migration script for pricing system tables that integrates seamlessly with existing Booksphere patterns.

REQUIREMENTS:
1. **Performance**: Design for 100+ concurrent pricing jobs, sub-200ms query times
2. **Security**: Multi-tenant RLS with zero data leakage between organizations  
3. **Scalability**: Handle high-volume pricing data with partitioning strategy
4. **Architecture**: Support quota management, circuit breakers, and progressive updates

THINK HARDER: Consider the full data lifecycle - job creation, processing, caching, cleanup. What indexes are critical? How will queries perform under load? What are the most likely performance bottlenecks? How does the source registry enable quota-aware fan-out?

PROVIDE:
1. Complete migration script following existing patterns with source registry
2. Strategic index recommendations with rationale (including composite indexes)
3. Partitioning strategy for high-volume tables (market_pricing_data, price_quotes)
4. RLS policies with security analysis and service-role exceptions
5. Performance impact assessment with partition pruning analysis
6. Source registry implementation with update_source_registry RPC (see Appendix A5)
7. Privacy controls for global observations sharing (N≥10 anonymization)
8. Ownership rules for source registry updates (orchestrator vs connectors)

Be extremely thorough - this is the foundation that everything else builds on.
```

**Agent 2: API Security Specialist**
```
Assume the persona of a senior API Security Specialist. You're reviewing the database schema and RLS policies for a pricing analysis feature.

CONTEXT: Multi-tenant book pricing system where organizations must be completely isolated. Pricing data contains sensitive business intelligence that could harm competitive position if leaked.

REVIEW THE DATABASE DESIGN PROVIDED BY THE PREVIOUS AGENT.

FOCUS AREAS:
1. **Authorization & Authentication**: Are organization boundaries properly enforced? Can a user access pricing data they shouldn't?
2. **Data Exposure**: Are we storing/exposing more pricing data than strictly necessary?
3. **Attack Vectors**: How could an attacker access competitor pricing data?

THINK DEEPER: What are the most dangerous scenarios? Cross-tenant data leakage? JWT manipulation? Service-role privilege escalation?

PROVIDE:
1. Security vulnerability assessment (Critical/High/Medium/Low)
2. RLS policy gaps and recommendations
3. Data exposure analysis
4. Recommended security controls and monitoring

Be paranoid - pricing data leakage could destroy customer trust.
```

**Agent 3: Senior Full-Stack Developer**
```
You are a world-class senior full-stack developer specializing in production-grade code implementation.

CONTEXT: You're implementing the database foundation for Booksphere's pricing analysis feature. You have feedback from the PostgreSQL Database Architect and API Security Specialist.

INTEGRATE ALL EXPERT FEEDBACK and create the final implementation.

TASK: Write the complete, production-ready database migration script and supporting code.

REQUIREMENTS:
1. **Integration Excellence**: Incorporate all security and performance recommendations
2. **Production Quality**: Follow Booksphere patterns exactly
3. **Architecture Alignment**: Ensure seamless integration with existing schema

THINK SEQUENTIALLY:
1. What are the core requirements from both experts?
2. How do I resolve any conflicting recommendations?
3. What edge cases need handling?
4. How do I ensure this follows existing Booksphere patterns?

PROVIDE:
1. Complete migration script (20250116000000_create_pricing_system_tables.sql)
2. TypeScript type definitions for new tables
3. Test queries to validate RLS and performance
4. Integration notes for existing codebase

Include comprehensive error handling and clear documentation explaining how expert feedback was addressed.
```

**Agent 4: Code Review Expert**
```
You are a meticulous senior code reviewer with expertise in catching bugs, logic errors, and incomplete implementations.

CONTEXT: Review the database migration script and supporting code for Booksphere's pricing feature foundation.

REVIEW WITH FRESH EYES. Assume nothing works until proven otherwise.

FOCUS AREAS:
1. **Completeness Check**: Is the migration actually complete? Missing constraints? Incomplete indexes?
2. **Logic Verification**: Do the RLS policies actually work? Are there security holes?
3. **Integration Accuracy**: Does this properly integrate with existing Booksphere patterns?

THINK CRITICALLY:
- Will this migration actually run without errors?
- Are there any inconsistencies with existing schema?
- What could break in production under load?
- Are there any incomplete TODOs or placeholder values?

PROVIDE:
1. Line-by-line code review with specific issues
2. Security vulnerability assessment
3. Performance bottleneck identification
4. Integration compatibility check
5. Pre-production testing checklist

Be ruthless - catch every issue before it reaches production.
```

#### Task 2: Orchestrator Skeleton

**Business Context**: The orchestrator is the central nervous system of pricing. It manages job lifecycle, enforces latency guarantees, and coordinates all pricing sources. Without rock-solid orchestration, the system will appear slow and unreliable to users.

**Human Prerequisites**:
- [ ] Supabase Edge Function deployment permissions
- [ ] Environment variables for external API timeouts
- [ ] Idempotency key generation strategy approval
- [ ] Monitoring dashboard access for latency tracking

#### Agent Workflow: Orchestrator Implementation

**Agent 1: System Architect**
```
You are a principal software architect with expertise in distributed systems and scalable architecture patterns.

CONTEXT: Design the pricing orchestrator for Booksphere - a high-performance job coordination system that must deliver pricing results with strict latency guarantees.

SYSTEM REQUIREMENTS:
- First partial results in ≤3 seconds
- P95 completion in ≤12 seconds  
- Hard timeout at 15 seconds
- Handle 100+ concurrent jobs
- Graceful degradation when providers fail
- Idempotency to prevent duplicate work

CRITICAL ARCHITECTURE PATTERNS:
- **Quota-Aware Fan-Out**: Use source registry to dynamically select providers based on availability, quotas, and circuit breaker states
- **Progressive Consistency**: Monotonic improvement guarantee - later updates only add confidence/evidence, never contradict earlier results
- **Layered Caching**: ISBN base cache + provider overlays + tenant quotes with specific TTLs
- **Circuit Breakers**: Per-provider failure tracking with automatic exclusion of degraded sources
- **Privacy Controls**: Global observations anonymized beyond edition-level with N≥10 threshold

SOURCE REGISTRY INTEGRATION:
The orchestrator must read from source_registry table to:
- Check circuit_breaker_state before calling providers
- Respect current_quota_remaining limits
- Apply reliability_weight to confidence scoring
- Use expected_latency_ms for timeout planning

BUSINESS RULES TO IMPLEMENT:
- Seller blocklist filtering before price computation
- Worth cataloging thresholds: median ≥$12, margin ≥$5, sell-through ≥60%
- Risk weights: 50% sell-through, 30% margin, 20% recency
- 5-minute idempotency window for identical requests

THINK ARCHITECTURALLY: How do you coordinate multiple async data sources while maintaining strict timing guarantees? How does the source registry enable intelligent provider selection? How do you ensure progressive updates never contradict earlier results?

DESIGN:
1. Job lifecycle state machine with clear transitions
2. Progressive result streaming strategy with monotonic improvement
3. Quota-aware provider selection using source registry
4. Timeout management and circuit breaker patterns
5. Cache key generation for idempotency
6. Error handling and degradation strategies

PROVIDE:
1. Detailed system architecture diagram
2. State machine definition with all transitions
3. Quota-aware fan-out algorithm
4. Progressive consistency implementation
5. API contract specifications
6. Performance and reliability requirements
7. Complexity vs. benefit trade-off analysis

Focus on scalability and reliability - this system must handle production load with intelligent provider management.
```

**Agent 2: Senior Full-Stack Developer**
```
You are a world-class senior full-stack developer implementing the pricing orchestrator based on the system architect's design.

CONTEXT: Build a production-grade Supabase Edge Function that orchestrates pricing jobs with strict latency guarantees.

ARCHITECTURE REQUIREMENTS FROM PREVIOUS AGENT: [Include the architecture design]

CRITICAL IMPLEMENTATION PATTERNS:
1. **Quota-Aware Fan-Out**: Query source_registry table to check circuit_breaker_state, current_quota_remaining, and reliability_weight before calling providers
2. **Progressive Consistency**: Implement monotonic improvement - later updates only add confidence/evidence, never contradict price ranges (see Appendix A2)
3. **Layered Cache Integration**: Check ISBN base cache → provider overlays → generate quote cache with specific TTLs
4. **Circuit Breaker Logic**: Update source_registry failure_count and circuit_breaker_state on provider errors (see Appendix A5)
5. **Seller Blocklist Filtering**: Apply organization-specific seller_blocklist before price computation
6. **Idempotency Implementation**: 5-minute window using job parameters hash
7. **Cache Lifecycle Management**: Implement background sweeper for expired entries (see Appendix A7)
8. **Quote Cache Creation**: Atomic linkage to price_quote_id with expires_at field (see Appendix A7)

BUSINESS RULES TO IMPLEMENT:
- Worth cataloging: IF (median_price ≥ 12 AND expected_margin ≥ 5 AND sell_through_prob ≥ 0.6) THEN true
- Confidence scoring: weight by source reliability + data freshness + sample size
- Risk weights: 0.5 * sell_through + 0.3 * margin + 0.2 * recency
- Provider timeouts: 3s Amazon, 4s eBay, 2s ISBNdb with circuit break after 3 failures

IMPLEMENTATION FOCUS:
1. **Latency Performance**: Every millisecond counts - optimize for speed
2. **Reliability**: Must handle provider failures gracefully
3. **Observability**: Comprehensive logging and metrics
4. **Source Registry Integration**: Dynamic provider selection based on health

THINK STEP-BY-STEP:
1. How do I implement quota-aware provider selection using source_registry?
2. How do I ensure progressive updates maintain monotonic improvement?
3. How do I integrate layered caching for optimal performance?
4. How do I implement circuit breakers with proper state management?
5. How do I apply seller blocklists and business rules correctly?

PROVIDE:
1. Complete Edge Function implementation (/supabase/functions/pricing-orchestrator/index.ts)
2. Quota-aware provider selection logic using source_registry
3. Progressive update streaming with consistency guarantees (monotonic merge rule)
4. Layered cache integration code with TTL management
5. Circuit breaker implementation with source_registry updates
6. Seller blocklist filtering logic
7. Business rules implementation (worth cataloging, confidence scoring)
8. Idempotency and timeout management
9. Comprehensive error handling and structured logging (see Appendix A3)
10. Cache lifecycle management with background sweeper setup (see Appendix A7)
11. Response contracts with trace_id and consistency_token (see Appendix A8)

Write production-ready code that implements all critical architecture patterns with proper error handling and type safety.
```

#### Task 3: Observability Foundation

**Business Context**: In production, you can't fix what you can't see. Comprehensive observability prevents outages, enables rapid incident response, and provides data for optimization. This is mission-critical for maintaining SLA commitments.

**Human Prerequisites**:
- [ ] Supabase dashboard access for metrics configuration
- [ ] Alert threshold definitions (latency, error rates)
- [ ] Incident response playbook review
- [ ] Kill switch authorization procedures

#### Agent Workflow: Observability Implementation

**Agent 1: DevOps/Infrastructure Engineer**
```
You are a senior DevOps engineer specializing in reliable deployments and operational excellence.

CONTEXT: Implement comprehensive observability for Booksphere's pricing system. This system processes business-critical pricing decisions and must maintain high availability.

OPERATIONAL REQUIREMENTS:
- 99.5% uptime SLA
- <12s P95 latency guarantee
- Rapid incident detection and response
- Graceful degradation during provider outages

THINK OPERATIONALLY: What will go wrong in production? How do you detect issues before customers notice? What metrics predict problems?

DESIGN:
1. **Deployment Safety**: Health checks, gradual rollout strategies
2. **Infrastructure Reliability**: Monitoring, alerting, kill switches
3. **Security Operations**: Audit logging, access controls

PROVIDE:
1. Comprehensive monitoring strategy
2. Alert definitions with severity levels
3. Kill switch implementation plan
4. Incident response procedures
5. Performance baseline and thresholds
6. Operational risk assessment

Focus on preventing incidents and enabling rapid recovery.
```

**Agent 2: Performance Engineer**
```
You are a senior performance engineer with expertise in full-stack optimization.

CONTEXT: Implement performance monitoring for the pricing system that must deliver results in <12 seconds while handling 100+ concurrent jobs.

PERFORMANCE TARGETS:
- First partial: ≤3s
- P95 completion: ≤12s
- Cache hit rate: >30%
- Error rate: <2%
- Concurrent job capacity: 100+

THINK PERFORMANCE: What are the bottlenecks? How do you identify performance regressions? What metrics predict capacity issues?

FOCUS AREAS:
1. **Algorithm Efficiency**: Monitoring pricing engine performance
2. **Database Performance**: Query optimization and N+1 detection
3. **Frontend Performance**: Latency distribution tracking

PROVIDE:
1. Performance metrics collection strategy
2. Latency monitoring implementation
3. Capacity planning guidelines
4. Performance regression detection
5. Load testing recommendations
6. Scale impact assessments (1x vs 100x scenarios)

Be quantitative - provide specific metrics and thresholds.
```

**Agent 3: Senior Full-Stack Developer**
```
Integrate the observability requirements from both the DevOps engineer and Performance engineer.

CONTEXT: Implement production-grade observability for the pricing system.

TASK: Create comprehensive monitoring, logging, and kill switch functionality.

INTEGRATE ALL EXPERT FEEDBACK:
- Operational requirements from DevOps engineer
- Performance monitoring from Performance engineer
- Security and compliance considerations

PROVIDE:
1. Metrics collection implementation
2. Structured logging system
3. Kill switch functionality
4. Health check endpoints
5. Alert configuration
6. Dashboard setup instructions

Ensure all code follows Booksphere patterns and includes proper error handling.
```

### Phase 1: ISBN MVP (Week 3-4)

#### Executive Summary
**Business Importance**: This phase delivers the core value proposition - transforming manual pricing research from 15-60 minutes into <12 seconds of automated analysis. Success here determines whether the feature provides genuine business value or becomes shelf-ware.

**Expected Outcome**: Functional pricing analysis for ISBN-based books using Amazon and eBay data with explainable AI rationale. Users can get pricing recommendations with confidence scores and supporting evidence.

**Critical Success Factors**:
- Latency targets met (3s partial, 12s complete)
- Confidence scores correlate with pricing accuracy
- AI explanations are business-relevant and trustworthy
- System handles common ISBN formats and edge cases
- Full distributed tracing with trace_id and consistency_token
- Job state machine properly implemented (see Appendix A1)
 - Delivered price used consistently for comps; robust comp hygiene and dedup/relist handling
 - Tenant-configurable seller quality thresholds and whitelists
 - UI surfaces uncertainty states and actionable next steps (low confidence, suspected reprint/lot, jacket uncertainty)

#### Human Prerequisites Checklist
- [ ] Amazon SP-API credentials and scopes verified
- [ ] eBay Finding API access confirmed
- [ ] Gemini 2.5 API key and quota allocation
- [ ] Legal review of data usage and attribution requirements
- [ ] Business rules defined for "worth cataloging" thresholds
- [ ] Condition adjustment multipliers approved by domain experts

#### Task 1: Amazon Connector

**Business Context**: Amazon provides the most comprehensive new book pricing data and serves as the primary baseline for pricing decisions. The connector must be extremely reliable since Amazon failures significantly impact pricing quality.

**Implementation Steps**:
1. **SP-API Authentication** (2 hours)
   - Replace Buildship token management with native implementation
   - Implement refresh token flow with proper expiry handling
   - Add credential validation and error handling

2. **Product Data Retrieval** (3 hours)
   - Implement GetItemOffersBatch for competitive offers
   - Add GetCompetitivePricing for buy box data
   - Handle pagination and rate limiting

3. **Data Normalization** (2 hours)
   - Transform SP-API responses to standard observation schema
   - Extract condition, seller, and pricing information
   - Compute delivered price when shipping is present
   - Filter reprints, PODs, international/teacher/book club editions when mismatched
   - Exclude low-quality sellers per tenant-configured thresholds/whitelists

4. **Quality Filtering** (1 hour)
   - Implement seller rating/feedback thresholds (tenant-configurable + whitelists)
   - Add reprint/POD/international/book club detection logic
   - Filter out lots/bundles and obvious mismatches
   - Filter obviously incorrect prices (outliers); cap influence of a single outlier listing

5. **Reliability Features** (1 hour)
   - Add timeout enforcement (3-5s)
   - Implement exponential backoff retry
   - Circuit breaker for sustained failures (see Appendix A4 error codes)
   - Add trace_id propagation throughout request flow
   - Implement structured logging (see Appendix A3)

#### Agent Workflow: Amazon Connector Implementation

**Agent 1: API Design Expert**
```
You are an API design specialist focusing on developer experience and API evolution.

CONTEXT: Design the Amazon SP-API connector for Booksphere's pricing system. This connector replaces existing Buildship workflow and must integrate seamlessly with the pricing orchestrator.

EXISTING BUILDSHIP REFERENCE: The current system uses /buildship/amazon/amazonApiRouter for SP-API integration. You need to understand this pattern and create a superior native implementation.

REQUIREMENTS:
1. **Design Consistency**: Clean interfaces, proper error handling, standard HTTP codes
2. **Developer Experience**: Clear response formats, comprehensive error messages
3. **Evolution Strategy**: Extensible design for future SP-API features

THINK SYSTEMATICALLY:
- What are the core SP-API endpoints needed?
- How should authentication be handled securely?
- What's the optimal response normalization strategy?
- How do we handle SP-API rate limits and quotas?

DESIGN:
1. Clean connector interface with typed responses
2. Authentication strategy with token management
3. Error taxonomy and handling strategy
4. Rate limiting and quota management
5. Response normalization schema including delivered price, domain flags (ex-library, book club, remainder, jacket state), and a generic `attributes` bag populated via `attribute_catalog`

PROVIDE:
1. Complete API design with TypeScript interfaces (include trace_id, consistency_token - see Appendix A8)
2. Authentication flow specification with circuit breaker states
3. Error handling strategy using extended taxonomy (see Appendix A4)
4. Rate limiting approach with quota tracking
5. Extension points for future requirements
6. Response contracts with progressive update support (see Appendix A8)

Focus on maintainability and clear contracts.
```

**Agent 2: API Security Specialist**
```
Assume the persona of a senior API Security Specialist reviewing the Amazon connector design.

CONTEXT: Amazon SP-API integration handles sensitive seller data and pricing information. Security failures could expose competitive intelligence or lead to API access revocation.

REVIEW THE API DESIGN FROM THE PREVIOUS AGENT.

SECURITY FOCUS:
1. **Authorization & Authentication**: Is SP-API token handling secure? Proper rotation?
2. **Input Sanitization**: Are ISBN inputs validated? SQL injection risks?
3. **Data Exposure**: Are we storing/logging sensitive Amazon data inappropriately?
4. **Rate Limiting**: Could abuse lead to API quota exhaustion?

THINK SECURITY-FIRST:
- What are the attack vectors? Token theft? API abuse? Data leakage?
- How could an attacker compromise Amazon access?
- What PII or sensitive data needs protection?
- Are there compliance requirements (GDPR, CCPA)?

PROVIDE:
1. Security vulnerability assessment (Critical/High/Medium/Low)
2. Token management security recommendations
3. Input validation requirements
4. Data handling and retention policies
5. Monitoring and alerting for security events

Be thorough - API access revocation would cripple the pricing system.
```

**Agent 3: Senior Full-Stack Developer**
```
You are a world-class senior full-stack developer implementing the Amazon SP-API connector.

CONTEXT: Build a production-grade Supabase Edge Function that replaces the existing Buildship Amazon integration with superior performance and reliability.

INTEGRATE ALL EXPERT FEEDBACK from API Designer and Security Specialist.

BUILD REQUIREMENTS:
1. **Performance**: Sub-5s response times with proper caching
2. **Security**: Secure token handling and data protection
3. **Reliability**: Graceful error handling and circuit breakers
4. **Integration**: Seamless orchestrator integration

THINK IMPLEMENTATION:
1. How do I structure the code for maintainability?
2. What's the optimal way to handle SP-API pagination?
3. How do I implement robust error handling?
4. What caching strategy minimizes API calls?

IMPLEMENT:
1. Complete Edge Function (/supabase/functions/pricing-connector-amazon/index.ts)
2. SP-API authentication with secure token management
3. Product data retrieval with pagination
4. Response normalization to standard schema (include trace_id, consistency_token, delivered price, domain flags, attributes via `attribute_catalog`)
5. Quality filtering and outlier detection
6. Comprehensive error handling using extended taxonomy (PROVIDER_CIRCUIT_OPEN, etc.)
7. Rate limiting and circuit breaker implementation (update source registry)
8. Structured logging with trace_id propagation (see Appendix A3)
9. Job state machine transitions (see Appendix A1)

Provide production-ready code with proper TypeScript types and error handling.
```

**Agent 4: Code Review Expert**
```
Review the Amazon connector implementation with extreme scrutiny.

CONTEXT: This connector is mission-critical for pricing accuracy and must handle production load reliably.

REVIEW FOCUS:
1. **Completeness**: Is the implementation actually complete? Any TODOs or placeholders?
2. **Logic Verification**: Will this connector actually work with real SP-API responses?
3. **Error Handling**: Are all failure scenarios properly handled?
4. **Performance**: Will this meet the <5s timeout requirement?

THINK CRITICALLY:
- Will authentication actually work in production?
- Are there any race conditions or async bugs?
- Is the data normalization logic correct?
- What will break under high load?

PROVIDE:
1. Line-by-line code review with specific issues
2. Logic verification and bug identification
3. Performance bottleneck analysis
4. Production readiness checklist
5. Recommended improvements

Catch every issue before production deployment.
```

#### Task 2: eBay Connector

**Business Context**: eBay provides crucial sold comparable data that Amazon lacks. This "market reality" data shows what books actually sell for, not just listing prices, making it essential for accurate pricing recommendations.

#### Agent Workflow: eBay Connector Implementation

**Agent 1: Pricing Strategy Expert**
```
You are a pricing strategy expert specializing in collectibles and used book markets.

CONTEXT: Design the eBay connector strategy for Booksphere's pricing system. eBay provides sold comparable data that's crucial for market-realistic pricing.

PRICING INTELLIGENCE REQUIREMENTS:
1. **Market Analysis**: Focus on actual sold prices (not listing prices)
2. **Temporal Relevance**: Weight recent sales more heavily
3. **Quality Filtering**: Exclude auction anomalies and obvious errors

THINK MARKET-WISE:
- What eBay data points are most predictive of fair market value?
- How do we handle currency variations and international sales?
- What sales should be excluded as non-representative?
- How do we weight eBay data against Amazon listing prices?

STRATEGY:
1. Data collection requirements from eBay Finding API
2. Quality filtering criteria for sold comparables
3. Currency normalization and shipping cost handling
4. Temporal weighting strategy for price relevance
5. Integration with overall pricing confidence scoring

PROVIDE:
1. eBay data requirements specification
2. Quality filtering criteria
3. Price normalization methodology
4. Confidence scoring contribution
5. Market competitiveness analysis

Focus on extracting maximum pricing intelligence from eBay's unique sold-comp data.
```

**Agent 2: Senior Full-Stack Developer**
```
Implement the eBay Finding API connector based on the pricing strategy expert's requirements.

CONTEXT: Build a production-grade connector that extracts sold comparable data from eBay to provide market-realistic pricing intelligence.

PRICING STRATEGY REQUIREMENTS:
1. **Market Analysis**: Focus on actual sold prices (not listing prices)
2. **Temporal Relevance**: Weight recent sales more heavily (90 days default; extend to 180 with decay if samples are scarce)
3. **Delivered Price**: Compute price + shipping for all sold comps; prefer records with clear shipping
4. **Hygiene Rules**: Exclude lots/bundles, POD/facsimiles, teacher/international/book club editions when mismatched, and obvious condition mismatches
5. **Dedup/Relist Handling**: Collapse relists and identical multi-listings; limit single-seller dominance in the comp set
6. **Auction Hygiene**: Favor BIN and multi-bid auctions; downweight single-bid/ultra-low-bid auctions; cap outlier influence
7. **Attribute Canonicalization**: Normalize raw provider fields into canonical keys defined in `attribute_catalog` and store in `attributes`

IMPLEMENTATION FOCUS:
1. **Data Quality**: Extract the most relevant sold comparable data
2. **Performance**: Meet timeout requirements while maximizing data collection
3. **Reliability**: Handle API variations and edge cases gracefully

BUILD:
1. eBay Finding API authentication and token management
2. findCompletedItems implementation with optimal parameters; compute delivered price (item + shipping)
3. Currency conversion to USD with current exchange rates
4. Shipping cost extraction and normalization; collapse relists via is_relist and seller+item heuristics
5. Quality filtering for representative sales (exclude lots/bundles, reprints/POD, narrow to matching editions/conditions); populate `attributes` using `attribute_catalog` synonyms
6. Response normalization to standard observation schema (include trace_id, consistency_token, delivered price, domain flags, attributes via `attribute_catalog`)
7. Timeout and retry logic with circuit breakers (see Appendix A4 error codes)
8. Quota tracking and source registry updates (see Appendix A5)
9. Structured logging with circuit breaker state tracking (see Appendix A3)

PROVIDE:
1. Complete Edge Function (/supabase/functions/pricing-connector-ebay/index.ts)
2. Authentication and API call implementation
3. Data normalization and quality filtering
4. Currency conversion logic
5. Error handling and logging
6. Performance optimization

Ensure the connector maximizes pricing intelligence while maintaining reliability.
```

#### Task 3: Pricing Engine v1

**Business Context**: The pricing engine is the "brain" that transforms raw market data into actionable pricing recommendations. Its accuracy directly impacts business profitability - overpricing loses sales, underpricing loses margin.

#### Agent Workflow: Pricing Engine Implementation

**Agent 1: Pricing Strategy Expert**
```
You are a pricing strategy expert specializing in collectibles and used book markets.

CONTEXT: Design the core pricing algorithm that transforms market observations into reliable pricing recommendations.

DATA INPUTS:
- Amazon competitive offers (listing prices)
- eBay sold comparables (actual sale prices) 
- Historical pricing data
- Book condition indicators
- Seller quality signals

SPECIFIC BUSINESS REQUIREMENTS (FROM DOMAIN ANALYSIS):
- Worth cataloging thresholds: median sold price ≥ $12, expected net margin ≥ $5, sell-through probability ≥ 60% within 90 days
- Default risk weights: 50% sell-through, 30% margin, 20% comparables recency/quality
- Source reliability weights: Amazon 1.0, eBay 0.9, ISBNdb 0.8 (from source_registry)
- Statistical method: Use trimmed median and IQR for outlier resistance
- Confidence formula: Based on sample size, source agreement, and data freshness
- Delivered price: Use price + shipping in all statistics; downweight comps without shipping clarity
- Recency fallback: 90d default; extend to 180d with decay if sample size is small
- Seller thresholds: tenant-configurable with whitelists for specialist dealers
- Dedup/relist handling: collapse identical or relisted items; limit single-seller influence

SELLER QUALITY FILTERING:
- Apply organization-specific seller_blocklist before price computation
- Default filter sellers with rating < 95% or < 50 feedback count; allow tenant overrides and whitelists
- Exclude obvious reprints, PODs, teacher/international/book club editions when mismatched, and damaged condition mismatches

CONDITION ADJUSTMENTS (MULTIPLIERS):
- Fine: 1.0x baseline
- Very Good: 0.85x baseline  
- Good: 0.7x baseline
- Acceptable: 0.5x baseline
- Poor: 0.3x baseline
- Signed premium: +5–30% depending on author/title tier; conservative default unless author significance known
- Dust jacket state: present (0–5%), price_clipped (-5–10%), chipped (-10–20%), missing (-30–60%) depending on title/segment

PRICING CHALLENGES:
- Different data sources have different reliability
- Condition variations significantly impact value
- Market timing affects relevance
- Outliers can skew results

DESIGN THE ALGORITHM:
1. **Statistical Approach**: Trimmed median (10% trim) with IQR-based outlier detection
2. **Source Weighting**: Use source_registry reliability_weight values
3. **Condition Adjustments**: Apply specific multipliers above (including jacket state and author-tier signed premium)
4. **Delivered Price + Hygiene**: Use delivered price; exclude lots/bundles and mismatches; dedup/relist handling
5. **Confidence Scoring**: f(sample_size, source_agreement, freshness, seller_quality)
6. **Edge Case Handling**: Minimum thresholds and fallback strategies; exception path for antiquarian_candidate
7. **Monotonic Merge Rule**: Implement progressive update guarantees (see Appendix A2)

THINK STRATEGICALLY:
- How do trimmed median and IQR provide outlier resistance?
- How do you balance sold prices (eBay) vs listing prices (Amazon)?
- What statistical confidence correlates with business confidence?
- How do you handle books below worth-cataloging thresholds?

PROVIDE:
1. Detailed pricing algorithm specification with exact formulas
2. Source reliability weighting implementation using source_registry
3. Condition adjustment methodology with specific multipliers
4. Confidence scoring formula with statistical basis
5. Worth cataloging determination logic
6. Edge case handling procedures with minimum thresholds
7. Parameter versioning for auditability
8. Seller blocklist integration strategy
9. Monotonic merge rule implementation for progressive updates (see Appendix A2)

Focus on accuracy and explainability - users need to trust the recommendations with specific business-relevant reasoning.
```

**Agent 2: Business Logic Validator**
```
You are a senior product engineer who bridges business requirements with technical implementation.

CONTEXT: Validate the pricing algorithm design against real-world book selling business requirements.

BUSINESS VALIDATION:
1. **Requirement Accuracy**: Does this algorithm actually solve the pricing problem?
2. **Edge Case Handling**: Are business edge cases properly addressed?
3. **Profit Impact**: Will this lead to profitable pricing decisions?

REVIEW THE PRICING STRATEGY and validate against business needs:

BUSINESS SCENARIOS TO TEST:
- Popular book with many comparables
- Rare book with few/no comparables  
- Book with wide price variance
- Damaged/poor condition book
- Signed or special edition book
- Recently published vs older book

THINK BUSINESS-FIRST:
- Will booksellers trust these recommendations?
- Do the confidence scores actually correlate with accuracy?
- Are condition adjustments realistic for the market?
- How do we handle books that shouldn't be cataloged?

VALIDATE:
1. Algorithm business logic correctness
2. Edge case coverage for real scenarios
3. Confidence score business relevance
4. Profitability impact analysis
5. User experience implications

Connect every technical decision to business impact.
```

**Agent 3: Senior Full-Stack Developer**
```
Implement the pricing engine based on validated business requirements and pricing strategy.

CONTEXT: Build the core pricing algorithm that must be both accurate and explainable.

INTEGRATE EXPERT FEEDBACK from Pricing Strategy Expert and Business Logic Validator.

IMPLEMENTATION REQUIREMENTS:
1. **Deterministic**: Same inputs always produce same outputs
2. **Auditable**: All parameters and decisions logged
3. **Performance**: Sub-second execution time
4. **Extensible**: Easy to add new data sources or adjustments

BUILD:
1. Robust statistical functions (trimmed median, IQR, outlier detection)
2. Source reliability weighting system
3. Condition/binding/signed adjustment logic
4. Confidence score calculation
5. Parameter versioning and logging
6. Edge case handling (no comps, extreme outliers)
7. Comprehensive unit tests for all scenarios

PROVIDE:
1. Complete pricing engine (/supabase/functions/pricing-engine/index.ts)
2. Statistical computation functions
3. Weighting and adjustment logic
4. Confidence scoring implementation
5. Parameter management system
6. Comprehensive test suite
7. Algorithm documentation

Ensure the engine is production-ready with proper error handling and logging.
```

#### Task 4: LLM Explainer

**Business Context**: AI explanations build user trust and enable better pricing decisions. Users need to understand WHY a price was recommended to feel confident using it in their business.

#### Agent Workflow: LLM Explainer Implementation

**Agent 1: Rare Book Domain Expert**
```
You are a rare book expert with 25 years in the antiquarian book trade, specializing in cataloging, condition assessment, and pricing intelligence.

CONTEXT: Design the AI explanation system for pricing recommendations. Explanations must be business-relevant and trustworthy to professional booksellers.

DOMAIN EXPERTISE REQUIREMENTS:
1. **Market Knowledge**: Explanations should reflect real market dynamics
2. **Condition Impact**: Properly explain how condition affects pricing
3. **Comparable Analysis**: Help users understand pricing evidence
4. **Business Relevance**: Focus on actionable insights for sellers

THINK LIKE A PROFESSIONAL BOOKSELLER:
- What factors actually drive book prices?
- How do you explain pricing confidence to skeptical sellers?
- What comparable data is most convincing?
- When should you recommend NOT cataloging a book?

DESIGN THE EXPLANATION STRATEGY:
1. Key factors template for pricing rationale
2. Comparable analysis explanation format
3. Confidence driver identification
4. Market context and timing considerations
5. Actionable recommendations beyond just price

PROVIDE:
1. Explanation template structure
2. Key pricing factors taxonomy
3. Comparable presentation strategy
4. Confidence explanation methodology
5. Business recommendation categories
6. Domain-specific language guidelines

Focus on building seller confidence through professional, knowledgeable explanations.
```

**Agent 2: Senior Full-Stack Developer**
```
Implement the LLM explanation system based on domain expert requirements.

CONTEXT: Build a Gemini 2.5 Flash integration that generates business-relevant pricing explanations.

DOMAIN REQUIREMENTS: [Include domain expert specifications]

IMPLEMENTATION CONSTRAINTS:
1. **Timeout**: Hard 2s limit - never block pricing results
2. **Reliability**: Graceful fallback when LLM unavailable
3. **Cost**: Optimize token usage for production economics
4. **Caching**: Cache explanations for similar pricing scenarios

BUILD:
1. Gemini 2.5 Flash integration with authentication
2. Prompt template system with domain expertise
3. Timeout enforcement with fallback explanations
4. Response caching based on pricing context (including uncertainty categories)
5. Token optimization for cost efficiency
6. Audit logging for prompt/response analysis
7. Quality monitoring for explanation relevance

PROVIDE:
1. Complete LLM explainer (/supabase/functions/pricing-explainer/index.ts)
2. Prompt template system
3. Timeout and fallback implementation
4. Caching strategy
5. Cost optimization features
6. Monitoring and logging

Ensure explanations enhance rather than delay the pricing experience.
```

#### Task 5: UI Components

**Business Context**: The user interface is the primary touchpoint for pricing value delivery. A confusing or slow UI will cause users to abandon the feature regardless of backend quality.

**Human Prerequisites**:
- [ ] UI/UX mockups approved by design team
- [ ] Accessibility requirements (WCAG 2.1 AA) confirmed
- [ ] Progressive update timing validated with users
- [ ] Error message taxonomy approved

#### Agent Workflow: UI Components Implementation

**Agent 1: UI/UX & Accessibility Expert**
```
You are a UI/UX and Accessibility (a11y) expert specializing in complex web applications.

CONTEXT: Design the user interface for Booksphere's pricing analysis feature. This must deliver rapid pricing insights while maintaining excellent usability.

USER EXPERIENCE REQUIREMENTS:
1. **Progressive Updates**: Show partial results in 3s, final in 12s
2. **Confidence Communication**: Users must understand pricing reliability
3. **Source Transparency**: Clear indication of data sources and freshness
4. **Error Recovery**: Graceful handling of provider failures

THINK USER-FIRST:
- How do you communicate confidence without overwhelming users?
- What's the optimal way to show progressive updates?
- How do you handle long wait times (8-12s) gracefully?
- What error states need special handling?

DESIGN:
1. **User Experience**: Progressive disclosure, intuitive flows, minimal clicks
2. **Accessibility**: ARIA standards, keyboard navigation, screen reader support
3. **Component Design**: shadcn/ui system adherence, responsive design

PROVIDE:
1. Complete component architecture design
2. User flow specifications for pricing workflow
3. Progressive update UI strategy
4. Error state and loading state designs
5. Accessibility compliance checklist
6. Mobile responsiveness considerations

Focus on user delight and accessibility - make pricing analysis feel fast and trustworthy.
```

**Agent 2: Senior Full-Stack Developer**
```
Implement the pricing UI components based on the UX expert's design.

CONTEXT: Build production-grade React components for Booksphere's pricing feature using Next.js 15 with App Router.

ARCHITECTURAL CONSTRAINTS:
- Server Components by default
- TanStack Query for all server state
- No useEffect for data fetching
- shadcn/ui component library
- Tailwind CSS for styling

UX REQUIREMENTS: [Include UX expert specifications]

IMPLEMENT:
1. QuickAssessment component (3s partial results)
2. DetailedAnalysis component (full pricing breakdown)
3. Progressive update rendering system
4. Provider health indicators
5. Source exclusion and retry functionality
6. Freshness and staleness indicators
7. Comprehensive error boundaries
8. Loading states and skeleton screens

PROVIDE:
1. Complete component implementations
2. TanStack Query hooks for pricing data
3. Progressive update rendering logic
4. Error handling and recovery UI
5. Accessibility implementation
6. TypeScript types for all props and state
7. Comprehensive component tests

Ensure components follow Booksphere patterns and provide excellent user experience.
```

**Agent 3: UI/UX & Accessibility Expert (Review)**
```
Review the implemented UI components for usability and accessibility compliance.

CONTEXT: Validate that the pricing UI implementation meets professional standards for complex business applications.

REVIEW FOCUS:
1. **User Experience**: Is the progressive update flow intuitive? Do error states help users recover?
2. **Accessibility**: Full keyboard navigation? Proper ARIA labels? Screen reader compatibility?
3. **Performance**: Do components render smoothly? Any unnecessary re-renders?

TEST SCENARIOS:
1. Keyboard-only navigation through entire pricing flow
2. Screen reader experience with NVDA/JAWS
3. Mobile device usage patterns
4. Error recovery workflows
5. Long-running pricing jobs (8-12s)

VALIDATE:
1. WCAG 2.1 AA compliance
2. Progressive update user experience
3. Error handling effectiveness
4. Mobile responsiveness
5. Performance under load

Provide specific improvements for any accessibility or usability issues found.
```

### Phase 2: Pre-ISBN & Antiquarian (Week 5-6)

#### Executive Summary
**Business Importance**: Extends pricing capability to pre-1970 books and rare/antiquarian materials, unlocking significant inventory value for specialized booksellers. This differentiates Booksphere from competitors focused only on ISBN books.

**Expected Outcome**: Accurate pricing for pre-ISBN books using fuzzy title/author matching with antiquarian marketplace data integration.

**Critical Success Factors**:
- Disambiguation accuracy >90% for common pre-ISBN books
- ViaLibri integration provides relevant comparable data
- User workflow handles ambiguous matches gracefully

#### Features Overview
- Fuzzy matching for pre-ISBN books (title/author/year/publisher)
- ViaLibri connector for antiquarian marketplaces  
- Disambiguation service with LLM fallback
- Tenant-specific weighting profiles

#### Implementation Tasks
- Implement fuzzy matching with similarity scoring
- Add ViaLibri connector (pending API access)
- Create disambiguation UI for ambiguous matches
- Add tenant preference management

#### Agent Workflow Summary
**Linear Agent Sequence**: System Architect → Rare Book Domain Expert → Search Algorithm Specialist → Senior Full-Stack Developer → Code Review Expert

*Note: Detailed agent prompts available upon request for implementation phase.*

### Phase 3: Condition & Analytics (Week 7-8)

#### Executive Summary
**Business Importance**: Automates condition assessment and provides market intelligence, reducing manual effort while improving pricing accuracy through computer vision and trend analysis.

**Expected Outcome**: Optional photo-based condition analysis with market trend dashboards for strategic pricing decisions.

#### Features Overview
- Photo-based condition analysis (opt-in)
- Condition modifier extraction from images
- Historical trend analytics
- Market insights dashboard

#### Agent Workflow Summary
**Linear Agent Sequence**: Computer Vision Specialist → Analytics Engineering Expert → Performance Engineer → Data Visualization Specialist → Senior Full-Stack Developer → UI/UX Expert

*Note: Detailed agent prompts available upon request for implementation phase.*

### Phase 4: Antiquarian Depth (Future)

<features>
  - ABAA/ABE/Alibris integration
  - First-edition identification rules
  - Publisher-specific bibliographic knowledge
  - Provenance and association tracking
</features>

### Phase 5: Dynamic Repricing (Future)

<features>
  - Automated repricing workflows
  - Marketplace synchronization
  - Approval workflows
  - Safety guardrails and caps
</features>

### Phase 6: Learning System (Future)

<features>
  - Feedback loop from sales velocity
  - Weight optimization based on outcomes
  - Cross-tenant anonymized benchmarks
  - Predictive pricing models
</features>

## Connector Translation Guide

### From Buildship to Native Implementation

#### Amazon SP-API Connector
```typescript
// Replace /buildship/amazon/amazonApiRouter with:

interface AmazonConnector {
  // Authentication (replace getAmazonApiToken workflow)
  async getAccessToken(): Promise<string> {
    // Use refresh token flow
    // Cache token until expiry
  }
  
  // Get offers (replace get_product_by_asin)
  async getItemOffers(asin: string): Promise<NormalizedObservation[]> {
    // Call SP-API GetItemOffersBatch
    // Filter by condition and seller rating
    // Normalize to standard schema
  }
  
  // Get competitive pricing
  async getCompetitivePricing(asin: string): Promise<PricingData> {
    // Call SP-API GetCompetitivePricing
    // Extract buy box and competitive offers
  }
}
```

#### eBay Connector
```typescript
// Replace /buildship/ebay/ebayApiRouter with:

interface eBayConnector {
  // Authentication (replace ebayGetAccessToken)
  async getAccessToken(): Promise<string> {
    // Use client credentials flow
    // Cache token until expiry
  }
  
  // Get sold listings (replace Finding API calls)
  async getSoldComps(isbn: string): Promise<NormalizedObservation[]> {
    // Call findCompletedItems
    // Filter last 90 days
    // Normalize prices and shipping
    // Convert currencies to USD
  }
}
```

### Normalized Observation Schema

```typescript
interface NormalizedObservation {
  // Identifiers
  edition_id?: string;
  marketplace_id: string;
  external_reference_id: string;
  
  // Pricing
  price_amount: number;
  currency_code: string;
  price_type: 'sold' | 'ask';
  price_date: Date;
  shipping_price?: number;
  delivered_price?: number; // price_amount + shipping_price when available
  
  // Seller
  seller_platform_id: string;
  seller_name?: string;
  seller_rating?: number;
  seller_location?: string;
  
  // Condition
  condition_grade?: string;
  condition_text?: string;
  has_dust_jacket?: boolean; // retained for backward-compat
  // Prefer attributes['dust_jacket_state'] going forward
  dust_jacket_state?: 'present' | 'price_clipped' | 'chipped' | 'missing';
  is_signed?: boolean;
  binding?: string;
  // Prefer attributes bag for these going forward
  is_ex_library?: boolean;
  is_book_club_edition?: boolean;
  has_remainder_mark?: boolean;
  association_copy?: boolean;
  owner_markings?: boolean;
  pages_annotated?: 'none' | 'some' | 'heavy';
  
  // Quality signals
  photo_count?: number;
  description_length?: number;
  listing_url?: string;
  
  // Metadata
  source_type: string;
  collected_at: Date;
  confidence?: number;
  is_relist?: boolean;
  // Extensible attribute bag to carry provider-specific/normalized flags
  attributes?: Record<string, unknown>;
}
```

## Testing Strategy

### Unit Tests (Vitest)
```typescript
// /src/lib/pricing/__tests__/

describe('PricingEngine', () => {
  test('calculates trimmed median correctly');
  test('applies source weights appropriately');
  test('handles empty comp sets gracefully');
  test('produces deterministic outputs');
  test('degrades confidence with missing sources');
  test('uses delivered price (price + shipping) for statistics');
  test('deduplicates relists and limits single-seller dominance');
  test('applies auction hygiene and caps outlier influence');
  test('applies dust_jacket_state and signed premium by author tier');
});

describe('CacheKey', () => {
  test('generates consistent keys for same inputs');
  test('includes parameter version in hash');
  test('respects idempotency window');
});
```

### Integration Tests
```typescript
// /tests/integration/pricing/

describe('Connector Integration', () => {
  test('Amazon connector handles throttling');
  test('eBay connector normalizes currency');
  test('ISBNdb connector caches appropriately');
  test('All connectors respect timeout');
});
```

### E2E Tests (Playwright)
```typescript
// /e2e/pricing-workflow.spec.ts

test('Complete pricing workflow', async ({ page }) => {
  // Scan ISBN
  // Wait for progressive updates
  // Verify first partial < 3s
  // Verify final result < 12s
  // Check confidence and rationale
  // Test source exclusion
  // Verify retry functionality
});
```

### Performance Tests
```yaml
# Load test configuration
scenarios:
  - name: "Concurrent pricing jobs"
    vus: 50
    duration: "5m"
    thresholds:
      - p95_latency: ["< 12000"]
      - error_rate: ["< 0.02"]
      - cache_hit_rate: ["> 0.3"]
```

## Deployment Checklist

### Pre-deployment
- [ ] All migrations applied and verified
- [ ] RLS policies tested with multiple tenants
- [ ] Provider credentials configured in secrets
- [ ] Kill switches wired and tested
- [ ] Monitoring dashboards configured
- [ ] Rate limits and quotas documented

### Deployment Steps
1. Deploy database migrations via Supabase MCP
2. Deploy Edge Functions (blue/green strategy)
3. Configure health checks
4. Enable feature flags (internal only)
5. Run smoke tests
6. Monitor metrics for 24h
7. Enable for beta tenant
8. Gradual rollout to all tenants

### Rollback Plan
```bash
# Immediate rollback
supabase functions deploy pricing-orchestrator --version previous

# Feature flag disable
UPDATE source_registry SET enabled = false WHERE source_code = 'problem_source';

# Kill switch activation
UPDATE feature_flags SET enabled = false WHERE feature = 'pricing_analysis';
```

## Operations Runbook

### Incident Response

#### Provider Outage
```yaml
symptoms:
  - Elevated timeout rate for specific provider
  - Increased job completion time
  
actions:
  1. Check provider status page
  2. Activate provider kill switch if confirmed
  3. Update status page with degraded service notice
  4. Monitor partial result quality
  
recovery:
  1. Re-enable provider when recovered
  2. Clear stale caches if needed
  3. Verify normal operation
```

#### Quota Exhaustion
```yaml
symptoms:
  - 429 responses from provider
  - Throttling errors in logs
  
actions:
  1. Reduce concurrent requests via config
  2. Increase backoff multiplier
  3. Prefer cached results
  4. Surface warning in UI
  
prevention:
  1. Monitor daily quota usage
  2. Implement sliding window rate limiting
  3. Set conservative default limits
```

### Monitoring & Alerts

```yaml
metrics:
  - job_completion_rate: "> 0.98"
  - p95_latency: "< 12s"
  - cache_hit_rate: "> 0.3"
  - provider_health: "all > 0.95"
  - error_rate: "< 0.02"

alerts:
  - name: "High latency"
    condition: "p95_latency > 15s for 5m"
    severity: "warning"
    
  - name: "Provider degraded"
    condition: "provider_health < 0.9 for 10m"
    severity: "warning"
    
  - name: "Job failures"
    condition: "error_rate > 0.05 for 5m"
    severity: "critical"
```

## Condensed Implementation Checklist

### Week 1-2: Foundation
- [ ] Create database schema via Supabase MCP
- [ ] Implement RLS policies and test isolation
- [ ] Build orchestrator skeleton with timeouts
- [ ] Set up observability and kill switches

### Week 3-4: MVP
- [ ] Build Amazon connector (replace Buildship)
- [ ] Build eBay connector (replace Buildship)
- [ ] Implement pricing engine v1
- [ ] Add LLM explainer with Gemini
- [ ] Create UI components (Quick/Detailed)
- [ ] Write core tests

### Week 5: Hardening
- [ ] Performance testing and optimization
- [ ] Security audit and fixes
- [ ] Documentation completion
- [ ] Beta deployment and monitoring

### Success Criteria
- [ ] P95 latency ≤ 12s achieved
- [ ] Confidence ≥ 0.7 for common ISBNs
- [ ] All tests green in CI
- [ ] Beta user acceptance ≥ 60%
- [ ] Zero critical incidents in first week

## Human Prerequisites & Agent Context Strategy

### Context Strategy for AI Agents
**Primary Reference**: This roadmap document serves as the main context source for all agents
**Embedded Context**: Each agent prompt includes essential technical details and business requirements
**Sequential Handoffs**: Agent outputs are explicitly passed to subsequent agents in the workflow
**Quality Assurance**: Each phase includes review agents to validate implementation quality

### Required Before Starting Implementation

#### Phase 0 Prerequisites
1. **Legal & Compliance**
   - [ ] eBay Finding API access path and ToS review completed
   - [ ] Amazon SP-API storage/display rights confirmed
   - [ ] Data attribution and truncation requirements documented
   - [ ] GDPR/CCPA compliance review for pricing data storage

2. **Provider Credentials & Access**
   - [ ] Amazon SP-API tokens and scopes configured
   - [ ] eBay API credentials obtained and tested
   - [ ] Gemini 2.5 API key and quota allocation confirmed
   - [ ] ISBNdb plan upgrade for pricing data access
   - [ ] Supabase Edge Function deployment permissions verified

3. **Technical Configuration**
   - [ ] Exact quota limits per provider documented
   - [ ] Circuit breaker thresholds defined
   - [ ] Kill switch authorization procedures established
   - [ ] Monitoring dashboard access configured
   - [ ] Alert threshold definitions approved

4. **Business Rules Definition**
   - [ ] "Worth cataloging" price thresholds defined
   - [ ] Default condition adjustment multipliers approved
   - [ ] Seller quality criteria specified
   - [ ] Confidence score interpretation guidelines
   - [ ] Pricing recommendation approval workflows

#### Phase 1 Prerequisites
5. **Domain Expertise Validation**
   - [ ] Rare book expert review of pricing factors
   - [ ] Bookseller feedback on explanation templates
   - [ ] Condition assessment methodology approval
   - [ ] Market timing and seasonality considerations

6. **UI/UX Specifications**
   - [ ] User interface mockups approved
   - [ ] Accessibility requirements (WCAG 2.1 AA) confirmed
   - [ ] Progressive update timing validated
   - [ ] Error message taxonomy and tone approved
   - [ ] Mobile responsiveness requirements defined

### Documentation Updates Required
- [ ] Update `/docs/pricing/pricing_questions_answers.md` with final decisions
- [ ] Create comprehensive API documentation in `/docs/api/pricing.md`
- [ ] Add operational runbook to `/docs/operations/pricing-runbook.md`
- [ ] Document agent workflow patterns in `/docs/development/agent-workflows.md`
- [ ] Create troubleshooting guide in `/docs/support/pricing-troubleshooting.md`

## Agent Workflow Execution Instructions

### How to Use This Roadmap with AI Agents

1. **Sequential Execution**: Follow the numbered tasks within each phase sequentially
2. **Copy-Paste Prompts**: Each agent prompt is designed to be copied and pasted directly
3. **Context Preservation**: Always include previous agent outputs when moving to the next agent
4. **Quality Gates**: Complete the review agent step before proceeding to implementation
5. **Iteration**: Use the "think harder" and sequential thinking instructions for complex problems

### Claude Code Subagent Integration
**Available Specialized Agents**: 
- PostgreSQL Database Architect (;db)
- API Security Specialist (;security)
- Performance Engineer (;perf)
- UI/UX & Accessibility Expert (;ux)
- Senior Full-Stack Developer (;code)
- Code Review Expert (;review)
- Business Logic Validator (;business)
- Rare Book Domain Expert (;book)
- Pricing Strategy Expert (;pricing)

### Cursor Agent Adaptation
**For Cursor users without subagent access**: Each prompt includes the specialized persona instructions embedded directly in the prompt text.

### GPT-5 Prompting Techniques Integrated
- **"Think Harder"**: All prompts include explicit instructions to think deeply
- **Planning Phases**: Complex tasks are broken into planning and execution phases
- **Structured Formatting**: All prompts use clear markdown structure
- **Sequential Thinking**: Each prompt encourages step-by-step reasoning
- **Iteration**: Review agents provide feedback loops for quality improvement

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Provider API changes | High | Isolated connectors, version detection |
| Quota exhaustion | Medium | Conservative limits, graceful degradation |
| Legal compliance | High | Provider-specific toggles, audit logging |
| Performance degradation | Medium | Caching layers, timeout enforcement |
| Data quality issues | Medium | Quality filters, confidence scoring |

## Quick Implementation Checklist

### Week 1-2: Foundation (Phase 0)
- [ ] **Database Schema** - Run PostgreSQL architect → security review → implementation → code review
- [ ] **Orchestrator** - Run system architect → implementation → code review
- [ ] **Observability** - Run DevOps engineer → performance engineer → implementation

### Week 3-4: MVP Core (Phase 1) 
- [ ] **Amazon Connector** - Run API designer → security review → implementation → code review
- [ ] **eBay Connector** - Run pricing strategist → implementation → code review
- [ ] **Pricing Engine** - Run pricing strategist → business validator → implementation
- [ ] **LLM Explainer** - Run domain expert → implementation → performance review
- [ ] **UI Components** - Run UX expert → implementation → accessibility review

### Week 5: Hardening & Deployment
- [ ] **Integration Testing** - Full end-to-end workflow validation
- [ ] **Performance Testing** - Load testing to verify latency targets
- [ ] **Security Audit** - Complete security review of all components
- [ ] **Production Deployment** - Staged rollout with monitoring

### Success Metrics Validation
- [ ] P95 latency ≤ 12s achieved consistently
- [ ] Confidence scores ≥ 0.7 for common ISBNs
- [ ] All automated tests passing in CI/CD
- [ ] Zero critical security vulnerabilities
- [ ] Beta user satisfaction ≥ 60% approval

## Conclusion

This enhanced roadmap provides a complete, agent-driven implementation strategy for the Pricing Analysis feature. By leveraging specialized AI agents with copy-paste prompts, teams can systematically build a production-grade pricing system while maintaining high quality and rapid development velocity.

**Key Innovation**: This roadmap transforms complex feature development into a series of guided AI agent workflows, enabling teams to "copy-paste their way" to a complete implementation while ensuring expert-level quality at each step.

**Next Steps**:
1. ✅ Complete human prerequisites checklist
2. 🤖 Begin Phase 0 with database architect agent
3. 📊 Track progress using the quick implementation checklist
4. 🔄 Iterate using agent feedback loops for continuous improvement

## Technical Appendix

### A1. Job State Machine

```ascii
[pending] ──start──> [running] ──stream──> [partial]* ──finalize──> [completed]
                         │                      │
                         └──error──> [failed] <──┘

State Transitions:
- start: pending → running (job initiated)
- stream partial: running → partial (progressive update, repeatable)
- finalize: partial|running → completed (all sources processed or timeout)
- error: running|partial → failed (unrecoverable error)

Exit States: completed, failed
Intermediate States: pending, running, partial
```

### A2. Monotonic Merge Rule

```pseudo
// Ensures progressive updates never regress previous results
function monotonic_merge(old_result, new_result):
    // Price ranges only tighten, never expand
    new_result.low_price = max(old_result.low_price, new_result.low_price)
    new_result.high_price = min(old_result.high_price, new_result.high_price)
    
    // Confidence only increases
    new_result.confidence = max(old_result.confidence, new_result.confidence)
    
    // Evidence accumulates
    new_result.evidence = old_result.evidence ∪ new_result.evidence
    
    // Source count increases
    new_result.source_count = old_result.source_count + new_result.new_sources
    
    return new_result
```

### A3. Structured Logging Schema

```json
{
  "trace_id": "uuid-v4",           // Distributed trace identifier
  "job_id": "uuid-v4",              // Pricing job identifier
  "organization_id": "uuid-v4",     // Tenant identifier
  "phase": "connector|engine|llm",  // Processing phase
  "source": "amazon|ebay|isbndb",   // Data source (if applicable)
  "event": "request_started|request_completed|error|timeout",
  "latency_ms": 2840,               // Operation latency
  "outcome": "success|failure|timeout|circuit_open",
  "error_code": "PROVIDER_TIMEOUT", // Error taxonomy code
  "cb_state": "closed|open|half_open", // Circuit breaker state
  "cache_hit": true|false,          // Cache utilization
  "timestamp": "2025-01-15T10:30:00Z",
  "metadata": {                     // Optional context
    "isbn": "9780123456789",
    "provider_status": 429,
    "retry_count": 1
  }
}
```

### A4. Extended Error Taxonomy

```typescript
enum PricingErrorCode {
  // Provider-specific errors
  PROVIDER_TIMEOUT = 'PROVIDER_TIMEOUT',
  PROVIDER_RATE_LIMITED = 'PROVIDER_RATE_LIMITED',
  PROVIDER_AUTH_FAILED = 'PROVIDER_AUTH_FAILED',
  PROVIDER_CIRCUIT_OPEN = 'PROVIDER_CIRCUIT_OPEN',      // NEW: Circuit breaker activated
  PROVIDER_DISABLED = 'PROVIDER_DISABLED',              // NEW: Provider manually disabled
  PROVIDER_QUOTA_EXHAUSTED = 'PROVIDER_QUOTA_EXHAUSTED',
  
  // Data quality errors
  INSUFFICIENT_COMPARABLES = 'INSUFFICIENT_COMPARABLES',
  LOW_CONFIDENCE_RESULTS = 'LOW_CONFIDENCE_RESULTS',
  STALE_OVERLAYS = 'STALE_OVERLAYS',                   // NEW: Cache data too old
  INCONSISTENT_DATA = 'INCONSISTENT_DATA',
  
  // System errors
  JOB_TIMEOUT = 'JOB_TIMEOUT',
  CACHE_ERROR = 'CACHE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  LLM_TIMEOUT = 'LLM_TIMEOUT',
  
  // Business logic errors
  ISBN_NOT_FOUND = 'ISBN_NOT_FOUND',
  BELOW_THRESHOLD = 'BELOW_THRESHOLD',
  BLOCKLIST_FILTERED = 'BLOCKLIST_FILTERED'
}
```

### A5. Source Registry Update Semantics

```sql
-- RPC: Update source registry (service-role only)
CREATE OR REPLACE FUNCTION update_source_registry(
  p_source_id UUID,
  p_failure_count INTEGER DEFAULT NULL,
  p_circuit_breaker_state TEXT DEFAULT NULL,
  p_current_quota_remaining INTEGER DEFAULT NULL,
  p_last_failure_at TIMESTAMPTZ DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Validate service-role authorization
  IF current_setting('request.jwt.claim.role') != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: service-role required';
  END IF;
  
  UPDATE source_registry
  SET 
    failure_count = COALESCE(p_failure_count, failure_count),
    circuit_breaker_state = COALESCE(p_circuit_breaker_state, circuit_breaker_state),
    current_quota_remaining = COALESCE(p_current_quota_remaining, current_quota_remaining),
    last_failure_at = COALESCE(p_last_failure_at, last_failure_at),
    updated_at = NOW()
  WHERE id = p_source_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ownership rules:
-- Orchestrator: Updates failure_count, circuit_breaker_state, last_failure_at
-- Connectors: Report quota usage (orchestrator updates current_quota_remaining)
-- Admin UI: Updates enabled status, cost_weight, expected_latency_ms
```

### A6. Implementation Sequence

```yaml
sequence:
  - phase: "Database Migrations"
    requirements:
      - Supabase project with service-role key
      - Organization JWT claim configured
      - Migration naming: YYYYMMDD_description.sql
    outputs:
      - Tables with RLS policies
      - Indexes and partitions created
      - RPCs defined
      
  - phase: "Orchestrator Skeleton"
    requirements:
      - Source registry read access
      - Feature flags configured
      - OpenTelemetry tracing setup
    outputs:
      - Job lifecycle management
      - Progressive streaming capability
      - Idempotency enforcement
      
  - phase: "Amazon Connector"
    requirements:
      - SP-API credentials
      - Auth token management
      - Circuit breaker library
    outputs:
      - Normalized pricing data
      - Error handling with retry
      - Quota tracking
      
  - phase: "eBay Connector"
    requirements:
      - Finding API access
      - Currency conversion service
      - Quality filter rules
    outputs:
      - Sold comparables data
      - Normalized currency values
      - Filtered results
      
  - phase: "Pricing Engine v1"
    requirements:
      - Statistical libraries
      - Parameter versioning
      - Confidence scoring logic
    outputs:
      - Deterministic price bands
      - Confidence scores
      - Evidence references
      
  - phase: "LLM Explainer"
    requirements:
      - Gemini 2.5 API access
      - Prompt templates
      - Cache infrastructure
    outputs:
      - Human-readable rationales
      - Cached explanations
      - Audit logs
      
  - phase: "Layered Cache Integration"
    requirements:
      - Redis or in-memory cache
      - TTL management
      - Invalidation logic
    outputs:
      - Multi-level cache
      - Background sweeper job
      - Cache hit metrics
      
  - phase: "Observability & Kill Switches"
    requirements:
      - Metrics collection
      - Alert configuration
      - Feature flag system
    outputs:
      - Real-time dashboards
      - Provider health monitoring
      - Emergency shutoff capability
      
  - phase: "E2E Testing & Load Validation"
    requirements:
      - Test data sets
      - Load testing tools
      - Performance baselines
    outputs:
      - SLO validation
      - Bottleneck identification
      - Production readiness
```

### A7. Cache Lifecycle Management

```typescript
// Background sweeper for expired cache entries
class CacheSweeper {
  async sweep(): Promise<void> {
    // Run every 5 minutes
    const expiredEntries = await db
      .from('pricing_cache')
      .select('*')
      .lt('expires_at', new Date().toISOString())
      .limit(1000);
    
    for (const entry of expiredEntries) {
      await db.transaction(async (tx) => {
        // Archive to cold storage if needed
        if (entry.preserve_for_audit) {
          await tx.from('pricing_cache_archive').insert({
            ...entry,
            archived_at: new Date()
          });
        }
        
        // Remove from hot cache
        await tx.from('pricing_cache')
          .delete()
          .eq('id', entry.id);
        
        // Update metrics
        await this.metrics.increment('cache.sweeper.removed', {
          cache_level: entry.cache_level,
          age_hours: this.getAgeHours(entry.created_at)
        });
      });
    }
  }
  
  // Quote cache lifecycle
  async createQuoteCache(quote: PriceQuote): Promise<void> {
    const ttl = this.calculateTTL(quote.sources);
    
    await db.from('pricing_cache').insert({
      cache_level: 'quote',
      cache_key: this.generateQuoteCacheKey(quote),
      data: quote,
      expires_at: new Date(Date.now() + ttl * 1000),
      price_quote_id: quote.id, // Atomic linkage
      organization_id: quote.organization_id,
      created_at: new Date()
    });
  }
}
```

### A8. Response Contract Enhancements

```typescript
// Enhanced response with tracing and consistency
interface PricingJobResponse {
  // Core fields
  job_id: string;
  status: JobStatus;
  
  // NEW: Tracing and consistency
  trace_id: string;                    // Distributed trace identifier
  consistency_token: string;            // Monotonic update verification
  
  // Timing and freshness
  created_at: string;
  updated_at: string;
  freshness_timestamp: string;         // Oldest data point used
  
  // Results
  price_quote?: PriceQuote;
  partial_results?: PartialResult[];
  
  // Evidence and sources
  basis_sources: string[];             // Always included
  evidence_refs?: EvidenceReference[];
  
  // Warnings and errors
  warnings?: Warning[];
  errors?: PricingError[];
}

interface PartialResult {
  // Progressive update fields
  timestamp: string;
  sources_completed: string[];
  sources_pending: string[];
  
  // Price data (monotonic)
  price_range: PriceRange;
  confidence: number;
  
  // NEW: Consistency tracking
  update_sequence: number;              // Monotonic counter
  consistency_token: string;            // Verify no regression
}
```

---

*This document represents the definitive agent-driven implementation guide. Use the specialized agent prompts sequentially to build a production-ready pricing analysis system with expert-level quality at every stage.*