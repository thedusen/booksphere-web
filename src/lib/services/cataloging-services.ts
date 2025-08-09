/**
 * Cataloging Services - Frontend Service Façades
 * 
 * This module implements the frontend service layer for the cataloging system,
 * providing clean abstractions over Supabase data access with React Query
 * integration, caching, and error handling.
 * 
 * Architecture Alignment:
 * - Service boundaries maintain separation of concerns
 * - 24h staleTime for slow-moving reference data
 * - Graceful degradation for network failures
 * - Type-safe interfaces throughout
 * - Debounced search operations
 * - Comprehensive error handling
 */

import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { Database } from '@/lib/supabase/types';
import { BookMetadata } from '@/lib/types/jobs';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Attribute-related types
export interface AttributeCategory {
  category_id: string;
  name: string;
  description?: string;
  display_order: number;
}

export interface AttributeType {
  attribute_type_id: string;
  category_id: string;
  name: string;
  description?: string;
  data_type: 'boolean' | 'text' | 'number' | 'date';
  display_order: number;
  category?: AttributeCategory;
}

export interface GroupedAttributes {
  [categoryName: string]: AttributeType[];
}

// Location-related types
export interface PublisherLocation {
  place_id: string;
  name: string;
  country?: string;
  region?: string;
}

// Format-related types
export interface BookFormat {
  item_type_id: string;
  name: string;
  description?: string;
  display_order: number;
}

// Edition matching types
export interface EditionMatch {
  edition_id: string;
  title: string;
  subtitle?: string;
  authors?: string[];
  publisher_name?: string;
  publication_year?: number;
  isbn13?: string;
  isbn10?: string;
  confidence_score: number;
  match_reasons: string[];
  cover_image_url?: string;
}

export interface EditionMatchResponse {
  edition_id: string;
  title: string;
  subtitle: string | null;
  publisher_name: string | null;
  publication_year: number | null;
  isbn13: string | null;
  isbn10: string | null;
  cover_image_url: string | null;
}

export interface EditionMatchRequest {
  title: string;
  subtitle?: string;
  isbn13?: string;
  isbn10?: string;
  publisher_name?: string;
  publication_year?: number;
}

// Service error types
export class CatalogingServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CatalogingServiceError';
  }
}

// ============================================================================
// CACHE KEY FACTORIES
// ============================================================================

export const catalogingServiceKeys = {
  // Attributes
  attributes: {
    all: ['cataloging-attributes'] as const,
    categories: () => [...catalogingServiceKeys.attributes.all, 'categories'] as const,
    types: () => [...catalogingServiceKeys.attributes.all, 'types'] as const,
    grouped: () => [...catalogingServiceKeys.attributes.all, 'grouped'] as const,
  },
  
  // Locations
  locations: {
    all: ['cataloging-locations'] as const,
    search: (query: string) => [...catalogingServiceKeys.locations.all, 'search', query] as const,
  },
  
  // Formats
  formats: {
    all: ['cataloging-formats'] as const,
    list: () => [...catalogingServiceKeys.formats.all, 'list'] as const,
  },
  
  // Edition matching
  editions: {
    all: ['cataloging-editions'] as const,
    match: (request: EditionMatchRequest) => [...catalogingServiceKeys.editions.all, 'match', request] as const,
  },
} as const;

// ============================================================================
// ATTRIBUTE SERVICE
// ============================================================================

/**
 * AttributeService - Manages the 53 book-specific attributes
 * 
 * Provides access to attribute categories and types with proper grouping
 * and caching. Implements progressive disclosure patterns for UI.
 */
export class AttributeService {
  private static instance: AttributeService;
  
  static getInstance(): AttributeService {
    if (!AttributeService.instance) {
      AttributeService.instance = new AttributeService();
    }
    return AttributeService.instance;
  }

  /**
   * Fetch all attribute categories
   */
  async fetchCategories(): Promise<AttributeCategory[]> {
    try {
      const { data, error } = await supabase
        .from('attribute_categories')
        .select('*')
        .order('display_order');

      if (error) {
        throw new CatalogingServiceError(
          'Failed to fetch attribute categories',
          'FETCH_CATEGORIES_ERROR',
          { supabaseError: error }
        );
      }

      return data || [];
    } catch (error) {
      if (error instanceof CatalogingServiceError) throw error;
      throw new CatalogingServiceError(
        'Unexpected error fetching attribute categories',
        'UNKNOWN_ERROR',
        { originalError: error }
      );
    }
  }

  /**
   * Fetch all attribute types with category information
   */
  async fetchAttributeTypes(): Promise<AttributeType[]> {
    try {
      const { data, error } = await supabase
        .from('attribute_types')
        .select(`
          *,
          category:attribute_categories(*)
        `)
        .order('display_order');

      if (error) {
        throw new CatalogingServiceError(
          'Failed to fetch attribute types',
          'FETCH_ATTRIBUTES_ERROR',
          { supabaseError: error }
        );
      }

      return data || [];
    } catch (error) {
      if (error instanceof CatalogingServiceError) throw error;
      throw new CatalogingServiceError(
        'Unexpected error fetching attribute types',
        'UNKNOWN_ERROR',
        { originalError: error }
      );
    }
  }

  /**
   * Group attributes by category for UI display
   */
  groupAttributesByCategory(attributes: AttributeType[]): GroupedAttributes {
    return attributes.reduce((groups, attribute) => {
      const categoryName = attribute.category?.name || 'Uncategorized';
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(attribute);
      return groups;
    }, {} as GroupedAttributes);
  }

  /**
   * Search attributes by name or description
   */
  searchAttributes(attributes: AttributeType[], query: string): AttributeType[] {
    if (!query.trim()) return attributes;
    
    const searchTerm = query.toLowerCase();
    return attributes.filter(attr => 
      attr.name.toLowerCase().includes(searchTerm) ||
      attr.description?.toLowerCase().includes(searchTerm) ||
      attr.category?.name.toLowerCase().includes(searchTerm)
    );
  }
}

// ============================================================================
// LOCATION SERVICE
// ============================================================================

/**
 * LocationService - Manages publisher locations
 * 
 * Provides search functionality for publisher locations with
 * graceful fallback to free-text entry.
 */
export class LocationService {
  private static instance: LocationService;
  
  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Search publisher locations by name
   */
  async searchLocations(query: string, limit: number = 10): Promise<PublisherLocation[]> {
    if (!query.trim()) return [];

    try {
      const { data, error } = await supabase
        .from('places')
        .select('place_id, name, country, region')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(limit);

      if (error) {
        throw new CatalogingServiceError(
          'Failed to search locations',
          'SEARCH_LOCATIONS_ERROR',
          { supabaseError: error }
        );
      }

      return data || [];
    } catch (error) {
      if (error instanceof CatalogingServiceError) throw error;
      throw new CatalogingServiceError(
        'Unexpected error searching locations',
        'UNKNOWN_ERROR',
        { originalError: error }
      );
    }
  }

  /**
   * Get location by ID
   */
  async getLocationById(placeId: string): Promise<PublisherLocation | null> {
    try {
      const { data, error } = await supabase
        .from('places')
        .select('place_id, name, country, region')
        .eq('place_id', placeId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new CatalogingServiceError(
          'Failed to fetch location',
          'FETCH_LOCATION_ERROR',
          { supabaseError: error }
        );
      }

      return data;
    } catch (error) {
      if (error instanceof CatalogingServiceError) throw error;
      throw new CatalogingServiceError(
        'Unexpected error fetching location',
        'UNKNOWN_ERROR',
        { originalError: error }
      );
    }
  }
}

// ============================================================================
// FORMAT SERVICE
// ============================================================================

/**
 * FormatService - Manages book formats
 * 
 * Provides access to book format types with caching.
 */
export class FormatService {
  private static instance: FormatService;
  
  static getInstance(): FormatService {
    if (!FormatService.instance) {
      FormatService.instance = new FormatService();
    }
    return FormatService.instance;
  }

  /**
   * Fetch all book formats
   */
  async fetchFormats(): Promise<BookFormat[]> {
    try {
      const { data, error } = await supabase
        .from('item_types')
        .select('item_type_id, name, description, display_order')
        .order('display_order');

      if (error) {
        throw new CatalogingServiceError(
          'Failed to fetch book formats',
          'FETCH_FORMATS_ERROR',
          { supabaseError: error }
        );
      }

      return data || [];
    } catch (error) {
      if (error instanceof CatalogingServiceError) throw error;
      throw new CatalogingServiceError(
        'Unexpected error fetching book formats',
        'UNKNOWN_ERROR',
        { originalError: error }
      );
    }
  }

  /**
   * Get format by ID
   */
  async getFormatById(itemTypeId: string): Promise<BookFormat | null> {
    try {
      const { data, error } = await supabase
        .from('item_types')
        .select('item_type_id, name, description, display_order')
        .eq('item_type_id', itemTypeId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new CatalogingServiceError(
          'Failed to fetch format',
          'FETCH_FORMAT_ERROR',
          { supabaseError: error }
        );
      }

      return data;
    } catch (error) {
      if (error instanceof CatalogingServiceError) throw error;
      throw new CatalogingServiceError(
        'Unexpected error fetching format',
        'UNKNOWN_ERROR',
        { originalError: error }
      );
    }
  }
}

// ============================================================================
// EDITION MATCH SERVICE
// ============================================================================

/**
 * EditionMatchService - Manages edition matching
 * 
 * Provides edition matching functionality using the existing
 * match_book_by_details RPC with proper debouncing and caching.
 */
export class EditionMatchService {
  private static instance: EditionMatchService;
  
  static getInstance(): EditionMatchService {
    if (!EditionMatchService.instance) {
      EditionMatchService.instance = new EditionMatchService();
    }
    return EditionMatchService.instance;
  }

  /**
   * Find matching editions using the existing RPC
   */
  async findMatches(
    request: EditionMatchRequest,
    organizationId: string,
    limit: number = 3
  ): Promise<EditionMatch[]> {
    try {
      // Validate input data
      if (!organizationId) {
        console.warn('EditionMatchService: No organization ID provided');
        return [];
      }

      if (!request.title && !request.isbn13 && !request.isbn10) {
        console.warn('EditionMatchService: No searchable criteria provided');
        return [];
      }

      console.log('🔍 Finding edition matches for:', { 
        title: request.title, 
        isbn13: request.isbn13, 
        organizationId 
      });

      const { data, error } = await supabase
        .rpc('match_book_by_details', {
          p_organization_id: organizationId,
          p_title: request.title || null,
          p_subtitle: request.subtitle || null,
          p_isbn13: request.isbn13 || null,
          p_isbn10: request.isbn10 || null,
          p_publisher_name: request.publisher_name || null,
          p_publication_year: request.publication_year || null,
          p_limit: limit
        });

      if (error) {
        // Check if it's a missing function error
        if (error.code === '42883' || error.message?.includes('function') || error.message?.includes('does not exist')) {
          console.warn('EditionMatchService: RPC function not available, returning empty matches');
          return [];
        }
        
        console.error('EditionMatchService error:', error);
        throw new CatalogingServiceError(
          'Failed to find edition matches',
          'FIND_MATCHES_ERROR',
          { supabaseError: error }
        );
      }

      // Transform the RPC response to our EditionMatch interface
      return (data || []).map((match: EditionMatchResponse) => ({
        edition_id: match.edition_id,
        title: match.title,
        subtitle: match.subtitle || undefined,
        publisher_name: match.publisher_name || undefined,
        publication_year: match.publication_year || undefined,
        isbn13: match.isbn13 || undefined,
        isbn10: match.isbn10 || undefined,
        confidence_score: this.calculateConfidenceScore(request, match),
        match_reasons: this.getMatchReasons(request, match),
        cover_image_url: match.cover_image_url || undefined,
      }));
    } catch (error) {
      if (error instanceof CatalogingServiceError) throw error;
      throw new CatalogingServiceError(
        'Unexpected error finding edition matches',
        'UNKNOWN_ERROR',
        { originalError: error }
      );
    }
  }

  /**
   * Calculate confidence score based on matching criteria
   */
  private calculateConfidenceScore(request: EditionMatchRequest, match: EditionMatchResponse): number {
    let score = 0;
    let totalFactors = 0;

    // ISBN match (highest weight)
    if (request.isbn13 && match.isbn13) {
      totalFactors += 40;
      if (request.isbn13 === match.isbn13) score += 40;
    }
    if (request.isbn10 && match.isbn10) {
      totalFactors += 40;
      if (request.isbn10 === match.isbn10) score += 40;
    }

    // Title match (high weight)
    if (request.title && match.title) {
      totalFactors += 30;
      const titleSimilarity = this.calculateStringSimilarity(request.title, match.title);
      score += titleSimilarity * 30;
    }

    // Publisher match (medium weight)
    if (request.publisher_name && match.publisher_name) {
      totalFactors += 20;
      const publisherSimilarity = this.calculateStringSimilarity(request.publisher_name, match.publisher_name);
      score += publisherSimilarity * 20;
    }

    // Publication year match (low weight)
    if (request.publication_year && match.publication_year) {
      totalFactors += 10;
      if (request.publication_year === match.publication_year) score += 10;
    }

    return totalFactors > 0 ? Math.round((score / totalFactors) * 100) : 0;
  }

  /**
   * Get human-readable match reasons
   */
  private getMatchReasons(request: EditionMatchRequest, match: EditionMatchResponse): string[] {
    const reasons: string[] = [];

    if (request.isbn13 && match.isbn13 && request.isbn13 === match.isbn13) {
      reasons.push('ISBN-13 exact match');
    }
    if (request.isbn10 && match.isbn10 && request.isbn10 === match.isbn10) {
      reasons.push('ISBN-10 exact match');
    }
    if (request.title && match.title && this.calculateStringSimilarity(request.title, match.title) > 0.8) {
      reasons.push('Title very similar');
    }
    if (request.publisher_name && match.publisher_name && this.calculateStringSimilarity(request.publisher_name, match.publisher_name) > 0.8) {
      reasons.push('Publisher very similar');
    }
    if (request.publication_year && match.publication_year && request.publication_year === match.publication_year) {
      reasons.push('Publication year match');
    }

    return reasons;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1;
    
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * React Query hooks for each service with proper caching and error handling
 */

// Attribute hooks
export const useAttributeCategories = () => {
  const attributeService = AttributeService.getInstance();
  
  return useQuery({
    queryKey: catalogingServiceKeys.attributes.categories(),
    queryFn: () => attributeService.fetchCategories(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useAttributeTypes = () => {
  const attributeService = AttributeService.getInstance();
  
  return useQuery({
    queryKey: catalogingServiceKeys.attributes.types(),
    queryFn: () => attributeService.fetchAttributeTypes(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useGroupedAttributes = () => {
  const attributeService = AttributeService.getInstance();
  const { data: attributes, ...rest } = useAttributeTypes();
  
  const groupedAttributes = useMemo(() => {
    if (!attributes) return {};
    return attributeService.groupAttributesByCategory(attributes);
  }, [attributes, attributeService]);
  
  return {
    data: groupedAttributes,
    ...rest,
  };
};

// Location hooks
export const useLocationSearch = (query: string, enabled: boolean = true) => {
  const locationService = LocationService.getInstance();
  
  return useQuery({
    queryKey: catalogingServiceKeys.locations.search(query),
    queryFn: () => locationService.searchLocations(query),
    enabled: enabled && query.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Format hooks
export const useBookFormats = () => {
  const formatService = FormatService.getInstance();
  
  return useQuery({
    queryKey: catalogingServiceKeys.formats.list(),
    queryFn: () => formatService.fetchFormats(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Edition matching hooks
export const useEditionMatches = (
  request: EditionMatchRequest,
  enabled: boolean = true
) => {
  const { organizationId } = useOrganization();
  const editionMatchService = EditionMatchService.getInstance();
  
  return useQuery({
    queryKey: catalogingServiceKeys.editions.match(request),
    queryFn: () => editionMatchService.findMatches(request, organizationId || ''),
    enabled: enabled && Boolean(request.title || request.isbn13 || request.isbn10) && Boolean(organizationId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Debounced search hook for better UX
 */
export const useDebouncedSearch = (value: string, delay: number = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Service health check utility
 */
export const useServiceHealth = () => {
  const queryClient = useQueryClient();
  
  return useCallback(async () => {
    try {
      // Test basic connectivity
      const { data, error } = await supabase
        .from('attribute_categories')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      
      return {
        healthy: true,
        services: {
          attributes: true,
          locations: true,
          formats: true,
          editions: true,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        services: {
          attributes: false,
          locations: false,
          formats: false,
          editions: false,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, []);
}; 