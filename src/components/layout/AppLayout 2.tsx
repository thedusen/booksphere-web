/**
 * AppLayout Component - Enhanced Responsive Layout
 * 
 * Provides the main application layout with responsive sidebar navigation.
 * Replaces the hardcoded layout with systematic, mobile-first design.
 */

"use client";

import React from 'react';
import { ResponsiveSidebar, MobileNavToggle } from './ResponsiveSidebar';
import { NavigationProvider, useNavigation } from './NavigationProvider';
import { Container, Stack, Inline } from '@/components/primitives';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  /** Optional header content */
  header?: React.ReactNode;
  /** Optional page title */
  title?: string;
}

/**
 * Internal layout component that uses navigation context
 */
const AppLayoutContent: React.FC<AppLayoutProps> = ({ 
  children, 
  header,
  title 
}) => {
  const { isMobileNavOpen, toggleMobileNav, isMobile } = useNavigation();

  return (
    <div className="flex h-screen bg-background">
      {/* Responsive Sidebar */}
      <ResponsiveSidebar 
        isMobileNavOpen={isMobileNavOpen}
        onMobileNavToggle={toggleMobileNav}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header with Navigation Toggle */}
        {isMobile && (
          <header className="flex items-center justify-between p-md border-b border-border bg-background md:hidden">
            <Inline gap="sm" align="center">
              <MobileNavToggle 
                isOpen={isMobileNavOpen}
                onToggle={toggleMobileNav}
              />
              {title && (
                <h1 className="text-lg font-semibold text-foreground">
                  {title}
                </h1>
              )}
            </Inline>
            {header}
          </header>
        )}
        
        {/* Desktop Header (optional) */}
        {!isMobile && header && (
          <header className="border-b border-border bg-background p-md">
            {header}
          </header>
        )}
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Container size="full" padding="md" className="h-full">
            {children}
          </Container>
        </main>
      </div>
    </div>
  );
};

/**
 * Main AppLayout component with navigation provider
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children, header, title }) => {
  return (
    <NavigationProvider>
      <AppLayoutContent header={header} title={title}>
        {children}
      </AppLayoutContent>
    </NavigationProvider>
  );
};

/**
 * Page Layout Component for consistent page structure
 */
interface PageLayoutProps {
  /** Page title */
  title: string;
  /** Optional page description */
  description?: string;
  /** Page actions (buttons, etc.) */
  actions?: React.ReactNode;
  /** Page content */
  children: React.ReactNode;
  /** Optional page-level loading state */
  isLoading?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,  
  description,
  actions,
  children,
  isLoading = false
}) => {
  return (
    <Stack gap="lg" className="h-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
        <Stack gap="xs">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-base text-muted-foreground">
              {description}
            </p>
          )}
        </Stack>
        
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
      
      {/* Page Content */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-md"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </Stack>
  );
};