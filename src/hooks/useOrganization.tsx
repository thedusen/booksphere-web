import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

interface OrgContextType {
    organizationId: string | null;
    loading: boolean;
    error: string | null;
}

const OrganizationContext = createContext<OrgContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
    const [organizationId, setOrganizationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        async function fetchOrg() {
            setLoading(true);
            setError(null);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    // This is not an error, just means no user is logged in.
                    // The UI can decide what to do (e.g., redirect).
                    if (isMounted) setLoading(false);
                    return;
                }

                const { data, error: orgError } = await supabase
                    .from("user_organizations")
                    .select("organizations_id")
                    .eq("user_id", user.id)
                    .single();

                if (orgError) throw orgError;
                if (!data) throw new Error("No organization found for this user.");
                
                if (isMounted) {
                    setOrganizationId(data.organizations_id);
                }
            } catch (err: unknown) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : "Failed to fetch organization");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }
        fetchOrg();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <OrganizationContext.Provider value={{ organizationId, loading, error }}>
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