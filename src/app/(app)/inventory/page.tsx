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

export default function InventoryPage() {
    // State for search and sort
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [sortBy, setSortBy] = useState<string>("date_added_to_stock DESC");
    const [filterType, setFilterType] = useState<FilterType>("All");
    const { organizationId, loading: orgLoading, error: orgError } = useOrganization();

    // Debounce search input
    const debouncedSearch = useDebounce(searchQuery, 300);

    // Fetch inventory data only if organizationId is available
    const {
        data,
        isLoading,
        error,
    } = useInventory({
        searchQuery: debouncedSearch,
        filterType,
        organizationId: organizationId || "", // useInventory expects a string
        client: supabase,
        sortBy,
    });

    // Flatten paginated data
    const inventoryData = data?.pages.flat() ?? [];

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

            {/* Search & Filter Row */}
            <div className="flex items-center gap-2">
                <Input
                    type="text"
                    placeholder="Search inventory..."
                    className="flex-1"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                <Button variant="outline" size="icon" aria-label="Filter options">
                    <Filter className="h-5 w-5" />
                </Button>
            </div>

            {/* Inventory Table */}
            <InventoryListTable
                data={inventoryData}
                isLoading={isLoading}
                error={error as Error | null}
            />
        </div>
    );
} 