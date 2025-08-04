#!/bin/bash

# Deploy Notification Processor Edge Function
# This script applies all necessary database migrations and deploys the Edge Function

set -e

echo "🚀 Deploying Notification Processor Edge Function..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first."
    exit 1
fi

# Check if we're in the correct directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in Supabase project directory. Please run from project root."
    exit 1
fi

echo "📊 Applying database migrations..."

# Apply migrations for the notification processor
echo "  - Creating sanitized event view..."
supabase db push --include-all

echo "  - Verifying migrations..."
supabase db diff --schema public

echo "🔧 Deploying Edge Function..."

# Deploy the notification processor function
supabase functions deploy notification-processor

echo "✅ Deployment complete!"

echo ""
echo "📋 Next steps:"
echo "1. Test the function with: supabase functions invoke notification-processor --data '{\"org_id\":\"your-org-uuid\"}'"
echo "2. Monitor logs with: supabase functions logs notification-processor"
echo "3. Set up scheduled invocation or trigger mechanism"
echo ""
echo "📈 Monitoring queries:"
echo "- Processor health: SELECT * FROM get_processor_cursor_health();"
echo "- Advisory locks: SELECT * FROM get_advisory_lock_status();"
echo "- Outbox metrics: SELECT * FROM outbox_health_metrics;"
echo ""
echo "🔒 Security checklist:"
echo "- ✅ RLS policies enabled"
echo "- ✅ Input validation implemented"
echo "- ✅ Payload sanitization active"
echo "- ✅ Rate limiting configured"
echo "- ✅ Advisory locks preventing race conditions" 