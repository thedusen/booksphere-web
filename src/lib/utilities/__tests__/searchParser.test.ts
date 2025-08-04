/**
 * Comprehensive Unit Tests for Search Parser
 * 
 * Tests cover:
 * - Basic query parsing
 * - Price range parsing
 * - Quoted values handling  
 * - Multiple attribute parsing
 * - Edge cases and error conditions
 * - Performance characteristics
 */

import { describe, it, expect, vi } from 'vitest';
import { parseSearchQuery, type ParsedSearchQuery, type SearchFilters, type PriceRange } from '../searchParser';

describe('parseSearchQuery', () => {
  describe('Basic Free Text Parsing', () => {
    it('should parse simple free text query', () => {
      const result = parseSearchQuery('wheel of time');
      
      expect(result).toEqual({
        filter_json: {},
        search_query: 'wheel of time'
      });
    });

    it('should handle empty query', () => {
      const result = parseSearchQuery('');
      
      expect(result).toEqual({
        filter_json: {},
        search_query: ''
      });
    });

    it('should handle whitespace-only query', () => {
      const result = parseSearchQuery('   ');
      
      expect(result).toEqual({
        filter_json: {},
        search_query: ''
      });
    });
  });

  describe('Author Parsing', () => {
    it('should parse single word author', () => {
      const result = parseSearchQuery('author:Jordan');
      
      expect(result).toEqual({
        filter_json: { author: 'Jordan' },
        search_query: ''
      });
    });

    it('should parse quoted author with spaces', () => {
      const result = parseSearchQuery('author:"Robert Jordan"');
      
      expect(result).toEqual({
        filter_json: { author: 'Robert Jordan' },
        search_query: ''
      });
    });

    it('should handle case insensitive author keyword', () => {
      const result = parseSearchQuery('AUTHOR:Jordan');
      
      expect(result).toEqual({
        filter_json: { author: 'Jordan' },
        search_query: ''
      });
    });

    it('should combine author with free text', () => {
      const result = parseSearchQuery('wheel author:Jordan time');
      
      expect(result).toEqual({
        filter_json: { author: 'Jordan' },
        search_query: 'wheel time'
      });
    });
  });

  describe('Publisher Parsing', () => {
    it('should parse single word publisher', () => {
      const result = parseSearchQuery('publisher:Penguin');
      
      expect(result).toEqual({
        filter_json: { publisher: 'Penguin' },
        search_query: ''
      });
    });

    it('should parse quoted publisher with spaces', () => {
      const result = parseSearchQuery('publisher:"Random House"');
      
      expect(result).toEqual({
        filter_json: { publisher: 'Random House' },
        search_query: ''
      });
    });

    it('should handle case insensitive publisher keyword', () => {
      const result = parseSearchQuery('PUBLISHER:Penguin');
      
      expect(result).toEqual({
        filter_json: { publisher: 'Penguin' },
        search_query: ''
      });
    });
  });

  describe('Attribute Parsing', () => {
    it('should parse single attribute', () => {
      const result = parseSearchQuery('attr:signed');
      
      expect(result).toEqual({
        filter_json: { attr: ['signed'] },
        search_query: ''
      });
    });

    it('should parse quoted attribute with spaces', () => {
      const result = parseSearchQuery('attr:"first edition"');
      
      expect(result).toEqual({
        filter_json: { attr: ['first edition'] },
        search_query: ''
      });
    });

    it('should parse multiple attributes', () => {
      const result = parseSearchQuery('attr:signed attr:"first edition" attr:hardcover');
      
      expect(result).toEqual({
        filter_json: { attr: ['signed', 'first edition', 'hardcover'] },
        search_query: ''
      });
    });

    it('should handle case insensitive attr keyword', () => {
      const result = parseSearchQuery('ATTR:signed');
      
      expect(result).toEqual({
        filter_json: { attr: ['signed'] },
        search_query: ''
      });
    });
  });

  describe('Price Range Parsing', () => {
    it('should parse single price', () => {
      const result = parseSearchQuery('$25');
      
      expect(result).toEqual({
        filter_json: { price: { min: 25, max: 25 } },
        search_query: ''
      });
    });

    it('should parse price range', () => {
      const result = parseSearchQuery('$25-100');
      
      expect(result).toEqual({
        filter_json: { price: { min: 25, max: 100 } },
        search_query: ''
      });
    });

    it('should parse decimal prices', () => {
      const result = parseSearchQuery('$25.99-99.95');
      
      expect(result).toEqual({
        filter_json: { price: { min: 25.99, max: 99.95 } },
        search_query: ''
      });
    });

    it('should parse single decimal price', () => {
      const result = parseSearchQuery('$29.99');
      
      expect(result).toEqual({
        filter_json: { price: { min: 29.99, max: 29.99 } },
        search_query: ''
      });
    });

    it('should ignore invalid price formats', () => {
      const result = parseSearchQuery('$invalid $-25 $25-');
      
      expect(result).toEqual({
        filter_json: {},
        search_query: '$invalid $-25 $25-'
      });
    });
  });

  describe('Complex Query Parsing', () => {
    it('should parse query with all filter types', () => {
      const result = parseSearchQuery('wheel author:"Robert Jordan" $25-100 attr:signed publisher:Tor fantasy');
      
      expect(result).toEqual({
        filter_json: {
          author: 'Robert Jordan',
          attr: ['signed'],
          publisher: 'Tor',
          price: { min: 25, max: 100 }
        },
        search_query: 'wheel fantasy'
      });
    });

    it('should handle multiple attributes in complex query', () => {
      const result = parseSearchQuery('fantasy attr:signed attr:"first edition" author:Jordan $50-200 epic');
      
      expect(result).toEqual({
        filter_json: {
          author: 'Jordan',
          attr: ['signed', 'first edition'],
          price: { min: 50, max: 200 }
        },
        search_query: 'fantasy epic'
      });
    });

    it('should preserve order of free text words', () => {
      const result = parseSearchQuery('wheel of attr:signed time author:Jordan fantasy series');
      
      expect(result).toEqual({
        filter_json: {
          author: 'Jordan',
          attr: ['signed']
        },
        search_query: 'wheel of time fantasy series'
      });
    });
  });

  describe('Quote Handling', () => {
    it('should handle unmatched quotes in free text', () => {
      const result = parseSearchQuery('wheel "of time author:Jordan');
      
      expect(result).toEqual({
        filter_json: {},
        search_query: 'wheel of time author:Jordan'
      });
    });

    it('should handle quotes around entire filter value', () => {
      const result = parseSearchQuery('author:"Robert Jordan"');
      
      expect(result).toEqual({
        filter_json: { author: 'Robert Jordan' },
        search_query: ''
      });
    });

    it('should handle nested quotes correctly', () => {
      const result = parseSearchQuery('attr:"The \\"Wheel\\" of Time"');
      
      expect(result).toEqual({
        filter_json: { attr: ['The \\Wheel\\ of Time'] },
        search_query: ''
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle consecutive spaces', () => {
      const result = parseSearchQuery('wheel     of     time');
      
      expect(result).toEqual({
        filter_json: {},
        search_query: 'wheel of time'
      });
    });

    it('should handle tabs and newlines as whitespace', () => {
      const result = parseSearchQuery('wheel\tof\ntime');
      
      expect(result).toEqual({
        filter_json: {},
        search_query: 'wheel of time'
      });
    });

    it('should handle filter without value', () => {
      const result = parseSearchQuery('author: publisher: attr:');
      
      expect(result).toEqual({
        filter_json: {},
        search_query: 'author: publisher: attr:'
      });
    });

    it('should handle special characters in free text', () => {
      const result = parseSearchQuery('book!@#$%^&*()');
      
      expect(result).toEqual({
        filter_json: {},
        search_query: 'book!@#$%^&*()'
      });
    });

    it('should handle very long query string', () => {
      const longQuery = 'word '.repeat(1000) + 'author:test';
      const result = parseSearchQuery(longQuery);
      
      expect(result.filter_json.author).toBe('test');
      expect(result.search_query).toContain('word');
    });
  });

  describe('Type Safety', () => {
    it('should return correctly typed result', () => {
      const result: ParsedSearchQuery = parseSearchQuery('author:test $25-50 attr:signed fantasy');
      
      // Type assertions to ensure TypeScript types are correct
      expect(typeof result.search_query).toBe('string');
      expect(typeof result.filter_json).toBe('object');
      
      if (result.filter_json.author) {
        expect(typeof result.filter_json.author).toBe('string');
      }
      
      if (result.filter_json.price) {
        expect(typeof result.filter_json.price.min).toBe('number');
        expect(typeof result.filter_json.price.max).toBe('number');
      }
      
      if (result.filter_json.attr) {
        expect(Array.isArray(result.filter_json.attr)).toBe(true);
      }
    });
  });

  describe('Performance', () => {
    it('should handle reasonable query size efficiently', () => {
      const startTime = performance.now();
      
      // Test with reasonably complex query
      for (let i = 0; i < 1000; i++) {
        parseSearchQuery('fantasy author:"Robert Jordan" $25-100 attr:signed attr:"first edition" publisher:Tor epic series');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete 1000 parses in reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);
    });

    it('should not consume excessive memory', () => {
      // Create many different queries to test memory usage
      const queries: string[] = [];
      
      for (let i = 0; i < 100; i++) {
        queries.push(`query${i} author:author${i} $${i}-${i + 50} attr:attr${i}`);
      }
      
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      queries.forEach(query => parseSearchQuery(query));
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory usage should not increase dramatically (less than 1MB for 100 queries)
      if (initialMemory > 0 && finalMemory > 0) {
        expect(finalMemory - initialMemory).toBeLessThan(1024 * 1024);
      }
    });
  });
}); 