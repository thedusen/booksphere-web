"use client";

import React from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useEditionDetails } from "@/hooks/useInventory";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Edit, Trash2, ChevronLeft } from "lucide-react";
import type { GroupedEdition } from "@/lib/types/inventory";
import Link from "next/link";

// Helper component for displaying rows of data
const DetailRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-3">
        <dt className="font-medium text-muted-foreground">{label}</dt>
        <dd className="md:col-span-2 text-foreground">{value || "—"}</dd>
    </div>
);

// Main Page Component
export default function EditionDetailPage() {
    const params = useParams();
    const { id } = params as { id: string };
    const { organizationId } = useOrganization();

    const { data: edition, isLoading, error } = useEditionDetails({
        editionId: id,
        organizationId: organizationId || '',
        client: supabase,
    });

    if (isLoading || !organizationId) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    if (error || !edition) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    {error?.message || "Could not load the requested edition."}
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Back to Inventory Link */}
            <div className="mb-2">
                <Button asChild variant="outline" size="sm">
                    <Link href="/inventory">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to Inventory
                    </Link>
                </Button>
            </div>

            {/* Hero Section */}
            <Card className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                    <div className="flex-shrink-0">
                        {edition.cover_image_url && (
                            <Image
                                src={edition.cover_image_url}
                                alt={`Cover for ${edition.book_title}`}
                                width={150}
                                height={225}
                                className="object-cover h-full w-full sm:w-[150px]"
                            />
                        )}
                    </div>
                    <div className="p-6 flex-1">
                        <h1 className="text-2xl font-bold tracking-tight">{edition.book_title}</h1>
                        <p className="text-lg text-muted-foreground mt-1">{edition.authors || "—"}</p>
                        <div className="text-sm text-muted-foreground mt-4 flex flex-col gap-1">
                          <span>ISBN-13: {edition.isbn13 || "N/A"}</span>
                          <span>ISBN-10: {edition.isbn10 || "N/A"}</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Stock Items Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Stock Items</CardTitle>
                    <CardDescription>
                        All copies of this edition in your inventory.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {edition.stock_items && edition.stock_items.length > 0 ? (
                        <div className="space-y-4">
                            {edition.stock_items.map((item) => (
                                <div key={item.stock_item_id} className="border rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <div className="font-medium">Condition: {item.condition_name}</div>
                                        <div className="text-sm text-muted-foreground">SKU: {item.sku || "N/A"}</div>
                                        <div className="text-sm text-muted-foreground">Location: {item.location_in_store_text || "N/A"}</div>
                                    </div>
                                    <div className="text-base font-semibold mt-2 md:mt-0">${item.selling_price_amount ? item.selling_price_amount.toFixed(2) : "N/A"}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-muted-foreground">No stock items for this edition.</div>
                    )}
                </CardContent>
            </Card>

            {/* Marketplace Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Marketplace Listings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Placeholder for marketplace content */}
                    <div className="text-center text-muted-foreground py-8">
                        Marketplace management coming soon.
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive">
                 <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-medium">Delete this Edition</p>
                            <p className="text-sm text-muted-foreground">This action is permanent and cannot be undone.</p>
                        </div>
                        <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Edition
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}