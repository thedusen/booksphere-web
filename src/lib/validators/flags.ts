import { z } from 'zod';
import { FlagType, FlagSeverity, FlagStatus } from '../types/flags';

export const flagFormSchema = z.object({
  table_name: z.string().min(1),
  record_id: z.string().min(1),
  field_name: z.string().optional(),
  flag_type: z.nativeEnum(FlagType),
  severity: z.nativeEnum(FlagSeverity),
  description: z.string().optional(),
  suggested_value: z.unknown().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const flagStatusUpdateSchema = z.object({
  flag_id: z.string().uuid(),
  status: z.nativeEnum(FlagStatus),
  resolution_notes: z.string().optional(),
  reviewed_by: z.string().uuid().optional(),
}); 