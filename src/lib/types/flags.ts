// Flag-related types and enums for the data quality flagging system

export enum FlagType {
  INCORRECT_DATA = 'incorrect_data',
  MISSING_DATA = 'missing_data',
  DUPLICATE_RECORD = 'duplicate_record',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  COPYRIGHT_ISSUE = 'copyright_issue',
  OTHER = 'other'
}

export enum FlagStatus {
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  RESOLVED = 'resolved',
  REJECTED = 'rejected'
}

export enum FlagPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum FlagCategory {
  CONTENT_ACCURACY = 'content_accuracy',
  METADATA_QUALITY = 'metadata_quality',
  USER_EXPERIENCE = 'user_experience',
  LEGAL_COMPLIANCE = 'legal_compliance'
}

// Base flag interface
export interface DataQualityFlag {
  flag_id: string;
  table_name: string;
  record_id: string;
  column_name?: string;
  flag_type: FlagType;
  flag_category: FlagCategory;
  priority: FlagPriority;
  title: string;
  description?: string;
  suggested_correction?: any;
  details?: Record<string, any>;
  status: FlagStatus;
  flagged_by: string;
  organizations_id: string;
  reviewed_by?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

// Request/Response types for the API
export interface CreateFlagRequest {
  table_name: string;
  record_id: string;
  column_name?: string;
  flag_type: FlagType;
  flag_category: FlagCategory;
  priority: FlagPriority;
  title: string;
  description?: string;
  suggested_correction?: any;
  details?: Record<string, any>;
}

export interface UpdateFlagRequest {
  status?: FlagStatus;
  resolution_notes?: string;
  reviewed_by?: string;
}

export interface FlagFilters {
  status?: FlagStatus[];
  flag_type?: FlagType[];
  flag_category?: FlagCategory[];
  priority?: FlagPriority[];
  table_name?: string[];
  flagged_by?: string;
  reviewed_by?: string;
  date_range?: {
    start: string;
    end: string;
  };
}

// Specific flag types for different data entities
export interface BookFlag extends Omit<DataQualityFlag, 'table_name'> {
  table_name: 'books';
}

export interface EditionFlag extends Omit<DataQualityFlag, 'table_name'> {
  table_name: 'editions';
}

export interface AuthorFlag extends Omit<DataQualityFlag, 'table_name'> {
  table_name: 'authors';
}

// UI-specific types
export interface FlagableField {
  fieldName: string;
  displayName: string;
  currentValue: any;
  dataType: 'string' | 'number' | 'date' | 'array' | 'object' | 'boolean';
  isRequired: boolean;
  validationRules?: any[];
}

export interface FlagFormData {
  field: FlagableField;
  flag_type: FlagType;
  flag_category: FlagCategory;
  priority: FlagPriority;
  title: string;
  description: string;
  suggested_correction: any;
}

// Analytics and reporting types
export interface FlagStats {
  total_flags: number;
  open_flags: number;
  resolved_flags: number;
  flags_by_type: Record<FlagType, number>;
  flags_by_priority: Record<FlagPriority, number>;
  flags_by_category: Record<FlagCategory, number>;
  average_resolution_time_hours: number;
}

export interface FlagTrend {
  date: string;
  flags_created: number;
  flags_resolved: number;
  flags_rejected: number;
}
