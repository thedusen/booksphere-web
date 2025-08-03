import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FilterChipProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, isActive, onClick }) => {
    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            style={isActive ? { color: '#ffffff !important' } : { color: '#1f2937 !important' }}
            className={cn(
                "rounded-xl transition-all animate-spring hover-scale-sm border shadow-elevation-1 [&]:!text-current",
                isActive 
                    ? "bg-gradient-to-r from-primary to-secondary shadow-elevation-2 hover:shadow-elevation-3 glow-purple border-primary/50 [&]:!text-white [&:hover]:!text-white filter-chip-active" 
                    : "bg-gradient-to-r from-background/90 to-lavender-50/40 border-primary/30 hover:border-primary/50 hover:bg-gradient-to-r hover:from-primary/8 hover:to-secondary/8 [&]:!text-gray-900 dark:[&]:!text-gray-100 hover:shadow-elevation-2 [&:hover]:!text-gray-900 dark:[&:hover]:!text-gray-100 filter-chip-inactive"
            )}
        >
            {label}
        </Button>
    );
};