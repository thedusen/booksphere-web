// Types for AI Cataloging Feedback System

export type FeedbackType = 
  | 'field_correction'    // Direct field value corrections
  | 'accuracy_rating'     // Overall accuracy scores
  | 'confidence_override' // Manual confidence adjustments
  | 'validation_confirm'  // User confirmed AI extraction
  | 'validation_reject'   // User rejected AI extraction
  | 'reprocessing_request'; // User requested reprocessing

export type FeedbackSource = 'automated' | 'manual' | 'batch_import';

export interface AIFeedbackEvent {
  event_id: string;
  organization_id: string;
  cataloging_job_id: string;
  user_id: string;
  feedback_type: FeedbackType;
  field_name?: string;
  original_value?: any;
  corrected_value?: any;
  accuracy_score?: number; // 1-5
  confidence_score?: number; // 0.00-1.00
  feedback_notes?: string;
  edit_session_id?: string;
  edit_sequence?: number;
  time_to_edit_ms?: number;
  feedback_source: FeedbackSource;
  created_at: string;
}

export interface AIFeedbackAggregate {
  aggregate_id: string;
  organization_id: string;
  aggregation_period: 'daily' | 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  field_name?: string; // null = overall metrics
  total_extractions: number;
  total_corrections: number;
  total_validations: number;
  confirmed_validations: number;
  total_reprocessing_requests: number;
  correction_rate: number;
  validation_success_rate: number;
  reprocessing_rate: number;
  avg_accuracy_score?: number;
  avg_confidence_score?: number;
  avg_time_to_edit_ms?: number;
  common_corrections?: Record<string, any>;
  problem_areas?: Record<string, any>;
  computed_at: string;
  updated_at: string;
}

// Dashboard data structures
export interface AccuracyDashboardItem {
  field_name: string;
  total_extractions: number;
  correction_rate: number;
  validation_success_rate: number;
  reprocessing_rate: number;
  avg_accuracy_score?: number;
  trend_direction: 'excellent' | 'good' | 'needs_improvement' | 'poor';
}

export interface ImprovementTrendItem {
  period_start: string;
  field_name: string;
  correction_rate: number;
  validation_success_rate: number;
  reprocessing_rate: number;
  improvement_score: number;
}

// Change detection types
export interface FieldChange {
  fieldName: string;
  fieldType: string;
  originalValue: any;
  newValue: any;
  changeType: 'addition' | 'correction' | 'removal' | 'formatting';
  isSignificant: boolean;
}

export interface ChangeSet {
  sessionId: string;
  catalogingJobId: string;
  changes: FieldChange[];
  totalChanges: number;
  significantChanges: number;
}

// Hook interfaces
export interface AIFeedbackTracker {
  trackFieldChange: (fieldName: string, originalValue: any, newValue: any, metadata?: Partial<AIFeedbackEvent>) => void;
  trackValidation: (isConfirmed: boolean, notes?: string) => void;
  trackReprocessingRequest: (reason?: string, notes?: string) => void;
  finalizeSession: () => Promise<void>;
  isTracking: boolean;
}

// Reprocessing modal types
export interface ReprocessingFeedbackData {
  reason: 'inaccurate_data' | 'missing_fields' | 'low_confidence' | 'other';
  problemFields: string[];
  accuracyRating: number; // 1-5
  comments?: string;
  expectedImprovements: string[];
}

// API request/response types
export interface CreateFeedbackEventRequest {
  cataloging_job_id: string;
  feedback_type: FeedbackType;
  field_name?: string;
  original_value?: any;
  corrected_value?: any;
  accuracy_score?: number;
  confidence_score?: number;
  feedback_notes?: string;
  edit_session_id?: string;
  edit_sequence?: number;
  time_to_edit_ms?: number;
}

export interface CreateFeedbackEventResponse {
  success: boolean;
  event_id: string;
  error?: string;
}

export interface BatchCreateFeedbackEventsRequest {
  events: CreateFeedbackEventRequest[];
}

export interface BatchCreateFeedbackEventsResponse {
  success: boolean;
  created_count: number;
  event_ids: string[];
  errors?: string[];
}

export interface GetDashboardDataRequest {
  days_back?: number;
}

export interface GetDashboardDataResponse {
  success: boolean;
  data: AccuracyDashboardItem[];
  error?: string;
}

export interface GetTrendDataRequest {
  field_name?: string;
}

export interface GetTrendDataResponse {
  success: boolean;
  data: ImprovementTrendItem[];
  error?: string;
}

// Utility types for change detection
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface ComparisonResult {
  hasChanges: boolean;
  changes: FieldChange[];
  significantChangeCount: number;
  totalChangeCount: number;
}

// Constants
export const TRACKABLE_FIELDS = [
  'title',
  'subtitle', 
  'authors',
  'publisher',
  'publication_year',
  'publication_location',
  'edition_statement',
  'has_dust_jacket'
] as const;

export type TrackableField = typeof TRACKABLE_FIELDS[number];

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.5,
  LOW: 0.0
} as const;

export const FEEDBACK_REASONS = [
  { value: 'inaccurate_data', label: 'AI extracted incorrect information' },
  { value: 'missing_fields', label: 'AI missed important details' },
  { value: 'low_confidence', label: 'AI was uncertain about key fields' },
  { value: 'other', label: 'Other reason' }
] as const;