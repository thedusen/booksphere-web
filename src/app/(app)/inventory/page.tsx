"use client";

import React, { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Filter, Camera } from "lucide-react";
import { InventoryListTable } from "../components/inventory/InventoryListTable";
import { useInventory, type GroupedEditionWithDate } from "@/hooks/useInventory";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";
import { InventoryDashboardHeader } from "../components/inventory/InventoryDashboardHeader";
import { EmptyState } from "../components/inventory/EmptyState";
import { useInventorySummaryMetrics } from "@/hooks/useInventory";
import { AdvancedFilterModal, AdvancedFilters } from "../components/inventory/AdvancedFilterModal";
import { InventorySortDropdown } from "../components/inventory/InventorySortDropdown";
import { useInventoryState } from "./InventoryStateProvider";
import type { UseInfiniteQueryResult, InfiniteData } from '@tanstack/react-query';

export default function InventoryPage() {
    const {
        searchQuery, setSearchQuery,
        sortBy, setSortBy,
        filters, setFilters,
        isFilterModalOpen, setFilterModalOpen,
        scrollContainerRef
    } = useInventoryState();

    const { organizationId, loading: orgLoading, error: orgError } = useOrganization();

    const debouncedSearch = useDebounce(searchQuery, 300);

    // Memoize and flatten filters for queryKey stability
    const memoizedFilters = useMemo(() => ({
        conditions: filters.conditions.join(','),
        publishers: filters.publishers.join(','),
        attributes: filters.attributes.join(',')
    }), [filters.conditions, filters.publishers, filters.attributes]);

    const inventoryQuery: UseInfiniteQueryResult<InfiniteData<GroupedEditionWithDate[], unknown>, Error> = useInventory({
        searchQuery: debouncedSearch,
        filterType: "All",
        organizationId: organizationId || "",
        client: supabase,
        sortBy,
        filters: memoizedFilters,
    });

    const inventoryData = inventoryQuery.data?.pages?.flat() ?? [];
    const isLoading = inventoryQuery.isLoading;
    const error = inventoryQuery.error;
    const fetchNextPage = inventoryQuery.fetchNextPage;
    const hasNextPage = inventoryQuery.hasNextPage;
    const isFetchingNextPage = inventoryQuery.isFetchingNextPage;

    const {
        data: summaryMetrics,
        isLoading: summaryLoading,
    } = useInventorySummaryMetrics({
        searchQuery: debouncedSearch,
        filterType: "All",
        organizationId: organizationId || "",
        client: supabase,
        sortBy,
        filters: memoizedFilters,
    });

    const handleApplyAdvancedFilters = (newFilters: AdvancedFilters) => {
        setFilters(newFilters);
        setFilterModalOpen(false);
    };

    // Save and restore scroll position on the scroll container, with debug logging and scroll event
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const scrollableElement = scrollContainerRef.current;
        if (!scrollableElement) {
            return;
        }

        // Restore scroll position
        const scrollPosition = sessionStorage.getItem('inventoryScrollPosition');
        if (scrollPosition) {
            let attempts = 0;
            const tryScroll = () => {
                if (scrollableElement.scrollHeight > parseInt(scrollPosition, 10) || attempts > 30) {
                    scrollableElement.scrollTop = parseInt(scrollPosition, 10);
                    sessionStorage.removeItem('inventoryScrollPosition');
                } else {
                    attempts++;
                    requestAnimationFrame(tryScroll);
                }
            };
            requestAnimationFrame(tryScroll);
        }

        // Save scroll position on scroll
        const handleScroll = () => {
            sessionStorage.setItem('inventoryScrollPosition', scrollableElement.scrollTop.toString());
        };
        scrollableElement.addEventListener('scroll', handleScroll);

        // Clean up
        return () => {
            scrollableElement.removeEventListener('scroll', handleScroll);
        };
    }, [inventoryData, scrollContainerRef]);

    // Highlight last-viewed edition
    const [lastViewedEditionId, setLastViewedEditionId] = useState<string | null>(null);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const id = sessionStorage.getItem('lastViewedEditionId');
        if (id) {
            setLastViewedEditionId(id);
            sessionStorage.removeItem('lastViewedEditionId');
        }
    }, []);

    if (orgLoading) {
        return <div className="py-8 text-center">Loading organization...</div>;
    }
    if (orgError) {
        return <div className="py-8 text-center text-red-500">Error: {orgError}</div>;
    }
    if (!organizationId) {
        return <div className="py-8 text-center text-muted-foreground">No organization found.</div>;
    }

    return (
        <div className="min-h-screen p-xl">
            <div className="flex flex-col gap-lg max-w-none">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight gradient-text">Inventory</h1>
                        <p className="text-muted-foreground mt-1">Manage your book collection and stock levels</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button asChild size="lg" variant="outline" className="shadow-elevation-2 hover-scale-sm">
                            <Link href="/cataloging/scan">
                                <Camera className="mr-2 h-5 w-5" />
                                Catalog More Books
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="primary" className="shadow-elevation-2 hover-scale-sm">
                            <Link href="/inventory/new">
                                <Plus className="mr-2 h-5 w-5" />
                                Add New Item
                            </Link>
                        </Button>
                    </div>
                </div>

            <InventoryDashboardHeader
                bookCount={summaryMetrics?.book_count ?? 0}
                totalItemCount={summaryMetrics?.total_item_count ?? 0}
                totalValueInCents={summaryMetrics?.total_value_in_cents ?? 0}
                isLoading={summaryLoading}
            />

            <div className="flex items-center gap-sm bg-gradient-to-r from-card via-card to-lavender-50/30 p-md rounded-xl border border-neutral-200/60 shadow-elevation-2">
                <Input
                    type="text"
                    placeholder="Search by title, author, ISBN..."
                    className="flex-1 bg-background/50 border-0 shadow-elevation-1 focus-visible:shadow-elevation-2"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button 
                    variant="ghost"
                    onClick={() => setFilterModalOpen(true)} 
                    className="shadow-elevation-2 hover-scale-sm bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 hover:border-primary/50 hover:bg-gradient-to-r hover:from-primary/20 hover:to-secondary/20 transition-all animate-spring glow-purple text-primary hover:text-white"
                >
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                </Button>
                <InventorySortDropdown
                    activeSort={sortBy}
                    onSortChange={setSortBy}
                />
            </div>

            <AdvancedFilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setFilterModalOpen(false)}
                onApply={handleApplyAdvancedFilters}
                currentFilters={filters}
                publisherOptions={[]} // Mock options
            />

            {isLoading && inventoryData.length === 0 ? (
                 <div className="py-8 text-center">Loading inventory...</div>
            ) : inventoryData.length === 0 ? (
                <EmptyState searchQuery={searchQuery} />
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing <span className="font-medium text-foreground">{inventoryData.length}</span> of <span className="font-medium text-foreground">{summaryMetrics?.book_count ?? 0}</span> books
                        </div>
                    </div>
                    <InventoryListTable
                        data={inventoryData}
                        isLoading={isLoading}
                        error={error as Error | null}
                        lastViewedEditionId={lastViewedEditionId || undefined}
                    />
                    {hasNextPage && (
                        <div className="flex justify-center pt-lg">
                            <Button
                                variant="ghost"
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                size="lg"
                                className="shadow-elevation-2 hover-scale-sm bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 hover:border-primary/50 hover:bg-gradient-to-r hover:from-primary/20 hover:to-secondary/20 transition-all animate-spring disabled:opacity-50 disabled:pointer-events-none text-primary hover:text-white"
                            >
                                {isFetchingNextPage ? "Loading more..." : "Load More Books"}
                            </Button>
                        </div>
                    )}
                </>
            )}
            </div>
        </div>
    );
}