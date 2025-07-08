import React from "react";
import type { StockItem, EditionStockItem } from "@/lib/types/inventory";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

    return (
        <div className={cn(
            "flex justify-between items-center p-3 hover:bg-muted/50 rounded-md",
            !isLast ? "border-b border-muted" : "",
            "pl-24 pr-16"
        )}>
            <div className="flex-1 space-y-1">
                <div className="font-medium">{item.condition_name}</div>
                <div className="text-sm text-muted-foreground">SKU: {item.sku || "N/A"}</div>
                 <div className="flex items-center pt-1 space-x-2">
                    {isListedOn("Amazon") && <Badge variant="secondary">Amazon</Badge>}
                    {isListedOn("eBay") && <Badge variant="secondary">eBay</Badge>}
                    {needsPhotos && <Badge variant="outline">Needs Photos</Badge>}
                </div>
            </div>
            <div className="text-base font-semibold w-20 text-right">
                ${item.selling_price_amount ? item.selling_price_amount.toFixed(2) : "N/A"}
            </div>
        </div>
    );
};