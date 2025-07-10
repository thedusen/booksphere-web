// Flag-related enums and types for the data quality flagging system

export enum FlagStatus {
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export enum FlagType {
  INCORRECT_DATA = 'incorrect_data',
  MISSING_DATA = 'missing_data',
  DUPLICATE_RECORD = 'duplicate_record',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  COPYRIGHT_ISSUE = 'copyright_issue',
  OTHER = 'other',
}

export enum FlagSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface FlagFormData {
  table_name: string;
  record_id: string;
  field_name?: string;
  flag_type: FlagType;
  severity: FlagSeverity;
  description?: string;
  suggested_value?: unknown;
  details?: Record<string, unknown>;
}

export interface FlagStatusUpdate {
  flag_id: string;
  status: FlagStatus;
  resolution_notes?: string;
  reviewed_by?: string;
}
