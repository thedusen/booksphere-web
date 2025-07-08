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
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={onClick}
            className="rounded-full"
        >
            {label}
        </Button>
    );
};