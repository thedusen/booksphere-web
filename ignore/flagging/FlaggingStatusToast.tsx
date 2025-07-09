// components/flagging/FlaggingStatusToast.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import { CheckCircle, XCircle, Clock, RotateCcw, X } from 'lucide-react-native';
import { useFlaggingContext } from '@/context/FlaggingContext';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

/**
 * Toast component that shows pending flags status
 * Displays a notification for each pending flag operation
 */
export const FlaggingStatusToast: React.FC = () => {
  const { pendingFlags, clearPendingFlag, retryPendingFlag } = useFlaggingContext();

  if (pendingFlags.length === 0) return null;

  return (
    <StyledView className="absolute top-16 left-4 right-4 z-50 space-y-2">
      {pendingFlags.map((flag) => (
        <StyledView
          key={flag.id}
          className={`
            p-3 rounded-lg shadow-lg flex-row items-center justify-between
            ${flag.status === 'success' ? 'bg-green-50 border border-green-200' : ''}
            ${flag.status === 'failed' ? 'bg-red-50 border border-red-200' : ''}
            ${flag.status === 'pending' ? 'bg-blue-50 border border-blue-200' : ''}
          `}
        >
          <StyledView className="flex-row items-center flex-1">
            {flag.status === 'pending' && (
              <Clock size={16} color="#2563eb" className="mr-2" />
            )}
            {flag.status === 'success' && (
              <CheckCircle size={16} color="#16a34a" className="mr-2" />
            )}
            {flag.status === 'failed' && (
              <XCircle size={16} color="#dc2626" className="mr-2" />
            )}
            
            <StyledView className="flex-1">
              <StyledText
                className={`
                  font-medium text-sm
                  ${flag.status === 'success' ? 'text-green-800' : ''}
                  ${flag.status === 'failed' ? 'text-red-800' : ''}
                  ${flag.status === 'pending' ? 'text-blue-800' : ''}
                `}
              >
                {flag.status === 'pending' && 'Submitting flag...'}
                {flag.status === 'success' && 'Flag submitted successfully'}
                {flag.status === 'failed' && 'Failed to submit flag'}
              </StyledText>
              
              <StyledText
                className={`
                  text-xs mt-1
                  ${flag.status === 'success' ? 'text-green-600' : ''}
                  ${flag.status === 'failed' ? 'text-red-600' : ''}
                  ${flag.status === 'pending' ? 'text-blue-600' : ''}
                `}
              >
                {flag.title}
              </StyledText>
              
              {flag.status === 'failed' && flag.error && (
                <StyledText className="text-xs text-red-500 mt-1">
                  {flag.error}
                </StyledText>
              )}
            </StyledView>
          </StyledView>

          <StyledView className="flex-row items-center ml-2">
            {flag.status === 'failed' && (
              <StyledTouchableOpacity
                onPress={() => retryPendingFlag(flag.id)}
                className="p-1 mr-2"
              >
                <RotateCcw size={14} color="#dc2626" />
              </StyledTouchableOpacity>
            )}
            
            {flag.status !== 'pending' && (
              <StyledTouchableOpacity
                onPress={() => clearPendingFlag(flag.id)}
                className="p-1"
              >
                <X size={14} color="#6b7280" />
              </StyledTouchableOpacity>
            )}
          </StyledView>
        </StyledView>
      ))}
    </StyledView>
  );
};
