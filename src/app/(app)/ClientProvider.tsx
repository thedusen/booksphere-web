"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FlaggingProvider } from "@/components/flagging/FlaggingProvider";
import { InventoryStateProvider } from "./inventory/InventoryStateProvider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OrganizationProvider } from "@/hooks/useOrganization";
import AppShell from "./AppShell";

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <OrganizationProvider>
        <TooltipProvider>
          <InventoryStateProvider>
            <FlaggingProvider>
              <AppShell>
                {children}
              </AppShell>
              <Toaster />
            </FlaggingProvider>
          </InventoryStateProvider>
        </TooltipProvider>
      </OrganizationProvider>
    </QueryClientProvider>
  );
}