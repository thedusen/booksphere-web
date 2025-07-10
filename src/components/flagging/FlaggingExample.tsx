'use client';

import React from 'react';
import { FlaggingTrigger, FlaggingButton, FlagStatus } from './index';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Example component showing how to integrate the flagging system
 * 
 * This demonstrates:
 * - Context menu flagging in data tables
 * - Button-based flagging for explicit actions
 * - Proper context data passing
 * - Field-level vs record-level flagging
 * - Integration with existing UI components
 */
export function FlaggingExample() {
  // Example book data
  const books = [
    {
      book_id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '978-0-7432-7356-5',
      publication_year: 1925,
      condition: 'Good',
      price: 15.99,
    },
    {
      book_id: '123e4567-e89b-12d3-a456-426614174001',
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '978-0-06-112008-4',
      publication_year: 1960,
      condition: 'Excellent',
      price: 12.50,
    },
  ];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Flagging System Integration Examples</CardTitle>
          <CardDescription>
            Right-click on any data field to flag it, or use the flag buttons for explicit actions.
            Try the keyboard shortcut Ctrl+Shift+R when focused on any flaggable element.
          </CardDescription>
        </CardHeader>
        <CardContent>
          
          {/* Example 1: Data Table with Context Menu Flagging */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Data Table with Context Menu Flagging</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>ISBN</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((book) => (
                  <TableRow key={book.book_id}>
                    <TableCell>
                      <FlaggingTrigger
                        tableName="books"
                        recordId={book.book_id}
                        fieldName="title"
                        currentValue={book.title}
                        fieldLabel="Book Title"
                        contextData={{
                          bookTitle: book.title,
                          author: book.author,
                          isbn: book.isbn,
                        }}
                      >
                        <span className="font-medium">{book.title}</span>
                      </FlaggingTrigger>
                    </TableCell>
                    <TableCell>
                      <FlaggingTrigger
                        tableName="books"
                        recordId={book.book_id}
                        fieldName="author"
                        currentValue={book.author}
                        fieldLabel="Author"
                        contextData={{
                          bookTitle: book.title,
                          author: book.author,
                        }}
                      >
                        {book.author}
                      </FlaggingTrigger>
                    </TableCell>
                    <TableCell>
                      <FlaggingTrigger
                        tableName="books"
                        recordId={book.book_id}
                        fieldName="isbn"
                        currentValue={book.isbn}
                        fieldLabel="ISBN"
                        contextData={{
                          bookTitle: book.title,
                          isbn: book.isbn,
                        }}
                      >
                        <code className="text-sm">{book.isbn}</code>
                      </FlaggingTrigger>
                    </TableCell>
                    <TableCell>
                      <FlaggingTrigger
                        tableName="books"
                        recordId={book.book_id}
                        fieldName="publication_year"
                        currentValue={book.publication_year.toString()}
                        fieldLabel="Publication Year"
                        contextData={{
                          bookTitle: book.title,
                          publicationYear: book.publication_year,
                        }}
                      >
                        {book.publication_year}
                      </FlaggingTrigger>
                    </TableCell>
                    <TableCell>
                      <FlaggingTrigger
                        tableName="books"
                        recordId={book.book_id}
                        fieldName="condition"
                        currentValue={book.condition}
                        fieldLabel="Condition"
                        contextData={{
                          bookTitle: book.title,
                          condition: book.condition,
                        }}
                      >
                        <Badge variant="outline">{book.condition}</Badge>
                      </FlaggingTrigger>
                    </TableCell>
                    <TableCell>
                      <FlaggingTrigger
                        tableName="books"
                        recordId={book.book_id}
                        fieldName="price"
                        currentValue={book.price.toString()}
                        fieldLabel="Price"
                        contextData={{
                          bookTitle: book.title,
                          price: book.price,
                        }}
                      >
                        ${book.price.toFixed(2)}
                      </FlaggingTrigger>
                    </TableCell>
                    <TableCell>
                      {/* Example of explicit button flagging */}
                      <FlaggingButton
                        tableName="books"
                        recordId={book.book_id}
                        currentValue={`${book.title} by ${book.author}`}
                        fieldLabel="Book Record"
                        contextData={{
                          bookTitle: book.title,
                          author: book.author,
                          isbn: book.isbn,
                          publicationYear: book.publication_year,
                        }}
                        size="sm"
                        variant="outline"
                        showLabel={false}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Example 2: Detail View with Button Flagging */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detail View with Button Flagging</h3>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <FlaggingTrigger
                    tableName="books"
                    recordId={books[0].book_id}
                    fieldName="title"
                    currentValue={books[0].title}
                    fieldLabel="Book Title"
                    contextData={{
                      bookTitle: books[0].title,
                      author: books[0].author,
                    }}
                  >
                    {books[0].title}
                  </FlaggingTrigger>
                  <FlaggingButton
                    tableName="books"
                    recordId={books[0].book_id}
                    currentValue={`${books[0].title} - Complete Record`}
                    fieldLabel="Complete Book Record"
                    contextData={{
                      bookTitle: books[0].title,
                      author: books[0].author,
                      isbn: books[0].isbn,
                      publicationYear: books[0].publication_year,
                      condition: books[0].condition,
                      price: books[0].price,
                    }}
                    size="sm"
                    variant="outline"
                    showLabel={true}
                  />
                </CardTitle>
                <CardDescription>
                  <FlaggingTrigger
                    tableName="books"
                    recordId={books[0].book_id}
                    fieldName="author"
                    currentValue={books[0].author}
                    fieldLabel="Author"
                    contextData={{
                      bookTitle: books[0].title,
                      author: books[0].author,
                    }}
                  >
                    by {books[0].author}
                  </FlaggingTrigger>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ISBN</label>
                    <div className="flex items-center gap-2">
                      <FlaggingTrigger
                        tableName="books"
                        recordId={books[0].book_id}
                        fieldName="isbn"
                        currentValue={books[0].isbn}
                        fieldLabel="ISBN"
                        contextData={{
                          bookTitle: books[0].title,
                          isbn: books[0].isbn,
                        }}
                      >
                        <code className="text-sm">{books[0].isbn}</code>
                      </FlaggingTrigger>
                      <FlaggingButton
                        tableName="books"
                        recordId={books[0].book_id}
                        fieldName="isbn"
                        currentValue={books[0].isbn}
                        fieldLabel="ISBN"
                        contextData={{
                          bookTitle: books[0].title,
                          isbn: books[0].isbn,
                        }}
                        size="sm"
                        variant="ghost"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Publication Year</label>
                    <div className="flex items-center gap-2">
                      <FlaggingTrigger
                        tableName="books"
                        recordId={books[0].book_id}
                        fieldName="publication_year"
                        currentValue={books[0].publication_year.toString()}
                        fieldLabel="Publication Year"
                        contextData={{
                          bookTitle: books[0].title,
                          publicationYear: books[0].publication_year,
                        }}
                      >
                        {books[0].publication_year}
                      </FlaggingTrigger>
                      <FlaggingButton
                        tableName="books"
                        recordId={books[0].book_id}
                        fieldName="publication_year"
                        currentValue={books[0].publication_year.toString()}
                        fieldLabel="Publication Year"
                        contextData={{
                          bookTitle: books[0].title,
                          publicationYear: books[0].publication_year,
                        }}
                        size="sm"
                        variant="ghost"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Example 3: Flagged Item States */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Flagged Item States</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Open Flag</CardTitle>
                </CardHeader>
                <CardContent>
                  <FlaggingTrigger
                    tableName="books"
                    recordId="example-flagged-open"
                    fieldName="title"
                    currentValue="Example Book with Open Flag"
                    fieldLabel="Book Title"
                    isFlagged={true}
                    flagStatus={FlagStatus.OPEN}
                    contextData={{
                      bookTitle: 'Example Book with Open Flag',
                      author: 'Test Author',
                    }}
                  >
                    {/**
                     * Addresses Code Review Feedback:
                     * - Adds missing children to the component instance to prevent a runtime error.
                     */}
                    <span>Example Book with Open Flag</span>
                  </FlaggingTrigger>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Resolved Flag</CardTitle>
                </CardHeader>
                <CardContent>
                  <FlaggingTrigger
                    tableName="books"
                    recordId="example-flagged-resolved"
                    fieldName="author"
                    currentValue="Test Author (Resolved)"
                    fieldLabel="Author"
                    isFlagged={true}
                    flagStatus={FlagStatus.RESOLVED}
                    contextData={{
                      bookTitle: 'Example Book',
                      author: 'Test Author (Resolved)',
                    }}
                  >
                    {/**
                     * Addresses Code Review Feedback:
                     * - Adds missing children to the component instance to prevent a runtime error.
                     */}
                    <span>Test Author (Resolved)</span>
                  </FlaggingTrigger>
                </CardContent>
              </Card>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
} 