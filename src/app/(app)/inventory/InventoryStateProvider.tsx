"use client";
import React, { createContext, useContext, useState } from "react";
import type { FilterType } from "@/lib/types/inventory";
import type { AdvancedFilters } from "../components/inventory/AdvancedFilterModal";

interface InventoryState {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  filterType: FilterType;
  filters: AdvancedFilters;
  setFilters: (v: AdvancedFilters) => void;
}

const InventoryContext = createContext<InventoryState | undefined>(undefined);

export const InventoryStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("date_added_to_stock DESC");
  const [filterType] = useState<FilterType>("All");
  const [filters, setFilters] = useState<AdvancedFilters>({ conditions: [], publishers: [], attributes: [] });

  return (
    <InventoryContext.Provider value={{
      searchQuery, setSearchQuery,
      sortBy, setSortBy,
      filterType,
      filters, setFilters
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export function useInventoryState() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventoryState must be used within InventoryStateProvider");
  return ctx;
} 