// components/admin/FlagContextDetails.tsx
import React from 'react';
import { BookContextCard } from './BookContextCard';
import { EditionContextCard } from './EditionContextCard';
import { StockItemContextCard } from './StockItemContextCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface FlagContextDetailsProps {
  tableName: string;
  recordId: string;
}

export function FlagContextDetails({ tableName, recordId }: FlagContextDetailsProps) {
  // Validate inputs
  if (!tableName || !recordId) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            Invalid Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Missing table name or record ID for context display.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Render appropriate context card based on table type
  switch (tableName.toLowerCase()) {
    case 'books':
      return <BookContextCard bookId={recordId} />;
    
    case 'editions':
      return <EditionContextCard editionId={recordId} />;
    
    case 'stock_items':
      return <StockItemContextCard stockItemId={recordId} />;
    
    default:
      return (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              Unknown Record Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Unsupported table type: <code className="font-mono">{tableName}</code>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Supported types: books, editions, stock_items
            </p>
          </CardContent>
        </Card>
      );
  }
}