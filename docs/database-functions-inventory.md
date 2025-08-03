# Database Functions Inventory
## Generated: 2025-08-03

This document provides a comprehensive inventory of all database functions used across the Booksphere ecosystem, including Web, Mobile, and Buildship/External APIs.

## Active Functions by Platform

### Web App Functions (booksphere-web)

#### Inventory Management
- `search_inventory` - ✅ SHARED with Mobile
- `get_edition_details` - Web only
- `get_inventory_summary_metrics` - ✅ SHARED with Mobile
- `get_stock_item_details` - ✅ SHARED with Mobile
- `get_book_summary` - ✅ SHARED with Mobile
- `add_edition_to_inventory` - Web only

#### Cataloging Workflow
- `get_cataloging_job_stats` - Web only
- `create_cataloging_job` - ✅ SHARED with Buildship
- `delete_cataloging_jobs` - Web only
- `retry_cataloging_jobs` - Web only
- `execute_bulk_delete` - Web only
- `execute_bulk_retry` - Web only

#### Data Quality & Flagging
- `create_data_quality_flag` - Web only
- `get_paginated_flags` - Web only
- `update_flag_status` - Web only

#### Outbox Pattern (Event Processing)
- `prune_delivered_events` - Web only
- `migrate_failed_events_to_dlq` - Web only
- `get_or_create_processor_cursor` - Web only
- `update_processor_cursor` - Web only
- `confirm_event_delivery` - Web only

### Mobile App Functions (booksphere-mobile)

#### Inventory Functions
- `search_inventory` - ✅ SHARED with Web
- `get_inventory_stats` - Mobile only
- `get_inventory_search_count` - Mobile only
- `get_stock_item_details` - ✅ SHARED with Web
- `get_book_summary` - ✅ SHARED with Web
- `get_inventory_summary_metrics` - ✅ SHARED with Web

### Buildship/External API Functions

#### Book Data Enrichment
- `get_edition_details_by_isbn` - Buildship only
- `get_full_edition_details` - Buildship only
- `match_book_by_details` - Buildship only

#### Marketplace Integration
- `upsert_ebay_tokens` - Buildship only
- `get_ebay_token_status` - Buildship only
- `update_ebay_access_token` - Buildship only
- `get_sp_api_token_status` - Buildship only (Amazon)

#### Workflow Support
- `create_cataloging_job` - ✅ SHARED with Web

## Function Version History & Duplicates

### Functions with Multiple Versions (To Be Cleaned)

#### `search_inventory`
- **Version 1**: Initial implementation with pagination bugs
- **Version 2**: Fixed grouping bugs
- **Version 3**: Keyset pagination implementation
- **Version 4**: ✅ CURRENT - Optimized version (KEEP)

#### `get_edition_details`
- **Version 1**: Original with different parameter names
- **Version 2**: Fixed condition column reference
- **Version 3**: ✅ CURRENT - Proper parameters (KEEP)

#### `create_data_quality_flag`
- **Version 1**: Original with title parameter
- **Version 2**: ✅ CURRENT - Without title parameter (KEEP)

#### `get_paginated_flags`
- **Version 1**: Original with SQL injection vulnerability
- **Version 2**: Fixed SQL injection
- **Version 3**: ✅ CURRENT - Added org filtering (KEEP)

## Safety Classification

### ❌ NEVER REMOVE (Cross-Platform Critical)
1. `search_inventory` (latest version)
2. `get_stock_item_details`
3. `get_book_summary`
4. `get_inventory_summary_metrics`
5. `create_cataloging_job`

### ⚠️ PLATFORM-SPECIFIC (Keep All Current Versions)
- All current flagging functions (Web only)
- All current outbox functions (Web only)
- All current marketplace functions (Buildship only)
- Mobile-specific inventory functions

### ✅ SAFE TO REMOVE (Obsolete Versions Only)
1. Old versions of `search_inventory` (versions 1-3)
2. Old versions of `get_edition_details` (versions 1-2)
3. Old version of `create_data_quality_flag` (version 1)
4. Old versions of `get_paginated_flags` (versions 1-2)

## Notes
- Total Active Functions: ~29 unique functions
- Cross-Platform Shared: 5 functions
- Platform-Specific: 24 functions
- Obsolete Versions to Remove: ~9 function versions