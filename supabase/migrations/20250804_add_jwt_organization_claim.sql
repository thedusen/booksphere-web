-- Migration: 20250804_add_jwt_organization_claim
-- Purpose: Add custom JWT claim for organization_id to improve security and performance
-- This ensures organization context is automatically available in all database operations

-- Create or replace the function that adds custom claims to JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  claims jsonb;
  user_organization_id uuid;
BEGIN
  -- Extract the current claims
  claims := event->'claims';

  -- Get the user's organization from user_organizations table
  SELECT organizations_id INTO user_organization_id
  FROM public.user_organizations
  WHERE user_id = (event->>'user_id')::uuid
  LIMIT 1;

  -- Add organization_id to the claims if found
  IF user_organization_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{organization_id}', to_jsonb(user_organization_id::text));
  END IF;

  -- Update the event with new claims
  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Add comment for documentation
COMMENT ON FUNCTION public.custom_access_token_hook IS 
'Adds organization_id to JWT claims for automatic organization context in all database operations. 
This eliminates the need for manual session settings and improves security.';

-- Note: After applying this migration, you need to:
-- 1. Go to Supabase Dashboard > Authentication > Hooks
-- 2. Enable "Customize ID Token Claims" 
-- 3. Select this function: custom_access_token_hook
-- 4. Save the configuration
-- 5. Users will need to re-authenticate to get the new claims