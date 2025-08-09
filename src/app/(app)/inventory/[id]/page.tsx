"use client";

import React, { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useEditionDetails } from "@/hooks/useInventory";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ChevronLeft } from "lucide-react";
import { FlaggingTrigger, FlaggingButton } from "@/components/flagging";
import type { EditionStockItem } from "@/lib/types/inventory";

// REVIEWER FIX: The props interface for the memoized card.
// It uses the actual `EditionStockItem` type for correctness.
interface StockItemCardProps {
  item: EditionStockItem;
  editionTitle: string;
}

/**
 * Performance Expert Optimization: Enhanced memoized component for individual stock items
 * 
 * PERFORMANCE IMPROVEMENTS:
 * - Stable context data prevents flagging trigger re-registration
 * - Memoized display values reduce string operations
 * - Custom comparison function prevents unnecessary re-renders
 * - Optimized for large inventories with many stock items per edition
 */
const StockItemCard = React.memo(function StockItemCard({ item, editionTitle }: StockItemCardProps) {
  // Performance Expert: Memoize all display values to prevent recalculation
  const displayValues = useMemo(() => ({
    sku: item.sku || "N/A",
    price: item.selling_price_amount ? item.selling_price_amount.toFixed(2) : "N/A",
    location: item.location_in_store_text || "N/A",
  }), [item.sku, item.selling_price_amount, item.location_in_store_text]);

  // Performance Expert: Stable context data with granular dependencies
  // This prevents Map churn in FlaggingProvider and trigger re-registration
  const stockItemContextData = useMemo(() => ({
    bookTitle: editionTitle,
    sku: displayValues.sku,
    condition: item.condition_name,
    price: item.selling_price_amount,
    stockItemId: item.stock_item_id, // Add for better admin context
  }), [
    editionTitle, 
    displayValues.sku, 
    item.condition_name, 
    item.selling_price_amount,
    item.stock_item_id
  ]);

  return (
    <div className="border border-neutral-200/60 rounded-xl p-lg bg-gradient-to-br from-background/98 to-mint-50/20 shadow-elevation-1 hover:shadow-elevation-2 animate-spring flex flex-col md:flex-row md:items-center md:justify-between gap-lg">
      <div className="space-y-2">
        {/* Condition field with flagging capability */}
        <div>
          <FlaggingTrigger
            tableName="stock_items"
            recordId={item.stock_item_id}
            fieldName="condition_name"
            currentValue={item.condition_name}
            fieldLabel="Condition"
            contextData={stockItemContextData}
            className="flaggable-field inline-block rounded-sm px-1 -mx-1"
          >
            <div className="text-sm text-muted-foreground">Condition: {item.condition_name}</div>
          </FlaggingTrigger>
        </div>

        {/* SKU field with flagging capability */}
        <div>
          <FlaggingTrigger
            tableName="stock_items"
            recordId={item.stock_item_id}
            fieldName="sku"
            currentValue={displayValues.sku}
            fieldLabel="SKU"
            contextData={stockItemContextData}
            className="flaggable-field inline-block rounded-sm px-1 -mx-1"
          >
            <div className="text-sm text-muted-foreground">SKU: {displayValues.sku}</div>
          </FlaggingTrigger>
        </div>

        {/* Location field with flagging capability */}
        <div>
          <FlaggingTrigger
            tableName="stock_items"
            recordId={item.stock_item_id}
            fieldName="location_in_store_text"
            currentValue={displayValues.location}
            fieldLabel="Location"
            contextData={stockItemContextData}
            className="flaggable-field inline-block rounded-sm px-1 -mx-1"
          >
            <div className="text-sm text-muted-foreground">Location: {displayValues.location}</div>
          </FlaggingTrigger>
        </div>
      </div>

      {/* Price field with flagging capability */}
      <FlaggingTrigger
        tableName="stock_items"
        recordId={item.stock_item_id}
        fieldName="selling_price_amount"
        currentValue={`$${displayValues.price}`}
        fieldLabel="Selling Price"
        contextData={stockItemContextData}
        className="flaggable-field inline-block rounded-sm px-2 -mx-2"
      >
        <div className="text-base font-semibold">${displayValues.price}</div>
      </FlaggingTrigger>
    </div>
);
}, (prevProps, nextProps) => {
  // Performance Expert: Custom comparison for StockItemCard
  // Only re-render if critical stock item data changes
  return (
    prevProps.item.stock_item_id === nextProps.item.stock_item_id &&
    prevProps.item.condition_name === nextProps.item.condition_name &&
    prevProps.item.sku === nextProps.item.sku &&
    prevProps.item.selling_price_amount === nextProps.item.selling_price_amount &&
    prevProps.item.location_in_store_text === nextProps.item.location_in_store_text &&
    prevProps.editionTitle === nextProps.editionTitle
  );
});

// Main Page Component
export default function EditionDetailPage() {
    const params = useParams();
    const { id } = params as { id: string };
    const { organizationId } = useOrganization();
    const router = useRouter();

    const { data: edition, isLoading, error } = useEditionDetails({
        editionId: id,
        organizationId: organizationId || '',
        client: supabase,
    });

    // Save last viewed edition id to sessionStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('lastViewedEditionId', id);
        }
    }, [id]);

    // Memoize context data for edition fields (expert recommendation)
    const editionContextData = useMemo(() => {
        if (!edition) return {};
        return {
            bookTitle: edition.book_title,
            authors: edition.authors || "Unknown",
            isbn13: edition.isbn13 || "N/A",
            isbn10: edition.isbn10 || "N/A",
            publisher: edition.publisher_name || "N/A",
            publicationDate: edition.published_date || "N/A",
            totalStockItems: edition.stock_items?.length || 0,
        };
    }, [edition]);

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
        <div className="max-w-4xl mx-auto space-y-6 py-6">
            {/* Back to Inventory Link */}
            <div className="mb-6">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.back()}
                    className="bg-gradient-to-r from-background/95 to-lavender-50/30 border-neutral-200/60 shadow-elevation-1 hover:shadow-elevation-2 animate-spring backdrop-blur-sm"
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Inventory
                </Button>
            </div>

            {/* Hero Section */}
            <Card className="overflow-hidden border-neutral-200/60 shadow-elevation-2 bg-gradient-to-br from-background/98 to-lavender-50/30 rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Edition Details</CardTitle>
                        <CardDescription>
                            Comprehensive information about this book edition
                        </CardDescription>
                    </div>
                    {/* Record-level flagging button (UX expert recommendation) */}
                    <FlaggingButton
                        tableName="editions"
                        recordId={id}
                        currentValue={edition.book_title}
                        fieldLabel="Edition Record"
                        contextData={editionContextData}
                        variant="outline"
                        size="sm"
                        showLabel={true}
                        className="bg-gradient-to-r from-background/95 to-coral-50/30 border-neutral-200/60 shadow-elevation-1 hover:shadow-elevation-2 animate-spring"
                    />
                </CardHeader>
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
                        {/* Book Title with flagging capability */}
                        <FlaggingTrigger
                            tableName="editions"
                            recordId={id}
                            fieldName="book_title"
                            currentValue={edition.book_title}
                            fieldLabel="Book Title"
                            contextData={editionContextData}
                            className="flaggable-field inline-block rounded-sm px-2 -mx-2"
                        >
                        <h1 className="text-2xl font-bold tracking-tight">{edition.book_title}</h1>
                        </FlaggingTrigger>

                        {/* Authors with flagging capability */}
                        <FlaggingTrigger
                            tableName="editions"
                            recordId={id}
                            fieldName="authors"
                            currentValue={edition.authors || "Unknown"}
                            fieldLabel="Authors"
                            contextData={editionContextData}
                            className="flaggable-field inline-block rounded-sm px-2 -mx-2"
                        >
                            <p className="text-lg text-muted-foreground mt-1">{edition.authors || "Unknown"}</p>
                        </FlaggingTrigger>

                        <div className="text-sm text-muted-foreground mt-4 grid grid-cols-2 gap-2">
                            {/* ISBN-13 with flagging capability */}
                            <div>
                                <FlaggingTrigger
                                    tableName="editions"
                                    recordId={id}
                                    fieldName="isbn13"
                                    currentValue={edition.isbn13 || "N/A"}
                                    fieldLabel="ISBN-13"
                                    contextData={editionContextData}
                                    className="flaggable-field inline-block rounded-sm px-1 -mx-1"
                                >
                                    <div>ISBN-13: {edition.isbn13 || "N/A"}</div>
                                </FlaggingTrigger>
                            </div>

                            {/* ISBN-10 with flagging capability */}
                            <div>
                                <FlaggingTrigger
                                    tableName="editions"
                                    recordId={id}
                                    fieldName="isbn10"
                                    currentValue={edition.isbn10 || "N/A"}
                                    fieldLabel="ISBN-10"
                                    contextData={editionContextData}
                                    className="flaggable-field inline-block rounded-sm px-1 -mx-1"
                                >
                                    <div>ISBN-10: {edition.isbn10 || "N/A"}</div>
                                </FlaggingTrigger>
                            </div>

                            {/* Publisher with flagging capability - Business Expert: Medium priority for collector accuracy */}
                            {edition.publisher_name && (
                                <div>
                                    <FlaggingTrigger
                                        tableName="editions"
                                        recordId={id}
                                        fieldName="publisher_name"
                                        currentValue={edition.publisher_name}
                                        fieldLabel="Publisher"
                                        contextData={editionContextData}
                                        className="flaggable-field inline-block rounded-sm px-1 -mx-1"
                                    >
                                        <div>Publisher: {edition.publisher_name}</div>
                                    </FlaggingTrigger>
                                </div>
                            )}

                            {/* Publication Date with flagging capability - Business Expert: Important for collector verification */}
                            {edition.published_date && (
                                <div>
                                    <FlaggingTrigger
                                        tableName="editions"
                                        recordId={id}
                                        fieldName="published_date"
                                        currentValue={edition.published_date}
                                        fieldLabel="Publication Date"
                                        contextData={editionContextData}
                                        className="flaggable-field inline-block rounded-sm px-1 -mx-1"
                                    >
                                        <div>Published: {new Date(edition.published_date).getFullYear()}</div>
                                    </FlaggingTrigger>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Stock Items Table */}
            <Card className="border-neutral-200/60 shadow-elevation-2 bg-gradient-to-br from-background/98 to-mint-50/20 rounded-xl">
                <CardHeader>
                    <CardTitle>Stock Items</CardTitle>
                    <CardDescription>
                        All copies of this edition in your inventory.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {edition.stock_items && edition.stock_items.length > 0 ? (
                        <div className="space-y-lg">
                            {/* REVIEWER FIX: This now correctly uses the memoized component,
                                preventing the performance bug. */}
                            {edition.stock_items.map((item) => (
                                <StockItemCard
                                    key={item.stock_item_id}
                                    item={item}
                                    editionTitle={edition.book_title}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-muted-foreground">No stock items for this edition.</div>
                    )}
                </CardContent>
            </Card>

            {/* Marketplace Card */}
            <Card className="border-neutral-200/60 shadow-elevation-2 bg-gradient-to-br from-background/98 to-lavender-50/30 rounded-xl">
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

        </div>
    );
}