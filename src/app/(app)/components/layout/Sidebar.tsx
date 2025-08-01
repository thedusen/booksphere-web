"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookCopy, LogOut, Flag, Shield, BookCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const Sidebar: React.FC = () => {
    const pathname = usePathname();
    const router = useRouter();
    
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
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Logout error:', error);
                toast.error('Failed to sign out. Please try again.');
                return;
            }
            
            // Clear any local storage or session data if needed
            // The supabase client will handle clearing the session
            
            // Navigate to login page
            router.push('/login');
            
            // Show success message
            toast.success('Signed out successfully');
        } catch (error) {
            console.error('Unexpected logout error:', error);
            toast.error('An unexpected error occurred during sign out');
        }
    };

    return (
        <aside className="flex flex-col h-screen w-60 bg-gray-900 text-white justify-between py-6 px-4">
            {/* Top: Logo/Title */}
            <div>
                <div className="mb-8 flex items-center gap-2 text-2xl font-bold tracking-tight">
                    {/* Replace with SVG logo if available */}
                    <span>📚</span>
                    <span>Booksphere</span>
                </div>
                
                {/* Main Navigation */}
                <nav className="flex flex-col gap-2 mb-6" role="navigation" aria-label="Main navigation">
                    {navigationItems.map(({ href, icon: Icon, label, isActive }) => (
                        <Button 
                            key={href}
                            asChild 
                            variant="ghost" 
                            className={cn(
                                "justify-start w-full transition-colors",
                                isActive && "bg-gray-800 text-white"
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
                <div className="border-t border-gray-700 pt-4">
                    <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-400">
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
                                    "justify-start w-full transition-colors",
                                    isActive && "bg-gray-800 text-white"
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
            <div data-testid="user-menu">
                <Button 
                    variant="ghost" 
                    className="justify-start w-full hover:bg-red-600/20 hover:text-red-200 transition-colors"
                    aria-label="Sign out of your account"
                    onClick={handleSignOut}
                >
                    <LogOut className="mr-2 h-5 w-5" />
                    Sign Out
                </Button>
            </div>
        </aside>
    );
};

export default Sidebar; 