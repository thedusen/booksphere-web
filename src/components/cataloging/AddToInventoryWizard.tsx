/**
 * AddToInventoryWizard Component
 * 
 * Comprehensive 3-step inventory addition wizard based on mobile app patterns.
 * Supports both AI-extracted data and manual entry workflows.
 * 
 * Steps:
 * 1. Core Details - Condition, price, quantity, SKU
 * 2. Attributes - Book-specific attributes and characteristics  
 * 3. Notes & Save - Condition notes and final review
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Search, 
  X, 
  ChevronDown,
  ChevronUp,
  Maximize,
  Minimize,
  Camera,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Import hooks and services
import { useOrganization } from '@/hooks/useOrganization';
import { useConditions, useAttributes } from '@/hooks/useInventory';
import { supabase } from '@/lib/supabase';
import { useMutation } from '@tanstack/react-query';

// Types
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

interface AddToInventoryWizardProps {
  bookData: BookData;
  onComplete?: () => void;
  onCancel?: () => void;
  initialStep?: number;
}

interface AttributeCategory {
  category_id: string;
  name: string;
}

interface AttributeType {
  attribute_type_id: string;
  name: string;
  category_id: string | null;
}

interface Condition {
  condition_id: string;
  standard_name: string;
  description: string | null;
}

const WIZARD_STEPS = [
  { id: 1, title: 'Core Details', description: 'Condition, pricing, and basic info' },
  { id: 2, title: 'Attributes', description: 'Book-specific characteristics' },
  { id: 3, title: 'Notes & Save', description: 'Final details and save' },
] as const;

// Step component interfaces
interface Step1Props {
  conditionId: string;
  setConditionId: (id: string) => void;
  price: string;
  setPrice: (price: string) => void;
  sku: string;
  setSku: (sku: string) => void;
  quantity: string;
  setQuantity: (quantity: string) => void;
  onNext: () => void;
  conditions: Condition[] | undefined;
  isLoadingConditions: boolean;
}

interface Step2Props {
  selectedIds: string[];
  onToggle: (id: string) => void;
  onNext: () => void;
  attributeCategories: AttributeCategory[] | undefined;
  attributeTypes: AttributeType[] | undefined;
  isLoadingAttributes: boolean;
}

interface FormData {
  price: string;
  quantity: string;
  selectedCondition?: Condition;
  selectedAttributes?: string[];
}

interface Step3Props {
  notes: string;
  setNotes: (notes: string) => void;
  onSave: () => void;
  isSaving: boolean;
  bookData: BookData;
  formData: FormData;
}

// Step 1: Core Details Component
const Step1_CoreDetails = ({ 
  conditionId, 
  setConditionId, 
  price, 
  setPrice, 
  sku, 
  setSku, 
  quantity, 
  setQuantity, 
  onNext, 
  conditions, 
  isLoadingConditions 
}: Step1Props) => {
  if (isLoadingConditions) {
    return (
      <div className="flex flex-col space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-1">
          <Label htmlFor="condition">Condition *</Label>
          <Select value={conditionId} onValueChange={setConditionId}>
            <SelectTrigger id="condition">
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              {conditions?.map((condition: Condition) => (
                <SelectItem key={condition.condition_id} value={condition.condition_id}>
                  {condition.standard_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-24">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="text-center"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="price">Price *</Label>
        <div className="flex items-center">
          <span className="mr-2 text-muted-foreground">$</span>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="24.99"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="sku">SKU (Optional)</Label>
        <Input
          id="sku"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="Leave blank to auto-generate"
        />
      </div>

      <Button 
        onClick={onNext} 
        className="w-full"
        disabled={!conditionId || !price || parseFloat(price) <= 0}
      >
        Next: Add Attributes
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

// Step 2: Attributes Component
const Step2_Attributes = ({ 
  selectedIds, 
  onToggle, 
  onNext, 
  attributeCategories, 
  attributeTypes, 
  isLoadingAttributes 
}: Step2Props) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const hasAutoOpened = React.useRef(false);

  // Auto-open first category when data loads
  React.useEffect(() => {
    if (attributeCategories && attributeCategories.length > 0 && !hasAutoOpened.current) {
      setOpenCategories([attributeCategories[0].category_id]);
      hasAutoOpened.current = true;
    }
  }, [attributeCategories]);

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
  };

  const filteredAttributes = useMemo(() => {
    if (!attributeTypes) return [];
    if (!searchTerm) return attributeTypes;
    return attributeTypes.filter((attr: AttributeType) => 
      attr.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, attributeTypes]);

  const visibleCategories = useMemo(() => {
    if (!attributeCategories) return [];
    return attributeCategories.filter((category: AttributeCategory) => {
      const categoryAttributes = filteredAttributes.filter((attr: AttributeType) => 
        attr.category_id === category.category_id
      );
      return categoryAttributes.length > 0 || !searchTerm;
    });
  }, [attributeCategories, filteredAttributes, searchTerm]);

  const allCategoriesOpen = visibleCategories.length > 0 && 
    visibleCategories.every((cat: AttributeCategory) => openCategories.includes(cat.category_id));

  const handleExpandCollapseAll = () => {
    if (allCategoriesOpen) {
      setOpenCategories([]);
    } else {
      setOpenCategories(visibleCategories.map((cat: AttributeCategory) => cat.category_id));
    }
  };

  const selectedAttributes = attributeTypes?.filter((attr: AttributeType) => 
    selectedIds.includes(attr.attribute_type_id)
  ) || [];

  if (isLoadingAttributes) {
    return (
      <div className="flex flex-col space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search attributes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1"
            onClick={() => setSearchTerm('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Selected Attributes */}
      {selectedAttributes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Selected ({selectedAttributes.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {selectedAttributes.map((attr: AttributeType) => (
                <Badge
                  key={attr.attribute_type_id}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => onToggle(attr.attribute_type_id)}
                >
                  {attr.name}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expand/Collapse All */}
      {visibleCategories.length > 1 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExpandCollapseAll}
          >
            {allCategoriesOpen ? (
              <><Minimize className="mr-2 h-4 w-4" />Collapse All</>
            ) : (
              <><Maximize className="mr-2 h-4 w-4" />Expand All</>
            )}
          </Button>
        </div>
      )}

      {/* Attributes by Category */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {visibleCategories.map((category: AttributeCategory) => {
          const categoryAttributes = filteredAttributes.filter((attr: AttributeType) => 
            attr.category_id === category.category_id
          );
          if (categoryAttributes.length === 0 && searchTerm) return null;
          
          const isOpen = openCategories.includes(category.category_id);
          
          return (
            <Card key={category.category_id}>
              <CardHeader 
                className="cursor-pointer py-3"
                onClick={() => toggleCategory(category.category_id)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{category.name}</CardTitle>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </CardHeader>
              {isOpen && (
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {categoryAttributes.map((attr: AttributeType) => (
                      <Button
                        key={attr.attribute_type_id}
                        variant={selectedIds.includes(attr.attribute_type_id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => onToggle(attr.attribute_type_id)}
                      >
                        {attr.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Button onClick={onNext} className="w-full">
        Next: Add Notes
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

// Step 3: Notes and Save Component
const Step3_NotesAndSave = ({ 
  notes, 
  setNotes, 
  onSave, 
  isSaving, 
  bookData, 
  formData 
}: Step3Props) => (
  <div className="space-y-6">
    <div>
      <Label htmlFor="notes">Condition Notes (Optional)</Label>
      <Textarea
        id="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="e.g., Minor shelf wear on jacket. Previous owner's signature on front flyleaf."
        className="min-h-[100px]"
      />
    </div>

    {/* Review Summary */}
    <Card>
      <CardHeader>
        <CardTitle>Review Your Entry</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {bookData.title && <p><strong>Title:</strong> {bookData.title}</p>}
        {bookData.authors && bookData.authors.length > 0 && (
          <p><strong>Authors:</strong> {bookData.authors.join(', ')}</p>
        )}
        {bookData.publisher && <p><strong>Publisher:</strong> {bookData.publisher}</p>}
        <p><strong>Price:</strong> ${formData.price || '0.00'}</p>
        <p><strong>Condition:</strong> {formData.selectedCondition?.standard_name || 'Not selected'}</p>
        <p><strong>Quantity:</strong> {formData.quantity || 1}</p>
        {(formData.selectedAttributes?.length ?? 0) > 0 && (
          <p><strong>Attributes:</strong> {formData.selectedAttributes?.length} selected</p>
        )}
      </CardContent>
    </Card>

    <Button 
      onClick={onSave} 
      disabled={isSaving}
      className="w-full"
    >
      {isSaving ? (
        <>
          <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          Saving...
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          Save to Inventory
        </>
      )}
    </Button>
  </div>
);

// Main AddToInventoryWizard Component
export function AddToInventoryWizard({ 
  bookData, 
  onComplete, 
  onCancel, 
  initialStep = 1 
}: AddToInventoryWizardProps) {
  const router = useRouter();
  const { organizationId } = useOrganization();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [conditionId, setConditionId] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [sku, setSku] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [newStockItemId, setNewStockItemId] = useState<string | null>(null);
  
  // Fetch data
  const { data: conditions, isLoading: isLoadingConditions } = useConditions({ client: supabase });
  const { data: attributes, isLoading: isLoadingAttributes } = useAttributes({ client: supabase });

  // Set default condition when conditions load
  useEffect(() => {
    if (conditions && conditions.length > 0 && !conditionId) {
      const defaultCondition = conditions.find(c => c.standard_name === 'Very Good') || 
        conditions[2] || 
        conditions[0];
      setConditionId(defaultCondition.condition_id);
    }
  }, [conditions, conditionId]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!conditionId) throw new Error('Condition is required');
      if (!price || parseFloat(price) <= 0) throw new Error('Valid price is required');
      if (!organizationId) throw new Error('No organization selected');

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const payload = {
        p_organization_id: organizationId,
        p_user_id: userId,
        p_isbn13: bookData.isbn || null,
        p_title: bookData.title || null,
        p_subtitle: bookData.subtitle || null,
        p_authors: (bookData.authors || []).map(name => ({ name })),
        p_publisher_name: bookData.publisher || null,
        p_publish_date_text: bookData.published_date || null,
        p_page_count: bookData.page_count || null,
        p_format_name: bookData.format_type || null,
        p_language_name: 'English',
        p_image_url: bookData.cover_image_url || null,
        p_condition_id: conditionId,
        p_price: parseFloat(price),
        p_condition_notes: notes || null,
        p_selected_attributes: selectedAttributeIds,
      };

      const { data: newStockItemId, error } = await supabase.rpc('add_edition_to_inventory', payload);
      if (error) throw error;

      return newStockItemId;
    },
    onSuccess: (stockItemId) => {
      setNewStockItemId(stockItemId);
      setShowCompletionModal(true);
      toast.success('Book successfully added to inventory!', {
        duration: 4000,
        action: {
          label: 'View in Inventory',
          onClick: () => router.push(`/inventory/${stockItemId}`)
        }
      });
    },
    onError: (error: Error) => {
      console.error('Error saving to inventory:', error);
      toast.error(error.message || 'Could not add book to inventory. Please try again.');
    },
  });

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

  const handleAttributeToggle = useCallback((attributeId: string) => {
    setSelectedAttributeIds(prev => 
      prev.includes(attributeId) 
        ? prev.filter(id => id !== attributeId)
        : [...prev, attributeId]
    );
  }, []);

  const handleSave = useCallback(() => {
    saveMutation.mutate();
  }, [saveMutation]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  // Prepare form data for review
  const formData = useMemo(() => ({
    price,
    quantity,
    selectedCondition: conditions?.find(c => c.condition_id === conditionId),
    selectedAttributes: attributes?.attributeTypes?.filter(attr => 
      selectedAttributeIds.includes(attr.attribute_type_id)
    )?.map(attr => attr.name),
  }), [price, quantity, conditionId, conditions, selectedAttributeIds, attributes]);

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1_CoreDetails
            conditionId={conditionId}
            setConditionId={setConditionId}
            price={price}
            setPrice={setPrice}
            sku={sku}
            setSku={setSku}
            quantity={quantity}
            setQuantity={setQuantity}
            onNext={handleNextStep}
            conditions={conditions}
            isLoadingConditions={isLoadingConditions}
          />
        );
      case 2:
        return (
          <Step2_Attributes
            selectedIds={selectedAttributeIds}
            onToggle={handleAttributeToggle}
            onNext={handleNextStep}
            attributeCategories={attributes?.attributeCategories}
            attributeTypes={attributes?.attributeTypes}
            isLoadingAttributes={isLoadingAttributes}
          />
        );
      case 3:
        return (
          <Step3_NotesAndSave
            notes={notes}
            setNotes={setNotes}
            onSave={handleSave}
            isSaving={saveMutation.isPending}
            bookData={bookData}
            formData={formData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Add to Inventory</h1>
          <p className="text-muted-foreground">
            {bookData.title || 'New Book'} • Step {currentStep} of {WIZARD_STEPS.length}
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        {WIZARD_STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  currentStep >= step.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
              </div>
              <p className="text-xs mt-2 text-center max-w-20">{step.title}</p>
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
          <p className="text-sm text-muted-foreground">
            {WIZARD_STEPS[currentStep - 1].description}
          </p>
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
          <ChevronLeft className="mr-2 h-4 w-4" /> 
          Previous
        </Button>
        
        <div className="space-x-2">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
      
      {/* Completion Modal */}
      <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              Book Added Successfully!
            </DialogTitle>
            <DialogDescription>
              {bookData.title || 'Your book'} has been added to inventory. What would you like to do next?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            <Button 
              className="w-full justify-start h-12"
              onClick={() => {
                setShowCompletionModal(false);
                onComplete?.();
                router.push('/cataloging/scan');
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Camera className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Scan Another Book</div>
                  <div className="text-xs text-muted-foreground">Continue cataloging workflow</div>
                </div>
              </div>
            </Button>
            
            <Button 
              variant="outline"
              className="w-full justify-start h-12"
              onClick={() => {
                setShowCompletionModal(false);
                router.push(`/inventory/${newStockItemId}`);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Eye className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">View in Inventory</div>
                  <div className="text-xs text-muted-foreground">See your new stock item</div>
                </div>
              </div>
            </Button>
            
            <Button 
              variant="outline"
              className="w-full justify-start h-12"
              onClick={() => {
                setShowCompletionModal(false);
                router.push('/cataloging');
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-500/10 rounded-lg">
                  <ArrowLeft className="h-4 w-4 text-gray-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Back to Cataloging</div>
                  <div className="text-xs text-muted-foreground">Return to job dashboard</div>
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}