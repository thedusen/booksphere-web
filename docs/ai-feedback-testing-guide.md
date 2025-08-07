# AI Cataloging Feedback System - Testing Guide

## Phase 1: Database Setup & Verification

### Step 1: Apply Database Migrations
```bash
# Apply the migrations to your Supabase instance
npx supabase db push

# Or if using Supabase CLI directly
supabase db push --db-url postgresql://[your-db-url]
```

### Step 2: Verify Database Schema
```sql
-- Run these queries in Supabase SQL Editor to verify tables exist

-- Check feedback events table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ai_feedback_events'
ORDER BY ordinal_position;

-- Check aggregates table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ai_feedback_aggregates'
ORDER BY ordinal_position;

-- Check if original_extracted_data column was added
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'cataloging_jobs' 
AND column_name = 'original_extracted_data';

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('ai_feedback_events', 'ai_feedback_aggregates');

-- Test analytics functions
SELECT * FROM get_ai_accuracy_dashboard(
  (SELECT organization_id FROM organizations LIMIT 1)::uuid, 
  30
);
```

### Step 3: Verify Indexes
```sql
-- Check indexes are created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('ai_feedback_events', 'ai_feedback_aggregates');
```

## Phase 2: Edge Function Testing

### Step 1: Deploy Updated Edge Function
```bash
# Deploy the updated process-cataloging-job function
npx supabase functions deploy process-cataloging-job

# Or using Supabase CLI
supabase functions deploy process-cataloging-job
```

### Step 2: Test Job Processing
```bash
# Create a test cataloging job and verify original_extracted_data is saved

# 1. First, create a cataloging job through the UI or API
# 2. Then check if both extracted_data and original_extracted_data are populated:

SELECT 
  job_id,
  extracted_data IS NOT NULL as has_extracted,
  original_extracted_data IS NOT NULL as has_original,
  extracted_data = original_extracted_data as are_identical
FROM cataloging_jobs 
WHERE job_id = '[your-test-job-id]';
```

## Phase 3: Frontend Component Testing

### Step 1: Install Dependencies & Build
```bash
# Install any missing dependencies
npm install

# Build the project to catch TypeScript errors
npm run build

# Run type checking
npm run type-check
```

### Step 2: Manual UI Testing - ReviewWizard Integration

1. **Navigate to Cataloging Page**
   - Go to `/cataloging` in your app
   - Create or select a cataloging job

2. **Open Review Wizard**
   - Click on a completed job to review
   - Verify confidence indicators appear next to fields
   - Check browser console for any errors

3. **Test Silent Change Tracking**
   ```javascript
   // Open browser console and run:
   localStorage.setItem('debug', 'ai-feedback');
   
   // Now make edits to fields and watch console for:
   // - "Tracking field change: [fieldName]"
   // - "Significant change detected"
   ```

4. **Edit Different Fields**
   - Change the title slightly
   - Modify authors
   - Update publication year
   - Toggle dust jacket checkbox
   - Watch for console logs showing tracking

5. **Submit the Form**
   - Complete the review and submit
   - Check browser Network tab for API call to `/api/ai-feedback`
   - Verify the payload contains your changes

### Step 3: Test Confidence Indicators

1. **Visual Verification**
   - Check that confidence indicators appear next to AI-extracted fields
   - Hover over indicators to see tooltips
   - Verify color coding (green/amber/red)

2. **Different Confidence Levels**
   ```sql
   -- Create test data with different confidence levels
   UPDATE cataloging_jobs 
   SET extracted_data = jsonb_set(
     extracted_data,
     '{extraction_confidence}',
     '{"title": "high", "contributors": "medium", "publication_info": "low"}'::jsonb
   )
   WHERE job_id = '[your-test-job-id]';
   ```

3. **Refresh and Verify**
   - Reload the ReviewWizard
   - Confirm different confidence indicators show correctly

## Phase 4: API Testing

### Step 1: Test Feedback Collection API
```bash
# Test single event submission
curl -X POST http://localhost:3001/api/ai-feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [your-auth-token]" \
  -d '{
    "cataloging_job_id": "[job-id]",
    "feedback_type": "field_correction",
    "field_name": "title",
    "original_value": "Old Title",
    "corrected_value": "New Title"
  }'

# Test batch submission
curl -X POST http://localhost:3001/api/ai-feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [your-auth-token]" \
  -d '{
    "events": [
      {
        "cataloging_job_id": "[job-id]",
        "feedback_type": "field_correction",
        "field_name": "title",
        "original_value": "Old Title",
        "corrected_value": "New Title"
      },
      {
        "cataloging_job_id": "[job-id]",
        "feedback_type": "field_correction",
        "field_name": "authors",
        "original_value": ["Author One"],
        "corrected_value": ["Author One", "Author Two"]
      }
    ]
  }'
```

### Step 2: Test Analytics APIs
```bash
# Test dashboard API
curl http://localhost:3001/api/ai-feedback/dashboard?days_back=30 \
  -H "Authorization: Bearer [your-auth-token]"

# Test trends API
curl http://localhost:3001/api/ai-feedback/trends \
  -H "Authorization: Bearer [your-auth-token]"

# Test with specific field
curl http://localhost:3001/api/ai-feedback/trends?field_name=title \
  -H "Authorization: Bearer [your-auth-token]"
```

### Step 3: Verify Database Records
```sql
-- Check if feedback events are being recorded
SELECT 
  event_id,
  feedback_type,
  field_name,
  original_value,
  corrected_value,
  created_at
FROM ai_feedback_events
WHERE organization_id = '[your-org-id]'
ORDER BY created_at DESC
LIMIT 10;

-- Check if aggregates are being updated
SELECT 
  field_name,
  total_extractions,
  total_corrections,
  correction_rate,
  period_start
FROM ai_feedback_aggregates
WHERE organization_id = '[your-org-id]'
ORDER BY computed_at DESC;
```

## Phase 5: Admin Dashboard Testing

### Step 1: Access Analytics Dashboard
1. Navigate to `/admin/ai-analytics`
2. Verify the page loads without errors
3. Check that overview cards display data

### Step 2: Test Time Range Filters
1. Change time range dropdown (7, 30, 90, 365 days)
2. Verify data updates accordingly
3. Check that API calls are made with correct parameters

### Step 3: Test Field Filtering
1. Select different fields from dropdown
2. Verify trends update for selected field
3. Test "All Fields" option

### Step 4: Test Data Visualization
1. Verify accuracy percentages display correctly
2. Check trend indicators (up/down arrows)
3. Confirm color coding matches performance levels

## Phase 6: Reprocessing Modal Testing

### Step 1: Setup Test Scenario
```javascript
// Add a "Reprocess Job" button to test the modal
// In your cataloging component, add:
import { ReprocessingFeedbackModal } from '@/components/cataloging/ReprocessingFeedbackModal';

// Add button and modal to your component
<Button onClick={() => setShowReprocessModal(true)}>
  Reprocess Job
</Button>

<ReprocessingFeedbackModal
  isOpen={showReprocessModal}
  onOpenChange={setShowReprocessModal}
  onSubmit={async (data) => {
    console.log('Feedback data:', data);
    // Handle submission
  }}
  onReprocessWithoutFeedback={async () => {
    console.log('Reprocessing without feedback');
    // Handle reprocessing
  }}
  jobTitle={job.extracted_data?.title}
/>
```

### Step 2: Test Modal Interactions
1. Click "Reprocess Job" button
2. Fill out feedback form
3. Test all form fields and checkboxes
4. Submit with feedback
5. Test "Reprocess Without Feedback" option
6. Verify data is logged correctly

## Phase 7: End-to-End Testing

### Step 1: Complete Workflow Test
1. **Create New Cataloging Job**
   - Upload book images
   - Wait for AI processing
   - Verify `original_extracted_data` is saved

2. **Review and Edit**
   - Open ReviewWizard
   - See confidence indicators
   - Make several edits to different fields
   - Submit the review

3. **Verify Feedback Collection**
   ```sql
   -- Check feedback was recorded
   SELECT * FROM ai_feedback_events 
   WHERE cataloging_job_id = '[your-job-id]'
   ORDER BY edit_sequence;
   ```

4. **Check Analytics Update**
   - Go to admin dashboard
   - Verify your changes appear in metrics
   - Check field-specific performance data

### Step 2: Performance Testing
```javascript
// Test with multiple rapid edits
for (let i = 0; i < 20; i++) {
  updateFormData({ title: `Test Title ${i}` });
}
// Verify debouncing works (should not create 20 events)
```

### Step 3: Error Handling
1. **Test with network offline**
   - Disable network
   - Make edits
   - Re-enable network
   - Verify feedback is still submitted

2. **Test with invalid data**
   - Try submitting very long field values
   - Test with special characters
   - Verify error handling works

## Phase 8: Automated Testing

### Step 1: Run Unit Tests
```bash
# Create test file for feedback hook
cat > src/hooks/__tests__/useAIFeedbackTracking.test.ts << 'EOF'
import { renderHook, act } from '@testing-library/react';
import { useAIFeedbackTracking } from '../useAIFeedbackTracking';

describe('useAIFeedbackTracking', () => {
  it('should track field changes', () => {
    const { result } = renderHook(() => 
      useAIFeedbackTracking({
        catalogingJobId: 'test-id',
        originalData: { title: 'Original' },
        organizationId: 'org-id'
      })
    );

    act(() => {
      result.current.trackFieldChange('title', 'Original', 'Modified');
    });

    expect(result.current.isTracking).toBe(true);
  });

  it('should ignore formatting-only changes', () => {
    const { result } = renderHook(() => 
      useAIFeedbackTracking({
        catalogingJobId: 'test-id',
        originalData: { title: 'Test Book' },
        organizationId: 'org-id'
      })
    );

    act(() => {
      result.current.trackFieldChange('title', 'Test Book', 'test book');
    });

    // Should not track case-only changes
  });
});
EOF

# Run tests
npm test
```

### Step 2: Integration Tests
```bash
# Create E2E test
cat > e2e/ai-feedback.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test.describe('AI Feedback System', () => {
  test('should show confidence indicators', async ({ page }) => {
    await page.goto('/cataloging');
    // Navigate to a job with AI data
    await page.click('[data-testid="review-job"]');
    
    // Check for confidence indicators
    await expect(page.locator('[data-testid="confidence-indicator"]')).toBeVisible();
  });

  test('should track field changes', async ({ page }) => {
    await page.goto('/cataloging/review/[job-id]');
    
    // Edit a field
    await page.fill('#title', 'New Title');
    
    // Submit form
    await page.click('[data-testid="submit-review"]');
    
    // Check network request was made
    await page.waitForRequest(/api\/ai-feedback/);
  });
});
EOF

# Run E2E tests
npm run test:e2e
```

## Phase 9: Production Monitoring

### Step 1: Setup Monitoring Queries
```sql
-- Daily monitoring query
CREATE OR REPLACE VIEW ai_feedback_daily_summary AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_events,
  COUNT(DISTINCT cataloging_job_id) as unique_jobs,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(time_to_edit_ms) as avg_edit_time_ms
FROM ai_feedback_events
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Check daily summary
SELECT * FROM ai_feedback_daily_summary LIMIT 7;
```

### Step 2: Create Alerts
```sql
-- Alert if no feedback collected in 24 hours
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'ALERT: No feedback collected in 24 hours'
    ELSE 'OK: Feedback collection working'
  END as status
FROM ai_feedback_events
WHERE created_at > NOW() - INTERVAL '24 hours';
```

## Testing Checklist

### ✅ Database
- [ ] Migrations applied successfully
- [ ] Tables created with correct schema
- [ ] RLS policies working
- [ ] Indexes created
- [ ] Analytics functions return data

### ✅ Backend
- [ ] Edge function preserves original data
- [ ] API endpoints respond correctly
- [ ] Authentication working
- [ ] Batch submission works

### ✅ Frontend
- [ ] ReviewWizard tracks changes
- [ ] Confidence indicators display
- [ ] Reprocessing modal works
- [ ] Admin dashboard shows data
- [ ] No console errors

### ✅ Integration
- [ ] End-to-end flow works
- [ ] Data flows correctly through system
- [ ] Performance acceptable
- [ ] Error handling works

### ✅ Production
- [ ] Monitoring in place
- [ ] Alerts configured
- [ ] Performance metrics tracked
- [ ] User experience unchanged

## Troubleshooting Common Issues

### Issue: Feedback events not saving
```sql
-- Check RLS policies
SELECT * FROM ai_feedback_events WHERE organization_id = '[your-org-id]';

-- If empty, check with service role
SET ROLE postgres;
SELECT * FROM ai_feedback_events;
RESET ROLE;
```

### Issue: Confidence indicators not showing
```javascript
// Check if extracted_data has confidence scores
console.log(job.extracted_data?.extraction_confidence);
```

### Issue: Analytics dashboard empty
```sql
-- Manually trigger aggregation
SELECT update_feedback_aggregates();

-- Check aggregates table
SELECT * FROM ai_feedback_aggregates;
```

### Issue: API returns 403
```javascript
// Check user authentication
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
console.log('Org membership:', await checkOrgMembership(user.id));
```

This comprehensive testing guide ensures all components of the AI feedback system work correctly together.