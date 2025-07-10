// Flagging system components and hooks
export { FlaggingTrigger, FlaggingButton } from './FlaggingTrigger';
export { FlaggingForm } from './FlaggingForm';
export { FlaggingProvider, useFlaggingContext } from './FlaggingProvider';
export { FlaggingExample } from './FlaggingExample';

// Re-export types for convenience
export type { FlagFormData, FlagStatusUpdate } from '@/lib/types/flags';
export { FlagType, FlagSeverity, FlagStatus } from '@/lib/types/flags'; 