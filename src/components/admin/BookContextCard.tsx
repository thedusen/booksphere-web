// components/admin/BookContextCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Calendar, Hash, ExternalLink } from 'lucide-react';
import { useBookDetails } from '@/hooks/useRecordDetails';

interface BookContextCardProps {
  bookId: string;
}

export function BookContextCard({ bookId }: BookContextCardProps) {
  const { data: book, isLoading, error } = useBookDetails(bookId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Book Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-16 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !book) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <BookOpen className="h-4 w-4" />
            Book Details - Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error ? 'Failed to load book details' : 'Book not found'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Book Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title and Subtitle */}
        <div>
          <h3 className="font-semibold text-lg leading-tight">
            {book.title || 'Untitled'}
          </h3>
          {book.subtitle && (
            <p className="text-muted-foreground mt-1">{book.subtitle}</p>
          )}
        </div>

        {/* Cover Image */}
        {book.primary_cover_image_url && (
          <div className="flex justify-center">
            <img
              src={book.primary_cover_image_url}
              alt={`Cover of ${book.title}`}
              className="max-w-24 max-h-32 object-cover rounded border"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Description */}
        {book.description && (
          <div>
            <h4 className="font-medium text-sm mb-2">Description</h4>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
              {book.description}
            </p>
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {book.first_publish_year && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">First Published:</span>
              <span className="font-medium">{book.first_publish_year}</span>
            </div>
          )}

          {book.edition_count && (
            <div className="flex items-center gap-2">
              <Hash className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Editions:</span>
              <span className="font-medium">{book.edition_count}</span>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {book.is_serial && (
            <Badge variant="secondary">Serial</Badge>
          )}
          {book.open_library_work_key && (
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
              <span>Book ID:</span>
              <code className="font-mono">{book.book_id}</code>
            </div>
            <div className="flex justify-between">
              <span>Created:</span>
              <span>{new Date(book.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Updated:</span>
              <span>{new Date(book.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}