"use client";
import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrganizationProvider } from "@/hooks/useOrganization";
import { InventoryStateProvider } from "./inventory/InventoryStateProvider";
import { FlaggingProvider } from "@/components/flagging";
import AppShell from "./AppShell";
import { Toaster } from '@/components/ui/sonner';
import { FlaggingProvider } from '@/components/flagging/FlaggingProvider';

const AppProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider supabase={supabase}>{children}</AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <FlaggingProvider>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <Header />
            <div className="p-4 sm:p-6 lg:p-8">{children}</div>
          </main>
        </div>
        <Toaster />
      </FlaggingProvider>
    </AppProviders>
  );
}