/**
 * Book Review Page
 * 
 * Matches the mobile app's review.tsx functionality exactly.
 * Shows book data from Buildship API and allows user to:
 * 1. Review the book details
 * 2. Edit the book details  
 * 3. Add to inventory
 * 4. Go back to scan again
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit3, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { fetchBookDataByISBN, BookData } from '@/lib/services/book-api';
import Image from 'next/image';

interface BookReviewPageProps {
  params: {
    isbn: string;
  };
}

export default function BookReviewPage({ params }: BookReviewPageProps) {
  const router = useRouter();
  const { isbn } = params;

  // Query book data using the real API (matches mobile app exactly)
  const { 
    data: bookData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<BookData, Error>({
    queryKey: ['bookDetails', isbn],
    queryFn: () => fetchBookDataByISBN(isbn),
    enabled: !!isbn,
  });

  const handleAddToInventory = () => {
    if (!bookData) return;
    
    // Navigate to AddToInventoryWizard with book data
    router.push(`/cataloging/add-to-inventory?book=${encodeURIComponent(JSON.stringify(bookData))}`);
  };

  const handleEdit = () => {
    if (!bookData) return;
    
    // Navigate to edit book page (can be implemented later)
    router.push(`/cataloging/edit-book?book=${encodeURIComponent(JSON.stringify(bookData))}`);
  };

  const handleGoBack = () => {
    // Navigate back to cataloging dashboard (matches mobile app)
    router.replace('/cataloging');
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex flex-col justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Looking up book details...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex-1 flex flex-col justify-center items-center py-12 px-4">
          <Alert variant="destructive" className="mb-6 max-w-md">
            <AlertTitle className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Book Not Found
            </AlertTitle>
            <AlertDescription className="mt-2">
              {error.message}
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <Button onClick={() => refetch()} variant="outline" className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            
            <Button onClick={handleGoBack} variant="ghost" className="w-full">
              Scan a Different Book
            </Button>
          </div>
        </div>
      );
    }

    if (bookData) {
      return (
        <div className="space-y-6">
          {/* Book Cover and Details */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Book Cover */}
                <div className="flex justify-center md:justify-start">
                  {bookData.cover_image_url ? (
                    <div className="relative w-48 h-72 rounded-lg overflow-hidden bg-gray-200 shadow-md">
                      <Image
                        src={bookData.cover_image_url}
                        alt={`Cover of ${bookData.title}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 192px, 192px"
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-72 rounded-lg bg-gray-200 flex items-center justify-center">
                      <p className="text-muted-foreground text-sm text-center px-4">
                        No cover image available
                      </p>
                    </div>
                  )}
                </div>

                {/* Book Information */}
                <div className="flex-1 space-y-4">
                  <div className="text-center md:text-left">
                    <h1 className="text-2xl font-bold text-foreground leading-tight">
                      {bookData.title}
                    </h1>
                    {bookData.subtitle && (
                      <p className="text-lg text-muted-foreground mt-1">
                        {bookData.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {bookData.authors && bookData.authors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Authors</p>
                        <p className="text-base text-foreground">
                          {bookData.authors.join(', ')}
                        </p>
                      </div>
                    )}

                    {bookData.publisher && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Publisher</p>
                        <p className="text-base text-foreground">
                          {bookData.publisher}
                          {bookData.published_date && (
                            <span className="text-muted-foreground">
                              {' '}({bookData.published_date.substring(0, 4)})
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                      {bookData.isbn && (
                        <Badge variant="secondary">
                          ISBN: {bookData.isbn}
                        </Badge>
                      )}
                      {bookData.page_count && (
                        <Badge variant="secondary">
                          {bookData.page_count} pages
                        </Badge>
                      )}
                      {bookData.format_type && (
                        <Badge variant="secondary">
                          {bookData.format_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button 
              onClick={handleAddToInventory} 
              className="w-full"
              size="lg"
            >
              Add to Inventory
            </Button>
            
            <Button 
              onClick={handleEdit} 
              variant="outline" 
              className="w-full"
              size="lg"
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Details
            </Button>
            
            <Button 
              onClick={handleGoBack} 
              variant="ghost" 
              className="w-full"
            >
              <span className="underline">Not this book? Scan again.</span>
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cataloging">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Cataloging
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Review Book</h1>
              <p className="text-muted-foreground text-sm">
                Verify the book details before adding to inventory
              </p>
            </div>
          </div>

          {/* Content */}
          {renderContent()}
        </div>
      </div>
    </div>
  );
}