"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// This is a placeholder context.
// In a real app, this would be implemented with a full authentication provider.
const AuthContext = createContext({ organizationId: null });

export const useAuth = () => {
    const [organizationId, setOrganizationId] = useState<string | null>(null);
    
    useEffect(() => {
        const getOrgFromJWT = async () => {
            try {
                // Get the session to access JWT claims
                const { data: { session } } = await supabase.auth.getSession();
                
                if (session) {
                    // Check app_metadata first (where it should be)
                    const orgId = session.user?.app_metadata?.organization_id || 
                                  session.user?.user_metadata?.organization_id;
                    
                    console.log('🔐 useAuth - JWT organization_id:', {
                        found: !!orgId,
                        orgId,
                        app_metadata: session.user?.app_metadata,
                        user_metadata: session.user?.user_metadata
                    });
                    
                    if (orgId) {
                        setOrganizationId(orgId);
                    } else {
                        // Fallback: Try to get from database
                        const { data } = await supabase
                            .from("user_organizations")
                            .select("organizations_id")
                            .eq("user_id", session.user.id)
                            .single();
                        
                        if (data?.organizations_id) {
                            console.log('🔐 useAuth - Got org from database:', data.organizations_id);
                            setOrganizationId(data.organizations_id);
                        }
                    }
                } else {
                    console.log('🔐 useAuth - No session found');
                }
            } catch (error) {
                console.error('🔐 useAuth - Error getting organization:', error);
            }
        };
        
        getOrgFromJWT();
        
        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                getOrgFromJWT();
            } else {
                setOrganizationId(null);
            }
        });
        
        return () => subscription.unsubscribe();
    }, []);
    
    return { organizationId };
}; 