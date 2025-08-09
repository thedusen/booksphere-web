// components/admin/EditionContextCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Book, Calendar, Hash, Ruler, Weight, ExternalLink } from 'lucide-react';
import { useEditionDetails, formatWeight } from '@/hooks/useRecordDetails';

interface EditionContextCardProps {
  editionId: string;
}

export function EditionContextCard({ editionId }: EditionContextCardProps) {
  const { data: edition, isLoading, error } = useEditionDetails(editionId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            Edition Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !edition) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Book className="h-4 w-4" />
            Edition Details - Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error ? 'Failed to load edition details' : 'Edition not found'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Book className="h-4 w-4" />
          Edition Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title and Subtitle */}
        <div>
          <h3 className="font-semibold text-lg leading-tight">
            {edition.title || edition.book_title || 'Untitled'}
          </h3>
          {edition.subtitle && (
            <p className="text-muted-foreground mt-1">{edition.subtitle}</p>
          )}
          {edition.book_title && edition.title !== edition.book_title && (
            <p className="text-xs text-muted-foreground mt-1">
              Book: {edition.book_title}
            </p>
          )}
        </div>

        {/* Cover Image */}
        {edition.edition_cover_image_url && (
          <div className="flex justify-center">
            <img
              src={edition.edition_cover_image_url}
              alt={`Cover of ${edition.title || edition.book_title}`}
              className="max-w-24 max-h-32 object-cover rounded border"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* ISBNs */}
        {(edition.isbn13 || edition.isbn10) && (
          <div>
            <h4 className="font-medium text-sm mb-2">ISBN</h4>
            <div className="flex flex-wrap gap-2">
              {edition.isbn13 && (
                <Badge variant="outline" className="font-mono">
                  ISBN-13: {edition.isbn13}
                </Badge>
              )}
              {edition.isbn10 && (
                <Badge variant="outline" className="font-mono">
                  ISBN-10: {edition.isbn10}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Publication Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {edition.publisher_name && (
            <div>
              <span className="text-muted-foreground">Publisher:</span>
              <p className="font-medium">{edition.publisher_name}</p>
            </div>
          )}

          {edition.publish_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Published:</span>
              <span className="font-medium">{edition.publish_date}</span>
            </div>
          )}

          {edition.format_type && (
            <div>
              <span className="text-muted-foreground">Format:</span>
              <p className="font-medium">{edition.format_type}</p>
            </div>
          )}

          {edition.number_of_pages && (
            <div className="flex items-center gap-2">
              <Hash className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Pages:</span>
              <span className="font-medium">{edition.number_of_pages}</span>
            </div>
          )}
        </div>

        {/* Physical Details */}
        {(edition.physical_dimensions || edition.weight_grams) && (
          <div>
            <h4 className="font-medium text-sm mb-2">Physical Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {edition.physical_dimensions && (
                <div className="flex items-center gap-2">
                  <Ruler className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Dimensions:</span>
                  <span className="font-medium text-xs">{edition.physical_dimensions}</span>
                </div>
              )}

              {edition.weight_grams && (
                <div className="flex items-center gap-2">
                  <Weight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Weight:</span>
                  <span className="font-medium">{formatWeight(edition.weight_grams)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Series Information */}
        {(edition.series_title || edition.series_number) && (
          <div>
            <h4 className="font-medium text-sm mb-2">Series</h4>
            <div className="text-sm">
              {edition.series_title && (
                <p className="font-medium">{edition.series_title}</p>
              )}
              {edition.series_number && (
                <p className="text-muted-foreground">Book #{edition.series_number}</p>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {edition.description && (
          <div>
            <h4 className="font-medium text-sm mb-2">Description</h4>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
              {edition.description}
            </p>
          </div>
        )}

        {/* Additional Info */}
        <div className="flex flex-wrap gap-2">
          {edition.by_statement && (
            <Badge variant="secondary" className="text-xs">
              {edition.by_statement}
            </Badge>
          )}
          {edition.publish_country && (
            <Badge variant="outline" className="text-xs">
              {edition.publish_country}
            </Badge>
          )}
          {edition.open_library_edition_key && (
            <Badge variant="outline" className="text-xs">
              <ExternalLink className="h-3 w-3 mr-1" />
              Open Library
            </Badge>
          )}
        </div>

        {/* Technical Details */}
        <div className="pt-2 border-t">
          <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Edition ID:</span>
              <code className="font-mono">{edition.edition_id}</code>
            </div>
            {edition.book_id && (
              <div className="flex justify-between">
                <span>Book ID:</span>
                <code className="font-mono">{edition.book_id}</code>
              </div>
            )}
            <div className="flex justify-between">
              <span>Created:</span>
              <span>{new Date(edition.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Updated:</span>
              <span>{new Date(edition.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}