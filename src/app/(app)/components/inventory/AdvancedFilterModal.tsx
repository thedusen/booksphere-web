"use client";
import React, { useState, useCallback } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FilterChip } from "./FilterChip";

export interface AdvancedFilters {
    conditions: string[];
    publishers: string[];
    attributes: string[];
}

interface AdvancedFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: AdvancedFilters) => void;
    currentFilters: AdvancedFilters;
    publisherOptions: string[];
}

export const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
    isOpen,
    onClose,
    onApply,
    currentFilters,
    publisherOptions,
}) => {
    const [conditions, setConditions] = useState<string[]>(currentFilters.conditions);
    const [publishers, setPublishers] = useState<string[]>(currentFilters.publishers);
    const [attributes, setAttributes] = useState<string[]>(currentFilters.attributes);

    const conditionOptions = ["New", "Like New", "Very Good", "Good", "Acceptable"];
    const attributeOptions = ["Signed", "First Edition", "Illustrated", "Dust Jacket"];

    const handleToggle = useCallback(
        (
            setter: React.Dispatch<React.SetStateAction<string[]>>,
            currentValues: string[],
            value: string
        ) => {
            setter(
                currentValues.includes(value)
                    ? currentValues.filter((v) => v !== value)
                    : [...currentValues, value]
            );
        },
        []
    );

    const handleApplyFilters = () => {
        onApply({ conditions, publishers, attributes });
        onClose();
    };
    
    const handleReset = () => {
        setConditions([]);
        setPublishers([]);
        setAttributes([]);
        onApply({ conditions: [], publishers: [], attributes: [] });
        onClose();
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Advanced Filters</SheetTitle>
                </SheetHeader>
                <div className="py-4 space-y-6">
                    <div>
                        <Label className="text-sm font-medium">Condition</Label>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {conditionOptions.map((option) => (
                                <FilterChip
                                    key={option}
                                    label={option}
                                    isActive={conditions.includes(option)}
                                    onClick={() => handleToggle(setConditions, conditions, option)}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">Attributes</Label>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {attributeOptions.map((option) => (
                                <FilterChip
                                    key={option}
                                    label={option}
                                    isActive={attributes.includes(option)}
                                    onClick={() => handleToggle(setAttributes, attributes, option)}
                                />
                            ))}
                        </div>
                    </div>
                    {/* Publisher filter can be added here once we have the data source */}
                </div>
                <SheetFooter>
                    <Button variant="outline" onClick={handleReset}>Reset</Button>
                    <SheetClose asChild>
                        <Button onClick={handleApplyFilters}>Apply Filters</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};