// context/FlaggingContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useFlagging as useFlaggingHook, CreateFlagParams } from '@/hooks/useFlagging';
import type { DataQualityFlag } from '@booksphere/shared';

interface PendingFlag extends CreateFlagParams {
  id: string;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  error?: string;
}

interface FlaggingContextType {
  // Core flagging functionality
  mutateFlag: (params: CreateFlagParams) => Promise<DataQualityFlag | null>;
  
  // Pending flags cache
  pendingFlags: PendingFlag[];
  clearPendingFlag: (id: string) => void;
  retryPendingFlag: (id: string) => Promise<void>;
  
  // User/org metadata
  userMetadata: {
    userId: string | null;
    organizationId: string | null;
    isAuthenticated: boolean;
  };
  
  // Loading states
  isCreatingFlag: boolean;
  error: string | null;
}

const FlaggingContext = createContext<FlaggingContextType>({
  mutateFlag: async () => null,
  pendingFlags: [],
  clearPendingFlag: () => {},
  retryPendingFlag: async () => {},
  userMetadata: {
    userId: null,
    organizationId: null,
    isAuthenticated: false,
  },
  isCreatingFlag: false,
  error: null,
});

export const useFlaggingContext = () => {
  const context = useContext(FlaggingContext);
  if (!context) {
    throw new Error('useFlaggingContext must be used within a FlaggingProvider');
  }
  return context;
};

export const FlaggingProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, organizationId } = useAuth();
  const flaggingHook = useFlaggingHook();
  const [pendingFlags, setPendingFlags] = useState<PendingFlag[]>([]);

  // Generate unique ID for pending flags
  const generatePendingFlagId = useCallback(() => {
    return `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Enhanced mutateFlag that handles pending state
  const mutateFlag = useCallback(async (params: CreateFlagParams): Promise<DataQualityFlag | null> => {
    const pendingId = generatePendingFlagId();
    
    // Add to pending flags immediately
    const pendingFlag: PendingFlag = {
      ...params,
      id: pendingId,
      timestamp: Date.now(),
      status: 'pending',
    };
    
    setPendingFlags(prev => [...prev, pendingFlag]);

    try {
      // Attempt to create the flag
      const result = await flaggingHook.createFlag(params);
      
      if (result) {
        // Success - update pending flag status
        setPendingFlags(prev => 
          prev.map(flag => 
            flag.id === pendingId 
              ? { ...flag, status: 'success' as const }
              : flag
          )
        );
        
        // Auto-remove successful flags after a delay
        setTimeout(() => {
          setPendingFlags(prev => prev.filter(flag => flag.id !== pendingId));
        }, 3000);
        
        return result;
      } else {
        // Failed - update pending flag status
        setPendingFlags(prev => 
          prev.map(flag => 
            flag.id === pendingId 
              ? { 
                  ...flag, 
                  status: 'failed' as const, 
                  error: flaggingHook.error || 'Unknown error' 
                }
              : flag
          )
        );
        return null;
      }
    } catch (error) {
      // Error - update pending flag status
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setPendingFlags(prev => 
        prev.map(flag => 
          flag.id === pendingId 
            ? { 
                ...flag, 
                status: 'failed' as const, 
                error: errorMessage 
              }
            : flag
        )
      );
      return null;
    }
  }, [flaggingHook, generatePendingFlagId]);

  // Clear a specific pending flag
  const clearPendingFlag = useCallback((id: string) => {
    setPendingFlags(prev => prev.filter(flag => flag.id !== id));
  }, []);

  // Retry a failed pending flag
  const retryPendingFlag = useCallback(async (id: string) => {
    const pendingFlag = pendingFlags.find(flag => flag.id === id);
    if (!pendingFlag) return;

    // Reset the flag to pending status
    setPendingFlags(prev => 
      prev.map(flag => 
        flag.id === id 
          ? { ...flag, status: 'pending' as const, error: undefined }
          : flag
      )
    );

    try {
      const result = await flaggingHook.createFlag(pendingFlag);
      
      if (result) {
        setPendingFlags(prev => 
          prev.map(flag => 
            flag.id === id 
              ? { ...flag, status: 'success' as const }
              : flag
          )
        );
        
        // Auto-remove successful flags after a delay
        setTimeout(() => {
          setPendingFlags(prev => prev.filter(flag => flag.id !== id));
        }, 3000);
      } else {
        setPendingFlags(prev => 
          prev.map(flag => 
            flag.id === id 
              ? { 
                  ...flag, 
                  status: 'failed' as const, 
                  error: flaggingHook.error || 'Retry failed' 
                }
              : flag
          )
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Retry failed';
      setPendingFlags(prev => 
        prev.map(flag => 
          flag.id === id 
            ? { 
                ...flag, 
                status: 'failed' as const, 
                error: errorMessage 
              }
            : flag
        )
      );
    }
  }, [pendingFlags, flaggingHook]);

  // User metadata
  const userMetadata = {
    userId: user?.id || null,
    organizationId: organizationId,
    isAuthenticated: !!user,
  };

  // Clean up old successful/failed flags periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5 minutes
      
      setPendingFlags(prev => 
        prev.filter(flag => {
          // Keep pending flags regardless of age
          if (flag.status === 'pending') return true;
          
          // Remove old successful/failed flags
          return (now - flag.timestamp) < maxAge;
        })
      );
    }, 60000); // Check every minute

    return () => clearInterval(cleanup);
  }, []);

  const value: FlaggingContextType = {
    mutateFlag,
    pendingFlags,
    clearPendingFlag,
    retryPendingFlag,
    userMetadata,
    isCreatingFlag: flaggingHook.isLoading,
    error: flaggingHook.error,
  };

  return (
    <FlaggingContext.Provider value={value}>
      {children}
    </FlaggingContext.Provider>
  );
};
