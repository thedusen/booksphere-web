"use client";

import React from "react";
import Image from "next/image";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import type { GroupedEdition } from "@/lib/types/inventory";

interface InventoryListTableProps {
    data: GroupedEdition[] | undefined;
    isLoading: boolean;
    error: Error | null;
}

export function InventoryListTable({ data, isLoading, error }: InventoryListTableProps) {
    if (isLoading) {
        return <div className="py-8 text-center">Loading inventory...</div>;
    }
    if (error) {
        return <div className="py-8 text-center text-red-500">Error: {error.message}</div>;
    }
    if (!data || data.length === 0) {
        return <div className="py-8 text-center text-muted-foreground">No inventory found.</div>;
    }

    // Flatten editions to rows (one row per edition)
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-10">
                        <input type="checkbox" aria-label="Select all" />
                    </TableHead>
                    <TableHead>Book</TableHead>
                    <TableHead>ISBN</TableHead>
                    <TableHead>Stock</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((edition) => (
                    <TableRow
                        key={edition.edition_id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                    // TODO: wire up navigation
                    >
                        <TableCell>
                            <input type="checkbox" aria-label={`Select ${edition.title}`} />
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-3">
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
                        </TableCell>
                        <TableCell>{edition.isbn13 || edition.isbn10 || "—"}</TableCell>
                        <TableCell>{edition.total_copies}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
} 