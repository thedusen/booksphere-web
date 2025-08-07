/**
 * Manual ISBN Entry Page
 * 
 * Allows users to manually enter an ISBN to look up book information
 * and then proceed to the AddToInventoryWizard
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Book } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';


// Import validation from the real book API service
import { validateISBN } from '@/lib/services/book-api';

export default function ManualISBNEntryPage() {
  const router = useRouter();
  const [isbn, setIsbn] = useState('');

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!isbn.trim()) {
      toast.error('Please enter an ISBN');
      return;
    }

    if (!validateISBN(isbn.trim())) {
      toast.error('Please enter a valid ISBN (10 or 13 digits)');
      return;
    }

    // Navigate to review page with ISBN (matches mobile app)
    router.push(`/cataloging/review/${isbn.trim()}`);
  }, [isbn, router]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }, [handleSubmit]);


  // Show the ISBN entry form
  return (
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-2xl font-bold">Manual ISBN Entry</h1>
              <p className="text-muted-foreground">
                Enter an ISBN to find and catalog a book
              </p>
            </div>
          </div>

          {/* ISBN Entry Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Enter ISBN
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="isbn-input">
                  ISBN (10 or 13 digits)
                </Label>
                <div className="text-sm text-muted-foreground mb-3">
                  Found on the copyright page or back cover of the book
                </div>
                <Input
                  id="isbn-input"
                  type="text"
                  placeholder="e.g., 9780143126560 or 978-0-14-312656-0"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLooking}
                  className="text-lg text-center font-mono"
                  autoFocus
                />
              </div>

              {/* Validation feedback */}
              {isbn && !validateISBN(isbn) && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Please enter a valid ISBN (10 or 13 digits)
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleSubmit}
                disabled={!isbn.trim() || !validateISBN(isbn.trim())}
                className="w-full"
                size="lg"
              >
                <Search className="mr-2 h-5 w-5" />
                Find Book
              </Button>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How to find an ISBN</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                  1
                </div>
                <div>
                  <p className="font-medium text-foreground">Check the copyright page</p>
                  <p>Usually found on the back of the title page</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                  2
                </div>
                <div>
                  <p className="font-medium text-foreground">Look at the back cover</p>
                  <p>Near the barcode, usually starting with 978 or 979</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground">Include or exclude dashes</p>
                  <p>Both &quot;9780143126560&quot; and &quot;978-0-14-312656-0&quot; work</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}