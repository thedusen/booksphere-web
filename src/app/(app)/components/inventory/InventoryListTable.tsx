"use client";

import React, { Fragment, useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import type { GroupedEdition } from "@/lib/types/inventory";
import { StockItemRow } from "./StockItemRow";
import { InventoryItemContextMenu } from "./InventoryItemContextMenu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import * as AlertDialog from "@/components/ui/alert-dialog";
import Link from "next/link";

interface InventoryListTableProps {
    data: GroupedEdition[] | undefined;
    isLoading: boolean;
    error: Error | null;
}

export function InventoryListTable({ data, isLoading, error }: InventoryListTableProps) {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [itemToDelete, setItemToDelete] = useState<GroupedEdition | null>(null);

    function toggleRowExpansion(editionId: string): void {
        setExpandedRows((prev) => ({ ...prev, [editionId]: !prev[editionId] }));
    }

    // Mock handlers for context menu
    function handleEdit(editionId: string): void {
        console.log("Edit", editionId);
    }
    function handleDeleteClick(editionId: string): void {
        const item = data?.find((e) => e.edition_id === editionId) || null;
        setItemToDelete(item);
    }
    function handleManagePhotos(editionId: string): void {
        console.log("Manage Photos", editionId);
    }
    function handleListOnMarketplace(editionId: string): void {
        console.log("List on Marketplace", editionId);
    }
    function handleDeleteConfirm(): void {
        if (itemToDelete) {
            // TODO: Call Supabase RPC to delete edition_id: ${itemToDelete.edition_id}
            console.log(`// TODO: Call Supabase RPC to delete edition_id: ${itemToDelete.edition_id}`);
        }
        setItemToDelete(null);
    }

    if (isLoading) {
        return <div className="py-8 text-center">Loading inventory...</div>;
    }
    if (error) {
        return <div className="py-8 text-center text-red-500">Error: {error.message}</div>;
    }
    if (!data || data.length === 0) {
        return <div className="py-8 text-center text-muted-foreground">No inventory found.</div>;
    }

    // 6 columns: Expand, Select, Book, ISBN, Stock, Actions
    const columnCount = 6;

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-8" />
                        <TableHead className="w-10">
                            <input type="checkbox" aria-label="Select all" onClick={e => e.stopPropagation()} />
                        </TableHead>
                        <TableHead>Book</TableHead>
                        <TableHead>ISBN</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead className="w-8" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((edition) => (
                        <Fragment key={edition.edition_id}>
                            <TableRow
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => toggleRowExpansion(edition.edition_id)}
                                tabIndex={0}
                                role="button"
                                aria-expanded={!!expandedRows[edition.edition_id]}
                            >
                                {/* Expand/collapse button */}
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={expandedRows[edition.edition_id] ? "Collapse row" : "Expand row"}
                                        onClick={e => { e.stopPropagation(); toggleRowExpansion(edition.edition_id); }}
                                    >
                                        {expandedRows[edition.edition_id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                    </Button>
                                </TableCell>
                                {/* Select checkbox */}
                                <TableCell>
                                    <input
                                        type="checkbox"
                                        aria-label={`Select ${edition.title}`}
                                        onClick={e => e.stopPropagation()}
                                    />
                                </TableCell>
                                {/* Book info */}
                                <TableCell>
                                    <Link href={`/inventory/${edition.edition_id}`}>
                                        <div className="flex items-center gap-3 hover:underline cursor-pointer" onClick={e => e.stopPropagation()} tabIndex={0} role="link" aria-label={`View details for ${edition.title}`}>
                                            {edition.cover_image_url && (
                                                <Image
                                                    src={edition.cover_image_url}
                                                    alt={edition.title}
                                                    width={40}
                                                    height={60}
                                                    className="rounded shadow-sm object-cover"
                                                />
                                            )}
                                            <div>
                                                <div className="font-medium leading-tight">{edition.title}</div>
                                                <div className="text-xs text-muted-foreground">{edition.primary_author}</div>
                                            </div>
                                        </div>
                                    </Link>
                                </TableCell>
                                {/* ISBN */}
                                <TableCell>{edition.isbn13 || edition.isbn10 || "—"}</TableCell>
                                {/* Stock + price badge */}
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span>{edition.total_copies}</span>
                                        {edition.price_range && (
                                            <Badge variant="outline" className="ml-2 text-xs font-normal">
                                                ${edition.price_range.min} - ${edition.price_range.max}
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                {/* Context menu */}
                                <TableCell>
                                    <div onClick={e => e.stopPropagation()}>
                                        <InventoryItemContextMenu
                                            item={edition}
                                            onEdit={() => handleEdit(edition.edition_id)}
                                            onDelete={() => handleDeleteClick(edition.edition_id)}
                                            onManagePhotos={() => handleManagePhotos(edition.edition_id)}
                                            onListOnMarketplace={() => handleListOnMarketplace(edition.edition_id)}
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                            {expandedRows[edition.edition_id] && (
                                <TableRow className="bg-muted/30">
                                    <TableCell colSpan={columnCount} className="p-0">
                                        {edition.stock_items && edition.stock_items.length > 0 ? (
                                            edition.stock_items.map((item, i) => (
                                                <StockItemRow key={item.stock_item_id} item={item} isLast={i === edition.stock_items.length - 1} />
                                            ))
                                        ) : (
                                            <div className="text-sm text-muted-foreground">No stock items for this edition.</div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </Fragment>
                    ))}
                </TableBody>
            </Table>
            <AlertDialog.AlertDialog open={!!itemToDelete} onOpenChange={open => { if (!open) setItemToDelete(null); }}>
                <AlertDialog.AlertDialogContent>
                    <AlertDialog.AlertDialogHeader>
                        <AlertDialog.AlertDialogTitle>Are you absolutely sure?</AlertDialog.AlertDialogTitle>
                        <AlertDialog.AlertDialogDescription>
                            This action is permanent and will delete the edition <span className="font-semibold">{itemToDelete?.title}</span> and all of its stock items. This cannot be undone.
                        </AlertDialog.AlertDialogDescription>
                    </AlertDialog.AlertDialogHeader>
                    <AlertDialog.AlertDialogFooter>
                        <AlertDialog.AlertDialogCancel>Cancel</AlertDialog.AlertDialogCancel>
                        <AlertDialog.AlertDialogAction onClick={handleDeleteConfirm}>Continue</AlertDialog.AlertDialogAction>
                    </AlertDialog.AlertDialogFooter>
                </AlertDialog.AlertDialogContent>
            </AlertDialog.AlertDialog>
        </>
    );
} 