// components/admin/StockItemContextCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, DollarSign, MapPin, Calendar, Ruler, Weight, Tag } from 'lucide-react';
import { useStockItemDetails, formatPrice, formatWeight, formatDimensions } from '@/hooks/useRecordDetails';

interface StockItemContextCardProps {
  stockItemId: string;
}

export function StockItemContextCard({ stockItemId }: StockItemContextCardProps) {
  const { data: stockItem, isLoading, error } = useStockItemDetails(stockItemId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Stock Item Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !stockItem) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Package className="h-4 w-4" />
            Stock Item Details - Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error ? 'Failed to load stock item details' : 'Stock item not found'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Stock Item Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title and Book Info */}
        <div>
          <h3 className="font-semibold text-lg leading-tight">
            {stockItem.book_title || stockItem.edition_title || 'Untitled'}
          </h3>
          {(stockItem.isbn13 || stockItem.isbn10) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {stockItem.isbn13 && (
                <Badge variant="outline" className="font-mono text-xs">
                  {stockItem.isbn13}
                </Badge>
              )}
              {stockItem.isbn10 && (
                <Badge variant="outline" className="font-mono text-xs">
                  {stockItem.isbn10}
                </Badge>
              )}
            </div>
          )}
          {stockItem.publisher_name && (
            <p className="text-sm text-muted-foreground mt-1">
              Published by {stockItem.publisher_name}
            </p>
          )}
        </div>

        {/* Primary Image */}
        {stockItem.primary_image_url && (
          <div className="flex justify-center">
            <img
              src={stockItem.primary_image_url}
              alt={`Photo of ${stockItem.book_title || stockItem.edition_title}`}
              className="max-w-24 max-h-32 object-cover rounded border"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* SKU and Status */}
        <div className="flex flex-wrap gap-2">
          {stockItem.sku && (
            <Badge variant="secondary">
              <Tag className="h-3 w-3 mr-1" />
              {stockItem.sku}
            </Badge>
          )}
          {stockItem.status && (
            <Badge variant={stockItem.status === 'available' ? 'default' : 'outline'}>
              {stockItem.status}
            </Badge>
          )}
          {stockItem.condition && (
            <Badge variant="outline">
              {stockItem.condition}
            </Badge>
          )}
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stockItem.selling_price_cents && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-3 w-3 text-green-600" />
              <span className="text-muted-foreground">Selling Price:</span>
              <span className="font-semibold text-green-600">
                {formatPrice(stockItem.selling_price_cents)}
              </span>
            </div>
          )}

          {stockItem.cost_cents && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Cost:</span>
              <span className="font-medium">
                {formatPrice(stockItem.cost_cents)}
              </span>
            </div>
          )}
        </div>

        {/* Location and Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {stockItem.location_in_store && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Location:</span>
              <span className="font-medium">{stockItem.location_in_store}</span>
            </div>
          )}

          {stockItem.date_acquired && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Acquired:</span>
              <span className="font-medium">
                {new Date(stockItem.date_acquired).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Physical Details */}
        {(stockItem.weight_grams || stockItem.length_mm || stockItem.width_mm || stockItem.height_mm) && (
          <div>
            <h4 className="font-medium text-sm mb-2">Physical Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {stockItem.weight_grams && (
                <div className="flex items-center gap-2">
                  <Weight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Weight:</span>
                  <span className="font-medium">{formatWeight(stockItem.weight_grams)}</span>
                </div>
              )}

              {(stockItem.length_mm || stockItem.width_mm || stockItem.height_mm) && (
                <div className="flex items-center gap-2">
                  <Ruler className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Dimensions:</span>
                  <span className="font-medium text-xs">
                    {formatDimensions(stockItem.length_mm, stockItem.width_mm, stockItem.height_mm)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Consignment Info */}
        {stockItem.is_consignment && (
          <div>
            <h4 className="font-medium text-sm mb-2">Consignment</h4>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">Consignment Item</Badge>
              {stockItem.consignment_percentage && (
                <span className="text-muted-foreground">
                  {stockItem.consignment_percentage}% commission
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stock Item Attributes */}
        {stockItem.attributes && stockItem.attributes.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Attributes</h4>
            <div className="flex flex-wrap gap-2">
              {stockItem.attributes.map((attr, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {attr.attribute_name}: {attr.attribute_value}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Condition Notes */}
        {stockItem.condition_notes && (
          <div>
            <h4 className="font-medium text-sm mb-2">Condition Notes</h4>
            <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
              {stockItem.condition_notes}
            </p>
          </div>
        )}

        {/* General Notes */}
        {stockItem.notes && (
          <div>
            <h4 className="font-medium text-sm mb-2">Notes</h4>
            <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
              {stockItem.notes}
            </p>
          </div>
        )}

        {/* Edition Info */}
        {(stockItem.number_of_pages || stockItem.publish_date || stockItem.format_type) && (
          <div>
            <h4 className="font-medium text-sm mb-2">Edition Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {stockItem.number_of_pages && (
                <div>
                  <span className="text-muted-foreground">Pages:</span>
                  <span className="font-medium ml-2">{stockItem.number_of_pages}</span>
                </div>
              )}
              {stockItem.publish_date && (
                <div>
                  <span className="text-muted-foreground">Published:</span>
                  <span className="font-medium ml-2">{stockItem.publish_date}</span>
                </div>
              )}
              {stockItem.format_type && (
                <div>
                  <span className="text-muted-foreground">Format:</span>
                  <span className="font-medium ml-2">{stockItem.format_type}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Technical Details */}
        <div className="pt-2 border-t">
          <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Stock Item ID:</span>
              <code className="font-mono">{stockItem.stock_item_id}</code>
            </div>
            {stockItem.edition_id && (
              <div className="flex justify-between">
                <span>Edition ID:</span>
                <code className="font-mono">{stockItem.edition_id}</code>
              </div>
            )}
            <div className="flex justify-between">
              <span>Created:</span>
              <span>{new Date(stockItem.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Updated:</span>
              <span>{new Date(stockItem.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}