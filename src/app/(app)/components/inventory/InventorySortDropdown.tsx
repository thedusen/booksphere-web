"use client";
import React from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

interface SortOption {
    label: string;
    value: string;
}

interface InventorySortDropdownProps {
    activeSort: string;
    onSortChange: (value: string) => void;
}

const sortOptions: SortOption[] = [
    { label: "Latest Added", value: "date_added_to_stock DESC" },
    { label: "Oldest Added", value: "date_added_to_stock ASC" },
    { label: "Title (A-Z)", value: "title ASC" },
    { label: "Title (Z-A)", value: "title DESC" },
    { label: "Author (A-Z)", value: "primary_author ASC" },
    { label: "Author (Z-A)", value: "primary_author DESC" },
    { label: "Price (Low to High)", value: "min_price ASC" },
    { label: "Price (High to Low)", value: "min_price DESC" },
];

export const InventorySortDropdown: React.FC<InventorySortDropdownProps> = ({
    activeSort,
    onSortChange,
}) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="shadow-elevation-2 hover-scale-sm bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 hover:border-primary/50 hover:bg-gradient-to-r hover:from-primary/20 hover:to-secondary/20 transition-all animate-spring glow-aqua text-primary hover:text-white">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Sort
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={activeSort} onValueChange={onSortChange}>
                    {sortOptions.map((option) => (
                        <DropdownMenuRadioItem key={option.value} value={option.value}>
                            {option.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};