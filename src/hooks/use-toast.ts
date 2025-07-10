import { toast as sonnerToast } from 'sonner';

interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

/**
 * Custom toast hook that wraps sonner with proper title/description formatting
 * 
 * Addresses Code Review Feedback:
 * - Properly passes description as options object to sonner
 * - Maintains proper styling separation between title and description
 * - Ensures consistent toast formatting across the application
 */
export function useToast() {
  const toast = ({ title, description, variant = 'default' }: ToastProps) => {
    const options = description ? { description } : {};
    
    if (variant === 'destructive') {
      sonnerToast.error(title, options);
    } else {
      sonnerToast.success(title, options);
    }
  };

  return { toast };
} 