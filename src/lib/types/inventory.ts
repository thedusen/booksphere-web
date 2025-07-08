// packages/shared/src/types/inventory.ts

export interface StockItem {
  stock_item_id: string;
  condition_name: string;
  selling_price_amount: number;
  sku: string | null;
  location_in_store_text: string | null;
  date_added_to_stock: string;
  is_active_for_sale: boolean;
  marketplace_listings: MarketplaceListing[];
  attributes: StockItemAttribute[];
  has_photos: boolean;
}

export interface MarketplaceListing {
  marketplace_name: string;
  status: 'active' | 'inactive' | 'sold';
  current_price: number;
  marketplace_sku: string | null;
}

export interface StockItemAttribute {
  name: string;
  value: boolean | string | number;
  category: string;
}

export interface GroupedEdition {
  edition_id: string;
  book_title: string;
  authors: string;
  isbn13: string | null;
  isbn10: string | null;
  publisher_name: string;
  published_date: string;
  cover_image_url: string | null;
  stock_items: Array<{
    stock_item_id: string;
    sku: string | null;
    selling_price_amount: number | null;
    location_in_store_text: string | null;
    condition_name: string;
    condition_notes: string | null;
    is_active_for_sale: boolean;
    date_added_to_stock: string;
  }>;
}

export type FilterType = "All" | "Available" | "Listed on Amazon" | "Listed on eBay" | "Needs Photos" | "Flagged" | "Low Stock";

// ✅ ADDED THE MISSING INTERFACES BELOW

export interface BookSummary {
  book_id: string;
  title: string;
  subtitle: string | null;
  primary_author: string;
  cover_image_url: string | null;
  isbn13: string | null;
  total_copies: number;
  editions_count: number;
  price_range: { min: number; max: number };
  stock_items: StockItem[];
}

export interface StockItemDetails {
  stock_item_id: string;
  sku: string;
  selling_price_amount: number;
  location_in_store_text: string | null;
  date_added_to_stock: string;
  is_active_for_sale: boolean;
  internal_notes: string | null;
  condition_id: string;
  condition_name: string;
  condition_notes: string | null;
  has_photos: boolean;
  edition_details: {
    edition_id: string;
    title: string;
    primary_author: string;
    cover_image_url: string | null;
    isbn13: string | null;
    isbn10: string | null;
    publisher_name: string | null;
    published_date: string | null;
  };
  marketplace_listings: {
    marketplace_id: string;
    marketplace_name: string;
    status: string;
    current_price: number;
    marketplace_sku: string | null;
    listing_url: string | null;
  }[];
  all_available_marketplaces: {
    marketplace_id: string;
    name: string;
    code: string;
    is_active: boolean;
  }[];
  attributes: {
    name: string;
    value: string | null;
    category: string;
  }[];
}

export interface ConditionStandard {
  condition_id: string;
  standard_name: string;
  description: string | null;
}