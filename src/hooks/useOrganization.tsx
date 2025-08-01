import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

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

    useEffect(() => {
        let isMounted = true;
        
        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!isMounted) return;

                const currentUser = session?.user ?? null;
                setUser(currentUser);

                if (event === 'SIGNED_OUT' || !currentUser) {
                    setOrganizationId(null);
                    setLoading(false);
                    // Redirect to login if not already there
                    if (pathname !== '/login') {
                        router.push('/login');
                    }
                    return;
                }

                // If user is authenticated, fetch organization
                if (currentUser) {
                    await fetchOrganization(currentUser);
                }
            }
        );

        // Initial check for current session
        const checkInitialAuth = async () => {
            try {
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

                await fetchOrganization(currentUser);
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
        };
    }, [router, pathname]);

    const fetchOrganization = async (currentUser: User) => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: orgError } = await supabase
                .from("user_organizations")
                .select("organizations_id")
                .eq("user_id", currentUser.id)
                .single();

            if (orgError) throw orgError;
            if (!data) throw new Error("No organization found for this user.");
            
            setOrganizationId(data.organizations_id);
        } catch (err: unknown) {
            console.error('Organization fetch error:', err);
            setError(err instanceof Error ? err.message : "Failed to fetch organization");
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