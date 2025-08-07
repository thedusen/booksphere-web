/**
 * Add to Inventory Page
 * 
 * Wrapper page that receives book data from the review step and 
 * passes it to the AddToInventoryWizard component.
 * This matches the mobile app's add-to-inventory.tsx flow.
 */

'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AddToInventoryWizard } from '@/components/cataloging/AddToInventoryWizard';
import { BookData } from '@/lib/services/book-api';
import { Loader2 } from 'lucide-react';

function AddToInventoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get book data from query parameters
  const bookDataString = searchParams.get('book');
  
  if (!bookDataString) {
    // If no book data, redirect back to cataloging
    router.replace('/cataloging');
    return null;
  }

  let bookData: BookData;
  try {
    bookData = JSON.parse(bookDataString);
  } catch (error) {
    console.error('Invalid book data:', error);
    router.replace('/cataloging');
    return null;
  }

  const handleComplete = () => {
    // On completion, navigate back to cataloging dashboard
    router.push('/cataloging');
  };

  const handleCancel = () => {
    // On cancel, navigate back to cataloging dashboard  
    router.back();
  };

  return (
    <AddToInventoryWizard
      bookData={bookData}
      onComplete={handleComplete}
      onCancel={handleCancel}
      initialStep={1}
    />
  );
}

export default function AddToInventoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading book data...</p>
        </div>
      </div>
    }>
      <AddToInventoryContent />
    </Suspense>
  );
}