// hooks/useFlagging.ts
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { 
  CreateFlagRequest, 
  DataQualityFlag, 
  FlagType, 
  FlagCategory, 
  FlagPriority 
} from '@booksphere/shared';

export interface CreateFlagParams {
  table_name: string;
  record_id: string;
  column_name?: string;
  title: string;
  description?: string;
  suggested_correction?: any;
  flag_type?: FlagType;
  flag_category?: FlagCategory;
  priority?: FlagPriority;
}

export const useFlagging = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { organizationId } = useAuth();

  const createFlag = async (params: CreateFlagParams): Promise<DataQualityFlag | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId || !organizationId) {
        throw new Error('User not authenticated');
      }

      // Set defaults based on the provided information
      const flagData: CreateFlagRequest = {
        table_name: params.table_name,
        record_id: params.record_id,
        column_name: params.column_name,
        title: params.title,
        description: params.description,
        suggested_correction: params.suggested_correction,
        flag_type: params.flag_type || 'incorrect_data' as FlagType,
        flag_category: params.flag_category || 'content_accuracy' as FlagCategory,
        priority: params.priority || 'medium' as FlagPriority,
      };

      const { data, error } = await supabase
        .from('data_quality_flags')
        .insert({
          ...flagData,
          flagged_by: userId,
          organizations_id: organizationId,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create flag';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getFlagsForRecord = async (
    tableName: string, 
    recordId: string, 
    columnName?: string
  ): Promise<DataQualityFlag[]> => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('data_quality_flags')
        .select('*')
        .eq('table_name', tableName)
        .eq('record_id', recordId)
        .eq('organizations_id', organizationId);

      if (columnName) {
        query = query.eq('column_name', columnName);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch flags';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const updateFlag = async (
    flagId: string, 
    updates: Partial<DataQualityFlag>
  ): Promise<DataQualityFlag | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('data_quality_flags')
        .update(updates)
        .eq('flag_id', flagId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update flag';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createFlag,
    getFlagsForRecord,
    updateFlag,
    isLoading,
    error,
  };
};
