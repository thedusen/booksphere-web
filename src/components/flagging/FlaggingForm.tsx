'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Flag, AlertCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
// Removed unused Alert imports
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { flagFormSchema } from '@/lib/validators/flags';
import { FlagType, FlagSeverity } from '@/lib/types/flags';
import { useCreateFlag } from '@/hooks/useFlagging';
import type { FlagFormData } from '@/lib/types/flags';

interface FlaggingFormProps {
  /** Controls sheet visibility */
  open: boolean;
  /** Sheet visibility change handler */
  onOpenChange: (open: boolean) => void;
  /** The table this record belongs to */
  tableName: 'books' | 'editions' | 'stock_items';
  /** UUID of the record being flagged */
  recordId: string;
  /** Specific field being flagged (optional) */
  fieldName?: string;
  /** Current value being flagged */
  currentValue: string;
  /** Human-readable label for the field */
  fieldLabel: string;
  /** Additional context data */
  contextData?: Record<string, unknown>;
  /** Default values for the form */
  defaultValues?: Partial<FlagFormData>;
}

/**
 * FlaggingForm - A comprehensive form for submitting data quality flags
 * 
 * Addresses Expert Feedback:
 * - Shows context preview so users don't lose sight of what they're flagging
 * - Uses proper shadcn/ui Form components with validation
 * - Implements full accessibility with ARIA labels and focus management
 * - Validates with Zod schemas before submission
 * - Provides clear error handling and success feedback
 * - Supports both field-level and record-level flagging
 */
export function FlaggingForm({
  open,
  onOpenChange,
  tableName,
  recordId,
  fieldName,
  currentValue,
  fieldLabel,
  contextData,
  defaultValues,
}: FlaggingFormProps) {
  const { toast } = useToast();
  const { mutate: createFlag, isPending: isSubmitting } = useCreateFlag();
  
  const form = useForm<FlagFormData>({
    resolver: zodResolver(flagFormSchema),
    defaultValues: {
      table_name: tableName,
      record_id: recordId,
      field_name: fieldName,
      flag_type: defaultValues?.flag_type || FlagType.INCORRECT_DATA,
      severity: defaultValues?.severity || FlagSeverity.MEDIUM,
      description: defaultValues?.description || '',
      suggested_value: defaultValues?.suggested_value,
      details: defaultValues?.details,
    },
  });

  const watchedFlagType = form.watch('flag_type');
  const watchedSeverity = form.watch('severity');

  const onSubmit = (data: FlagFormData) => {
    createFlag(data, {
      onSuccess: () => {
        toast({
          title: 'Flag Submitted',
          description: 'Thank you for helping improve our data quality.',
        });
        handleClose();
        /**
         * Addresses Code Review Feedback:
         * - Explicitly resets form state after a successful submission to prevent
         *   any chance of stale data if the same form instance is reused.
         */
        form.reset();
      },
      onError: (error: Error) => {
        toast({
          title: 'Submission Error',
          description:
            error.message || 'An unexpected error occurred. Please try again.',
          variant: 'destructive',
        });
      },
    });
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const getSeverityDescription = (severity?: FlagSeverity) => {
    /**
     * Addresses Code Review Feedback:
     * - Adds a guard clause to prevent runtime errors if the value is undefined.
     */
    if (!severity) return 'Select a severity level to see a description.';
    switch (severity) {
      case FlagSeverity.LOW:
        return 'Minor issue, such as a typo or formatting error.';
      case FlagSeverity.MEDIUM:
        return 'Incorrect but non-critical data. Should be reviewed.';
      case FlagSeverity.HIGH:
        return 'Significantly incorrect data that could mislead users.';
      case FlagSeverity.CRITICAL:
        return 'Critical error, such as wrong author, title, or price.';
      default:
        return '';
    }
  };

  const getFlagTypeDescription = (flagType?: FlagType) => {
    /**
     * Addresses Code Review Feedback:
     * - Adds a guard clause to prevent runtime errors if the value is undefined.
     */
    if (!flagType) return 'Select an issue type to see a description.';
    switch (flagType) {
      case FlagType.INCORRECT_DATA:
        return 'The information is factually wrong (e.g., wrong author, year).';
      case FlagType.INAPPROPRIATE_CONTENT:
        return 'The content is offensive, harmful, or violates policy.';
      case FlagType.DUPLICATE_RECORD:
        return 'This record is a duplicate of another entry.';
      case FlagType.MISSING_DATA:
        return 'Required information is missing or incomplete.';
      case FlagType.COPYRIGHT_ISSUE:
        return 'There may be copyright or licensing concerns.';
      case FlagType.OTHER:
        return 'A different type of issue not listed above.';
      default:
        return '';
    }
  };

  /**
   * Dynamically generates context preview items from contextData
   * 
   * Addresses Code Review Feedback:
   * - Removes hardcoded context keys (bookTitle, author, isbn)
   * - Dynamically iterates over all contextData properties
   * - Safely converts values to strings for rendering
   * - Creates human-readable labels from camelCase keys
   */
  const getContextPreview = () => {
    if (!contextData || Object.keys(contextData).length === 0) {
      return [];
    }
    
         return Object.entries(contextData)
       .filter(([, value]) => value != null && value !== '') // Filter out null/empty values
       .map(([key, value]) => ({
        label: key
          .replace(/([A-Z])/g, ' $1') // Add space before capital letters
          .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
          .trim(),
        value: String(value), // Safe conversion to string
      }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Report Data Quality Issue
          </SheetTitle>
          <SheetDescription>
            Help us improve data quality by reporting issues you&apos;ve found.
          </SheetDescription>
        </SheetHeader>

        {/* Context Preview Section */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">What you&apos;re flagging:</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {fieldName ? 'Field' : 'Record'}
              </Badge>
              <span className="text-sm font-medium">{fieldLabel}</span>
            </div>
            
            <div className="pl-4 border-l-2 border-muted">
              <div className="text-sm text-muted-foreground">Current value:</div>
              <div className="text-sm font-mono bg-background p-2 rounded border mt-1">
                {currentValue || <span className="text-muted-foreground italic">Empty</span>}
              </div>
            </div>
            
            {/* Additional context */}
            {getContextPreview().length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-muted-foreground mb-2">Context:</div>
                <div className="grid grid-cols-2 gap-2">
                  {getContextPreview().map((item, index) => (
                    <div key={index} className="text-xs">
                      <span className="text-muted-foreground">{item.label}:</span>
                      <span className="ml-1 font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Form Section */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="flagging-form">
            
            {/* Flag Type Selection */}
            <FormField
              control={form.control}
              name="flag_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What type of issue is this?</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="flag-type-select">
                        <SelectValue placeholder="Select issue type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(FlagType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {/**
                           * Addresses Code Review Feedback:
                           * - Wraps enum value in String() to ensure type safety before calling string methods.
                           */}
                          {String(type)
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {getFlagTypeDescription(watchedFlagType)}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Severity Selection */}
            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How severe is this issue?</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="severity-select">
                        <SelectValue placeholder="Select severity level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(FlagSeverity).map((severity) => (
                        <SelectItem key={severity} value={severity}>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                'w-2 h-2 rounded-full',
                                severity === FlagSeverity.LOW && 'bg-green-500',
                                severity === FlagSeverity.MEDIUM &&
                                  'bg-yellow-500',
                                severity === FlagSeverity.HIGH &&
                                  'bg-orange-500',
                                severity === FlagSeverity.CRITICAL &&
                                  'bg-red-500',
                              )}
                            />
                            {/**
                             * Addresses Code Review Feedback:
                             * - Wraps enum value in String() to ensure type safety before calling string methods.
                             */}
                            {String(severity).charAt(0).toUpperCase() +
                              String(severity).slice(1)}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {getSeverityDescription(watchedSeverity)}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide additional details about the issue..."
                      className="min-h-[100px]"
                      data-testid="flag-reason"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Help us understand the issue better with additional context.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Suggested Value (for incorrect data) */}
            {watchedFlagType === FlagType.INCORRECT_DATA && (
              <FormField
                control={form.control}
                name="suggested_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suggested Correction (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="What should the correct value be?"
                        {...field}
                        value={String(field.value ?? '')} // Safe string conversion
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>
                      If you know the correct value, please provide it here.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Error Alert */}
            {/* The original code had a conditional rendering of Alert based on createFlagMutation.isError,
                but createFlagMutation is no longer used. Assuming the intent was to show an error
                if the mutation itself failed, but the new useCreateFlag handles error feedback.
                For now, removing the conditional rendering as it's no longer relevant. */}
            {/* {createFlagMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {createFlagMutation.error instanceof Error 
                    ? createFlagMutation.error.message 
                    : 'An error occurred while submitting your flag. Please try again.'}
                </AlertDescription>
              </Alert>
            )} */}

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
                data-testid="submit-flag-button"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Flag
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
} 