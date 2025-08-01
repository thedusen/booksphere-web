/**
 * Review Wizard Component - Simplified Version
 * 
 * A basic review wizard for finalizing cataloging entries.
 * This is a foundational implementation that demonstrates the key concepts
 * and can be extended with more advanced features later.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { AttributePicker } from './AttributePicker';

// Import hooks and services
import { useFinalizeCatalogingJob } from '@/hooks/useCatalogJobs';
import { useOrganization } from '@/hooks/useOrganization';
import { EditionMatchService, useBookFormats } from '@/lib/services/cataloging-services';
import { useDebounce } from '@/hooks/useDebounce';
import { TypedCatalogingJob, BookMatch } from '@/lib/types/jobs';
import { CatalogingJobFinalizeRequest } from '@/lib/validators/cataloging';

interface ReviewWizardProps {
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
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Edition Match Results</AlertDialogTitle>
          <AlertDialogDescription>
            We found the following editions that might match your entry. Select one to apply its data, or create a new edition.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="max-h-[60vh] overflow-y-auto p-4" aria-live="polite">
          {isLoading ? (
            <p>Searching for editions...</p>
          ) : matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((match) => (
                <Card key={match.edition_id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg">{match.title}</CardTitle>
                    <Badge variant={match.confidence === 'high' ? 'default' : 'secondary'}>
                      {match.confidence} confidence
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">{match.subtitle}</p>
                    <p className="text-sm mt-2"><strong>Authors:</strong> {match.authors?.join(', ')}</p>
                    <p className="text-sm"><strong>Publisher:</strong> {match.publisher_name}</p>
                    <p className="text-sm"><strong>Year:</strong> {match.publication_year}</p>
                  </CardContent>
                  <div className="p-4 pt-0">
                    <Button onClick={() => onSelectMatch(match)} className="w-full">Select This Edition</Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p>No matches found.</p>
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


const WIZARD_STEPS = [
  { id: 1, title: 'Bibliographic Data', description: 'Title, authors, publisher details' },
  { id: 2, title: 'Physical Details', description: 'Format, pagination, condition' },
  { id: 3, title: 'Pricing & Final Review', description: 'Set price and finalize' },
] as const;

export function ReviewWizard({ job, onComplete, onCancel }: ReviewWizardProps) {
  const router = useRouter();
  const { organizationId } = useOrganization();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CatalogingJobFinalizeRequest>>({
    job_id: job.job_id,
    isbn: job.extracted_data?.isbn || '',
    title: job.extracted_data?.title || '',
    subtitle: job.extracted_data?.subtitle || '',
    authors: job.extracted_data?.authors || [],
    publisher_name: job.extracted_data?.publisher_name || '',
    publication_year: job.extracted_data?.publication_year,
    has_dust_jacket: job.extracted_data?.has_dust_jacket || false,
    condition_id: '', // Will be set by user
    price: 0, // Will be set by user
    format_id: undefined, // Will be set by user
    pagination_text: '', // will be set by user
    selected_attributes: [], // will be set by user
  });

  const [isMatchDialogOpen, setMatchDialogOpen] = useState(false);
  const [matches, setMatches] = useState<BookMatch[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  const editionMatchService = EditionMatchService.getInstance();

  const debouncedTitle = useDebounce(formData.title || '', 500);
  const debouncedIsbn = useDebounce(formData.isbn || '', 500);

  const { data: bookFormats, isLoading: isLoadingFormats, error: formatsError } = useBookFormats();

  const finalizeMutation = useFinalizeCatalogingJob();

  // Effect to trigger edition matching
  React.useEffect(() => {
    const performMatch = async () => {
      if (!organizationId) return;

      if ((debouncedIsbn && debouncedIsbn.length >= 10) || (debouncedTitle && debouncedTitle.length > 5)) {
        setIsMatching(true);
        setMatchDialogOpen(true);
        try {
          const results = await editionMatchService.findMatches(
            {
              title: debouncedTitle,
              isbn13: debouncedIsbn, // Assuming ISBN is ISBN-13 for matching
            },
            organizationId
          );
          
          const mappedMatches: BookMatch[] = results.map(r => ({
            ...r,
            confidence: r.confidence_score > 0.8 ? 'high' : r.confidence_score > 0.5 ? 'medium' : 'low',
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
    performMatch();
  }, [debouncedTitle, debouncedIsbn, editionMatchService, organizationId]);


  // Update form data
  const updateFormData = useCallback((updates: Partial<CatalogingJobFinalizeRequest>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Navigation handlers
  const handleNextStep = useCallback(() => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleSelectMatch = (match: BookMatch) => {
    updateFormData({
      title: match.title,
      subtitle: match.subtitle,
      authors: match.authors,
      publisher_name: match.publisher_name,
      publication_year: match.publication_year,
      // You might want to map other fields as well
    });
    toast.success("Applied data from selected edition.");
    setMatchDialogOpen(false);
  };

  const handleCreateNew = () => {
    toast.info("Continuing with manually entered data.");
    setMatchDialogOpen(false);
  };

  // Final submission
  const handleSubmit = useCallback(async () => {
    if (!formData.title || !formData.condition_id || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await finalizeMutation.mutateAsync({
        job_id: job.job_id,
        title: formData.title,
        subtitle: formData.subtitle,
        authors: formData.authors,
        publisher_name: formData.publisher_name,
        publication_year: formData.publication_year,
        has_dust_jacket: formData.has_dust_jacket,
        condition_id: formData.condition_id,
        price: formData.price,
        condition_notes: formData.condition_notes,
        sku: formData.sku,
        format_id: formData.format_id,
        pagination_text: formData.pagination_text,
        selected_attributes: formData.selected_attributes,
      });

      toast.success('Book successfully added to inventory!');
      onComplete?.();
      router.push('/cataloging');
    } catch (error) {
      console.error('Failed to finalize job:', error);
      toast.error('Failed to finalize cataloging job');
    }
  }, [formData, finalizeMutation, job.job_id, onComplete, router]);

  // Cancel handler
  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                value={formData.isbn || ''}
                onChange={(e) => updateFormData({ isbn: e.target.value })}
                placeholder="Enter ISBN"
              />
            </div>
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => updateFormData({ title: e.target.value })}
                placeholder="Enter book title"
              />
            </div>
            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={formData.subtitle || ''}
                onChange={(e) => updateFormData({ subtitle: e.target.value })}
                placeholder="Enter book subtitle"
              />
            </div>
            <div>
              <Label htmlFor="authors">Authors</Label>
              <Input
                id="authors"
                value={formData.authors?.join(', ') || ''}
                onChange={(e) => updateFormData({ authors: e.target.value.split(', ').filter(Boolean) })}
                placeholder="Enter authors (comma-separated)"
              />
            </div>
            <div>
              <Label htmlFor="publisher">Publisher</Label>
              <Input
                id="publisher"
                value={formData.publisher_name || ''}
                onChange={(e) => updateFormData({ publisher_name: e.target.value })}
                placeholder="Enter publisher name"
              />
            </div>
            <div>
              <Label htmlFor="year">Publication Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.publication_year || ''}
                onChange={(e) => updateFormData({ publication_year: parseInt(e.target.value) || undefined })}
                placeholder="Enter publication year"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="format">Book Format</Label>
              {isLoadingFormats ? (
                <Skeleton className="h-10 w-full" />
              ) : formatsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>Could not load book formats.</AlertDescription>
                </Alert>
              ) : (
                <Select
                  onValueChange={(value) => updateFormData({ format_id: value })}
                  defaultValue={formData.format_id}
                >
                  <SelectTrigger id="format">
                    <SelectValue placeholder="Select a format" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookFormats && bookFormats.length > 0 ? (
                      bookFormats.map((format) => (
                        <SelectItem key={format.item_type_id} value={format.item_type_id}>
                          {format.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="-" disabled>No formats found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label htmlFor="pagination">Pagination</Label>
              <Input
                id="pagination"
                value={formData.pagination_text || ''}
                onChange={(e) => updateFormData({ pagination_text: e.target.value })}
                placeholder="e.g., xii, 320 pp."
              />
            </div>
            <div>
              <Label htmlFor="dust-jacket">Has Dust Jacket</Label>
              <div className="flex items-center space-x-2">
                <input
                  id="dust-jacket"
                  type="checkbox"
                  checked={formData.has_dust_jacket || false}
                  onChange={(e) => updateFormData({ has_dust_jacket: e.target.checked })}
                />
                <Label htmlFor="dust-jacket">Yes, this book has a dust jacket</Label>
              </div>
            </div>
            <div>
              <Label htmlFor="condition">Condition ID *</Label>
              <Input
                id="condition"
                value={formData.condition_id || ''}
                onChange={(e) => updateFormData({ condition_id: e.target.value })}
                placeholder="Enter condition ID (UUID)"
              />
            </div>
            <div>
              <Label htmlFor="condition-notes">Condition Notes</Label>
              <Textarea
                id="condition-notes"
                value={formData.condition_notes || ''}
                onChange={(e) => updateFormData({ condition_notes: e.target.value })}
                placeholder="Enter condition notes"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label>Attributes</Label>
              <AttributePicker
                selectedAttributes={formData.selected_attributes || []}
                onChange={(newAttributes) => updateFormData({ selected_attributes: newAttributes })}
              />
            </div>
            <div>
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => updateFormData({ price: parseFloat(e.target.value) || 0 })}
                placeholder="Enter price"
              />
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku || ''}
                onChange={(e) => updateFormData({ sku: e.target.value })}
                placeholder="Enter SKU (optional)"
              />
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Review Your Entry</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Title:</strong> {formData.title}</p>
                <p><strong>Authors:</strong> {formData.authors?.join(', ') || 'None'}</p>
                <p><strong>Publisher:</strong> {formData.publisher_name || 'None'}</p>
                <p><strong>Price:</strong> ${formData.price || 0}</p>
                <p><strong>Has Dust Jacket:</strong> {formData.has_dust_jacket ? 'Yes' : 'No'}</p>
                <p><strong>Attributes:</strong> {formData.selected_attributes?.join(', ') || 'None'}</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Review Catalog Entry</h1>
            <p className="text-muted-foreground">
              {job.extracted_data?.title || 'Untitled Book'}
            </p>
          </div>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Fill out the form to finalize the book details and add it to your inventory.
          </AlertDescription>
        </Alert>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        {WIZARD_STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= step.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                {currentStep > step.id ? <Check size={16} /> : step.id}
              </div>
              <p className="text-sm mt-2 text-center">{step.title}</p>
            </div>
            {index < WIZARD_STEPS.length - 1 && (
              <div className="flex-1 h-px bg-muted mx-4" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle>{WIZARD_STEPS[currentStep - 1].title}</CardTitle>
        </CardHeader>
        <CardContent>{renderCurrentStep()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevStep}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <div className="space-x-2">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          {currentStep < WIZARD_STEPS.length ? (
            <Button onClick={handleNextStep}>
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={finalizeMutation.isPending}>
              {finalizeMutation.isPending ? 'Saving...' : 'Finalize and Add to Inventory'}
            </Button>
          )}
        </div>
      </div>
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
} 