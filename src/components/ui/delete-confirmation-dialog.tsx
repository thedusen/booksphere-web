/**
 * Reusable Delete Confirmation Dialog
 * 
 * A standardized delete confirmation dialog using shadcn AlertDialog.
 * Provides consistent UX across the application for destructive actions.
 */

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DeleteConfirmationDialogProps {
  /** The trigger element (usually a button) */
  trigger?: React.ReactNode;
  /** Title of the dialog */
  title?: string;
  /** Description text explaining what will be deleted */
  description?: string;
  /** Text for the delete button */
  deleteButtonText?: string;
  /** Text for the cancel button */
  cancelButtonText?: string;
  /** Function called when user confirms deletion */
  onConfirm: () => void;
  /** Whether the delete action is currently loading */
  isLoading?: boolean;
  /** Whether the dialog should be disabled */
  disabled?: boolean;
  /** Optional: Control the open state of the dialog */
  open?: boolean;
  /** Optional: Callback for when the open state changes */
  onOpenChange?: (open: boolean) => void;
}

export function DeleteConfirmationDialog({
  trigger,
  title = 'Confirm Deletion',
  description = 'Are you sure you want to delete this item? This action cannot be undone.',
  deleteButtonText = 'Delete',
  cancelButtonText = 'Cancel',
  onConfirm,
  isLoading = false,
  disabled = false,
  open,
  onOpenChange,
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <AlertDialogTrigger asChild disabled={disabled}>
          {trigger}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelButtonText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Deleting...' : deleteButtonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 