"use client";

import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useRef } from "react";
import type { FilterType } from "@/lib/types/inventory";
import type { AdvancedFilters } from "../components/inventory/AdvancedFilterModal";

// Define the shape of the state
export interface InventoryContextState {
    searchQuery: string;
    setSearchQuery: Dispatch<SetStateAction<string>>;
    sortBy: string;
    setSortBy: Dispatch<SetStateAction<string>>;
    filters: AdvancedFilters;
    setFilters: Dispatch<SetStateAction<AdvancedFilters>>;
    isFilterModalOpen: boolean;
    setFilterModalOpen: Dispatch<SetStateAction<boolean>>;
    scrollContainerRef: React.RefObject<HTMLElement | null>;
}

// Create the context with a default undefined value
const InventoryContext = createContext<InventoryContextState | undefined>(undefined);

// Define the default shape for the filters
const defaultFilters: AdvancedFilters = {
    conditions: [],
    publishers: [],
    attributes: [],
};

// Create the Provider component
export function InventoryStateProvider({ children }: { children: ReactNode }): React.ReactElement {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [sortBy, setSortBy] = useState<string>("date_added_to_stock DESC");
    const [filters, _setFilters] = useState<AdvancedFilters>(defaultFilters);
    const [isFilterModalOpen, setFilterModalOpen] = useState<boolean>(false);

    // Add scrollContainerRef
    const scrollContainerRef = useRef<HTMLElement | null>(null);

    // Memoized setFilters to avoid unnecessary updates
    const setFilters = React.useCallback((newFilters: AdvancedFilters | ((prev: AdvancedFilters) => AdvancedFilters)) => {
        _setFilters(prev => {
            const next = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
            return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
        });
    }, []);

    // The value provided to the context consumers
    const value = {
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        filters,
        setFilters,
        isFilterModalOpen,
        setFilterModalOpen,
        scrollContainerRef,
    };

    return (
        <InventoryContext.Provider value={value}>
            {children}
        </InventoryContext.Provider>
    );
}

// Create the custom hook for easy consumption
export function useInventoryState(): InventoryContextState {
    const context = useContext(InventoryContext);
    if (context === undefined) {
        throw new Error("useInventoryState must be used within an InventoryStateProvider");
    }
    return context;
}