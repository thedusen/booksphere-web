# AI Cataloging Feedback System - Mobile Implementation Guide

## Overview

This guide provides implementation requirements for adding AI feedback tracking to the React Native mobile app. The system has been implemented in the web app and uses the same backend APIs and database schema.

## Architecture Summary

The AI feedback system consists of:
- **Silent Change Tracking**: Automatically tracks user edits to AI cataloging output
- **Optional Reprocessing Feedback**: Modal for explicit feedback when users reprocess jobs
- **Backend APIs**: Shared between web and mobile for feedback collection
- **Analytics Dashboard**: Admin-only view of AI performance metrics

## Required Mobile Implementation

### 1. Hook Integration

Create a mobile-specific version of the feedback tracking hook:

**File: `hooks/useAIFeedbackTracking.ts`**

```typescript
import { useCallback, useRef, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';
import { 
  AIFeedbackTracker, 
  CreateFeedbackEventRequest,
  TrackableField,
  TRACKABLE_FIELDS 
} from '@/types/ai-feedback';

// Mobile-optimized version with reduced API calls
export function useAIFeedbackTracking({
  catalogingJobId,
  originalData,
  organizationId,
  enabled = true,
  debounceMs = 1000 // Longer debounce for mobile
}: UseAIFeedbackTrackingOptions): AIFeedbackTracker {
  // Same implementation as web, but with:
  // - Longer debounce times
  // - Offline queue support
  // - Battery-conscious tracking
}
```

### 2. Mobile Components

#### Confidence Indicators

**File: `components/cataloging/ConfidenceIndicator.tsx`**

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import { useConfidenceLevel } from '@/hooks/useAIFeedbackTracking';

export function MobileConfidenceIndicator({
  confidence,
  fieldName,
  size = 'small'
}: MobileConfidenceIndicatorProps) {
  const { level, color, label } = useConfidenceLevel(confidence);
  
  return (
    <View style={styles.indicator}>
      <View style={[styles.dot, { backgroundColor: getColorValue(level) }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
```

#### Reprocessing Modal

**File: `components/cataloging/ReprocessingFeedbackModal.tsx`**

```typescript
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ReprocessingFeedbackData, FEEDBACK_REASONS } from '@/types/ai-feedback';

export function MobileReprocessingModal({
  isVisible,
  onClose,
  onSubmit,
  onReprocessWithoutFeedback,
  jobTitle
}: MobileReprocessingModalProps) {
  // Native modal implementation with:
  // - Touch-friendly interface
  // - Simplified feedback form
  // - Native iOS/Android styling
}
```

### 3. Integration Points

#### Catalog Review Screen

**File: `screens/CatalogReviewScreen.tsx`**

```typescript
import { useAIFeedbackTracking } from '@/hooks/useAIFeedbackTracking';
import { MobileConfidenceIndicator } from '@/components/cataloging/ConfidenceIndicator';

export function CatalogReviewScreen({ route }: CatalogReviewScreenProps) {
  const { job } = route.params;
  
  // Initialize feedback tracking
  const feedbackTracker = useAIFeedbackTracking({
    catalogingJobId: job.job_id,
    originalData: job.original_extracted_data || job.extracted_data || {},
    organizationId: organizationId || '',
    enabled: !!organizationId
  });

  // Track form changes
  const handleFieldChange = (fieldName: string, newValue: any) => {
    const originalValue = job.original_extracted_data?.[fieldName];
    if (originalValue !== undefined) {
      feedbackTracker.trackFieldChange(fieldName, originalValue, newValue);
    }
    // Update form state...
  };

  // Finalize feedback on submission
  const handleSubmit = async () => {
    try {
      feedbackTracker.finalizeSession().catch(console.error);
      // Continue with job finalization...
    } catch (error) {
      // Handle error...
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Title Field */}
      <View style={styles.fieldContainer}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Title</Text>
          <MobileConfidenceIndicator 
            extractedData={job.extracted_data}
            fieldName="title"
          />
        </View>
        <TextInput
          value={formData.title}
          onChangeText={(value) => handleFieldChange('title', value)}
          style={styles.input}
        />
      </View>
      
      {/* Add confidence indicators to other fields... */}
    </ScrollView>
  );
}
```

#### Cataloging Capture Screen

**File: `screens/CatalogNewScreen.tsx`** (already exists)

Add feedback tracking initialization when job is created:

```typescript
// After successful job creation
const handleSubmit = async () => {
  try {
    const newJobId = await createCatalogingJob(imageUrls);
    
    // Track new job creation for feedback system
    if (feedbackTracker) {
      feedbackTracker.trackValidation(true, 'Job created successfully');
    }
    
    // Continue with existing flow...
  } catch (error) {
    // Handle error...
  }
};
```

### 4. API Integration

The mobile app will use the same API endpoints as the web app:

- `POST /api/ai-feedback` - Submit feedback events
- `GET /api/ai-feedback/dashboard` - Admin analytics (if needed)
- `GET /api/ai-feedback/trends` - Performance trends

### 5. Offline Support

**File: `services/feedbackQueue.ts`**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

export class FeedbackQueue {
  private static instance: FeedbackQueue;
  private queue: CreateFeedbackEventRequest[] = [];
  
  static getInstance(): FeedbackQueue {
    if (!FeedbackQueue.instance) {
      FeedbackQueue.instance = new FeedbackQueue();
    }
    return FeedbackQueue.instance;
  }

  async queueEvent(event: CreateFeedbackEventRequest) {
    this.queue.push(event);
    await this.saveQueue();
  }

  async syncQueue() {
    if (this.queue.length === 0) return;
    
    try {
      const response = await fetch('/api/ai-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: this.queue })
      });
      
      if (response.ok) {
        this.queue = [];
        await this.saveQueue();
      }
    } catch (error) {
      console.error('Failed to sync feedback queue:', error);
    }
  }

  private async saveQueue() {
    await AsyncStorage.setItem('feedbackQueue', JSON.stringify(this.queue));
  }

  private async loadQueue() {
    const saved = await AsyncStorage.getItem('feedbackQueue');
    this.queue = saved ? JSON.parse(saved) : [];
  }
}
```

### 6. Performance Considerations

#### Battery Optimization
- Use longer debounce times (1000ms vs 500ms on web)
- Batch API calls more aggressively
- Suspend tracking when app is backgrounded

#### Memory Management
- Clear pending events on low memory warnings
- Limit queue size to prevent memory issues
- Use weak references where possible

#### Network Efficiency
- Queue events for batch submission
- Compress payloads when possible
- Respect user's data usage preferences

### 7. Testing Strategy

#### Unit Tests
```typescript
// __tests__/useAIFeedbackTracking.test.ts
describe('useAIFeedbackTracking', () => {
  it('should track field changes correctly', () => {
    // Test change detection
  });
  
  it('should handle offline scenarios', () => {
    // Test queue functionality
  });
  
  it('should respect debounce timing', () => {
    // Test debounce behavior
  });
});
```

#### Integration Tests
```typescript
// __tests__/CatalogReviewScreen.test.ts
describe('CatalogReviewScreen feedback integration', () => {
  it('should track user edits silently', () => {
    // Test feedback tracking integration
  });
  
  it('should show confidence indicators', () => {
    // Test UI integration
  });
});
```

### 8. Implementation Checklist

#### Phase 1: Core Integration
- [ ] Port `useAIFeedbackTracking` hook to mobile
- [ ] Create mobile confidence indicator component
- [ ] Add tracking to catalog review screens
- [ ] Implement offline queue system

#### Phase 2: Advanced Features
- [ ] Create reprocessing feedback modal
- [ ] Add confidence indicators to all form fields
- [ ] Implement batch sync functionality
- [ ] Add error handling and retry logic

#### Phase 3: Performance & Polish
- [ ] Optimize for battery life
- [ ] Add memory management
- [ ] Implement data usage controls
- [ ] Add comprehensive testing

### 9. Platform-Specific Considerations

#### iOS
- Use native UIKit components for modals
- Implement proper accessibility labels
- Handle safe area insets correctly
- Support dark mode

#### Android
- Use Material Design components
- Handle back button behavior
- Support different screen densities
- Implement proper permissions

### 10. Migration Strategy

1. **Backend First**: Database schema and APIs are already deployed
2. **Mobile Hook**: Implement the feedback tracking hook
3. **UI Integration**: Add confidence indicators progressively
4. **Testing**: Comprehensive testing before production release
5. **Rollout**: Gradual rollout with feature flags

## Expected Benefits

### For Users
- **Zero Friction**: No additional steps required
- **Visual Feedback**: Confidence indicators help users focus on uncertain fields
- **Improved Quality**: Better AI accuracy over time

### For Business
- **Data-Driven Improvements**: Clear metrics on AI performance
- **Cost Optimization**: Focus improvements on high-impact areas
- **Competitive Advantage**: Industry-leading cataloging accuracy

## Support & Maintenance

### Monitoring
- Track API usage and error rates
- Monitor offline queue performance
- Analyze user interaction patterns

### Updates
- Regular sync with web app changes
- Performance optimizations based on usage data
- Feature parity maintenance

This implementation will provide the mobile app with the same comprehensive AI feedback capabilities as the web application while maintaining excellent performance and user experience.