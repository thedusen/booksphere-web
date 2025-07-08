"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Filter } from "lucide-react";
import { InventoryListTable } from "../components/inventory/InventoryListTable";
import { useInventory } from "@/hooks/useInventory";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/lib/supabase";
import type { FilterType } from "@/lib/types/inventory";
import { useOrganization } from "@/hooks/useOrganization";
import { InventoryDashboardHeader } from "../components/inventory/InventoryDashboardHeader";
import { EmptyState } from "../components/inventory/EmptyState";
import { useInventorySummaryMetrics } from "@/hooks/useInventory";
import { AdvancedFilterModal, AdvancedFilters } from "../components/inventory/AdvancedFilterModal";
import { InventorySortDropdown } from "../components/inventory/InventorySortDropdown";
import { Skeleton } from "@/components/ui/skeleton";
import { useInventoryState } from "./InventoryStateProvider";

export default function InventoryPage() {
    const {
        searchQuery, setSearchQuery,
        sortBy, setSortBy,
        filterType,
        filters, setFilters
    } = useInventoryState();
    const { organizationId, loading: orgLoading, error: orgError } = useOrganization();
    const [showAdvancedFilterModal, setShowAdvancedFilterModal] = useState<boolean>(false);

    // Debounce search input
    const debouncedSearch = useDebounce(searchQuery, 300);

    // Fetch inventory data only if organizationId is available
    const {
        data,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInventory({
        searchQuery: debouncedSearch,
        filterType,
        organizationId: organizationId || "", // useInventory expects a string
        client: supabase,
        sortBy,
        filters,
    });

    // Fetch summary metrics
    const {
        data: summaryMetrics,
        isLoading: summaryLoading,
    } = useInventorySummaryMetrics({
        searchQuery: debouncedSearch,
        filterType,
        organizationId: organizationId || "",
        client: supabase,
        sortBy,
        filters,
    });

    // Flatten paginated data
    const inventoryData = data?.pages.flat() ?? [];

    // Advanced filter modal handlers
    const handleApplyAdvancedFilters = (newFilters: AdvancedFilters) => {
        setFilters(newFilters);
        setShowAdvancedFilterModal(false);
    };

    // Mock publisher options for now
    const mockPublisherOptions: string[] = ["Penguin", "HarperCollins", "Random House", "Simon & Schuster"];

    if (orgLoading) {
        return <div className="py-8 text-center">Loading organization...</div>;
    }
    if (orgError) {
        return <div className="py-8 text-center text-red-500">Error: {orgError}</div>;
    }
    if (!organizationId) {
        return <div className="py-8 text-center text-muted-foreground">No organization found.</div>;
    }

    // Show skeleton loader while loading inventory
    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
                    <Button asChild>
                        <Link href="/inventory/new">
                            <Plus className="mr-2 h-5 w-5" />
                            Add New Item
                        </Link>
                    </Button>
                </div>
                {/* Dashboard Header */}
                <InventoryDashboardHeader
                    bookCount={summaryMetrics?.book_count ?? 0}
                    totalItemCount={summaryMetrics?.total_item_count ?? 0}
                    totalValueInCents={summaryMetrics?.total_value_in_cents ?? 0}
                    isLoading={summaryLoading}
                />
                {/* Search & Filter Row */}
                <div className="flex items-center gap-2">
                    <Input
                        type="text"
                        placeholder="Search inventory..."
                        className="flex-1"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <Button variant="outline" size="icon" aria-label="Filter options" onClick={() => setShowAdvancedFilterModal(true)}>
                        <Filter className="h-5 w-5" />
                    </Button>
                    <InventorySortDropdown
                        activeSort={sortBy}
                        onSortChange={setSortBy}
                    />
                </div>
                {/* Advanced Filter Modal */}
                <AdvancedFilterModal
                    isOpen={showAdvancedFilterModal}
                    onClose={() => setShowAdvancedFilterModal(false)}
                    onApply={handleApplyAdvancedFilters}
                    currentFilters={filters}
                    publisherOptions={mockPublisherOptions}
                />
                {/* Skeleton Loader Rows */}
                <div className="mt-4">
                    {[...Array(8)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full mb-2" />
                    ))}
                </div>
            </div>
        );
    }

    // Show empty state only if not loading and no data
    if (inventoryData.length === 0) {
        return <EmptyState searchQuery={searchQuery} />;
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header Row */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
                <Button asChild>
                    <Link href="/inventory/new">
                        <Plus className="mr-2 h-5 w-5" />
                        Add New Item
                    </Link>
                </Button>
            </div>

            {/* Dashboard Header */}
            <InventoryDashboardHeader
                bookCount={summaryMetrics?.book_count ?? 0}
                totalItemCount={summaryMetrics?.total_item_count ?? 0}
                totalValueInCents={summaryMetrics?.total_value_in_cents ?? 0}
                isLoading={summaryLoading}
            />

            {/* Search & Filter Row */}
            <div className="flex items-center gap-2">
                <Input
                    type="text"
                    placeholder="Search inventory..."
                    className="flex-1"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                <Button variant="outline" size="icon" aria-label="Filter options" onClick={() => setShowAdvancedFilterModal(true)}>
                    <Filter className="h-5 w-5" />
                </Button>
                <InventorySortDropdown
                    activeSort={sortBy}
                    onSortChange={setSortBy}
                />
            </div>

            {/* Advanced Filter Modal */}
            <AdvancedFilterModal
                isOpen={showAdvancedFilterModal}
                onClose={() => setShowAdvancedFilterModal(false)}
                onApply={handleApplyAdvancedFilters}
                currentFilters={filters}
                publisherOptions={mockPublisherOptions}
            />

            {/* Item Count */}
            <div className="text-sm text-muted-foreground">
                Showing {inventoryData.length} of {summaryMetrics?.book_count ?? 0} books
            </div>

            {/* Inventory Table */}
            <InventoryListTable
                data={inventoryData}
                isLoading={isLoading}
                error={error as Error | null}
            />

            {/* Load More Button */}
            <div className="flex justify-center mt-4">
                {hasNextPage && (
                    <Button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        variant="outline"
                    >
                        {isFetchingNextPage ? "Loading..." : "Load More"}
                    </Button>
                )}
            </div>
        </div>
    );
} 