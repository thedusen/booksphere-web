# Buildship to Supabase Edge Functions Migration Guide

## Overview

This document details the complete migration from BuildShip to Supabase Edge Functions for the AI-powered book cataloging system. Since **booksphere-web is the source of truth**, all components created in this mobile project must be transferred to the web project.

## Migration Summary

### What Was Built
- **Edge Function**: Complete replacement for BuildShip workflow
- **Frontend Updates**: Modified mobile app to use Edge Function instead of BuildShip
- **Retry Functionality**: Added retry capabilities for both failed and successful jobs
- **Modern Architecture**: Uses latest Supabase Edge Functions patterns with Deno

### Key Benefits
- ✅ **Eliminated External Dependency**: No more BuildShip subscription
- ✅ **Better Performance**: Edge Functions run globally, closer to users
- ✅ **Enhanced Retry Logic**: Users can retry any job (failed or successful)
- ✅ **Unified Stack**: Everything runs in Supabase ecosystem
- ✅ **Cost Savings**: Reduced third-party API costs
- ✅ **Better Debugging**: All logs in Supabase dashboard

## Critical Files to Transfer to booksphere-web

### 1. Edge Function Code (MUST TRANSFER)

**Source Directory**: `/supabase/functions/process-cataloging-job/`

#### Main Function File
- **File**: `supabase/functions/process-cataloging-job/index.ts`
- **Purpose**: Main Edge Function that processes cataloging jobs
- **Key Features**:
  - JWT authentication validation
  - Service role switching for elevated permissions
  - Complete AI processing workflow
  - Comprehensive error handling
  - Real-time job status updates

#### Utility Functions
- **File**: `supabase/functions/process-cataloging-job/_utils/gemini-client.ts`
- **Purpose**: Gemini AI API integration
- **Key Features**:
  - Structured prompts for book cataloging
  - Image processing and base64 conversion
  - Error handling for AI responses
  - JSON parsing and validation

- **File**: `supabase/functions/process-cataloging-job/_utils/image-processor.ts`
- **Purpose**: Image fetching and processing utilities
- **Key Features**:
  - Fetch images from Supabase Storage
  - Base64 conversion for AI processing
  - Support for both URL and storage path access
  - Comprehensive error handling

#### Shared Utilities
- **File**: `supabase/functions/_shared/cors.ts`
- **Purpose**: CORS headers for Edge Functions
- **Usage**: Shared across all Edge Functions

### 2. Environment Variables (MUST CONFIGURE)

#### Supabase Secrets Required
```bash
# In booksphere-web project, set these Supabase secrets:
supabase secrets set GEMINI_API_KEY="your_gemini_api_key_here"
```

#### Environment Variables Already Available
These should already exist in booksphere-web:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Frontend Changes (REFERENCE ONLY)

The following changes were made to the mobile app and should inform any similar changes needed in the web app:

#### API Endpoint Update
```typescript
// OLD (BuildShip):
const API_ENDPOINT = `${process.env.EXPO_PUBLIC_API_BASE_URL}/catalog-from-images`;

// NEW (Edge Function):  
const API_ENDPOINT = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/process-cataloging-job`;
```

#### Payload Structure Change
```typescript
// OLD (BuildShip):
const payload = { imageUrls };

// NEW (Edge Function):
const payload = { jobId: newJobId };
```

## Step-by-Step Migration Instructions

### Phase 1: Environment Setup

1. **Navigate to booksphere-web project**
   ```bash
   cd /path/to/booksphere-web
   ```

2. **Ensure Supabase CLI is installed and updated**
   ```bash
   npm install -g @supabase/supabase-cli@latest
   supabase --version
   ```

3. **Link to Supabase project** (if not already linked)
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

### Phase 2: Copy Edge Function Files

1. **Create Edge Functions directory structure** (if it doesn't exist)
   ```bash
   mkdir -p supabase/functions/_shared
   mkdir -p supabase/functions/process-cataloging-job/_utils
   ```

2. **Copy all Edge Function files from booksphere-mobile to booksphere-web**:
   - Copy `supabase/functions/process-cataloging-job/index.ts`
   - Copy `supabase/functions/process-cataloging-job/_utils/gemini-client.ts`
   - Copy `supabase/functions/process-cataloging-job/_utils/image-processor.ts`
   - Copy `supabase/functions/_shared/cors.ts`

### Phase 3: Configure Environment

1. **Set up Gemini API key as Supabase secret**
   ```bash
   supabase secrets set GEMINI_API_KEY="your_actual_gemini_api_key"
   ```

2. **Verify environment variables**
   ```bash
   supabase secrets list
   ```

### Phase 4: Local Testing

1. **Start local Supabase services**
   ```bash
   supabase start
   ```

2. **Create local environment file**
   ```bash
   cp ./supabase/.env.local.example ./supabase/.env.local
   # Add GEMINI_API_KEY to the .env.local file
   ```

3. **Serve Edge Functions locally**
   ```bash
   supabase functions serve --env-file ./supabase/.env.local --no-verify-jwt
   ```

4. **Test the Edge Function**
   ```bash
   curl -X POST 'http://localhost:54321/functions/v1/process-cataloging-job' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{"jobId": "test-job-id"}'
   ```

### Phase 5: Production Deployment

1. **Deploy Edge Function to production**
   ```bash
   supabase functions deploy process-cataloging-job
   ```

2. **Verify deployment**
   ```bash
   supabase functions list
   ```

3. **Test production endpoint**
   ```bash
   curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-cataloging-job' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{"jobId": "actual-job-id"}'
   ```

### Phase 6: Update Web Application

If the web application has similar cataloging functionality:

1. **Update API endpoint in web app**
   - Change from BuildShip URL to Edge Function URL
   - Update payload structure from `{ imageUrls }` to `{ jobId }`

2. **Test full workflow**
   - Create cataloging job
   - Trigger Edge Function
   - Verify real-time updates
   - Test retry functionality

## Database Dependencies

### Required RPC Functions

The Edge Function depends on these existing RPC functions (should already exist in booksphere-web):

1. **`create_cataloging_job(image_urls_payload)`**
   - Creates new cataloging job
   - Returns job ID

2. **`match_book_by_details(p_title, p_author_name, p_publication_year)`**
   - Matches extracted book data against existing books
   - Returns array of matching edition IDs

### Required Tables

The Edge Function interacts with these tables (should already exist):

1. **`cataloging_jobs`**
   - Primary table for job tracking
   - Columns: `job_id`, `status`, `image_urls`, `extracted_data`, `matched_edition_ids`, `error_message`

2. **Books/Authors/Publishers tables**
   - Used by `match_book_by_details` function

## Retry Functionality

### Implementation Details

Two types of retry were implemented:

1. **Cancel and Retry** (for pending/failed jobs)
   - Deletes original job
   - Creates new job with same images
   - Triggers Edge Function for processing

2. **Reprocess** (for completed jobs)
   - Keeps original job intact
   - Creates new job with same images
   - Allows users to get different AI results

### Frontend Integration

The retry functionality requires:
- UI buttons/actions for retry operations
- Mutation handlers for API calls  
- Snackbar/toast notifications for user feedback
- Real-time updates via Supabase subscriptions

## Testing Checklist

### Local Testing
- [ ] Edge Function serves locally
- [ ] Can process test job with images
- [ ] Error handling works correctly
- [ ] Environment variables are loaded
- [ ] CORS headers work properly

### Production Testing
- [ ] Edge Function deploys successfully
- [ ] Production secrets are configured
- [ ] Full workflow: job creation → processing → completion
- [ ] Retry functionality works for all job states
- [ ] Error scenarios are handled gracefully
- [ ] Real-time updates work correctly

### Performance Testing
- [ ] Concurrent job processing
- [ ] Large image handling
- [ ] AI processing timeouts
- [ ] Memory usage optimization

## Monitoring and Debugging

### Logs Access
```bash
# View Edge Function logs
supabase functions logs --tail process-cataloging-job
```

### Dashboard Monitoring
- Monitor function execution in Supabase Dashboard
- Check error rates and response times
- Review function invocation metrics

### Common Issues and Solutions

1. **JWT Token Issues**
   - Ensure Authorization header is properly formatted
   - Verify token is not expired
   - Check RLS policies allow user access

2. **Image Processing Failures**
   - Verify image URLs are accessible
   - Check Supabase Storage permissions
   - Ensure images are valid format

3. **Gemini API Errors**
   - Verify API key is correctly set
   - Check API quota/billing status
   - Monitor response format changes

## Rollback Plan

If issues arise after deployment:

1. **Temporary Rollback**
   - Update frontend to use BuildShip endpoint temporarily
   - Keep Edge Function deployed for debugging

2. **Full Rollback**
   - Remove Edge Function deployment
   - Restore original BuildShip integration
   - Document issues for future resolution

## Cost Analysis

### Before (BuildShip)
- BuildShip subscription: $XX/month
- External API dependency costs
- Limited debugging capabilities

### After (Edge Functions)
- Supabase Edge Function invocations: ~$X per million
- Reduced third-party dependencies
- Better debugging and monitoring

## Security Considerations

### Authentication Flow
1. User JWT token validates request
2. Service role performs database operations
3. RLS policies enforce data access

### API Key Management
- Gemini API key stored as Supabase secret
- Not exposed in client-side code
- Rotation capabilities via Supabase dashboard

### Data Privacy
- Images processed temporarily in memory
- No persistent storage of image data in Edge Function
- Existing RLS policies maintained

## Conclusion

This migration successfully eliminates the BuildShip dependency while improving performance, reducing costs, and adding enhanced retry functionality. The modular architecture ensures maintainability and scalability for future enhancements.

**Next Steps for booksphere-web team:**
1. Follow migration instructions above
2. Test thoroughly in staging environment  
3. Deploy to production with monitoring
4. Update any web-specific UI components for retry functionality
5. Remove BuildShip subscription once fully validated

## Support and Troubleshooting

For issues with this migration:
1. Check Edge Function logs in Supabase Dashboard
2. Verify all environment variables are set
3. Test with sample job data
4. Review this documentation for missed steps

---
*Migration completed: [Current Date]*
*Next review: After production deployment*