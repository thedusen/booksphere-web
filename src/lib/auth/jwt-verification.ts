/**
 * JWT Claims Verification Utilities
 * 
 * These utilities help diagnose and verify JWT custom claims configuration
 * in Supabase projects. Use these functions to debug authentication issues.
 */

import { supabase } from '@/lib/supabase';

export interface JWTVerificationResult {
  hasJWTClaims: boolean;
  organizationId: string | null;
  claimsSource: 'app_metadata' | 'user_metadata' | 'database' | 'none';
  configurationStatus: 'configured' | 'missing' | 'error';
  recommendations: string[];
}

/**
 * Verifies if JWT custom claims are properly configured and working
 */
export async function verifyJWTConfiguration(): Promise<JWTVerificationResult> {
  const recommendations: string[] = [];
  
  try {
    // Get current session and user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return {
        hasJWTClaims: false,
        organizationId: null,
        claimsSource: 'none',
        configurationStatus: 'error',
        recommendations: ['User is not authenticated. Please sign in first.']
      };
    }

    const user = session.user;
    let organizationId: string | null = null;
    let claimsSource: JWTVerificationResult['claimsSource'] = 'none';

    // Check app_metadata first (custom JWT claims location)
    if (user.app_metadata?.organization_id) {
      organizationId = user.app_metadata.organization_id;
      claimsSource = 'app_metadata';
    }
    // Check user_metadata as fallback
    else if (user.user_metadata?.organization_id) {
      organizationId = user.user_metadata.organization_id;
      claimsSource = 'user_metadata';
      recommendations.push('Organization ID found in user_metadata instead of app_metadata. This suggests JWT custom claims may not be configured.');
    }
    // Fallback to database query
    else {
      try {
        const { data, error } = await supabase
          .from('user_organizations')
          .select('organizations_id')
          .eq('user_id', user.id)
          .single();
        
        if (!error && data) {
          organizationId = data.organizations_id;
          claimsSource = 'database';
          recommendations.push('Organization ID only found via database query. JWT custom claims are not configured.');
          recommendations.push('To fix: Go to Supabase Dashboard > Authentication > Hooks > Enable "Customize ID Token Claims" > Select "custom_access_token_hook"');
        }
      } catch {
        recommendations.push('Database query for organization failed. Check user_organizations table.');
      }
    }

    // Determine configuration status
    let configurationStatus: JWTVerificationResult['configurationStatus'] = 'missing';
    if (claimsSource === 'app_metadata') {
      configurationStatus = 'configured';
      recommendations.push('JWT custom claims are properly configured! ✓');
    } else if (claimsSource === 'user_metadata') {
      configurationStatus = 'missing';
      recommendations.push('JWT custom claims partially configured but not in the correct location.');
    } else if (claimsSource === 'database') {
      configurationStatus = 'missing';
      recommendations.push('JWT custom claims are not configured. Falling back to database queries.');
    } else {
      configurationStatus = 'error';
      recommendations.push('No organization found for this user in any location.');
    }

    // Additional recommendations based on findings
    if (configurationStatus !== 'configured') {
      recommendations.push('Steps to configure JWT custom claims:');
      recommendations.push('1. Verify the migration "20250804_add_jwt_organization_claim.sql" was applied');
      recommendations.push('2. Go to Supabase Dashboard > Authentication > Hooks');
      recommendations.push('3. Enable "Customize ID Token Claims"');
      recommendations.push('4. Select function: "custom_access_token_hook"');
      recommendations.push('5. Save configuration');
      recommendations.push('6. Users must sign out and sign back in to get new JWT claims');
    }

    return {
      hasJWTClaims: claimsSource === 'app_metadata',
      organizationId,
      claimsSource,
      configurationStatus,
      recommendations
    };

  } catch (error) {
    return {
      hasJWTClaims: false,
      organizationId: null,
      claimsSource: 'none',
      configurationStatus: 'error',
      recommendations: [
        'Error verifying JWT configuration.',
        `Error details: ${error instanceof Error ? error.message : 'Unknown error'}`
      ]
    };
  }
}

/**
 * Logs detailed JWT verification information to console
 * Useful for debugging authentication issues
 */
export async function debugJWTConfiguration(): Promise<void> {
  console.group('🔍 JWT Configuration Debug');
  
  const result = await verifyJWTConfiguration();
  
  console.log('Configuration Status:', result.configurationStatus);
  console.log('Has JWT Claims:', result.hasJWTClaims);
  console.log('Organization ID:', result.organizationId);
  console.log('Claims Source:', result.claimsSource);
  
  console.group('📋 Recommendations:');
  result.recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });
  console.groupEnd();
  
  console.groupEnd();
}

/**
 * Quick check if JWT claims are working
 */
export async function isJWTConfigured(): Promise<boolean> {
  const result = await verifyJWTConfiguration();
  return result.configurationStatus === 'configured';
}