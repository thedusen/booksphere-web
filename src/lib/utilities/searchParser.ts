// packages/shared/src/searchParser.ts

/**
 * Lightweight search query parser.
 *
 * Supported token syntax examples:
 *   author:Lee              => { author: "Lee" }
 *   author:"Robert Jordan"  => { author: "Robert Jordan" }
 *   attr:signed             => { attr: ["signed"] }
 *   attr:"first edition"    => { attr: ["first edition"] }
 *   publisher:Penguin       => { publisher: "Penguin" }
 *   $25-100                 => { price: { min: 25, max: 100 } }
 *   $15                     => { price: { min: 15, max: 15 } }
 *
 * Everything that cannot be interpreted as a structured token is treated as
 * free-text and returned in `search_query` so it can be sent to full-text search.
 */

export interface PriceRange {
  min?: number;
  max?: number;
}

export interface SearchFilters {
  author?: string;
  attr?: string[];
  publisher?: string;
  price?: PriceRange;
  // Extend with more filters as needed.
}

export interface ParsedSearchQuery {
  /** Structured filters extracted from the query string. */
  filter_json: SearchFilters;
  /** Remaining words that are not structured tokens. */
  search_query: string;
}

/**
 * Parse a raw user query string into structured filters + free-text component.
 *
 * The parser is intentionally lightweight and forgiving – it works on a simple
 * tokenisation-by-whitespace strategy.  In order to support spaces inside a
 * value (eg `author:"Robert Jordan"`), surround the value with double quotes.
 *
 * @example
 *   parseSearchQuery('wheel author:"Robert Jordan" $5-20 attr:signed');
 *   => {
 *        filter_json: {
 *          author: 'Robert Jordan',
 *          attr: ['signed'],
 *          price: { min: 5, max: 20 }
 *        },
 *        search_query: 'wheel'
 *      }
 */
export function parseSearchQuery(rawQuery: string): ParsedSearchQuery {
  const filter: SearchFilters = {};
  const freeText: string[] = [];

  // Split by whitespace but keep quotes together.
  const tokens = tokenise(rawQuery);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // ---- Price token ------------------------------------------------------
    // Price range token is the only one *not* prefixed by a keyword.
    // Examples: $25-100  |  $30
    const priceMatch = token.match(/^\$(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?$/);
    if (priceMatch) {
      const [, minStr, maxStr] = priceMatch;
      const min = Number(minStr);
      const max = maxStr ? Number(maxStr) : min;
      filter.price = { min, max };
      continue;
    }

    // ---- Keyword:value tokens --------------------------------------------
    const keywordMatch = token.match(/^(author|attr|publisher):(.+)$/i);
    if (keywordMatch) {
      const [, keyword, valueRaw] = keywordMatch;
      const value = stripQuotes(valueRaw);

      switch (keyword.toLowerCase()) {
        case 'author':
          filter.author = value;
          break;
        case 'publisher':
          filter.publisher = value;
          break;
        case 'attr':
          if (!filter.attr) filter.attr = [];
          filter.attr.push(value);
          break;
      }
      continue;
    }

    // Everything else is free-text.
    freeText.push(token);
  }

  return {
    filter_json: filter,
    search_query: freeText.join(' '),
  };
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Very small tokenizer that splits on whitespace but keeps quoted substrings
 * (double quotes) together – like a shell would.
 */
function tokenise(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      continue; // drop quotes themselves
    }

    if (!inQuotes && /\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) tokens.push(current);

  return tokens;
}

function stripQuotes(value: string): string {
  return value.replace(/^"|"$/g, '');
}
