import React, { useMemo } from "react";
import type { StockItem, EditionStockItem } from "@/lib/types/inventory";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FlaggingTrigger } from "@/components/flagging";

interface StockItemRowProps {
    item: StockItem | EditionStockItem;
    isLast?: boolean;
}

export const StockItemRow: React.FC<StockItemRowProps> = ({ item, isLast = false }) => {
    const isListedOn = (marketplace: string) => {
        if ('marketplace_listings' in item && Array.isArray(item.marketplace_listings)) {
            return item.marketplace_listings.some(
                (listing) => listing.marketplace_name === marketplace && listing.status === 'active'
            );
        }
        return false;
    };
    const needsPhotos = 'has_photos' in item ? !item.has_photos : false;

    // Memoize context data for performance (expert recommendation)
    const skuContextData = useMemo(() => ({
        condition: item.condition_name,
        price: item.selling_price_amount,
    }), [item.condition_name, item.selling_price_amount]);

    const conditionContextData = useMemo(() => ({
        sku: item.sku || "N/A",
        price: item.selling_price_amount,
    }), [item.sku, item.selling_price_amount]);

    const priceContextData = useMemo(() => ({
        sku: item.sku || "N/A", 
        condition: item.condition_name,
    }), [item.sku, item.condition_name]);

    // Handle empty states gracefully (expert recommendation)
    const displaySku = item.sku || "N/A";
    const displayPrice = item.selling_price_amount ? item.selling_price_amount.toFixed(2) : "N/A";

    return (
        <div className={cn(
            "flex justify-between items-center p-3 hover:bg-muted/50 rounded-md",
            !isLast ? "border-b border-muted" : "",
            "pl-24 pr-16"
        )}>
            <div className="flex-1 space-y-1">
                {/* Condition field with flagging capability */}
                <FlaggingTrigger
                    tableName="stock_items"
                    recordId={item.stock_item_id}
                    fieldName="condition_name"
                    currentValue={item.condition_name}
                    fieldLabel="Condition"
                    contextData={conditionContextData}
                    className="inline-block rounded-sm px-1 -mx-1"
                >
                    <div className="font-medium">{item.condition_name}</div>
                </FlaggingTrigger>

                {/* SKU field with flagging capability */}
                <FlaggingTrigger
                    tableName="stock_items"
                    recordId={item.stock_item_id}
                    fieldName="sku"
                    currentValue={displaySku}
                    fieldLabel="SKU"
                    contextData={skuContextData}
                    className="inline-block rounded-sm px-1 -mx-1"
                >
                    <div className="text-sm text-muted-foreground">SKU: {displaySku}</div>
                </FlaggingTrigger>

                <div className="flex items-center pt-1 space-x-2">
                    {isListedOn("Amazon") && <Badge variant="secondary">Amazon</Badge>}
                    {isListedOn("eBay") && <Badge variant="secondary">eBay</Badge>}
                    {needsPhotos && <Badge variant="outline">Needs Photos</Badge>}
                </div>
            </div>

            {/* Price field with flagging capability */}
            <FlaggingTrigger
                tableName="stock_items"
                recordId={item.stock_item_id}
                fieldName="selling_price_amount"
                currentValue={`$${displayPrice}`}
                fieldLabel="Selling Price"
                contextData={priceContextData}
                className="inline-block rounded-sm px-2 -mx-2"
            >
                <div className="text-base font-semibold w-20 text-right">
                    ${displayPrice}
                </div>
            </FlaggingTrigger>
        </div>
    );
};