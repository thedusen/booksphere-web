"use client";

import React from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Camera, Store } from "lucide-react";
import type { GroupedEdition } from "@/lib/types/inventory";

interface InventoryItemContextMenuProps {
    item: GroupedEdition;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onManagePhotos: (id: string) => void;
    onListOnMarketplace: (id: string) => void;
}

export const InventoryItemContextMenu: React.FC<InventoryItemContextMenuProps> = ({
    item,
    onEdit,
    onDelete,
    onManagePhotos,
    onListOnMarketplace,
}) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(item.edition_id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit Details</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onManagePhotos(item.edition_id)}>
                     <Camera className="mr-2 h-4 w-4" />
                    <span>Manage Photos</span>
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => onListOnMarketplace(item.edition_id)}>
                     <Store className="mr-2 h-4 w-4" />
                    <span>List on Marketplace</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(item.edition_id)}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};