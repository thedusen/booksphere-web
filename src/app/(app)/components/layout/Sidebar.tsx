"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookCopy, LogOut, Flag, Shield, BookCheck } from "lucide-react";
import { BooksphereLogo } from "@/components/ui/icons/BooksphereLogo";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const Sidebar: React.FC = () => {
    const pathname = usePathname();
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = React.useState(false);
    
    // Navigation items with active state detection
    const navigationItems = [
        {
            href: "/dashboard",
            icon: LayoutDashboard,
            label: "Dashboard",
            isActive: pathname === "/dashboard"
        },
        {
            href: "/inventory",
            icon: BookCopy,
            label: "Inventory",
            isActive: pathname.startsWith("/inventory")
        },
        {
            href: "/cataloging",
            icon: BookCheck,
            label: "Cataloging Jobs",
            isActive: pathname.startsWith("/cataloging")
        }
    ];

    const adminItems = [
        {
            href: "/admin/flags",
            icon: Flag,
            label: "Data Quality Flags",
            isActive: pathname.startsWith("/admin/flags")
        }
    ];

    /**
     * Handle user logout with proper error handling and navigation
     */
    const handleSignOut = async () => {
        if (isSigningOut) {
            console.log('Sign out already in progress, ignoring click');
            return;
        }

        console.log('Sign out button clicked');
        setIsSigningOut(true);
        
        try {
            console.log('Attempting to sign out...');
            
            // Add timeout to prevent hanging
            const signOutPromise = supabase.auth.signOut({ scope: 'local' });
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Sign out timeout')), 10000)
            );
            
            const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any;
            
            console.log('Sign out response:', { error });
            
            if (error) {
                console.error('Supabase logout error:', error);
                
                // Try alternative approach - clear session manually
                console.log('Attempting manual session clear...');
                try {
                    await supabase.auth.getSession();
                    // Force clear the session
                    localStorage.removeItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
                    sessionStorage.clear();
                } catch (clearError) {
                    console.error('Manual session clear failed:', clearError);
                }
                
                toast.error(`Failed to sign out: ${error.message}`);
                setIsSigningOut(false);
                return;
            }
            
            console.log('Sign out successful, clearing local storage and navigating...');
            
            // Clear any remaining auth data
            try {
                localStorage.clear();
                sessionStorage.clear();
            } catch (storageError) {
                console.warn('Storage clear failed:', storageError);
            }
            
            // Navigate to login page
            router.push('/login');
            
            // Show success message
            toast.success('Signed out successfully');
        } catch (error) {
            console.error('Unexpected logout error:', error);
            
            // Force logout by clearing storage and redirecting
            try {
                localStorage.clear();
                sessionStorage.clear();
                router.push('/login');
                toast.success('Signed out (forced)');
            } catch (forceError) {
                toast.error(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
                setIsSigningOut(false);
            }
        }
    };

    return (
        <aside className="sticky top-0 flex flex-col h-screen w-60 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 text-white justify-between py-6 px-4 relative overflow-hidden shadow-elevation-3 z-40">
            {/* Top: Logo/Title */}
            <div className="relative z-10">
                <div className="mb-8 flex items-center gap-2 text-2xl font-bold tracking-tight">
                    <BooksphereLogo 
                        size={32} 
                        className="text-secondary"
                    />
                    <span className="gradient-text">Booksphere</span>
                </div>
                
                {/* Main Navigation */}
                <nav className="flex flex-col gap-2 mb-6" role="navigation" aria-label="Main navigation">
                    {navigationItems.map(({ href, icon: Icon, label, isActive }) => (
                        <Button 
                            key={href}
                            asChild 
                            variant="ghost" 
                            className={cn(
                                "justify-start w-full transition-all animate-spring glass-hover",
                                isActive && "bg-gradient-to-r from-primary/20 to-secondary/20 text-white glow-aqua border border-secondary/30"
                            )}
                        >
                            <Link 
                                href={href}
                                aria-current={isActive ? "page" : undefined}
                            >
                                <Icon className="mr-2 h-5 w-5" />
                                {label}
                            </Link>
                        </Button>
                    ))}
                </nav>

                {/* Admin Section */}
                <div className="border-t border-gradient-to-r border-from-primary/30 border-to-secondary/30 pt-4">
                    <div className="flex items-center gap-2 mb-3 text-sm font-medium text-secondary">
                        <Shield className="h-4 w-4" />
                        <span>Administration</span>
                    </div>
                    <nav className="flex flex-col gap-2" role="navigation" aria-label="Administration">
                        {adminItems.map(({ href, icon: Icon, label, isActive }) => (
                            <Button 
                                key={href}
                                asChild 
                                variant="ghost" 
                                className={cn(
                                    "justify-start w-full transition-all animate-spring glass-hover",
                                    isActive && "bg-gradient-to-r from-primary/20 to-secondary/20 text-white glow-aqua border border-secondary/30"
                                )}
                            >
                                <Link 
                                    href={href}
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    <Icon className="mr-2 h-5 w-5" />
                                    {label}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </div>
            </div>
            
            {/* Bottom: Sign Out */}
            <div data-testid="user-menu" className="relative z-10">
                <Button 
                    variant="ghost" 
                    className="justify-start w-full hover:bg-gradient-to-r hover:from-destructive/20 hover:to-coral-500/20 hover:text-destructive transition-all animate-spring glass-hover"
                    aria-label="Sign out of your account"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                >
                    <LogOut className="mr-2 h-5 w-5" />
                    {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                </Button>
            </div>
        </aside>
    );
};

export default Sidebar; 