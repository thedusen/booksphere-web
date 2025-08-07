/**
 * Enhanced Review Wizard for AI Cataloging Jobs
 * 
 * Two-phase wizard based on mobile app catalog-review pattern:
 * 1. AI Data Review & Contributors - Review and edit AI-extracted data
 * 2. Add to Inventory - Use the comprehensive AddToInventoryWizard
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  ArrowLeft,
  ChevronRight, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Import our components
import { AddToInventoryWizard } from './AddToInventoryWizard';
import { ContributorsEditor, Contributor, initializeContributorsFromAuthors } from './ContributorsEditor';

// Import hooks and services
import { useOrganization } from '@/hooks/useOrganization';
import { EditionMatchService } from '@/lib/services/cataloging-services';
import { useDebounce } from '@/hooks/useDebounce';
import { TypedCatalogingJob, BookMatch } from '@/lib/types/jobs';

interface EnhancedReviewWizardProps {
  job: TypedCatalogingJob;
  onComplete?: () => void;
  onCancel?: () => void;
}

interface EditionMatchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  matches: BookMatch[];
  isLoading: boolean;
  onSelectMatch: (match: BookMatch) => void;
  onCreateNew: () => void;
}

interface BookData {
  isbn?: string;
  title?: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  published_date?: string;
  page_count?: number;
  cover_image_url?: string;
  format_type?: string;
}

interface FormInputProps {
  label: string;
  value: string | undefined;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: string;
  placeholder?: string;
}

const EditionMatchDialog: React.FC<EditionMatchDialogProps> = ({
  isOpen,
  onOpenChange,
  matches,
  isLoading,
  onSelectMatch,
  onCreateNew,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-4xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Edition Match Results</AlertDialogTitle>
          <AlertDialogDescription>
            We found the following editions that might match your entry. Select one to apply its data, or create a new edition.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="max-h-[60vh] overflow-y-auto p-4" aria-live="polite">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin mr-2 h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              <p>Searching for editions...</p>
            </div>
          ) : matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((match) => (
                <Card key={match.edition_id} className="flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base leading-tight">{match.title}</CardTitle>
                      <Badge 
                        variant={match.confidence === 'high' ? 'default' : 'secondary'}
                        className="ml-2"
                      >
                        {match.confidence}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow pt-0">
                    {match.subtitle && (
                      <p className="text-sm text-muted-foreground mb-2">{match.subtitle}</p>
                    )}
                    <div className="space-y-1 text-sm">
                      <p><strong>Authors:</strong> {match.authors?.join(', ') || 'Unknown'}</p>
                      <p><strong>Publisher:</strong> {match.publisher_name || 'Unknown'}</p>
                      <p><strong>Year:</strong> {match.publication_year || 'Unknown'}</p>
                    </div>
                  </CardContent>
                  <div className="p-4 pt-0">
                    <Button onClick={() => onSelectMatch(match)} className="w-full" size="sm">
                      Select This Edition
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No matching editions found.</p>
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onCreateNew}>Create New Edition</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Helper component for form inputs
const FormInput = ({ 
  label, 
  value, 
  onChangeText, 
  multiline = false, 
  keyboardType = 'default', 
  placeholder = '' 
}: FormInputProps) => (
  <div className="space-y-2">
    <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>{label}</Label>
    {multiline ? (
      <textarea
        id={label.toLowerCase().replace(/\s+/g, '-')}
        className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm min-h-[80px] resize-none"
        value={value || ''}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
      />
    ) : (
      <Input
        id={label.toLowerCase().replace(/\s+/g, '-')}
        type={keyboardType === 'number-pad' ? 'number' : 'text'}
        value={value || ''}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
      />
    )}
  </div>
);

export function EnhancedReviewWizard({ job, onComplete, onCancel }: EnhancedReviewWizardProps) {
  const { organizationId } = useOrganization();
  
  // Wizard phases: 'review' or 'inventory'
  const [currentPhase, setCurrentPhase] = useState<'review' | 'inventory'>('review');
  
  // Form data state initialized with AI-extracted data
  const [formData, setFormData] = useState(() => ({
    title: job.extracted_data?.title || '',
    subtitle: job.extracted_data?.subtitle || '',
    publisher: job.extracted_data?.publisher_name || '',
    publication_year: job.extracted_data?.publication_year || null,
    edition_statement: job.extracted_data?.edition_statement || '',
    isbn: job.extracted_data?.isbn13 || job.extracted_data?.isbn || '',
    page_count: job.extracted_data?.page_count || null,
  }));

  // Contributors state
  const [contributors, setContributors] = useState<Contributor[]>(() => {
    if (job.extracted_data?.authors && Array.isArray(job.extracted_data.authors)) {
      return initializeContributorsFromAuthors(job.extracted_data.authors);
    }
    return [{ name: '', author_type_id: '8d3afa07-239b-49bb-afd9-b2dc85348b03', role: 'Author' }];
  });

  // Edition matching state
  const [isMatchDialogOpen, setMatchDialogOpen] = useState(false);
  const [matches, setMatches] = useState<BookMatch[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  const editionMatchService = EditionMatchService.getInstance();
  const debouncedTitle = useDebounce(formData.title || '', 500);
  const debouncedIsbn = useDebounce(formData.isbn || '', 500);

  // Effect to trigger edition matching
  useEffect(() => {
    const performMatch = async () => {
      if (!organizationId) return;

      if ((debouncedIsbn && debouncedIsbn.length >= 10) || 
          (debouncedTitle && debouncedTitle.length > 5)) {
        setIsMatching(true);
        setMatchDialogOpen(true);
        try {
          const results = await editionMatchService.findMatches(
            {
              title: debouncedTitle,
              isbn13: debouncedIsbn,
            },
            organizationId
          );
          
          const mappedMatches: BookMatch[] = results.map(r => ({
            ...r,
            confidence: r.confidence_score > 0.8 ? 'high' : 
                       r.confidence_score > 0.5 ? 'medium' : 'low',
          }));

          setMatches(mappedMatches);
        } catch (error) {
          console.error("Edition matching failed:", error);
          toast.error("Failed to search for matching editions.");
          setMatches([]);
        } finally {
          setIsMatching(false);
        }
      }
    };

    if (currentPhase === 'review') {
      performMatch();
    }
  }, [debouncedTitle, debouncedIsbn, editionMatchService, organizationId, currentPhase]);

  // Form data handlers
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSelectMatch = useCallback((match: BookMatch) => {
    setFormData(prev => ({
      ...prev,
      title: match.title,
      subtitle: match.subtitle || '',
      publisher: match.publisher_name || '',
      publication_year: match.publication_year ?? null,
    }));
    
    // Update contributors if available
    if (match.authors && match.authors.length > 0) {
      setContributors(initializeContributorsFromAuthors(match.authors));
    }
    
    toast.success("Applied data from selected edition.");
    setMatchDialogOpen(false);
  }, []);

  const handleCreateNew = useCallback(() => {
    toast.info("Continuing with manually entered data.");
    setMatchDialogOpen(false);
  }, []);

  // Prepare book data for AddToInventoryWizard
  const bookData: BookData = useMemo(() => ({
    isbn: formData.isbn,
    title: formData.title,
    subtitle: formData.subtitle,
    authors: contributors.filter(c => c.name.trim()).map(c => c.name.trim()),
    publisher: formData.publisher,
    published_date: formData.publication_year?.toString(),
    page_count: formData.page_count || undefined,
    cover_image_url: job.image_urls?.cover_url || undefined,
    format_type: 'Hardcover', // Default, will be selectable in inventory wizard
  }), [formData, contributors, job.image_urls]);

  // Navigation handlers
  const handleProceedToInventory = useCallback(() => {
    if (!formData.title) {
      toast.error('Please provide a title.');
      return;
    }

    if (!contributors || contributors.length === 0 || !contributors.some(c => c.name.trim())) {
      toast.error('At least one contributor is required.');
      return;
    }

    setCurrentPhase('inventory');
  }, [formData.title, contributors]);

  const handleBackToReview = useCallback(() => {
    setCurrentPhase('review');
  }, []);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const handleInventoryComplete = useCallback(() => {
    toast.success('Cataloging job completed successfully!');
    onComplete?.();
  }, [onComplete]);

  // Render the AI data review phase
  const renderReviewPhase = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Review AI Extracted Data</h1>
            <p className="text-muted-foreground">
              {job.extracted_data?.title || 'Cataloging Job'} • Job ID: {job.job_id}
            </p>
          </div>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Review Required</AlertTitle>
          <AlertDescription>
            Please review and correct the AI-extracted book details below before proceeding to inventory.
          </AlertDescription>
        </Alert>
      </div>

      {/* Main form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Basic info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Book Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormInput
                label="Title *"
                value={formData.title}
                onChangeText={(val: string) => handleInputChange('title', val)}
                placeholder="Enter book title"
              />
              
              <FormInput
                label="Subtitle"
                value={formData.subtitle}
                onChangeText={(val: string) => handleInputChange('subtitle', val)}
                placeholder="Enter subtitle if any"
              />
              
              <FormInput
                label="ISBN"
                value={formData.isbn}
                onChangeText={(val: string) => handleInputChange('isbn', val)}
                placeholder="Enter ISBN-10 or ISBN-13"
              />
              
              <FormInput
                label="Publisher"
                value={formData.publisher}
                onChangeText={(val: string) => handleInputChange('publisher', val)}
                placeholder="Enter publisher name"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Publication Year"
                  value={formData.publication_year?.toString()}
                  onChangeText={(val: string) => handleInputChange('publication_year', val)}
                  keyboardType="number-pad"
                  placeholder="2023"
                />
                
                <FormInput
                  label="Page Count"
                  value={formData.page_count?.toString()}
                  onChangeText={(val: string) => handleInputChange('page_count', val)}
                  keyboardType="number-pad"
                  placeholder="320"
                />
              </div>
              
              <FormInput
                label="Edition Statement"
                value={formData.edition_statement}
                onChangeText={(val: string) => handleInputChange('edition_statement', val)}
                placeholder="e.g., First Edition, Revised Edition"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right column - Contributors and image */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contributors</CardTitle>
            </CardHeader>
            <CardContent>
              <ContributorsEditor
                contributors={contributors}
                onContributorsChange={setContributors}
              />
            </CardContent>
          </Card>

          {/* Preview image if available */}
          {job.image_urls?.cover_url && (
            <Card>
              <CardHeader>
                <CardTitle>Cover Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-[3/4] max-w-48 mx-auto">
                  <img
                    src={job.image_urls.cover_url}
                    alt="Book cover"
                    className="w-full h-full object-cover rounded-md border"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={handleCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        
        <Button 
          onClick={handleProceedToInventory}
          disabled={!formData.title || !contributors.some(c => c.name.trim())}
        >
          Continue to Inventory
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Edition matching dialog */}
      <EditionMatchDialog
        isOpen={isMatchDialogOpen}
        onOpenChange={setMatchDialogOpen}
        matches={matches}
        isLoading={isMatching}
        onSelectMatch={handleSelectMatch}
        onCreateNew={handleCreateNew}
      />
    </div>
  );

  // Render based on current phase
  if (currentPhase === 'inventory') {
    return (
      <AddToInventoryWizard
        bookData={bookData}
        onComplete={handleInventoryComplete}
        onCancel={handleBackToReview}
      />
    );
  }

  return renderReviewPhase();
}