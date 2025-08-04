/**
 * ResponsiveSidebar Component - Mobile-First Navigation
 * 
 * Provides responsive sidebar navigation that adapts to different screen sizes:
 * - Mobile: Overlay drawer with backdrop
 * - Tablet: Collapsible sidebar with toggle
 * - Desktop: Full persistent sidebar
 * 
 * Replaces the hardcoded bg-gray-900 sidebar with proper design tokens.
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  BookCopy, 
  LogOut, 
  Flag, 
  Shield, 
  BookCheck,
  Menu,
  X
} from "lucide-react";
import { BooksphereLogo } from "@/components/ui/icons/BooksphereLogo";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Stack, Inline } from "@/components/primitives";

interface ResponsiveSidebarProps {
  /** Current mobile nav state */
  isMobileNavOpen?: boolean;
  /** Mobile nav toggle handler */
  onMobileNavToggle?: (open: boolean) => void;
}

const ResponsiveSidebar: React.FC<ResponsiveSidebarProps> = ({
  isMobileNavOpen = false,
  onMobileNavToggle
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  // Handle mobile nav close on route change
  useEffect(() => {
    if (isMobileNavOpen && onMobileNavToggle) {
      onMobileNavToggle(false);
    }
  }, [pathname]);

  // Handle escape key for mobile nav
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileNavOpen && onMobileNavToggle) {
        onMobileNavToggle(false);
      }
    };

    if (isMobileNavOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileNavOpen, onMobileNavToggle]);

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
      
      // Navigate to login page
      router.push('/login');
      
      // Show success message
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Unexpected logout error:', error);
      toast.error('An unexpected error occurred during sign out');
    }
  };

  const SidebarContent = () => (
    <Stack gap="none" className="h-full">
      {/* Logo/Brand */}
      <div className="p-lg border-b border-sidebar-border">
        <Inline gap="sm" align="center">
          <BooksphereLogo 
            size={32} 
            className="text-sidebar-primary"
          />
          <span className="text-2xl font-bold tracking-tight text-sidebar-foreground">
            Booksphere
          </span>
        </Inline>
      </div>
      
      {/* Main Navigation */}
      <div className="flex-1 p-lg">
        <Stack gap="sm">
          <nav role="navigation" aria-label="Main navigation">
            <Stack gap="xs">
              {navigationItems.map(({ href, icon: Icon, label, isActive }) => (
                <Button 
                  key={href}
                  asChild 
                  variant="ghost" 
                  size="sm"
                  className={cn(
                    "justify-start w-full h-touch-target transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <Link 
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {label}
                  </Link>
                </Button>
              ))}
            </Stack>
          </nav>

          {/* Admin Section */}
          <div className="border-t border-sidebar-border pt-lg">
            <Inline gap="sm" align="center" className="mb-sm">
              <Shield className="h-4 w-4 text-sidebar-foreground/60" />
              <span className="text-sm font-medium text-sidebar-foreground/60">
                Administration
              </span>
            </Inline>
            <nav role="navigation" aria-label="Administration">
              <Stack gap="xs">
                {adminItems.map(({ href, icon: Icon, label, isActive }) => (
                  <Button 
                    key={href}
                    asChild 
                    variant="ghost" 
                    size="sm"
                    className={cn(
                      "justify-start w-full h-touch-target transition-colors",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    <Link 
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {label}
                    </Link>
                  </Button>
                ))}
              </Stack>
            </nav>
          </div>
        </Stack>
      </div>
      
      {/* Sign Out */}
      <div className="p-lg border-t border-sidebar-border" data-testid="user-menu">
        <Button 
          variant="ghost" 
          size="sm"
          className="justify-start w-full h-touch-target hover:bg-destructive/10 hover:text-destructive transition-colors"
          aria-label="Sign out of your account"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </Stack>
  );

  return (
    <>
      {/* Mobile Navigation Overlay */}
      {isMobileNavOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => onMobileNavToggle?.(false)}
            aria-hidden="true"
          />
          
          {/* Mobile Sidebar */}
          <aside 
            className={cn(
              "fixed left-0 top-0 z-50 h-full w-sidebar-width",
              "bg-sidebar text-sidebar-foreground shadow-elevation-4",
              "transform transition-transform duration-300 ease-in-out",
              "md:hidden",
              isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
            )}
            aria-label="Mobile navigation"
          >
            {/* Close button */}
            <div className="absolute right-4 top-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-touch-target w-touch-target p-0"
                onClick={() => onMobileNavToggle?.(false)}
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden md:flex md:flex-col h-screen",
          "bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-sidebar-width"
        )}
        aria-label="Main navigation"
      >
        <SidebarContent />
      </aside>
    </>
  );
};

/**
 * Mobile Navigation Toggle Button
 * Use this in your header/navbar to toggle mobile navigation
 */
export const MobileNavToggle: React.FC<{
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}> = ({ isOpen, onToggle }) => (
  <Button
    variant="ghost"
    size="sm"
    className="md:hidden h-touch-target w-touch-target p-0"
    onClick={() => onToggle(!isOpen)}
    aria-label={isOpen ? "Close navigation" : "Open navigation"}
    aria-expanded={isOpen}
  >
    {isOpen ? (
      <X className="h-5 w-5" />
    ) : (
      <Menu className="h-5 w-5" />
    )}
  </Button>
);

export { ResponsiveSidebar, type ResponsiveSidebarProps };