/**
 * Cataloging Jobs Dashboard
 * 
 * This page implements the comprehensive cataloging dashboard following the UX design
 * specifications with performance optimizations for production scale:
 * 
 * 1. **Performance Optimizations**: Uses OptimizedCatalogingDashboard for 1,000+ jobs
 * 2. **Information Architecture**: Prioritizes job status, metadata, and actions
 * 3. **Filtering System**: Status tabs, search, source type, and date range filters
 * 4. **Bulk Operations**: Multi-select with retry/delete actions
 * 5. **Responsive Design**: DataTable on desktop, Card list on mobile
 * 6. **Accessibility**: Full keyboard navigation, ARIA labels, screen reader support
 * 7. **Empty States**: Helpful guidance for new users and filtered results
 * 
 * Architecture Integration:
 * - Uses React Query hooks for data management
 * - Implements real-time updates via Supabase subscriptions
 * - Follows multi-tenant security patterns
 * - Provides comprehensive error handling
 * - Optimized for large datasets with memoization and efficient selection
 * 
 * Performance Features:
 * - O(1) selection operations using Set-based approach
 * - Memoized date formatting with LRU cache
 * - Debounced search to prevent excessive API calls
 * - React.memo for component optimization
 * - Memory usage tracking and cleanup
 */

'use client';

import React from 'react';
import { OptimizedCatalogingDashboard } from './components/OptimizedCatalogingDashboard';

/**
 * Main cataloging dashboard page with performance optimizations
 * 
 * This component now uses the OptimizedCatalogingDashboard which provides:
 * - Efficient handling of 1,000+ cataloging jobs
 * - O(1) selection operations
 * - Memoized components and computations
 * - Memory usage monitoring
 * - Error boundaries for resilient operation
 */
export default function CatalogingDashboard() {
  return (
    <OptimizedCatalogingDashboard 
      enablePerformanceMonitoring={process.env.NODE_ENV === 'development'}
      enableVirtualScrolling={false} // Can be enabled in future for very large datasets
      maxPageSize={100} // Reasonable default for performance
    />
  );
} 