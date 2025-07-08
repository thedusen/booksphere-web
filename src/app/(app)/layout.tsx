"use client";
import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrganizationProvider } from "@/hooks/useOrganization";
import Sidebar from "./components/layout/Sidebar";
import { InventoryStateProvider } from "./inventory/InventoryStateProvider";
import AppShell from "./AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <OrganizationProvider>
                <InventoryStateProvider>
                    <AppShell>{children}</AppShell>
                </InventoryStateProvider>
            </OrganizationProvider>
        </QueryClientProvider>
    );
}