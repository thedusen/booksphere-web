"use client";

import React, { Fragment, useState, useEffect } from "react";
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
import type { GroupedEditionWithDate } from "@/hooks/useInventory";
import { StockItemRow } from "./StockItemRow";
import { InventoryItemContextMenu } from "./InventoryItemContextMenu";
import { Button } from "@/components/ui/button";
import * as AlertDialog from "@/components/ui/alert-dialog";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FlaggingTrigger } from "@/components/flagging";
import { createFlagContextData } from '@/lib/types/flags';

interface InventoryListTableProps {
    data: GroupedEditionWithDate[] | undefined;
    isLoading: boolean;
    error: Error | null;
    lastViewedEditionId?: string | null;
}

export function InventoryListTable({ data, isLoading, error, lastViewedEditionId }: InventoryListTableProps) {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [itemToDelete, setItemToDelete] = useState<GroupedEditionWithDate | null>(null);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);

    // Effect: when lastViewedEditionId changes, trigger highlight
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        if (lastViewedEditionId) {
            setHighlightedId(lastViewedEditionId);
            const timer = setTimeout(() => {
                setHighlightedId(null);
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('lastViewedEditionId');
                }
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [lastViewedEditionId]);

    function toggleRowExpansion(editionId: string): void {
        setExpandedRows((prev) => ({ ...prev, [editionId]: !prev[editionId] }));
    }

    function handleEdit(_editionId: string): void {}
    function handleDeleteClick(edition: GroupedEditionWithDate): void {
        setItemToDelete(edition);
    }
    function handleManagePhotos(_editionId: string): void {}
    function handleListOnMarketplace(_editionId: string): void {}
    function handleDeleteConfirm(): void {
        // TODO: Call Supabase RPC to delete edition_id: itemToDelete.edition_id
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

    const columnCount = 7;

    return (
        <>
            <div className="rounded-xl border border-primary/10 shadow-elevation-3 bg-gradient-to-br from-background/98 to-lavender-50/30 overflow-hidden backdrop-blur-[1px]">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gradient-to-r from-primary/8 to-secondary/8 border-b border-primary/20 hover:bg-gradient-to-r hover:from-primary/12 hover:to-secondary/12 transition-all animate-spring">
                        <TableHead className="w-8" />
                        <TableHead className="w-10">
                            <input type="checkbox" aria-label="Select all" onClick={e => e.stopPropagation()} className="rounded border-primary/30 text-primary focus:ring-primary/50 focus:ring-2 hover:border-primary/50 transition-all animate-spring" />
                        </TableHead>
                        <TableHead>Book</TableHead>
                        <TableHead>ISBN</TableHead>
                        <TableHead className="text-center">Stock</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="w-8" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((edition) => (
                        <Fragment key={edition.edition_id}>
                            <TableRow
                                className={cn(
                                    "cursor-pointer transition-all animate-spring hover:bg-gradient-to-r hover:from-primary/8 hover:to-secondary/8 hover:shadow-elevation-1 border-b border-primary/15 group",
                                    highlightedId === edition.edition_id && "animate-fade-highlight bg-gradient-to-r from-primary/15 to-secondary/15 shadow-elevation-2"
                                )}
                                onClick={() => toggleRowExpansion(edition.edition_id)}
                                tabIndex={0}
                                role="button"
                                aria-expanded={!!expandedRows[edition.edition_id]}
                            >
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={expandedRows[edition.edition_id] ? "Collapse row" : "Expand row"}
                                        onClick={e => { e.stopPropagation(); toggleRowExpansion(edition.edition_id); }}
                                        className="rounded-full h-8 w-8 hover:bg-gradient-to-r hover:from-primary/15 hover:to-secondary/15 transition-all animate-spring group-hover:shadow-elevation-1"
                                    >
                                        {expandedRows[edition.edition_id] ? <ChevronDown size={18} className="text-primary" /> : <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />}
                                    </Button>
                                </TableCell>
                                <TableCell>
                                    <input
                                        type="checkbox"
                                        aria-label={`Select ${edition.title}`}
                                        onClick={e => e.stopPropagation()}
                                        className="rounded border-primary/30 text-primary focus:ring-primary/50 focus:ring-2 hover:border-primary/50 transition-all animate-spring"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Link href={`/inventory/${edition.edition_id}`}>
                                        <div className="flex items-center gap-3 hover:text-primary transition-colors animate-spring">
                                            {edition.cover_image_url && (
                                                <Image
                                                    src={edition.cover_image_url}
                                                    alt={edition.title || 'Book cover'}
                                                    width={40}
                                                    height={60}
                                                    className="rounded-lg shadow-elevation-2 object-cover border border-neutral-200/40 hover:shadow-elevation-3 transition-all animate-spring"
                                                />
                                            )}
                                            <div>
                                                <FlaggingTrigger
                                                    tableName="editions"
                                                    recordId={edition.edition_id}
                                                    fieldName="title"
                                                    currentValue={edition.title}
                                                    fieldLabel="Book Title"
                                                    contextData={{
                                                        author: edition.primary_author,
                                                        isbn: edition.isbn13 || edition.isbn10,
                                                        publisher: edition.publisher_name,
                                                        totalCopies: edition.total_copies,
                                                    }}
                                                    className="flaggable-field inline-block rounded-sm px-1 -mx-1"
                                                >
                                                    <div className="font-medium leading-tight">{edition.title}</div>
                                                </FlaggingTrigger>
                                                {/* Authors with flagging capability - UX Expert: High-priority field for data quality */}
                                                <FlaggingTrigger
                                                    tableName="editions"
                                                    recordId={edition.edition_id}
                                                    fieldName="primary_author"
                                                    currentValue={edition.primary_author}
                                                    fieldLabel="Author"
                                                    contextData={createFlagContextData({
                                                        title: edition.title,
                                                        primaryAuthor: edition.primary_author || undefined,
                                                        isbn13: edition.isbn13 || undefined,
                                                        isbn10: edition.isbn10 || undefined,
                                                        publisher: edition.publisher_name,
                                                        publicationDate: edition.published_date || undefined,
                                                    })}
                                                    className="flaggable-field"
                                                >
                                                    <span className="text-muted-foreground">
                                                        {edition.primary_author}
                                                    </span>
                                                </FlaggingTrigger>
                                            </div>
                                        </div>
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    {/* ISBN with flagging capability - Business Expert: Highest priority for marketplace compliance */}
                                    {(edition.isbn13 || edition.isbn10) ? (
                                        <FlaggingTrigger
                                            tableName="editions"
                                            recordId={edition.edition_id}
                                            fieldName={edition.isbn13 ? "isbn13" : "isbn10"}
                                            currentValue={edition.isbn13 || edition.isbn10 || ""}
                                            fieldLabel={edition.isbn13 ? "ISBN-13" : "ISBN-10"}
                                            contextData={createFlagContextData({
                                                title: edition.title,
                                                primaryAuthor: edition.primary_author || undefined,
                                                isbn13: edition.isbn13 || undefined,
                                                isbn10: edition.isbn10 || undefined,
                                                publisher: edition.publisher_name,
                                                publicationDate: edition.published_date || undefined,
                                            })}
                                            className="flaggable-field"
                                        >
                                            <span className="font-mono text-xs">
                                                {edition.isbn13 || edition.isbn10 || 'No ISBN'}
                                            </span>
                                        </FlaggingTrigger>
                                    ) : (
                                        "—"
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className="font-medium">{edition.total_copies}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    {edition.price_range ? (
                                        <span className="text-sm font-medium">
                                            ${Math.min(edition.price_range.min, edition.price_range.max).toFixed(2)} - ${Math.max(edition.price_range.min, edition.price_range.max).toFixed(2)}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">No price</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div onClick={e => e.stopPropagation()}>
                                        <InventoryItemContextMenu
                                            item={edition}
                                            onEdit={() => handleEdit(edition.edition_id)}
                                            onDelete={() => handleDeleteClick(edition)}
                                            onManagePhotos={() => handleManagePhotos(edition.edition_id)}
                                            onListOnMarketplace={() => handleListOnMarketplace(edition.edition_id)}
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                            {expandedRows[edition.edition_id] && (
                                <TableRow className="bg-gradient-to-r from-lavender-50/40 to-secondary/5">
                                    <TableCell colSpan={columnCount} className="p-0 border-0">
                                        <div className="bg-gradient-to-r from-primary/8 to-secondary/8 mx-2 my-1 rounded-lg shadow-elevation-1">
                                            {edition.stock_items && edition.stock_items.length > 0 ? (
                                                <div className="divide-y divide-primary/10">
                                                    {edition.stock_items.map((item) => (
                                                        <div key={item.stock_item_id} className="px-lg py-md first:pt-lg last:pb-lg">
                                                            <StockItemRow 
                                                                item={item} 
                                                                bookContext={{
                                                                    editionId: edition.edition_id,
                                                                    title: edition.title,
                                                                    primaryAuthor: edition.primary_author,
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-muted-foreground py-xl px-lg text-center italic">
                                                    No individual stock items for this edition.
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </Fragment>
                    ))}
                </TableBody>
            </Table>
            </div>
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

/*
Add this to your global CSS if not already present:
.animate-fade-highlight {
  animation: fade-highlight 3s ease-out 1;
}
@keyframes fade-highlight {
  0% { background-color: #f3e8ff; }
  80% { background-color: #f3e8ff; }
  100% { background-color: transparent; }
}
*/ 