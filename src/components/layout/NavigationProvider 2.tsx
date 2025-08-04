/**
 * Navigation Provider - Mobile Navigation State Management
 * 
 * Provides centralized state management for mobile navigation.
 * Handles responsive behavior and navigation state across the app.
 */

"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface NavigationContextType {
  isMobileNavOpen: boolean;
  toggleMobileNav: (open?: boolean) => void;
  closeMobileNav: () => void;
  openMobileNav: () => void;
  isMobile: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.matchMedia('(max-width: 767px)').matches;
      setIsMobile(mobile);
      
      // Auto-close mobile nav when switching to desktop
      if (!mobile && isMobileNavOpen) {
        setIsMobileNavOpen(false);
      }
    };

    // Initial check
    checkIsMobile();

    // Listen for resize events
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    mediaQuery.addEventListener('change', checkIsMobile);

    return () => {
      mediaQuery.removeEventListener('change', checkIsMobile);
    };
  }, [isMobileNavOpen]);

  const toggleMobileNav = (open?: boolean) => {
    setIsMobileNavOpen(prev => open !== undefined ? open : !prev);
  };

  const closeMobileNav = () => {
    setIsMobileNavOpen(false);
  };

  const openMobileNav = () => {
    setIsMobileNavOpen(true);
  };

  const value: NavigationContextType = {
    isMobileNavOpen,
    toggleMobileNav,
    closeMobileNav,
    openMobileNav,
    isMobile,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

/**
 * Hook to use navigation context
 */
export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};