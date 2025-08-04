import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { debugJWTConfiguration } from "@/lib/auth/jwt-verification";

export interface OrgContextType {
    organizationId: string | null;
    user: User | null;
    loading: boolean;
    error: string | null;
}

const OrganizationContext = createContext<OrgContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
    const [organizationId, setOrganizationId] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    
    // Prevent redundant auth checks and organization fetches
    const lastUserIdRef = useRef<string | null>(null);
    const isInitializedRef = useRef(false);
    const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        let isMounted = true;
        
        // Listen for auth changes with better duplicate prevention
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!isMounted) return;

                const currentUser = session?.user ?? null;
                const currentUserId = currentUser?.id ?? null;
                
                console.log('Auth state change:', { 
                    event, 
                    userId: currentUserId, 
                    lastUserId: lastUserIdRef.current,
                    isInitialized: isInitializedRef.current
                });

                // Skip if this is the same user and we're already initialized (prevents tab focus loops)
                if (isInitializedRef.current && currentUserId === lastUserIdRef.current && event === 'TOKEN_REFRESHED') {
                    console.log('Skipping token refresh - same user, already initialized');
                    return;
                }

                setUser(currentUser);

                if (event === 'SIGNED_OUT' || !currentUser) {
                    console.log('User signed out or no user, resetting state');
                    setOrganizationId(null);
                    setLoading(false);
                    lastUserIdRef.current = null;
                    isInitializedRef.current = false;
                    
                    // Clear any pending fetch
                    if (fetchTimeoutRef.current) {
                        clearTimeout(fetchTimeoutRef.current);
                        fetchTimeoutRef.current = null;
                    }
                    
                    // Redirect to login if not already there
                    if (pathname !== '/login') {
                        router.push('/login');
                    }
                    return;
                }

                // If user is authenticated and different from last user, fetch organization
                if (currentUser && currentUserId !== lastUserIdRef.current) {
                    lastUserIdRef.current = currentUserId;
                    
                    // Clear any pending fetch
                    if (fetchTimeoutRef.current) {
                        clearTimeout(fetchTimeoutRef.current);
                    }
                    
                    // Debounce organization fetching to prevent rapid successive calls
                    fetchTimeoutRef.current = setTimeout(async () => {
                        await fetchOrganization(currentUser);
                        isInitializedRef.current = true;
                    }, 100);
                }
            }
        );

        // Initial check for current session - only run once
        const checkInitialAuth = async () => {
            if (isInitializedRef.current) {
                console.log('Already initialized, skipping initial auth check');
                return;
            }
            
            try {
                console.log('Running initial auth check');
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                
                if (!isMounted) return;

                setUser(currentUser);

                if (!currentUser) {
                    setLoading(false);
                    // Only redirect if not on login page
                    if (pathname !== '/login') {
                        router.push('/login');
                    }
                    return;
                }

                lastUserIdRef.current = currentUser.id;
                await fetchOrganization(currentUser);
                isInitializedRef.current = true;
            } catch (err) {
                if (isMounted) {
                    console.error('Auth check error:', err);
                    setError('Failed to check authentication status');
                    setLoading(false);
                }
            }
        };

        checkInitialAuth();

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            
            // Clean up any pending fetch timeout
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
                fetchTimeoutRef.current = null;
            }
        };
    }, [router, pathname]);

    const fetchOrganization = async (currentUser: User, retryCount = 0) => {
        const maxRetries = 3;
        
        try {
            setLoading(true);
            setError(null);

            // First, try to get organization_id from JWT claims
            const session = await supabase.auth.getSession();
            const claims = session.data.session?.user?.app_metadata;
            let jwtOrgId = claims?.organization_id;
            
            // Also check user_metadata as fallback location for organization_id
            if (!jwtOrgId) {
                jwtOrgId = session.data.session?.user?.user_metadata?.organization_id;
            }
            
            console.log('JWT Claims Debug:', {
                hasSession: !!session.data.session,
                hasClaims: !!claims,
                jwtOrgId,
                appMetadata: claims,
                userMetadata: session.data.session?.user?.user_metadata,
                retryCount
            });

            // Run detailed JWT configuration debug on first attempt
            if (retryCount === 0) {
                await debugJWTConfiguration();
            }

            if (jwtOrgId) {
                console.log('Using organization_id from JWT claims:', jwtOrgId);
                setOrganizationId(jwtOrgId);
                return;
            }

            // Fallback to database query if JWT claims don't have organization_id
            console.log('JWT claims missing organization_id, falling back to database query');
            const { data, error: orgError } = await supabase
                .from("user_organizations")
                .select("organizations_id")
                .eq("user_id", currentUser.id)
                .single();

            if (orgError) {
                // If it's a connection error and we haven't exhausted retries, try again
                if (retryCount < maxRetries && (orgError.message.includes('network') || orgError.message.includes('timeout'))) {
                    console.log(`Network error, retrying... (${retryCount + 1}/${maxRetries})`);
                    setTimeout(() => fetchOrganization(currentUser, retryCount + 1), 1000 * (retryCount + 1));
                    return;
                }
                throw orgError;
            }
            
            if (!data) {
                throw new Error("No organization found for this user. Please contact support if this issue persists.");
            }
            
            console.log('Using organization_id from database:', data.organizations_id);
            setOrganizationId(data.organizations_id);
        } catch (err: unknown) {
            console.error('Organization fetch error:', err);
            const errorMessage = err instanceof Error ? err.message : "Failed to fetch organization";
            
            // Provide more helpful error messages
            let userFriendlyMessage = errorMessage;
            if (errorMessage.includes('JWT')) {
                userFriendlyMessage = "Authentication configuration issue. Please sign out and sign back in.";
            } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
                userFriendlyMessage = "Network connection issue. Please check your internet connection and try again.";
            } else if (errorMessage.includes('No organization found')) {
                userFriendlyMessage = "Your account is not associated with an organization. Please contact support.";
            }
            
            setError(userFriendlyMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <OrganizationContext.Provider value={{ organizationId, user, loading, error }}>
            {children}
        </OrganizationContext.Provider>
    );
}

export function useOrganization() {
    const context = useContext(OrganizationContext);
    if (context === undefined) {
        throw new Error("useOrganization must be used within an OrganizationProvider");
    }
    return context;
}